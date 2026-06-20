import { NextResponse } from 'next/server'
import { getAuthUser, requireSubscription } from '@/lib/auth'
import { COMPANIES, computeScore } from '@/lib/data'
export async function GET(request) {
  // public endpoint - no auth required
  try {
    const res = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: 'AI infrastructure semiconductor data center news 2025', search_depth: 'basic', max_results: 10 }) })
    const tData = await res.json()
    const content = (tData.results||[]).map(r=>r.title+' '+(r.content||'')).join(' ').toLowerCase()
    const ranked = COMPANIES.map(c => { const variants=[c.name.toLowerCase(),...(c.keywords||[]).slice(0,3)]; const mentions=variants.reduce((a,v)=>{const m=content.match(new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'));return a+(m?m.length:0)},0); return {...c,exposure_score:computeScore(c),mention_count:mentions,trending:mentions>1} })
    ranked.sort((a,b)=>(b.mention_count*3+b.exposure_score)-(a.mention_count*3+a.exposure_score))
    return NextResponse.json({ ranking: ranked.slice(0,20), total: COMPANIES.length, fresh_content_date: new Date().toISOString() })
  } catch(e) {
    const ranked = COMPANIES.map(c=>({...c,exposure_score:computeScore(c),mention_count:0,trending:false})).sort((a,b)=>b.exposure_score-a.exposure_score)
    return NextResponse.json({ ranking: ranked.slice(0,20), total: COMPANIES.length, error: 'Ranking estático' })
  }
}
