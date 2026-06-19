import { NextResponse } from 'next/server'
import { getAuthUser, requireSubscription } from '@/lib/auth'
const TICKERS = {'NVIDIA':'NVDA','TSMC':'TSM','AMD':'AMD','Intel':'INTC','Broadcom':'AVGO','Equinix':'EQIX','Vertiv Holdings':'VRT','Arista Networks':'ANET','Constellation Energy':'CEG','GE Vernova':'GEV','Super Micro Computer':'SMCI','Astera Labs':'ALAB','Credo Technology':'CRDO','Arm Holdings':'ARM'}
export async function GET(request) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })
  if (!requireSubscription(user)) return NextResponse.json({ detail: 'Suscripción requerida' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company') || 'NVIDIA'
  const ticker = TICKERS[company] || 'NVDA'
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1mo`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const data = await res.json()
    const chart = data.chart?.result?.[0]
    if (!chart) throw new Error('No data')
    const meta = chart.meta
    const timestamps = chart.timestamp || []
    const closes = chart.indicators?.quote?.[0]?.close || []
    const history = timestamps.map((ts,i) => ({ date: new Date(ts*1000).toISOString().split('T')[0], close: closes[i]?Math.round(closes[i]*100)/100:null })).filter(d=>d.close)
    return NextResponse.json({ company, ticker, current_price: meta.regularMarketPrice, previous_close: meta.previousClose, change_pct: meta.regularMarketPrice&&meta.previousClose?Math.round(((meta.regularMarketPrice-meta.previousClose)/meta.previousClose*100)*100)/100:0, currency: meta.currency||'USD', exchange: meta.exchangeName||'', history })
  } catch(e) {
    return NextResponse.json({ company, ticker, current_price: null, error: 'Datos no disponibles temporalmente' })
  }
}
