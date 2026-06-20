'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ── Colors ────────────────────────────────────────────────────────────────────
const C = { cyan:'#00d4ff', violet:'#7b61ff', green:'#00ff94', yellow:'#ffd60a', orange:'#ff6b35', red:'#ff4444' }
const PALETTE = [C.cyan, C.violet, C.green, C.yellow, C.orange]
const lc = n => PALETTE[Math.abs((n||'').charCodeAt(0) - 65) % PALETTE.length] || C.cyan
const sc = s => s >= 75 ? C.green : s >= 50 ? C.yellow : C.red

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Score Ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 48 }) {
  const r = size * 0.38, circ = 2 * Math.PI * r
  const fill = (score / 100) * circ, color = sc(score)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a2840" strokeWidth={size*.1}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*.1}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{filter:`drop-shadow(0 0 4px ${color}88)`}}/>
      <text x={size/2} y={size/2+4} textAnchor="middle" fill={color}
        fontSize={size*.22} fontWeight="700" fontFamily="sans-serif">{score}</text>
    </svg>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────────
function ConfidenceBadge({ level }) {
  const map = {
    A: { label:'Verified Official', color:C.green, bg:'#001f0f', icon:'🟢' },
    B: { label:'Confirmed', color:C.yellow, bg:'#1f1500', icon:'🟡' },
    C: { label:'Weak Signal', color:C.orange, bg:'#1f0a00', icon:'🟠' },
    D: { label:'Speculative', color:C.red, bg:'#1f0000', icon:'🔴' },
  }
  const b = map[level] || map.C
  return (
    <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:700,
      background:b.bg,color:b.color,border:`1px solid ${b.color}44`}}>
      {b.icon} {b.label}
    </span>
  )
}

// ── Disclaimer ─────────────────────────────────────────────────────────────────
function Disclaimer({ compact = false }) {
  if (compact) return (
    <div style={{padding:'8px 12px',background:'#0d1421',border:'1px solid #1a2840',borderRadius:8,
      fontSize:10,color:'#4a5f80',lineHeight:1.5}}>
      ⚠️ Not financial advice. For research purposes only. Consult a registered financial advisor before making investment decisions.
    </div>
  )
  return (
    <div style={{padding:'12px 16px',background:'#0a0f1a',border:'1px solid #1a2840',borderRadius:10,
      fontSize:11,color:'#4a5f80',lineHeight:1.6,marginTop:8}}>
      <strong style={{color:'#8899bb'}}>Disclaimer:</strong> This platform does not provide personalized financial advice
      or recommendations to buy or sell assets. All information is for educational, informational and research purposes only.
      Users should conduct their own analysis or consult a registered financial advisor before making investment decisions.
    </div>
  )
}

