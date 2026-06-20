import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { computeExposureScore } from '@/lib/scoring'
import { COMPANIES as FALLBACK_COMPANIES, searchCompanies as fallbackSearch } from '@/lib/data'

const DISCLAIMER = 'This content is informational research, not financial advice. Not a recommendation to buy or sell assets.'

const TRENDS = [
  { slug: 'ai-infrastructure', name: 'AI Infrastructure', description: 'Data centers, GPUs, networking and power infrastructure enabling artificial intelligence at scale.', companies: ['NVIDIA', 'TSMC', 'AMD', 'Super Micro Computer', 'Vertiv Holdings', 'Equinix', 'Arista Networks'] },
  { slug: 'space-economy', name: 'Space Economy', description: 'Commercial space launch, satellite broadband, space defense and in-space manufacturing.', companies: ['SpaceX', 'Northrop Grumman', 'RTX', 'Lockheed Martin', 'Maxar Technologies'] },
  { slug: 'defense-tech', name: 'Defense Tech', description: 'Next-generation defense systems, autonomous weapons, AI-enabled surveillance and C4ISR.', companies: ['Palantir', 'Lockheed Martin', 'Northrop Grumman', 'RTX', 'L3Harris'] },
  { slug: 'semiconductors', name: 'Semiconductors', description: 'Chip design, fabrication, EDA tools and semiconductor equipment.', companies: ['NVIDIA', 'TSMC', 'AMD', 'ASML', 'Lam Research', 'Applied Materials', 'Qualcomm', 'Arm Holdings'] },
  { slug: 'data-centers', name: 'Data Centers', description: 'Hyperscale and colocation data centers, power, cooling and infrastructure.', companies: ['Equinix', 'Digital Realty', 'Iron Mountain', 'Vertiv Holdings', 'Eaton Corporation'] },
  { slug: 'nuclear-energy', name: 'Nuclear Energy', description: 'Nuclear power plants, small modular reactors (SMRs) and nuclear fuel for AI data center power demand.', companies: ['Constellation Energy', 'Vistra Energy', 'Oklo', 'NuScale Power'] },
  { slug: 'robotics', name: 'Robotics', description: 'Industrial robots, autonomous systems, humanoid robots and AI-enabled automation.', companies: ['NVIDIA', 'Qualcomm', 'Arm Holdings', 'Cadence Design Systems'] },
  { slug: 'cybersecurity', name: 'Cybersecurity', description: 'Endpoint security, cloud security, threat intelligence and zero-trust architecture.', companies: ['Palo Alto Networks', 'CrowdStrike', 'Broadcom', 'Qualcomm'] },
]

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()

  if (!q) {
    return NextResponse.json({
      query: '', result_count: 0, companies: [], trends: [],
      disclaimer: DISCLAIMER,
      suggested_terms: ['chips', 'data centers', 'energy', 'nvidia', 'defense', 'cybersecurity'],
    })
  }

  const qLower = q.toLowerCase()
  const start = Date.now()

  // Check if query matches a trend
  const matchedTrends = TRENDS.filter(t =>
    t.slug.includes(qLower.replace(/\s+/g, '-')) ||
    t.name.toLowerCase().includes(qLower) ||
    qLower.includes(t.slug.replace(/-/g, ' '))
  )

  // Search companies in Supabase
  let companies = []
  try {
    const { data } = await supabaseAdmin
      .from('companies')
      .select('*')
      .or(`display_name.ilike.%${q}%,industry.ilike.%${q}%,sector.ilike.%${q}%`)
      .limit(20)

    if (data?.length > 0) {
      companies = data.map(c => ({ ...c, exposure_score: computeExposureScore(c) }))
    }
  } catch {}

  // Fallback to JSON if Supabase empty
  if (!companies.length) {
    companies = fallbackSearch(q)
  }

  if (!companies.length && !matchedTrends.length) {
    return NextResponse.json({
      query: q,
      result_count: 0,
      companies: [],
      trends: [],
      disclaimer: DISCLAIMER,
      message: `No results for "${q}". Try: chips, data centers, energy, nvidia, defense.`,
      suggested_terms: ['chips', 'data centers', 'energy', 'nvidia', 'defense', 'cybersecurity'],
    })
  }

  return NextResponse.json({
    query: q,
    result_count: companies.length,
    response_time_seconds: ((Date.now() - start) / 1000).toFixed(3),
    companies,
    trends: matchedTrends,
    disclaimer: DISCLAIMER,
  })
}
