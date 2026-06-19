import { NextResponse } from 'next/server'
import { getAuthUser, requireSubscription } from '@/lib/auth'

const TICKERS = {
  'NVIDIA':'NVDA','TSMC':'TSM','AMD':'AMD','Intel':'INTC','Broadcom':'AVGO',
  'Marvell Technology':'MRVL','Micron Technology':'MU','ASML':'ASML',
  'Lam Research':'LRCX','Applied Materials':'AMAT','Equinix':'EQIX',
  'Digital Realty':'DLR','Vertiv Holdings':'VRT','Arista Networks':'ANET',
  'Palo Alto Networks':'PANW','CrowdStrike':'CRWD','Corning':'GLW',
  'Eaton Corporation':'ETN','Constellation Energy':'CEG','GE Vernova':'GEV',
  'Super Micro Computer':'SMCI','Dell Technologies':'DELL','Amphenol':'APH',
  'Arm Holdings':'ARM','Cadence Design Systems':'CDNS','Synopsys':'SNPS',
  'Astera Labs':'ALAB','Credo Technology':'CRDO','Iron Mountain':'IRM',
  'Celestica':'CLS','Bloom Energy':'BE','Oklo':'OKLO',
}
const RANGE_CONFIG = {
  '1D':{interval:'5m',range:'1d'},'1S':{interval:'1h',range:'5d'},
  '1M':{interval:'1d',range:'1mo'},'3M':{interval:'1d',range:'3mo'},'1A':{interval:'1wk',range:'1y'},
}

export async function GET(request) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })
  if (!requireSubscription(user)) return NextResponse.json({ detail: 'Suscripción requerida' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company') || 'NVIDIA'
  const rangeKey = searchParams.get('range') || '1M'
  const ticker = TICKERS[company] || 'NVDA'
  const { interval, range } = RANGE_CONFIG[rangeKey] || RANGE_CONFIG['1M']

  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Referer': 'https://finance.yahoo.com',
        },
        cache: 'no-store',
      })
      if (!res.ok) continue
      const data = await res.json()
      const chart = data.chart?.result?.[0]
      if (!chart) continue
      const meta = chart.meta
      const timestamps = chart.timestamp || []
      const closes = chart.indicators?.quote?.[0]?.close || []
      const highs = chart.indicators?.quote?.[0]?.high || []
      const lows = chart.indicators?.quote?.[0]?.low || []
      const volumes = chart.indicators?.quote?.[0]?.volume || []
      const history = timestamps.map((ts,i) => ({
        date: new Date(ts*1000).toISOString(),
        close: closes[i] ? Math.round(closes[i]*100)/100 : null,
        high: highs[i] ? Math.round(highs[i]*100)/100 : null,
        low: lows[i] ? Math.round(lows[i]*100)/100 : null,
        volume: volumes[i] || null,
      })).filter(d => d.close !== null)

      const current = meta.regularMarketPrice
      const prev = meta.previousClose || meta.chartPreviousClose
      const change = current && prev ? Math.round(((current-prev)/prev*100)*100)/100 : 0

      return NextResponse.json({
        company, ticker, range: rangeKey,
        current_price: current,
        previous_close: prev,
        change_pct: change,
        change_abs: current && prev ? Math.round((current-prev)*100)/100 : 0,
        day_high: meta.regularMarketDayHigh,
        day_low: meta.regularMarketDayLow,
        open: meta.regularMarketOpen,
        currency: meta.currency || 'USD',
        exchange: meta.exchangeName || '',
        market_state: meta.marketState || 'CLOSED',
        history,
        fetched_at: new Date().toISOString(),
      })
    } catch(e) { continue }
  }

  return NextResponse.json({
    company, ticker, range: rangeKey,
    current_price: null, error: 'Datos no disponibles', history: [],
  })
}
