import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { searchContracts } from '@/lib/usaspending'
import { computeExposureScore } from '@/lib/scoring'

export async function GET(request) {
  // Security: only Vercel cron can call this
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('id, display_name, legal_name')
    .limit(20) // Process 20 per run to stay within timeouts

  if (!companies?.length) return NextResponse.json({ processed: 0 })

  let processed = 0
  for (const co of companies) {
    const { contracts, error } = await searchContracts(co.display_name, { limit: 20 })
    if (error || !contracts.length) continue

    const rows = contracts.map(c => ({ ...c, company_id: co.id }))
    await supabaseAdmin.from('contracts').upsert(rows, { onConflict: 'id' }).catch(() => {})
    processed++
  }

  return NextResponse.json({ processed, timestamp: new Date().toISOString() })
}
