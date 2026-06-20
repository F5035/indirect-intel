'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

// ── Shared utils ───────────────────────────────────────────────────────────────
const C = { cyan:'#00d4ff', violet:'#7b61ff', green:'#00ff94', yellow:'#ffd60a', orange:'#ff6b35', red:'#ff4444' }
const PALETTE = [C.cyan, C.violet, C.green, C.yellow, C.orange]
const lc = n => PALETTE[Math.abs((n||'').charCodeAt(0)-65) % PALETTE.length] || C.cyan
const sc = s => s >= 75 ? C.green : s >= 50 ? C.yellow : C.red
const fmt = n => n ? (n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(0)}M` : `$${n.toFixed(0)}`) : '—'

function slugify(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

// ── Score Ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score, size=48 }) {
  const r=size*.38, circ=2*Math.PI*r, fill=(score/100)*circ, color=sc(score)
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

// ── Confidence Badge ───────────────────────────────────────────────────────────
function Badge({ level, label }) {
  const map = {
    A:{color:C.green,bg:'#001f0f',icon:'🟢',def:'Verified Official'},
    B:{color:C.yellow,bg:'#1f1500',icon:'🟡',def:'Confirmed'},
    C:{color:C.orange,bg:'#1f0a00',icon:'🟠',def:'Weak Signal'},
    D:{color:C.red,bg:'#1f0000',icon:'🔴',def:'Speculative'},
  }
  const b = map[level] || map.C
  return (
    <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:700,
      background:b.bg,color:b.color,border:`1px solid ${b.color}44`,whiteSpace:'nowrap'}}>
      {b.icon} {label || b.def}
    </span>
  )
}

// ── Disclaimer ─────────────────────────────────────────────────────────────────
function Disclaimer() {
  return (
    <div style={{padding:'10px 14px',background:'#0a0f1a',border:'1px solid #1a2840',borderRadius:8,
      fontSize:10,color:'#4a5f80',lineHeight:1.6,marginTop:12}}>
      ⚠️ <strong style={{color:'#8899bb'}}>Not financial advice.</strong> Information is for research purposes only.
      Consult a registered financial advisor before making investment decisions.
      Data sourced from SEC EDGAR, USASpending.gov, Yahoo Finance, Tavily.
    </div>
  )
}

// ── Loading ────────────────────────────────────────────────────────────────────
function Loading({ text='Loading...' }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'60px 0',color:'#4a5f80'}}>
      <span style={{fontSize:24,animation:'spin 1s linear infinite',display:'inline-block'}}>⬡</span>
      <span style={{fontSize:13}}>{text}</span>
    </div>
  )
}

// ── Stock Chart ────────────────────────────────────────────────────────────────
function StockChart({ ticker, companyName, hasTickerData }) {
  const canvasRef = useRef()
  const [stock, setStock] = useState(null)
  const [range, setRange] = useState('1M')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervals = useRef({})
  const RANGES = ['1D','1S','1M','3M','1A']

  async function loadStock(r) {
    setLoading(true)
    try {
      const res = await fetch(`/api/stock?company=${encodeURIComponent(companyName)}&range=${r}`)
      const data = await res.json()
      if (data.error && !data.current_price) { setError('Data unavailable'); setStock(null) }
      else { setStock(data); setError(null) }
    } catch { setError('Failed to load stock data') }
    setLoading(false)
  }

  useEffect(() => { if (hasTickerData) { loadStock(range) } else setLoading(false) }, [range])

  useEffect(() => {
    if (!canvasRef.current || !stock?.history?.length) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.offsetWidth || 600, H = 180
    canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)
    const prices = stock.history.map(d=>d.close).filter(Boolean)
    if (!prices.length) return
    const min=Math.min(...prices), max=Math.max(...prices), rng=max-min||1
    const pad={top:16,right:12,bottom:24,left:52}
    const cW=W-pad.left-pad.right, cH=H-pad.top-pad.bottom
    ctx.clearRect(0,0,W,H)
    const up = stock.change_pct >= 0
    const lineColor = up ? C.green : C.red
    ctx.strokeStyle='#1a2840'; ctx.lineWidth=0.5
    for(let i=0;i<=4;i++){
      const y=pad.top+cH*(1-i/4)
      ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(W-pad.right,y); ctx.stroke()
      ctx.fillStyle='#4a5f80'; ctx.font='9px sans-serif'; ctx.textAlign='right'
      ctx.fillText(`$${(min+rng*i/4).toFixed(0)}`,pad.left-4,y+3)
    }
    const grad=ctx.createLinearGradient(0,pad.top,0,pad.top+cH)
    grad.addColorStop(0,lineColor+'44'); grad.addColorStop(1,lineColor+'00')
    ctx.beginPath()
    prices.forEach((p,i)=>{const x=pad.left+(i/(prices.length-1))*cW,y=pad.top+cH*(1-(p-min)/rng);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
    ctx.lineTo(pad.left+cW,pad.top+cH); ctx.lineTo(pad.left,pad.top+cH); ctx.closePath()
    ctx.fillStyle=grad; ctx.fill()
    ctx.beginPath(); ctx.strokeStyle=lineColor; ctx.lineWidth=2; ctx.shadowColor=lineColor; ctx.shadowBlur=6
    prices.forEach((p,i)=>{const x=pad.left+(i/(prices.length-1))*cW,y=pad.top+cH*(1-(p-min)/rng);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
    ctx.stroke(); ctx.shadowBlur=0
  }, [stock])

  if (!hasTickerData) return (
    <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:24,textAlign:'center'}}>
      <div style={{fontSize:24,marginBottom:8}}>📊</div>
      <div style={{fontSize:13,color:'#8899bb',marginBottom:4}}>No public market data</div>
      <div style={{fontSize:11,color:'#4a5f80'}}>This company does not trade on a public exchange.
        Financial data sourced from public contracts and filings.</div>
    </div>
  )

  const up = stock?.change_pct >= 0
  const color = up ? C.green : C.red

  return (
    <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
        <div>
          <div style={{fontSize:10,color:'#4a5f80',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>
            {ticker} · Yahoo Finance · <span style={{color:'#2a3f60'}}>15min delay</span>
          </div>
          {loading ? <div style={{color:'#4a5f80',fontSize:13}}>Loading...</div>
          : error ? <div style={{color:C.red,fontSize:12}}>{error}</div>
          : stock?.current_price ? (
            <div style={{display:'flex',alignItems:'baseline',gap:10}}>
              <div style={{fontSize:28,fontWeight:800,color:'#f0f6ff'}}>${stock.current_price.toFixed(2)}</div>
              <div style={{fontSize:13,fontWeight:700,color}}>
                {up?'▲':'▼'} {stock.change_abs>0?'+':''}{stock.change_abs?.toFixed(2)} ({up?'+':''}{stock.change_pct?.toFixed(2)}%)
              </div>
            </div>
          ) : null}
        </div>
        <div style={{display:'flex',gap:2,background:'#111c2d',border:'1px solid #1a2840',borderRadius:8,padding:3}}>
          {RANGES.map(r => (
            <button key={r} onClick={()=>setRange(r)}
              style={{padding:'4px 10px',borderRadius:6,border:'none',fontSize:11,fontWeight:700,
                background:range===r?(up?C.green:C.red):'transparent',
                color:range===r?'#060b14':'#4a5f80',cursor:'pointer'}}>
              {r}
            </button>
          ))}
        </div>
      </div>
      {stock?.current_price && (
        <div style={{display:'flex',gap:16,marginBottom:12,flexWrap:'wrap'}}>
          {[
            {l:'Day High', v:stock.day_high?`$${stock.day_high.toFixed(2)}`:'—'},
            {l:'Day Low', v:stock.day_low?`$${stock.day_low.toFixed(2)}`:'—'},
            {l:'Open', v:stock.open?`$${stock.open.toFixed(2)}`:'—'},
            {l:'Market', v:stock.market_state==='REGULAR'?'Open':'Closed', c:stock.market_state==='REGULAR'?C.green:'#4a5f80'},
            {l:'Volume', v:stock.history?.slice(-1)[0]?.volume?(stock.history.slice(-1)[0].volume/1e6).toFixed(1)+'M':'—'},
          ].map((m,i) => (
            <div key={i}>
              <div style={{fontSize:10,color:'#4a5f80',marginBottom:2,textTransform:'uppercase',letterSpacing:'0.5px'}}>{m.l}</div>
              <div style={{fontSize:12,fontWeight:600,color:m.c||'#f0f6ff'}}>{m.v}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{position:'relative',width:'100%',height:180}}>
        {loading && <Loading text="Fetching Yahoo Finance..."/>}
        <canvas ref={canvasRef} style={{width:'100%',height:180,display:'block',opacity:loading?.3:1}}/>
      </div>
      {stock?.fetched_at && (
        <div style={{fontSize:10,color:'#2a3f60',marginTop:6,textAlign:'right'}}>
          Yahoo Finance · {new Date(stock.fetched_at).toLocaleTimeString()} · updates every 15s
        </div>
      )}
    </div>
  )
}

// ── Contracts Tab ──────────────────────────────────────────────────────────────
function ContractsTab({ slug, companyName }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/contracts?slug=${slug}&page=${page}`)
      .then(r=>r.json())
      .then(d=>{ setData(d); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [slug, page])

  if (loading) return <Loading text="Fetching USASpending.gov contracts..."/>

  const contracts = data?.contracts || []

  if (!contracts.length) return (
    <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:32,textAlign:'center'}}>
      <div style={{fontSize:32,marginBottom:12}}>📋</div>
      <div style={{fontSize:14,color:'#8899bb',marginBottom:8}}>
        {data?.message || 'No federal contracts detected for this company in the last 12 months'}
      </div>
      <div style={{fontSize:11,color:'#4a5f80'}}>
        Data source: <a href="https://www.usaspending.gov" target="_blank" rel="noopener" style={{color:C.cyan}}>USASpending.gov</a>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'#f0f6ff'}}>{data?.total || contracts.length} Contracts Detected</div>
          <div style={{fontSize:11,color:'#4a5f80'}}>Source: USASpending.gov · <Badge level="A"/> · Updated {data?.last_updated ? new Date(data.last_updated).toLocaleDateString() : 'today'}</div>
        </div>
      </div>

      {contracts.map((c,i) => (
        <div key={c.id||i} style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:10,
          padding:16,marginBottom:8,borderLeft:`3px solid ${C.cyan}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div style={{flex:1,marginRight:12}}>
              <div style={{fontSize:13,fontWeight:600,color:'#f0f6ff',marginBottom:4,lineHeight:1.4}}>
                {c.title || `Contract ${c.contract_number}`}
              </div>
              <div style={{fontSize:11,color:'#4a5f80'}}>{c.buyer_agency}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontSize:18,fontWeight:800,color:C.green}}>{fmt(c.amount)}</div>
              <Badge level={c.confidence_level||'A'}/>
            </div>
          </div>
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            {c.award_date && <div><span style={{fontSize:10,color:'#4a5f80'}}>Award Date: </span><span style={{fontSize:11,color:'#8899bb'}}>{c.award_date}</span></div>}
            {c.end_date && <div><span style={{fontSize:10,color:'#4a5f80'}}>End Date: </span><span style={{fontSize:11,color:'#8899bb'}}>{c.end_date}</span></div>}
            {c.naics && <div><span style={{fontSize:10,color:'#4a5f80'}}>NAICS: </span><span style={{fontSize:11,color:'#8899bb'}}>{c.naics}</span></div>}
            {c.psc && <div><span style={{fontSize:10,color:'#4a5f80'}}>PSC: </span><span style={{fontSize:11,color:'#8899bb'}}>{c.psc}</span></div>}
            {c.place_of_performance && <div><span style={{fontSize:10,color:'#4a5f80'}}>Location: </span><span style={{fontSize:11,color:'#8899bb'}}>{c.place_of_performance}</span></div>}
            <div><span style={{fontSize:10,color:'#4a5f80'}}>Type: </span><span style={{fontSize:11,color:'#8899bb'}}>{c.contract_type || 'prime'}</span></div>
          </div>
          {c.source_url && (
            <div style={{marginTop:8}}>
              <a href={c.source_url} target="_blank" rel="noopener"
                style={{fontSize:10,color:C.cyan,textDecoration:'none'}}>
                🔗 View on USASpending.gov →
              </a>
            </div>
          )}
        </div>
      ))}

      {data?.total > 20 && (
        <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
            style={{padding:'6px 14px',borderRadius:8,border:'1px solid #1a2840',
              background:'transparent',color:page===1?'#2a3f60':'#8899bb',cursor:'pointer'}}>← Prev</button>
          <span style={{padding:'6px 14px',fontSize:12,color:'#4a5f80'}}>Page {page}</span>
          <button onClick={()=>setPage(p=>p+1)}
            style={{padding:'6px 14px',borderRadius:8,border:'1px solid #1a2840',
              background:'transparent',color:'#8899bb',cursor:'pointer'}}>Next →</button>
        </div>
      )}

      {data?.disclaimer && (
        <div style={{fontSize:10,color:'#2a3f60',marginTop:12,textAlign:'center'}}>{data.disclaimer}</div>
      )}
    </div>
  )
}

// ── Relationships Tab ──────────────────────────────────────────────────────────
function RelationshipsTab({ slug }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/relationships?slug=${slug}`)
      .then(r=>r.json())
      .then(d=>{ setData(d); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [slug])

  if (loading) return <Loading text="Mapping ecosystem relationships..."/>

  const rels = data?.relationships || []

  if (!rels.length) return (
    <div style={{textAlign:'center',padding:'60px 0',color:'#4a5f80'}}>
      <div style={{fontSize:32,marginBottom:12}}>🔗</div>
      <div style={{fontSize:14,color:'#8899bb'}}>No relationships mapped yet</div>
      <div style={{fontSize:11,marginTop:6}}>Relationship data is built from SEC filings and verified sources</div>
    </div>
  )

  const TYPE_COLORS = {
    supplier: C.violet, customer: C.green, subsidiary: C.cyan,
    partner: C.yellow, competitor: C.orange, contractor: C.cyan,
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'#f0f6ff'}}>{rels.length} Relationships Detected</div>
          <div style={{fontSize:11,color:'#4a5f80'}}>Source: SEC filings, annual reports, verified industry analysis</div>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {['supplier','customer','partner','competitor','contractor'].map(type => {
          const count = rels.filter(r => r.relationship_type === type).length
          if (!count) return null
          return (
            <span key={type} style={{padding:'4px 12px',borderRadius:16,fontSize:11,fontWeight:600,
              background:TYPE_COLORS[type]+'18',color:TYPE_COLORS[type],border:`1px solid ${TYPE_COLORS[type]}44`}}>
              {type} ({count})
            </span>
          )
        })}
      </div>

      {rels.map((r,i) => (
        <div key={i} style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:10,
          padding:14,marginBottom:8,display:'flex',alignItems:'flex-start',gap:14}}>
          <div style={{width:40,height:40,borderRadius:9,background:lc(r.target_company_name)+'18',
            border:`1px solid ${lc(r.target_company_name)}44`,color:lc(r.target_company_name),
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>
            {(r.target_company_name||'').substring(0,2).toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
              <span style={{fontSize:14,fontWeight:700,color:'#f0f6ff'}}>{r.target_company_name}</span>
              <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:700,
                background:(TYPE_COLORS[r.relationship_type]||C.cyan)+'18',
                color:TYPE_COLORS[r.relationship_type]||C.cyan}}>
                {r.relationship_type}
              </span>
              <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,
                background:r.direct_or_indirect==='direct'?'#001f0f':'#0f0f00',
                color:r.direct_or_indirect==='direct'?C.green:C.yellow}}>
                {r.direct_or_indirect}
              </span>
              <Badge level={r.confidence_level||'B'}/>
            </div>
            {r.evidence && <div style={{fontSize:11,color:'#8899bb',marginBottom:6}}>{r.evidence}</div>}
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <span style={{fontSize:10,color:'#4a5f80'}}>Confidence: <strong style={{color:sc(r.confidence_score||70)}}>{r.confidence_score||70}%</strong></span>
              <span style={{fontSize:10,color:'#4a5f80'}}>Source: <span style={{color:'#8899bb'}}>{r.evidence_source}</span></span>
              {r.source_url && (
                <a href={r.source_url} target="_blank" rel="noopener" style={{fontSize:10,color:C.cyan}}>
                  🔗 View source →
                </a>
              )}
            </div>
          </div>
        </div>
      ))}

      {data?.disclaimer && (
        <div style={{fontSize:10,color:'#2a3f60',marginTop:12,padding:10,background:'#0a0f1a',borderRadius:8}}>
          ℹ️ {data.disclaimer}
        </div>
      )}
    </div>
  )
}

