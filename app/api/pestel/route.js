import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPestelSignals, computePestelScores } from '@/lib/pestel'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug') || ''
  const companyName = searchParams.get('company') || ''

  // Find company
  let company = null
  if (slug) {
    const { data } = await supabaseAdmin
      .from('companies')
      .select('id, display_name, ticker, has_ticker')
      .eq('slug', slug)
      .single()
    company = data
  } else if (companyName) {
    const { data } = await supabaseAdmin
      .from('companies')
      .select('id, display_name, ticker, has_ticker')
      .ilike('display_name', `%${companyName}%`)
      .single()
    company = data
  }

  if (!company) {
    return NextResponse.json({ detail: 'Company not found' }, { status: 404 })
  }

  const signals = await getPestelSignals(company.id, company.display_name, company.ticker)
  const scores = computePestelScores(signals)

  return NextResponse.json({
    company: company.display_name,
    pestel: scores,
    signals,
    coverage: ['P', 'E', 'L'],
    mvp_note: 'MVP 1 covers Political, Economic and Legal signals. Social, Technological and Environmental coming in MVP 2.',
    last_updated: new Date().toISOString(),
  })
}
