import { NextResponse } from 'next/server'
import { getAuthUser, requireSubscription } from '@/lib/auth'
import { searchCompanies, buildValueChainMap, checkEvidence } from '@/lib/data'

const DISCLAIMER = 'Este contenido es research informativo, no asesoramiento financiero. No constituye recomendación de compra o venta de activos.'

export async function GET(request) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })
  if (!requireSubscription(user)) return NextResponse.json({ detail: 'Suscripción requerida' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''

  const start = Date.now()
  let results = searchCompanies(q)

  if (!results.length) {
    return NextResponse.json({
      query: q, trend: 'IA Infrastructure', result_count: 0, companies: [],
      value_chain_map: { categories: [] }, disclaimer: DISCLAIMER,
      message: 'No encontramos empresas relacionadas. Probá con: chips, data centers, energía, nvidia, servidores.',
      suggested_terms: ['chips', 'data centers', 'energía', 'nvidia', 'servidores', 'cooling', 'fibra', 'ciberseguridad'],
    })
  }

  // Filter/flag by evidence
  results = results.map(c => {
    if (!checkEvidence(c)) return { ...c, evidence_flag: 'evidencia insuficiente', exposure_score: Math.min(c.exposure_score, 40) }
    if (c.type === 'private') {
      const b = c.score_breakdown || {}
      return { ...c, score_breakdown: { evidence_quality: b.evidence_quality || 0, market_growth: b.market_growth || 0 }, financial_note: 'Empresa privada: campos financieros no disponibles públicamente' }
    }
    return c
  })

  return NextResponse.json({
    query: q, trend: 'IA Infrastructure', result_count: results.length,
    response_time_seconds: ((Date.now() - start) / 1000).toFixed(3),
    companies: results,
    value_chain_map: buildValueChainMap(results),
    disclaimer: DISCLAIMER,
  })
}
