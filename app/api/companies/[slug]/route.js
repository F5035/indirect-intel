import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { computeExposureScore } from '@/lib/scoring'

export async function GET(request, { params }) {
  const { slug } = params

  // Fetch from Supabase
  const { data: company, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !company) {
    // Try by display_name fallback
    const { data: byName } = await supabaseAdmin
      .from('companies')
      .select('*')
      .ilike('display_name', slug.replace(/-/g, ' '))
      .single()

    if (!byName) {
      return NextResponse.json({ detail: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...byName,
      exposure_score: computeExposureScore(byName),
    })
  }

  return NextResponse.json({
    ...company,
    exposure_score: computeExposureScore(company),
  })
}