// ── Ticker Bar ─────────────────────────────────────────────────────────────────
function TickerBar({ companies }) {
  if (!companies?.length) return null
  const items = [...companies, ...companies]
  return (
    <div style={{background:'#060b14',borderBottom:'1px solid #0d1421',overflow:'hidden',height:28,display:'flex',alignItems:'center'}}>
      <div style={{display:'flex',animation:'ticker 80s linear infinite',whiteSpace:'nowrap'}}>
        {items.map((c,i) => (
          <span key={i} style={{padding:'0 20px',fontSize:11,color:'#4a5f80',
            borderRight:'1px solid #0d1421',display:'inline-flex',alignItems:'center',gap:6}}>
            <span style={{color:'#f0f6ff',fontWeight:600}}>{(c.ticker||c.display_name?.split(' ')[0]||'').substring(0,5)}</span>
            <span style={{color:sc(c.exposure_score||50),fontWeight:700}}>{c.exposure_score||50}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Nav ────────────────────────────────────────────────────────────────────────
function Nav({ onSearch }) {
  const [q, setQ] = useState('')
  return (
    <nav style={{background:'#060b14',borderBottom:'1px solid #0d1421',padding:'0 24px',
      height:52,display:'flex',alignItems:'center',justifyContent:'space-between',
      position:'sticky',top:0,zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',gap:24}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:18,fontWeight:900,background:`linear-gradient(90deg,${C.cyan},${C.violet})`,
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>⬡</span>
          <span style={{fontSize:14,fontWeight:800,color:'#f0f6ff',letterSpacing:'-0.5px'}}>Supply Alpha</span>
        </div>
        <span style={{padding:'2px 8px',borderRadius:6,background:'#0d1421',border:'1px solid #1a2840',
          fontSize:10,color:'#4a5f80',fontWeight:600}}>BETA</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{position:'relative'}}>
          <input value={q} onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&q&&onSearch(q)}
            style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:8,
              padding:'6px 12px 6px 32px',color:'#f0f6ff',fontSize:12,outline:'none',width:200}}
            placeholder="Search companies, trends..."/>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',
            fontSize:12,color:'#4a5f80'}}>🔍</span>
        </div>
      </div>
    </nav>
  )
}

// ── Live Trends ────────────────────────────────────────────────────────────────
const TRENDS = [
  { slug:'ai-infrastructure', name:'AI Infrastructure', icon:'🤖', color:C.cyan },
  { slug:'space-economy', name:'Space Economy', icon:'🚀', color:C.violet },
  { slug:'defense-tech', name:'Defense Tech', icon:'🛡️', color:C.orange },
  { slug:'semiconductors', name:'Semiconductors', icon:'💾', color:C.yellow },
  { slug:'data-centers', name:'Data Centers', icon:'🏢', color:C.green },
  { slug:'nuclear-energy', name:'Nuclear Energy', icon:'⚛️', color:C.cyan },
]

// ── Company Card ───────────────────────────────────────────────────────────────
function CompanyCard({ company, onClick }) {
  const [hov, setHov] = useState(false)
  const color = lc(company.display_name)
  const score = company.exposure_score || 50
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{background:'#0d1421',border:`1px solid ${hov ? color+'55' : '#1a2840'}`,
        borderRadius:12,padding:16,cursor:'pointer',transition:'all .2s',
        transform:hov?'translateY(-2px)':'translateY(0)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
        <div style={{width:40,height:40,borderRadius:10,background:color+'18',
          border:`1px solid ${color}44`,color,display:'flex',alignItems:'center',
          justifyContent:'center',fontSize:14,fontWeight:800}}>
          {company.display_name.substring(0,2).toUpperCase()}
        </div>
        <ScoreRing score={score} size={40}/>
      </div>
      <div style={{fontSize:14,fontWeight:700,color:'#f0f6ff',marginBottom:2,
        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
        {company.display_name}
      </div>
      <div style={{fontSize:11,color:'#4a5f80',marginBottom:8}}>
        {company.ticker ? `${company.ticker} · ` : ''}{company.industry || company.sector}
      </div>
      <div style={{fontSize:10,color:color,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>
        {score >= 75 ? 'High Exposure' : score >= 50 ? 'Moderate' : 'Low Exposure'} →
      </div>
    </div>
  )
}

// ── Search Bar ─────────────────────────────────────────────────────────────────
function SearchBar({ onSearch, companies = [] }) {
  const [q, setQ] = useState('')
  const [sugg, setSugg] = useState([])
  const [focused, setFocused] = useState(false)

  function handleChange(val) {
    setQ(val)
    if (val.length > 1) {
      setSugg(companies.filter(c =>
        c.display_name.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 6))
    } else setSugg([])
  }

  return (
    <div style={{position:'relative',maxWidth:640,margin:'0 auto'}}>
      <div style={{display:'flex',gap:10}}>
        <div style={{flex:1,position:'relative'}}>
          <input value={q} onChange={e=>handleChange(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&q)onSearch(q)}}
            onFocus={()=>setFocused(true)} onBlur={()=>setTimeout(()=>setFocused(false),150)}
            style={{width:'100%',background:'#0d1421',border:`1px solid ${focused?C.cyan:'#1a2840'}`,
              borderRadius:12,padding:'14px 16px 14px 44px',color:'#f0f6ff',fontSize:15,
              outline:'none',transition:'border-color .2s'}}
            placeholder="Search companies, tickers, trends, sectors..."/>
          <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',
            fontSize:18,color:'#4a5f80'}}>🔍</span>
        </div>
        <button onClick={()=>q&&onSearch(q)}
          style={{padding:'0 24px',borderRadius:12,border:'none',
            background:`linear-gradient(90deg,${C.cyan},${C.violet})`,
            color:'#060b14',fontSize:14,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
          Analyze →
        </button>
      </div>

      {/* Suggestions */}
      {focused && sugg.length > 0 && (
        <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,right:80,
          background:'#0d1421',border:'1px solid #1a2840',borderRadius:10,
          zIndex:200,overflow:'hidden',boxShadow:'0 8px 32px #00000088'}}>
          {sugg.map(c => (
            <div key={c.id||c.slug} onMouseDown={()=>{onSearch(c.display_name)}}
              style={{padding:'10px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,
                fontSize:13,color:'#8899bb'}}
              onMouseEnter={e=>e.currentTarget.style.background='#111c2d'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{width:28,height:28,borderRadius:6,background:lc(c.display_name)+'22',
                color:lc(c.display_name),display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:9,fontWeight:800}}>{c.display_name.substring(0,2).toUpperCase()}</div>
              <span style={{color:'#f0f6ff'}}>{c.display_name}</span>
              {c.ticker && <span style={{color:'#4a5f80',fontSize:11}}>{c.ticker}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Quick tags */}
      <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap',justifyContent:'center'}}>
        {['NVIDIA','SpaceX','AI Infrastructure','Defense Tech','Semiconductors','Nuclear Energy'].map(tag => (
          <button key={tag} onClick={()=>onSearch(tag)}
            style={{padding:'5px 14px',borderRadius:20,background:'#0d1421',
              border:'1px solid #1a2840',fontSize:12,color:'#4a5f80',cursor:'pointer',
              transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyan;e.currentTarget.style.color=C.cyan}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a2840';e.currentTarget.style.color='#4a5f80'}}>
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Search Results ─────────────────────────────────────────────────────────────
function SearchResults({ results, onCompany, onBack }) {
  if (!results) return null
  const cos = results.companies || []
  const trends = results.trends || []
  return (
    <div className="fade-in">
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <button onClick={onBack} style={{padding:'6px 14px',borderRadius:8,border:'1px solid #1a2840',
          background:'transparent',color:'#4a5f80',fontSize:12,cursor:'pointer'}}>
          ← Back
        </button>
        <div style={{fontSize:13,color:'#4a5f80'}}>
          Results for <strong style={{color:'#f0f6ff'}}>"{results.query}"</strong>
          {' '}<span style={{color:'#4a5f80'}}>· {results.result_count} companies</span>
          {results.response_time_seconds && <span style={{color:'#2a3f60'}}> · {results.response_time_seconds}s</span>}
        </div>
      </div>

      {trends.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:'#4a5f80',marginBottom:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>
            Matching Trends
          </div>
          {trends.map(t => (
            <div key={t.slug} style={{background:'#0d1421',border:`1px solid ${C.cyan}33`,
              borderRadius:10,padding:14,marginBottom:8}}>
              <div style={{fontSize:14,fontWeight:700,color:C.cyan,marginBottom:4}}>{t.name}</div>
              <div style={{fontSize:12,color:'#8899bb',marginBottom:8}}>{t.description}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {(t.companies||[]).slice(0,5).map(n => (
                  <button key={n} onClick={()=>onCompany(n)}
                    style={{padding:'3px 10px',borderRadius:16,background:'#111c2d',
                      border:'1px solid #1a2840',fontSize:11,color:'#8899bb',cursor:'pointer'}}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {cos.length > 0 ? (
        <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,overflow:'hidden'}}>
          {cos.map((c,i) => (
            <div key={c.id||c.slug||i} onClick={()=>onCompany(c.display_name||c.name)}
              style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',cursor:'pointer',
                borderBottom:i<cos.length-1?'1px solid #111c2d':'none'}}
              onMouseEnter={e=>e.currentTarget.style.background='#111c2d'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{width:38,height:38,borderRadius:9,background:lc(c.display_name||c.name)+'18',
                border:`1px solid ${lc(c.display_name||c.name)}44`,color:lc(c.display_name||c.name),
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800}}>
                {(c.display_name||c.name).substring(0,2).toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:'#f0f6ff',marginBottom:2}}>{c.display_name||c.name}</div>
                <div style={{fontSize:11,color:'#4a5f80'}}>{c.industry} · {c.country}</div>
              </div>
              {c.ticker && <span style={{fontSize:12,color:'#4a5f80',fontFamily:'monospace'}}>{c.ticker}</span>}
              <ScoreRing score={c.exposure_score||50} size={38}/>
            </div>
          ))}
        </div>
      ) : (
        <div style={{textAlign:'center',padding:'60px 0',color:'#4a5f80'}}>
          <div style={{fontSize:32,marginBottom:12}}>🔍</div>
          <div style={{fontSize:15,color:'#8899bb',marginBottom:8}}>
            {results.message || `No companies found for "${results.query}"`}
          </div>
          <div style={{fontSize:12}}>Try: chips, data centers, energy, nvidia, defense, cybersecurity</div>
        </div>
      )}

      <div style={{marginTop:16}}>
        <Disclaimer compact/>
      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [view, setView] = useState('home') // 'home' | 'results'

  useEffect(() => {
    fetch('/api/ranking')
      .then(r => r.json())
      .then(d => { setCompanies(d.ranking || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSearch(q) {
    if (!q?.trim()) return
    setSearching(true)
    setView('results')
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data)
    } catch {
      setSearchResults({ query: q, result_count: 0, companies: [], trends: [] })
    }
    setSearching(false)
  }

  function handleCompany(name) {
    router.push(`/company/${slugify(name)}`)
  }

  const topCompanies = companies.slice(0, 12)

  return (
    <div style={{minHeight:'100vh',background:'#060b14'}}>
      <Nav onSearch={handleSearch}/>
      <TickerBar companies={companies.slice(0,20)}/>

      <main style={{maxWidth:1200,margin:'0 auto',padding:'32px 24px'}}>

        {/* ── SEARCH RESULTS VIEW ── */}
        {view === 'results' && (
          searching ? (
            <div style={{textAlign:'center',padding:'80px 0',color:'#4a5f80'}}>
              <div style={{fontSize:24,marginBottom:12}} className="spin">⬡</div>
              <div>Analyzing ecosystem...</div>
            </div>
          ) : (
            <SearchResults
              results={searchResults}
              onCompany={handleCompany}
              onBack={() => setView('home')}
            />
          )
        )}

        {/* ── HOME VIEW ── */}
        {view === 'home' && (
          <div className="fade-in">
            {/* Hero */}
            <div style={{textAlign:'center',marginBottom:48}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,
                padding:'6px 16px',borderRadius:20,background:'#0d1421',
                border:`1px solid ${C.cyan}33`,marginBottom:20}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:C.green,
                  display:'inline-block'}} className="pulse"/>
                <span style={{fontSize:11,color:C.cyan,fontWeight:600,letterSpacing:'1px'}}>
                  INDIRECT INTELLIGENCE PLATFORM
                </span>
              </div>

              <h1 style={{fontSize:42,fontWeight:900,lineHeight:1.1,marginBottom:16,letterSpacing:'-1px'}}>
                <span style={{color:'#f0f6ff'}}>Discover the </span>
                <span style={{background:`linear-gradient(90deg,${C.cyan},${C.violet})`,
                  WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>hidden companies</span>
                <br/>
                <span style={{color:'#f0f6ff'}}>behind the giants.</span>
              </h1>

              <p style={{fontSize:16,color:'#8899bb',maxWidth:520,margin:'0 auto 32px',lineHeight:1.6}}>
                Map supplier chains, federal contracts, indirect relationships, PESTEL risks
                and social signals — all verified, all sourced.
              </p>

              <SearchBar onSearch={handleSearch} companies={companies}/>
            </div>

            {/* Live Trends */}
            <div style={{marginBottom:40}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <h2 style={{fontSize:14,fontWeight:700,color:'#f0f6ff'}}>⚡ Live Trends</h2>
                <span style={{fontSize:11,color:'#4a5f80'}}>Click to explore ecosystem</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}} className="grid-3">
                {TRENDS.map(t => (
                  <div key={t.slug} onClick={()=>handleSearch(t.name)}
                    style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:10,
                      padding:14,cursor:'pointer',textAlign:'center',transition:'all .2s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=t.color+'55';e.currentTarget.style.background='#111c2d'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a2840';e.currentTarget.style.background='#0d1421'}}>
                    <div style={{fontSize:22,marginBottom:6}}>{t.icon}</div>
                    <div style={{fontSize:11,fontWeight:600,color:'#f0f6ff',lineHeight:1.3}}>{t.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Companies */}
            <div style={{marginBottom:40}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div>
                  <h2 style={{fontSize:14,fontWeight:700,color:'#f0f6ff',marginBottom:2}}>Top Companies by Exposure Score</h2>
                  <div style={{fontSize:11,color:'#4a5f80'}}>Ranked by indirect AI infrastructure exposure · Updated via Tavily</div>
                </div>
                {loading && <span style={{fontSize:12,color:'#4a5f80'}} className="spin">↺</span>}
              </div>

              {loading ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}} className="grid-2">
                  {[...Array(8)].map((_,i) => (
                    <div key={i} style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,
                      height:120,animation:'pulse 1.5s infinite'}}/>
                  ))}
                </div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}} className="grid-2">
                  {topCompanies.map(c => (
                    <CompanyCard
                      key={c.id||c.slug||c.name}
                      company={{...c, display_name: c.name||c.display_name}}
                      onClick={() => handleCompany(c.name||c.display_name)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* How it works */}
            <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,
              padding:24,marginBottom:24}}>
              <h2 style={{fontSize:14,fontWeight:700,color:'#f0f6ff',marginBottom:16}}>
                What questions can Supply Alpha answer?
              </h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}} className="grid-1">
                {[
                  { icon:'🏭', q:'Who are the hidden suppliers behind NVIDIA?', color:C.cyan },
                  { icon:'📋', q:'Which companies are winning federal contracts in AI?', color:C.violet },
                  { icon:'🔗', q:'What companies benefit indirectly from SpaceX growth?', color:C.green },
                  { icon:'⚠️', q:'What PESTEL risks does Palantir face in 2025?', color:C.yellow },
                  { icon:'🏆', q:'Who are the hidden winners in Nuclear Energy?', color:C.orange },
                  { icon:'📊', q:'How exposed is TSMC to U.S. export controls?', color:C.cyan },
                ].map((item,i) => (
                  <div key={i} onClick={()=>handleSearch(item.q.split(' ').slice(2,4).join(' '))}
                    style={{padding:14,background:'#111c2d',borderRadius:10,cursor:'pointer',
                      borderLeft:`3px solid ${item.color}`,transition:'all .2s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#1a2840'}
                    onMouseLeave={e=>e.currentTarget.style.background='#111c2d'}>
                    <div style={{fontSize:18,marginBottom:6}}>{item.icon}</div>
                    <div style={{fontSize:12,color:'#8899bb',lineHeight:1.4}}>{item.q}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data sources */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}} className="grid-1">
              <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
                <h3 style={{fontSize:12,fontWeight:700,color:'#f0f6ff',marginBottom:10}}>
                  🟢 Verified Data Sources
                </h3>
                {[
                  {name:'SEC EDGAR', detail:'Filings, companyfacts, submissions'},
                  {name:'USASpending.gov', detail:'Federal awards, contracts, subawards'},
                  {name:'DoD Contracts', detail:'Daily defense contract announcements'},
                  {name:'Yahoo Finance', detail:'Stock prices · 15min delay'},
                  {name:'Tavily', detail:'Verified news and research'},
                ].map((s,i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',
                    padding:'6px 0',borderBottom:'1px solid #111c2d'}}>
                    <span style={{fontSize:12,fontWeight:500,color:'#f0f6ff'}}>{s.name}</span>
                    <span style={{fontSize:11,color:'#4a5f80'}}>{s.detail}</span>
                  </div>
                ))}
              </div>
              <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
                <h3 style={{fontSize:12,fontWeight:700,color:'#f0f6ff',marginBottom:10}}>
                  📊 Exposure Score Methodology
                </h3>
                {[
                  {label:'Evidence quality', v:'30%', color:C.cyan},
                  {label:'Financial health', v:'15%', color:C.green},
                  {label:'Momentum', v:'15%', color:C.violet},
                  {label:'Market growth', v:'15%', color:C.yellow},
                  {label:'Valuation', v:'15%', color:C.orange},
                  {label:'Risk factors', v:'10%', color:C.red},
                ].map((m,i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'5px 0',borderBottom:'1px solid #111c2d'}}>
                    <span style={{fontSize:11,color:'#4a5f80'}}>{m.label}</span>
                    <span style={{fontSize:11,fontWeight:700,color:m.color}}>{m.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <Disclaimer/>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{borderTop:'1px solid #0d1421',padding:'16px 24px',
        display:'flex',justifyContent:'space-between',alignItems:'center',
        maxWidth:1200,margin:'0 auto',fontSize:11,color:'#2a3f60'}}>
        <span>Supply Alpha · Indirect Intelligence Platform</span>
        <span>Data sourced from SEC EDGAR, USASpending.gov, Yahoo Finance, Tavily</span>
        <span>Not financial advice</span>
      </footer>
    </div>
  )
}
