import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { searchContracts } from '@/lib/usaspending'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company') || ''
  const slug = searchParams.get('slug') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  if (!company && !slug) {
    return NextResponse.json({ detail: 'company or slug required' }, { status: 400 })
  }

  // Find company in Supabase
  let companyId = null
  let companyName = company

  if (slug) {
    const { data: co } = await supabaseAdmin
      .from('companies')
      .select('id, display_name, legal_name')
      .eq('slug', slug)
      .single()
    if (co) {
      companyId = co.id
      companyName = co.display_name || co.legal_name
    }
  } else {
    const { data: co } = await supabaseAdmin
      .from('companies')
      .select('id, display_name, legal_name')
      .ilike('display_name', `%${company}%`)
      .single()
    if (co) {
      companyId = co.id
      companyName = co.display_name || co.legal_name
    }
  }

  // Check Supabase cache (contracts < 24h old)
  if (companyId) {
    const { data: cached } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('company_id', companyId)
      .gte('last_checked', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('award_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (cached?.length > 0) {
      return NextResponse.json({
        contracts: cached,
        total: cached.length,
        company: companyName,
        source: 'cache',
        last_updated: cached[0]?.last_checked,
      })
    }
  }

  // Fetch from USASpending API
  const { contracts, total, error } = await searchContracts(companyName, { limit, page })

  if (error && error !== 'timeout') {
    // Return empty with message per spec
    return NextResponse.json({
      contracts: [],
      total: 0,
      company: companyName,
      message: 'No se detectaron contratos federales para esta empresa en los últimos 12 meses',
      error,
    })
  }

  // Cache in Supabase
  if (contracts.length > 0 && companyId) {
    const rows = contracts.map(c => ({ ...c, company_id: companyId }))
    await supabaseAdmin.from('contracts').upsert(rows, { onConflict: 'id' }).catch(() => {})
  }

  return NextResponse.json({
    contracts,
    total,
    company: companyName,
    source: 'usaspending',
    last_updated: new Date().toISOString(),
    disclaimer: 'Source: USASpending.gov — Official U.S. federal spending data. Confidence level: A (Verified Official)',
  })
}
