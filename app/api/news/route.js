import { NextResponse } from 'next/server'
import { getAuthUser, requireSubscription } from '@/lib/auth'

export async function GET(request) {
  // public endpoint - no auth required
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company') || 'NVIDIA AI infrastructure'
  const type = searchParams.get('type') || 'news'
  const queries = {
    news: `${company} contracts partnerships earnings announcement 2025`,
    contracts: `${company} government contract deal agreement signed 2025`,
  }
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: queries[type] || queries.news, search_depth: 'basic', max_results: 8 }),
    })
    const data = await res.json()
    const results = (data.results || []).map(r => ({ title: r.title, url: r.url, source: new URL(r.url).hostname.replace('www.',''), snippet: (r.content||'').substring(0,200), published_date: r.published_date||null, impact: /billion|\$[0-9]+b|major|government/i.test(r.title)?'high':/million|\$[0-9]+m|contract|deal/i.test(r.title)?'medium':'low' }))
    return NextResponse.json({ company, type, results, total: results.length })
  } catch(e) {
    return NextResponse.json({ company, type, results: [], error: e.message })
  }
}