// ── PESTEL Tab ─────────────────────────────────────────────────────────────────
function PestelTab({ slug }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/pestel?slug=${slug}`)
      .then(r=>r.json())
      .then(d=>{ setData(d); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [slug])

  if (loading) return <Loading text="Analyzing PESTEL signals..."/>

  const pestel = data?.pestel || {}
  const CATS = [
    {key:'P', label:'Political', icon:'🏛️', color:C.violet, covered:true},
    {key:'E', label:'Economic', icon:'📊', color:C.cyan, covered:true},
    {key:'S', label:'Social', icon:'👥', color:C.green, covered:false},
    {key:'T', label:'Technological', icon:'⚙️', color:C.yellow, covered:false},
    {key:'En', label:'Environmental', icon:'🌿', color:C.green, covered:false},
    {key:'L', label:'Legal', icon:'⚖️', color:C.orange, covered:true},
  ]

  return (
    <div>
      <div style={{marginBottom:16,padding:12,background:'#0a0f1a',border:`1px solid ${C.violet}33`,
        borderRadius:8,fontSize:11,color:'#8899bb'}}>
        MVP 1 covers Political, Economic and Legal signals. Social, Technological and Environmental signals coming in MVP 2.
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {CATS.map(cat => {
          const d = pestel[cat.key] || {}
          const score = d.score || 0
          const signals = d.signals || []
          return (
            <div key={cat.key} style={{background:'#0d1421',border:`1px solid ${cat.covered?cat.color+'44':'#1a2840'}`,
              borderRadius:12,padding:16,opacity:cat.covered?1:0.5}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:18}}>{cat.icon}</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#f0f6ff'}}>{cat.label}</span>
                </div>
                {cat.covered
                  ? <div style={{fontSize:22,fontWeight:800,color:sc(score)}}>{score}</div>
                  : <span style={{fontSize:10,color:'#2a3f60',padding:'2px 8px',background:'#111c2d',borderRadius:6}}>MVP 2</span>
                }
              </div>
              {cat.covered && (
                <>
                  <div style={{fontSize:11,color:cat.color,marginBottom:8,fontWeight:600}}>{d.status || 'Analyzing...'}</div>
                  {signals.slice(0,2).map((s,i) => (
                    <div key={i} style={{fontSize:11,color:'#8899bb',padding:'6px 0',
                      borderTop:'1px solid #111c2d',lineHeight:1.4}}>
                      <span style={{color:s.signal_type==='risk'?C.red:C.green,marginRight:4}}>
                        {s.signal_type==='risk'?'▼':'▲'}
                      </span>
                      {s.description?.substring(0,100)}...
                      {s.source_url && (
                        <a href={s.source_url} target="_blank" rel="noopener"
                          style={{display:'block',fontSize:10,color:C.cyan,marginTop:2}}>
                          {s.source_name} →
                        </a>
                      )}
                    </div>
                  ))}
                </>
              )}
              {!cat.covered && (
                <div style={{fontSize:11,color:'#4a5f80',lineHeight:1.4}}>
                  Full {cat.label} analysis coming in the next release.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── News Tab ───────────────────────────────────────────────────────────────────
function NewsTab({ companyName }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('news')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/news?company=${encodeURIComponent(companyName)}&type=${type}`)
      .then(r=>r.json())
      .then(d=>{ setNews(d.results||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [companyName, type])

  function inferLevel(item) {
    const source = (item.source||'').toLowerCase()
    if (source.includes('sec') || source.includes('investor') || source.includes('official')) return 'A'
    if (source.includes('reuters') || source.includes('bloomberg') || source.includes('wsj') ||
        source.includes('ft.com') || source.includes('ap.org') || source.includes('cnbc')) return 'B'
    return 'C'
  }

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[{v:'news',l:'📰 News'},{v:'contracts',l:'📋 Contracts'}].map(t => (
          <button key={t.v} onClick={()=>setType(t.v)}
            style={{padding:'7px 16px',borderRadius:8,border:`1px solid ${type===t.v?C.cyan:'#1a2840'}`,
              background:type===t.v?C.cyan+'11':'transparent',color:type===t.v?C.cyan:'#8899bb',
              fontSize:12,cursor:'pointer',fontWeight:type===t.v?700:400}}>
            {t.l}
          </button>
        ))}
        <div style={{marginLeft:'auto',fontSize:10,color:'#4a5f80',display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:C.green,display:'inline-block'}}
            className="pulse"/>
          Source: Tavily · Real-time
        </div>
      </div>

      {loading ? <Loading text="Searching Reuters, Bloomberg, SEC..."/>
      : news.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 0',color:'#4a5f80'}}>
          <div style={{fontSize:32,marginBottom:12}}>📰</div>
          <div>No recent verified news found</div>
        </div>
      ) : (
        news.slice(0,10).map((item,i) => {
          const level = inferLevel(item)
          return (
            <div key={i} style={{padding:'14px 16px',marginBottom:8,background:'#0d1421',
              border:'1px solid #1a2840',borderRadius:10,
              borderLeft:`3px solid ${item.impact==='high'?C.red:item.impact==='medium'?C.yellow:C.cyan}`}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                <Badge level={level}/>
                <span style={{fontSize:10,color:'#4a5f80'}}>{item.source}</span>
                <span style={{padding:'1px 8px',borderRadius:12,fontSize:10,fontWeight:700,
                  background:item.impact==='high'?'#1f0000':item.impact==='medium'?'#1f1500':'#001520',
                  color:item.impact==='high'?C.red:item.impact==='medium'?C.yellow:C.cyan}}>
                  {item.impact?.toUpperCase()}
                </span>
                {item.published_date && (
                  <span style={{fontSize:10,color:'#4a5f80',marginLeft:'auto'}}>{item.published_date}</span>
                )}
              </div>
              <a href={item.url} target="_blank" rel="noopener"
                style={{fontSize:13,color:'#f0f6ff',lineHeight:1.5,display:'block',marginBottom:6}}
                onMouseEnter={e=>e.target.style.color=C.cyan}
                onMouseLeave={e=>e.target.style.color='#f0f6ff'}>
                {item.title}
              </a>
              {item.snippet && <div style={{fontSize:11,color:'#4a5f80',lineHeight:1.5}}>{item.snippet}</div>}
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Social Tab ─────────────────────────────────────────────────────────────────
function SocialTab({ slug, companyName }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/social?slug=${slug}`)
      .then(r=>r.json())
      .then(d=>{ setData(d); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [slug])

  if (loading) return <Loading text="Scanning social signals..."/>

  if (!data?.show_module) return (
    <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:32,textAlign:'center'}}>
      <div style={{fontSize:32,marginBottom:12}}>📡</div>
      <div style={{fontSize:14,color:'#8899bb',marginBottom:6}}>Social signal volume below threshold</div>
      <div style={{fontSize:11,color:'#4a5f80'}}>
        Policy: Social Signals are only displayed when ≥ 100 mentions are detected.
        This prevents low-quality or bot-generated signals from appearing.
      </div>
    </div>
  )

  const signals = data?.signals || []

  return (
    <div>
      <div style={{padding:'10px 14px',background:'#120f00',border:`1px solid ${C.yellow}44`,
        borderRadius:8,marginBottom:16,fontSize:11,color:C.yellow}}>
        ⚠️ <strong>Speculative / Not Confirmed</strong> — Social signals are based on public forum activity and may not reflect verified facts.
        Data marked Level D. Minimum 100 mentions threshold enforced.
      </div>

      {signals.map((s,i) => (
        <div key={i} style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16,marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:18}}>💬</span>
              <span style={{fontSize:14,fontWeight:700,color:'#f0f6ff',textTransform:'capitalize'}}>{s.platform}</span>
              <Badge level="D" label="Speculative"/>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:20,fontWeight:800,color:C.cyan}}>{(s.mentions_count||0).toLocaleString()}</div>
              <div style={{fontSize:10,color:'#4a5f80'}}>mentions detected</div>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
            {[
              {l:'Positive', v:s.sentiment_positive||0, c:C.green},
              {l:'Neutral', v:s.sentiment_neutral||0, c:'#4a5f80'},
              {l:'Negative', v:s.sentiment_negative||0, c:C.red},
            ].map(sent => (
              <div key={sent.l} style={{textAlign:'center',padding:10,background:'#111c2d',borderRadius:8}}>
                <div style={{fontSize:18,fontWeight:800,color:sent.c}}>{sent.v}%</div>
                <div style={{fontSize:10,color:'#4a5f80',marginTop:2}}>{sent.l}</div>
                <div style={{height:3,background:'#0d1421',borderRadius:2,marginTop:6}}>
                  <div style={{width:`${sent.v}%`,height:'100%',background:sent.c,borderRadius:2}}/>
                </div>
              </div>
            ))}
          </div>

          {s.growth_24h !== undefined && (
            <div style={{marginBottom:12,fontSize:12,color:'#8899bb'}}>
              24h growth: <span style={{color:s.growth_24h>=0?C.green:C.red,fontWeight:700}}>
                {s.growth_24h>=0?'+':''}{s.growth_24h}%
              </span>
            </div>
          )}

          {(s.representative_comments||[]).length > 0 && (
            <div>
              <div style={{fontSize:11,color:'#4a5f80',marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                Representative Posts
              </div>
              {(s.representative_comments||[]).map((c,j) => (
                <div key={j} style={{padding:'8px 12px',background:'#111c2d',borderRadius:8,marginBottom:6,
                  borderLeft:`2px solid ${C.yellow}44`}}>
                  <div style={{fontSize:11,color:'#8899bb',lineHeight:1.4}}>{c.text}</div>
                  <div style={{display:'flex',gap:10,marginTop:4}}>
                    <span style={{fontSize:10,color:'#4a5f80'}}>r/{c.subreddit}</span>
                    <span style={{fontSize:10,color:'#4a5f80'}}>▲ {c.score}</span>
                    <a href={c.url} target="_blank" rel="noopener" style={{fontSize:10,color:C.cyan}}>View →</a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{fontSize:10,color:'#2a3f60',marginTop:8}}>
            Captured: {s.captured_at ? new Date(s.captured_at).toLocaleString() : 'Just now'} · Status: {s.status}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Alerts Tab ─────────────────────────────────────────────────────────────────
function AlertsTab({ slug, companyName }) {
  const [token, setToken] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [channel, setChannel] = useState('in-app')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    const t = localStorage.getItem('ii_token')
    setToken(t)
    if (t) loadAlerts(t)
  }, [])

  async function loadAlerts(t) {
    setLoading(true)
    try {
      const res = await fetch('/api/alerts', { headers: { Authorization: `Bearer ${t}` } })
      const d = await res.json()
      setAlerts(d.alerts||[])
    } catch {}
    setLoading(false)
  }

  async function createAlert() {
    if (!token) return
    setCreating(true)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ target: companyName, target_type: 'company', channel }),
      })
      const d = await res.json()
      if (d.alert) { setSuccess('Alert created!'); setAlerts(a=>[d.alert,...a]) }
    } catch {}
    setCreating(false)
    setTimeout(() => setSuccess(null), 3000)
  }

  async function deleteAlert(id) {
    if (!token) return
    await fetch(`/api/alerts/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    setAlerts(a => a.filter(x => x.id !== id))
  }

  if (!token) return (
    <div style={{textAlign:'center',padding:'60px 0'}}>
      <div style={{fontSize:32,marginBottom:12}}>🔔</div>
      <div style={{fontSize:14,color:'#8899bb',marginBottom:16}}>Sign in to create alerts</div>
      <div style={{fontSize:12,color:'#4a5f80',marginBottom:20}}>
        Get notified when {companyName} wins a new federal contract, files with the SEC, or generates social signals.
      </div>
      <a href="/auth/login" style={{padding:'10px 24px',borderRadius:10,background:`linear-gradient(90deg,${C.cyan},${C.violet})`,
        color:'#060b14',fontSize:13,fontWeight:700,textDecoration:'none'}}>
        Sign in to set alerts →
      </a>
    </div>
  )

  return (
    <div>
      <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:'#f0f6ff',marginBottom:12}}>
          Create Alert for {companyName}
        </div>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {['in-app','email'].map(c => (
            <button key={c} onClick={()=>setChannel(c)}
              style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${channel===c?C.cyan:'#1a2840'}`,
                background:channel===c?C.cyan+'11':'transparent',color:channel===c?C.cyan:'#4a5f80',
                fontSize:12,cursor:'pointer'}}>
              {c === 'in-app' ? '🔔 In-app' : '📧 Email'}
            </button>
          ))}
        </div>
        <button onClick={createAlert} disabled={creating}
          style={{padding:'9px 20px',borderRadius:9,border:'none',
            background:`linear-gradient(90deg,${C.cyan},${C.violet})`,
            color:'#060b14',fontSize:13,fontWeight:700,cursor:'pointer',opacity:creating?.7:1}}>
          {creating ? 'Creating...' : '+ Create Alert'}
        </button>
        {success && <div style={{marginTop:8,fontSize:12,color:C.green}}>✓ {success}</div>}
      </div>

      {loading ? <Loading text="Loading alerts..."/> : alerts.length === 0 ? (
        <div style={{textAlign:'center',padding:'32px 0',color:'#4a5f80',fontSize:13}}>
          No alerts configured yet
        </div>
      ) : (
        alerts.map(a => (
          <div key={a.id} style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:10,
            padding:14,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#f0f6ff',marginBottom:2}}>
                🔔 {a.target}
              </div>
              <div style={{fontSize:11,color:'#4a5f80'}}>
                {a.channel} · Created {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
              </div>
            </div>
            <button onClick={()=>deleteAlert(a.id)}
              style={{padding:'5px 12px',borderRadius:7,border:'1px solid #1a2840',
                background:'transparent',color:C.red,fontSize:12,cursor:'pointer'}}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  )
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ company, score }) {
  const fields = [
    {l:'Sector', v:company.sector},
    {l:'Industry', v:company.industry},
    {l:'Country', v:company.country},
    {l:'Ticker', v:company.ticker},
    {l:'Exchange', v:company.exchange},
    {l:'Type', v:company.company_type},
    {l:'Employees', v:company.employees?.toLocaleString()},
    {l:'Website', v:company.website, link:true},
    {l:'Founded', v:company.founded_year},
    {l:'Last Updated', v:company.last_updated ? new Date(company.last_updated).toLocaleDateString() : null},
  ].filter(f => f.v)

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20}}>
      <div>
        <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16,marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:'#f0f6ff',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.5px'}}>Description</div>
          <div style={{fontSize:13,color:'#8899bb',lineHeight:1.7}}>{company.description || 'No description available.'}</div>
        </div>

        {(company.risks||[]).length > 0 && (
          <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#f0f6ff',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.5px'}}>Key Risks</div>
            {company.risks.map((r,i) => (
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'6px 0',borderBottom:'1px solid #111c2d'}}>
                <span style={{color:C.red,marginTop:1,flexShrink:0}}>▼</span>
                <span style={{fontSize:12,color:'#8899bb'}}>{r}</span>
              </div>
            ))}
          </div>
        )}

        {(company.evidence||[]).length > 0 && (
          <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#f0f6ff',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.5px'}}>Evidence</div>
            {company.evidence.map((e,i) => (
              <div key={i} style={{padding:'8px 0',borderBottom:'1px solid #111c2d'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                  <Badge level="A" label={e.type?.toUpperCase()||'FILING'}/>
                </div>
                <div style={{fontSize:12,color:'#8899bb',lineHeight:1.4}}>{e.description}</div>
                {e.url && <a href={e.url} target="_blank" rel="noopener" style={{fontSize:10,color:C.cyan}}>View source →</a>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16,marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:'#f0f6ff',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.5px'}}>Company Info</div>
          {fields.map((f,i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #111c2d'}}>
              <span style={{fontSize:11,color:'#4a5f80'}}>{f.l}</span>
              {f.link ? (
                <a href={f.v.startsWith('http')?f.v:`https://${f.v}`} target="_blank" rel="noopener"
                  style={{fontSize:11,color:C.cyan}}>{f.v}</a>
              ) : (
                <span style={{fontSize:11,color:'#f0f6ff',fontWeight:500,textAlign:'right'}}>{f.v}</span>
              )}
            </div>
          ))}
        </div>

        {company.categories?.length > 0 && (
          <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#f0f6ff',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.5px'}}>Categories</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {company.categories.map(cat => (
                <span key={cat} style={{padding:'4px 10px',borderRadius:16,fontSize:11,
                  background:C.cyan+'18',color:C.cyan,border:`1px solid ${C.cyan}44`}}>{cat}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Company Page ──────────────────────────────────────────────────────────
export default function CompanyPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug

  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState(0)

  const TABS = [
    {label:'Overview', icon:'📋'},
    {label:'Charts', icon:'📈'},
    {label:'Contracts', icon:'🏛️'},
    {label:'Relationships', icon:'🔗'},
    {label:'PESTEL', icon:'🌐'},
    {label:'News', icon:'📰'},
    {label:'Social Signals', icon:'💬'},
    {label:'Alerts', icon:'🔔'},
  ]

  useEffect(() => {
    fetch(`/api/companies/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(d => { if (d) { setCompany(d); setLoading(false) } })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [slug])

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#060b14',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <Loading text={`Loading ${slug}...`}/>
    </div>
  )

  if (notFound) return (
    <div style={{minHeight:'100vh',background:'#060b14',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <div style={{fontSize:48}}>🔍</div>
      <div style={{fontSize:18,color:'#f0f6ff',fontWeight:700}}>Company not found</div>
      <div style={{fontSize:13,color:'#4a5f80'}}>"{slug}" doesn't match any company in our database</div>
      <button onClick={()=>router.push('/')}
        style={{padding:'10px 24px',borderRadius:10,border:'none',
          background:`linear-gradient(90deg,${C.cyan},${C.violet})`,
          color:'#060b14',fontSize:13,fontWeight:700,cursor:'pointer'}}>
        ← Back to Search
      </button>
    </div>
  )

  const score = company?.exposure_score || 50
  const color = lc(company?.display_name||'')
  const isPrivate = company?.company_type === 'private'

  return (
    <div style={{minHeight:'100vh',background:'#060b14'}}>
      {/* Nav */}
      <nav style={{background:'#060b14',borderBottom:'1px solid #0d1421',padding:'0 24px',
        height:52,display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:100}}>
        <button onClick={()=>router.push('/')}
          style={{padding:'5px 12px',borderRadius:7,border:'1px solid #1a2840',
            background:'transparent',color:'#4a5f80',fontSize:12,cursor:'pointer'}}>
          ← Supply Alpha
        </button>
        <span style={{color:'#1a2840'}}>/</span>
        <span style={{fontSize:13,color:'#f0f6ff',fontWeight:600}}>{company?.display_name}</span>
        {company?.ticker && <span style={{fontSize:11,color:'#4a5f80',fontFamily:'monospace'}}>{company.ticker}</span>}
      </nav>

      <main style={{maxWidth:1200,margin:'0 auto',padding:'24px 24px'}}>
        {/* Company Header */}
        <div style={{display:'flex',alignItems:'flex-start',gap:20,marginBottom:24,flexWrap:'wrap'}}>
          <div style={{width:60,height:60,borderRadius:14,background:color+'18',
            border:`2px solid ${color}44`,color,display:'flex',alignItems:'center',
            justifyContent:'center',fontSize:20,fontWeight:900,flexShrink:0}}>
            {(company?.display_name||'').substring(0,2).toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:6}}>
              <h1 style={{fontSize:24,fontWeight:900,color:'#f0f6ff',margin:0}}>{company?.display_name}</h1>
              {company?.ticker && (
                <span style={{padding:'3px 10px',borderRadius:8,background:color+'18',
                  border:`1px solid ${color}44`,color,fontSize:12,fontWeight:700,fontFamily:'monospace'}}>
                  {company.ticker}
                </span>
              )}
              {isPrivate && (
                <span style={{padding:'3px 10px',borderRadius:8,background:'#1a2840',
                  fontSize:11,color:'#4a5f80'}}>Private</span>
              )}
            </div>
            <div style={{fontSize:13,color:'#4a5f80'}}>
              {company?.industry} · {company?.country}
              {company?.exchange && ` · ${company.exchange}`}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{textAlign:'center'}}>
              <ScoreRing score={score} size={64}/>
              <div style={{fontSize:10,color:'#4a5f80',marginTop:4,textAlign:'center'}}>Exposure</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:0,borderBottom:'1px solid #1a2840',marginBottom:24,overflowX:'auto'}}>
          {TABS.map((t,i) => (
            <div key={i} onClick={()=>setTab(i)}
              style={{padding:'10px 16px',cursor:'pointer',fontSize:12,fontWeight:tab===i?700:400,
                color:tab===i?C.cyan:'#8899bb',
                borderBottom:tab===i?`2px solid ${C.cyan}`:'2px solid transparent',
                marginBottom:-1,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5}}>
              <span>{t.icon}</span> {t.label}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div className="fade-in" key={tab}>
          {tab === 0 && <OverviewTab company={company} score={score}/>}
          {tab === 1 && <StockChart ticker={company?.ticker} companyName={company?.display_name} hasTickerData={!isPrivate && !!company?.ticker}/>}
          {tab === 2 && <ContractsTab slug={slug} companyName={company?.display_name}/>}
          {tab === 3 && <RelationshipsTab slug={slug}/>}
          {tab === 4 && <PestelTab slug={slug}/>}
          {tab === 5 && <NewsTab companyName={company?.display_name}/>}
          {tab === 6 && <SocialTab slug={slug} companyName={company?.display_name}/>}
          {tab === 7 && <AlertsTab slug={slug} companyName={company?.display_name}/>}
        </div>

        <Disclaimer/>
      </main>
    </div>
  )
}
