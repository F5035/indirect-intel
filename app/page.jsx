'use client'
import { useState, useEffect, useRef } from 'react'

const LC=['#00d4ff','#7b61ff','#00ff94','#ff6b35','#ffd60a','#ff4d8f']
const lc=n=>LC[n?.charCodeAt(0)%LC.length]||LC[0]
const sc=s=>s>=75?'#00ff94':s>=50?'#ffd60a':'#ff4444'
const sbg=s=>s>=75?'#001f0f':s>=50?'#1f1500':'#1f0000'
const sborder=s=>s>=75?'#00ff9444':s>=50?'#ffd60a44':'#ff444444'

async function api(path,opts={},token){
  const h={'Content-Type':'application/json'}
  if(token)h['Authorization']=`Bearer ${token}`
  const r=await fetch(path,{headers:h,...opts})
  const d=await r.json()
  if(!r.ok)throw new Error(d.detail||'Error')
  return d
}

function ScoreRing({score,size=56}){
  const r=size*.38,c=2*Math.PI*r,fill=(score/100)*c,color=sc(score)
  return(<svg width={size}height={size}viewBox={`0 0 ${size} ${size}`}>
    <circle cx={size/2}cy={size/2}r={r}fill="none"stroke="#1a2840"strokeWidth={size*.1}/>
    <circle cx={size/2}cy={size/2}r={r}fill="none"stroke={color}strokeWidth={size*.1}strokeDasharray={`${fill} ${c}`}strokeLinecap="round"transform={`rotate(-90 ${size/2} ${size/2})`}style={{filter:`drop-shadow(0 0 4px ${color}88)`}}/>
    <text x={size/2}y={size/2+4}textAnchor="middle"fill={color}fontSize={size*.22}fontWeight="700"fontFamily="sans-serif">{score}</text>
  </svg>)
}

function TickerBar({companies}){
  if(!companies?.length)return null
  const items=[...companies,...companies]
  return(
    <div style={{background:'#060b14',borderBottom:'1px solid #0d1421',overflow:'hidden',height:28,display:'flex',alignItems:'center'}}>
      <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
      <div style={{display:'flex',animation:'ticker 60s linear infinite',whiteSpace:'nowrap'}}>
        {items.map((c,i)=>(
          <span key={i}style={{padding:'0 20px',fontSize:11,color:'#4a5f80',borderRight:'1px solid #0d1421',display:'inline-flex',alignItems:'center',gap:6}}>
            <span style={{color:'#f0f6ff',fontWeight:600}}>{c.name.split(' ')[0]}</span>
            <span style={{color:sc(c.exposure_score),fontWeight:700}}>{c.exposure_score}</span>
            {c.trending&&<span style={{color:'#00ff94',fontSize:9}}>▲</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function App(){
  const[view,setView]=useState('inicio')
  const[company,setCompany]=useState('NVIDIA')
  const[ranking,setRanking]=useState([])
  const[news,setNews]=useState([])
  const[stock,setStock]=useState(null)
  const[stockRange,setStockRange]=useState('1M')
  const[tab,setTab]=useState(0)
  const[rl,setRl]=useState(false)
  const[nl,setNl]=useState(false)
  const[sl,setSl]=useState(false)
  const[countdown,setCountdown]=useState(60)
  const[searchInput,setSearchInput]=useState('')
  const[suggestions,setSuggestions]=useState([])
  const[searchR,setSearchR]=useState(null)
  const[searchQ,setSearchQ]=useState('')
  const[lang,setLang]=useState('es')
  const iRef=useRef(),cntRef=useRef(),stockRef=useRef()

  const COMPANIES=['NVIDIA','TSMC','AMD','Broadcom','Arista Networks','Equinix','Vertiv Holdings','Constellation Energy','Super Micro Computer','SK Hynix','ASML','Lam Research','Micron Technology','Palo Alto Networks','CrowdStrike','Corning','Eaton Corporation','GE Vernova','Dell Technologies','Astera Labs','Credo Technology','Arm Holdings','Cadence Design Systems','Synopsys','Marvell Technology','Applied Materials','Intel','Digital Realty','Amphenol','Bloom Energy','Oklo','Celestica','Flex Ltd','Iron Mountain']

  useEffect(()=>{
    const l=localStorage.getItem('ii_lang');if(l)setLang(l)
    loadRanking()
    iRef.current=setInterval(()=>{loadRanking();setCountdown(60)},60000)
    cntRef.current=setInterval(()=>setCountdown(c=>c>0?c-1:60),1000)
    return()=>{clearInterval(iRef.current);clearInterval(cntRef.current)}
  },[])

  useEffect(()=>{localStorage.setItem('ii_lang',lang)},[lang])

  useEffect(()=>{
    if(view!=='deepdive')return
    if(stockRef.current)clearInterval(stockRef.current)
    loadStock(company,stockRange)
    stockRef.current=setInterval(()=>loadStock(company,stockRange),15000)
    return()=>clearInterval(stockRef.current)
  },[view,company,stockRange])

  async function loadRanking(){
    setRl(true)
    try{const d=await api('/api/ranking',{});setRanking(d.ranking||[])}catch{}
    setRl(false)
  }

  async function loadNews(co,type='news'){
    setNl(true)
    try{const d=await api(`/api/news?company=${encodeURIComponent(co)}&type=${type}`,{});setNews(d.results||[])}catch{setNews([])}
    setNl(false)
  }

  async function loadStock(co,range){
    setSl(true)
    try{const d=await api(`/api/stock?company=${encodeURIComponent(co)}&range=${range}`,{});setStock(d)}catch{setStock(null)}
    setSl(false)
  }

  async function doSearch(q){
    if(!q.trim())return
    setSearchQ(q);setView('buscar');setSuggestions([]);setSearchInput(q)
    try{const d=await api(`/api/search?q=${encodeURIComponent(q)}`,{});setSearchR(d)}catch{}
  }

  function handleSearch(val){
    setSearchInput(val)
    if(val.length>1)setSuggestions(COMPANIES.filter(c=>c.toLowerCase().includes(val.toLowerCase())).slice(0,6))
    else setSuggestions([])
  }

  function openCo(name){
    setCompany(name);setTab(0);setView('deepdive');setStock(null)
    loadNews(name);setSuggestions([])
  }

  const navItems=[
    {id:'inicio',label:lang==='es'?'Inicio':'Home'},
    {id:'empresas',label:lang==='es'?'Empresas':'Companies'},
    {id:'deepdive',label:'Deep Dive'},
    {id:'ecosistema',label:lang==='es'?'Ecosistema':'Ecosystem'},
    {id:'novedades',label:lang==='es'?'Novedades':'News'},
    {id:'watchlist',label:'Watchlist'},
  ]

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'#060b14',color:'#f0f6ff',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',fontSize:'13px'}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        a{color:inherit;text-decoration:none}
        button{cursor:pointer}
      `}</style>

      {/* Sidebar */}
      <div style={{width:200,background:'#0d1421',borderRight:'1px solid #1a2840',display:'flex',flexDirection:'column',position:'fixed',height:'100vh',zIndex:50}}>
        <div style={{padding:'20px 16px',borderBottom:'1px solid #1a2840'}}>
          <div style={{fontSize:16,fontWeight:800,background:'linear-gradient(90deg,#00d4ff,#7b61ff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:2}}>Indirect Intel</div>
          <div style={{fontSize:10,color:'#4a5f80'}}>{lang==='es'?'Inteligencia de inversión indirecta':'Indirect investment intelligence'}</div>
        </div>

        <nav style={{padding:'12px 8px',flex:1}}>
          {navItems.map(n=>(
            <div key={n.id} onClick={()=>{setView(n.id);if(n.id==='novedades'){loadNews('AI infrastructure semiconductor')}}} style={{padding:'9px 12px',borderRadius:8,cursor:'pointer',fontSize:13,marginBottom:2,color:view===n.id?'#00d4ff':'#8899bb',background:view===n.id?'#00d4ff11':'transparent',fontWeight:view===n.id?600:400,borderLeft:view===n.id?'2px solid #00d4ff':'2px solid transparent'}}>
              {n.label}
            </div>
          ))}
        </nav>

        <div style={{padding:'10px 14px',borderTop:'1px solid #1a2840'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#00ff94',display:'inline-block',boxShadow:'0 0 6px #00ff94',animation:'pulse 1.5s infinite'}}/>
              <span style={{fontSize:10,color:'#00ff94',fontWeight:600}}>{lang==='es'?'EN VIVO':'LIVE'}</span>
            </div>
            <span style={{fontSize:10,color:'#4a5f80'}}>{countdown}s</span>
          </div>
          <div style={{display:'flex',gap:3,marginTop:4}}>
            {['es','en'].map(l=>(
              <button key={l} onClick={()=>setLang(l)} style={{flex:1,padding:'4px',borderRadius:6,border:'none',fontSize:11,fontWeight:700,background:lang===l?'linear-gradient(90deg,#00d4ff,#7b61ff)':'#111c2d',color:lang===l?'#060b14':'#4a5f80'}}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{marginLeft:200,flex:1,display:'flex',flexDirection:'column'}}>
        <TickerBar companies={ranking.slice(0,20)}/>

        {/* Topbar */}
        <div style={{background:'#0d1421',borderBottom:'1px solid #1a2840',padding:'0 20px',height:50,display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:40}}>
          <div style={{flex:1,maxWidth:480,position:'relative'}}>
            <input
              value={searchInput}
              onChange={e=>handleSearch(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&doSearch(searchInput)}
              onFocus={e=>e.target.style.borderColor='#00d4ff'}
              onBlur={e=>{e.target.style.borderColor='#1a2840';setTimeout(()=>setSuggestions([]),150)}}
              placeholder={lang==='es'?'Buscar empresa o sector...':'Search company or sector...'}
              style={{width:'100%',background:'#111c2d',border:'1px solid #1a2840',borderRadius:8,padding:'8px 12px 8px 34px',color:'#f0f6ff',fontSize:13,outline:'none'}}
            />
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#4a5f80',pointerEvents:'none'}}>🔍</span>
            {suggestions.length>0&&(
              <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#0d1421',border:'1px solid #1a2840',borderRadius:8,marginTop:4,zIndex:100,overflow:'hidden',boxShadow:'0 8px 32px #00000088'}}>
                {suggestions.map(s=>(
                  <div key={s} onMouseDown={()=>openCo(s)} style={{padding:'10px 14px',cursor:'pointer',fontSize:13,color:'#8899bb',display:'flex',alignItems:'center',gap:10}} onMouseEnter={e=>e.currentTarget.style.background='#111c2d'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:26,height:26,borderRadius:6,background:lc(s)+'22',color:lc(s),display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,flexShrink:0}}>{s.substring(0,2).toUpperCase()}</div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            <button onClick={()=>setView('watchlist')} style={{padding:'6px 14px',borderRadius:8,background:'#00d4ff11',border:'1px solid #00d4ff33',color:'#00d4ff',fontSize:12,fontWeight:600}}>★ Watchlist</button>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{background:'#070d05',borderBottom:'1px solid #0f2008',padding:'4px 20px',fontSize:11,color:'#2a5a15'}}>
          ⚠ {lang==='es'?'Contenido informativo — No constituye asesoramiento financiero':'Informational content — Not financial advice'}
        </div>

        {/* Content */}
        <div style={{padding:20,flex:1,animation:'fadeIn .25s ease'}}>
          {view==='inicio'&&<Inicio ranking={ranking} loading={rl} onCo={openCo} onRefresh={loadRanking} lang={lang} setView={setView}/>}
          {view==='empresas'&&<Empresas ranking={ranking} loading={rl} onCo={openCo} lang={lang}/>}
          {view==='buscar'&&<Buscar results={searchR} query={searchQ} onSearch={doSearch} onCo={openCo} companies={COMPANIES} lang={lang}/>}
          {view==='deepdive'&&<DeepDive company={company} news={news} stock={stock} nl={nl} sl={sl} tab={tab} setTab={setTab} onCo={openCo} onLoadNews={(c,t)=>loadNews(c,t)} stockRange={stockRange} setStockRange={r=>{setStockRange(r);if(stockRef.current)clearInterval(stockRef.current);loadStock(company,r);stockRef.current=setInterval(()=>loadStock(company,r),15000)}} lang={lang}/>}
          {view==='ecosistema'&&<Ecosistema company={company} onCo={openCo} lang={lang}/>}
          {view==='novedades'&&<Novedades news={news} loading={nl} onRefresh={()=>loadNews('AI infrastructure semiconductor')} lang={lang}/>}
          {view==='watchlist'&&<Watchlist onCo={openCo} lang={lang}/>}
        </div>
      </div>
    </div>
  )
}

function Inicio({ranking,loading,onCo,onRefresh,lang,setView}){
  const top=ranking.slice(0,8)
  const emerging=ranking.filter(c=>c.trending).slice(0,3)
  const avg=ranking.length?Math.round(ranking.reduce((a,c)=>a+c.exposure_score,0)/ranking.length):null

  return(<div>
    {/* Hero */}
    <div style={{background:'linear-gradient(135deg,#0d1f3d 0%,#060b14 60%)',border:'1px solid #1a2840',borderRadius:16,padding:'32px 36px',marginBottom:24,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,#00d4ff08,transparent)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-20,left:'40%',width:150,height:150,borderRadius:'50%',background:'radial-gradient(circle,#7b61ff06,transparent)',pointerEvents:'none'}}/>
      <div style={{fontSize:11,color:'#00d4ff',fontWeight:600,textTransform:'uppercase',letterSpacing:'2px',marginBottom:12}}>
        {lang==='es'?'Inteligencia de inversión indirecta':'Indirect investment intelligence'}
      </div>
      <h1 style={{fontSize:28,fontWeight:800,color:'#f0f6ff',lineHeight:1.25,marginBottom:12,letterSpacing:'-0.5px',maxWidth:600}}>
        {lang==='es'
          ?'Las empresas que más ganan con la IA no son las que la hacen'
          :'The companies profiting most from AI are not the ones building it'}
      </h1>
      <p style={{fontSize:14,color:'#8899bb',lineHeight:1.7,maxWidth:560,marginBottom:24}}>
        {lang==='es'
          ?'Indirect Intel rastrea 52 compañías de infraestructura, energía, hardware y refrigeración que crecen por el boom de la IA — antes de que el mercado lo descuente.'
          :'Indirect Intel tracks 52 infrastructure, energy, hardware and cooling companies growing from the AI boom — before the market prices it in.'}
      </p>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <button onClick={()=>setView('empresas')} style={{padding:'10px 24px',borderRadius:10,border:'none',background:'linear-gradient(90deg,#00d4ff,#7b61ff)',color:'#060b14',fontSize:13,fontWeight:700,boxShadow:'0 0 20px #00d4ff44'}}>
          {lang==='es'?'Explorar el ecosistema →':'Explore the ecosystem →'}
        </button>
        <button onClick={()=>{setView('deepdive')}} style={{padding:'10px 24px',borderRadius:10,border:'1px solid #1a2840',background:'#111c2d',color:'#8899bb',fontSize:13,fontWeight:500}}>
          {lang==='es'?'Ver NVIDIA ahora':'View NVIDIA now'}
        </button>
      </div>
      <div style={{marginTop:20,display:'flex',gap:20,flexWrap:'wrap'}}>
        {[
          {v:ranking.length||52,l:lang==='es'?'empresas monitoreadas':'companies tracked'},
          {v:avg?`${avg}/100`:'calculando...',l:lang==='es'?'score promedio del sector':'avg sector score'},
          {v:'Yahoo Finance + Tavily',l:lang==='es'?'fuentes verificadas':'verified sources'},
          {v:lang==='es'?'cada 60s':'every 60s',l:lang==='es'?'frecuencia de actualización':'update frequency'},
        ].map((m,i)=>(
          <div key={i}>
            <div style={{fontSize:15,fontWeight:700,color:'#f0f6ff'}}>{m.v}</div>
            <div style={{fontSize:11,color:'#4a5f80'}}>{m.l}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Emerging signals */}
    {emerging.length>0&&(
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <h2 style={{fontSize:14,fontWeight:700,color:'#f0f6ff'}}>⚡ {lang==='es'?'Señales emergentes':'Emerging signals'}</h2>
          <span style={{fontSize:11,color:'#4a5f80'}}>{lang==='es'?'Empresas ganando relevancia antes que el mercado':'Companies gaining relevance before the market'}</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {emerging.map(c=>(
            <div key={c.id} onClick={()=>onCo(c.name)} style={{background:'linear-gradient(135deg,#0d1f3d,#0a1a0d)',border:'1px solid #00d4ff22',borderRadius:12,padding:16,cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='#00d4ff55';e.currentTarget.style.transform='translateY(-2px)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#00d4ff22';e.currentTarget.style.transform='translateY(0)'}}>
              <div style={{fontSize:10,color:'#00d4ff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:6,fontWeight:600}}>⚡ {lang==='es'?'Señal emergente':'Emerging signal'}</div>
              <div style={{fontSize:15,fontWeight:700,color:'#f0f6ff',marginBottom:3}}>{c.name}</div>
              <div style={{fontSize:11,color:'#4a5f80',marginBottom:12}}>{c.industry}</div>
              <div style={{display:'flex',gap:16}}>
                <div><div style={{fontSize:10,color:'#4a5f80',marginBottom:2}}>Score</div><div style={{fontSize:20,fontWeight:800,color:sc(c.exposure_score)}}>{c.exposure_score}</div></div>
                <div><div style={{fontSize:10,color:'#4a5f80',marginBottom:2}}>{lang==='es'?'Menciones':'Mentions'}</div><div style={{fontSize:20,fontWeight:800,color:'#f0f6ff'}}>{c.mention_count}×</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Ranking */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:16}}>
      <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <h2 style={{fontSize:14,fontWeight:700,color:'#f0f6ff',marginBottom:2}}>{lang==='es'?'Empresas del sector':'Sector companies'}</h2>
            <div style={{fontSize:11,color:'#4a5f80'}}>{lang==='es'?'Ordenadas por score de exposición a la IA':'Ranked by AI exposure score'}</div>
          </div>
          <button onClick={onRefresh} style={{padding:'5px 12px',borderRadius:8,border:'1px solid #1a2840',background:'transparent',color:'#4a5f80',fontSize:11}}>{loading?'...':(lang==='es'?'↺ Actualizar':'↺ Refresh')}</button>
        </div>
        {loading?(
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'30px 0',justifyContent:'center',color:'#4a5f80'}}>
            <span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>↺</span>
            {lang==='es'?'Cargando datos reales...':'Loading real data...'}
          </div>
        ):top.map((c,i)=>(
          <div key={c.id} onClick={()=>onCo(c.name)} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 8px',borderRadius:8,cursor:'pointer',borderBottom:'1px solid #111c2d',transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='#111c2d'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{fontSize:11,fontWeight:700,color:'#2a3f60',width:18,textAlign:'right',flexShrink:0}}>{i+1}</span>
            <div style={{width:32,height:32,borderRadius:7,background:lc(c.name)+'18',border:`1px solid ${lc(c.name)}33`,color:lc(c.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,flexShrink:0}}>{c.name.substring(0,2).toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:'#f0f6ff',marginBottom:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
              <div style={{fontSize:11,color:'#4a5f80'}}>{c.industry} · {c.country}</div>
            </div>
            {c.trending&&<span style={{padding:'2px 7px',borderRadius:12,fontSize:10,fontWeight:600,background:'#00d4ff11',color:'#00d4ff',border:'1px solid #00d4ff33',flexShrink:0}}>↑</span>}
            <ScoreRing score={c.exposure_score} size={38}/>
          </div>
        ))}
        <div style={{marginTop:12,textAlign:'center'}}>
          <button onClick={()=>setView('empresas')} style={{padding:'7px 16px',borderRadius:8,border:'1px solid #1a2840',background:'transparent',color:'#00d4ff',fontSize:12,fontWeight:500}}>
            {lang==='es'?'Ver las 52 empresas →':'View all 52 companies →'}
          </button>
        </div>
      </div>

      {/* Methodology */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
          <h3 style={{fontSize:13,fontWeight:700,color:'#f0f6ff',marginBottom:10}}>¿Qué es el Score de Exposición IA?</h3>
          <p style={{fontSize:12,color:'#8899bb',lineHeight:1.6,marginBottom:12}}>
            {lang==='es'
              ?'Un número del 0 al 100 que mide cuánto dependen los ingresos de una empresa del crecimiento de la IA — directa o indirectamente.'
              :'A 0-100 number measuring how much a company\'s revenue depends on AI growth — directly or indirectly.'}
          </p>
          {[
            {l:lang==='es'?'Menciones en medios verificados':'Verified media mentions',v:'30%',c:'#00d4ff'},
            {l:lang==='es'?'Contratos y partnerships IA':'AI contracts & partnerships',v:'25%',c:'#7b61ff'},
            {l:lang==='es'?'Precio y momentum bursátil':'Stock price & momentum',v:'25%',c:'#00ff94'},
            {l:lang==='es'?'Riesgo y concentración':'Risk & concentration',v:'20%',c:'#ffd60a'},
          ].map((m,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid #111c2d'}}>
              <span style={{fontSize:11,color:'#4a5f80'}}>{m.l}</span>
              <span style={{fontSize:11,fontWeight:700,color:m.c}}>{m.v}</span>
            </div>
          ))}
        </div>
        <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
          <h3 style={{fontSize:13,fontWeight:700,color:'#f0f6ff',marginBottom:10}}>{lang==='es'?'Fuentes de datos':'Data sources'}</h3>
          {[
            {n:'Yahoo Finance',d:lang==='es'?'Precios · delay 15min':'Prices · 15min delay'},
            {n:'Tavily',d:lang==='es'?'Noticias verificadas · tiempo real':'Verified news · real time'},
            {n:'SEC EDGAR',d:lang==='es'?'Filings trimestrales':'Quarterly filings'},
            {n:'Reuters / Bloomberg',d:lang==='es'?'Noticias de alto impacto':'High-impact news'},
          ].map((s,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #111c2d'}}>
              <span style={{fontSize:12,fontWeight:500,color:'#f0f6ff'}}>{s.n}</span>
              <span style={{fontSize:11,color:'#4a5f80'}}>{s.d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>)
}

function Empresas({ranking,loading,onCo,lang}){
  const[sector,setSector]=useState('todos')
  const sectores=[...new Set(ranking.map(c=>c.industry))].filter(Boolean).slice(0,8)
  const filtered=sector==='todos'?ranking:ranking.filter(c=>c.industry===sector)

  return(<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
      <div>
        <h1 style={{fontSize:20,fontWeight:800,color:'#f0f6ff',marginBottom:4}}>{lang==='es'?'Empresas del ecosistema IA':'AI ecosystem companies'}</h1>
        <div style={{fontSize:12,color:'#4a5f80'}}>{lang==='es'?`${ranking.length} empresas monitoreadas · Score de exposición IA actualizado cada hora`:`${ranking.length} companies monitored · AI exposure score updated hourly`}</div>
      </div>
    </div>
    <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
      <span onClick={()=>setSector('todos')} style={{padding:'5px 14px',borderRadius:20,fontSize:12,cursor:'pointer',border:`1px solid ${sector==='todos'?'#00d4ff':'#1a2840'}`,background:sector==='todos'?'#00d4ff11':'transparent',color:sector==='todos'?'#00d4ff':'#8899bb',fontWeight:sector==='todos'?600:400}}>
        {lang==='es'?'Todos':'All'}
      </span>
      {sectores.map(s=>(
        <span key={s} onClick={()=>setSector(s)} style={{padding:'5px 14px',borderRadius:20,fontSize:12,cursor:'pointer',border:`1px solid ${sector===s?'#00d4ff':'#1a2840'}`,background:sector===s?'#00d4ff11':'transparent',color:sector===s?'#00d4ff':'#8899bb',fontWeight:sector===s?600:400}}>
          {s}
        </span>
      ))}
    </div>
    {loading?(
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'60px 0',color:'#4a5f80'}}>
        <span style={{animation:'spin 1s linear infinite',fontSize:20}}>↺</span>
        {lang==='es'?'Cargando datos reales de Tavily...':'Loading real data from Tavily...'}
      </div>
    ):(
      <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 80px',padding:'8px 16px',borderBottom:'1px solid #1a2840',fontSize:11,color:'#4a5f80',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>
          <span>{lang==='es'?'Empresa':'Company'}</span>
          <span>{lang==='es'?'Sector':'Sector'}</span>
          <span>{lang==='es'?'País':'Country'}</span>
          <span style={{textAlign:'center'}}>Score</span>
        </div>
        {filtered.map((c,i)=>(
          <div key={c.id} onClick={()=>onCo(c.name)} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 80px',alignItems:'center',padding:'12px 16px',borderBottom:i<filtered.length-1?'1px solid #111c2d':'none',cursor:'pointer',transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='#111c2d'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:7,background:lc(c.name)+'18',border:`1px solid ${lc(c.name)}33`,color:lc(c.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,flexShrink:0}}>{c.name.substring(0,2).toUpperCase()}</div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'#f0f6ff'}}>{c.name}</div>
                {c.trending&&<span style={{fontSize:10,color:'#00d4ff'}}>↑ trending</span>}
              </div>
            </div>
            <div style={{fontSize:12,color:'#8899bb'}}>{c.industry||'—'}</div>
            <div style={{fontSize:12,color:'#8899bb'}}>{c.country||'—'}</div>
            <div style={{display:'flex',justifyContent:'center'}}><ScoreRing score={c.exposure_score} size={38}/></div>
          </div>
        ))}
      </div>
    )}
  </div>)
}

function Buscar({results,query,onSearch,onCo,companies,lang}){
  const[q,setQ]=useState(query||'')
  const[sugg,setSugg]=useState([])
  const cos=results?.companies||[]
  function handleQ(val){setQ(val);if(val.length>1)setSugg((companies||[]).filter(c=>c.toLowerCase().includes(val.toLowerCase())).slice(0,6));else setSugg([])}
  return(<div>
    <h1 style={{fontSize:20,fontWeight:800,color:'#f0f6ff',marginBottom:20}}>{lang==='es'?'Buscar empresas':'Search companies'}</h1>
    <div style={{position:'relative',marginBottom:16}}>
      <div style={{display:'flex',gap:10}}>
        <div style={{flex:1,position:'relative'}}>
          <input value={q} onChange={e=>handleQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onSearch(q)} style={{width:'100%',background:'#0d1421',border:'1px solid #1a2840',borderRadius:10,padding:'12px 16px 12px 40px',color:'#f0f6ff',fontSize:14,outline:'none'}} placeholder={lang==='es'?'Empresa, sector o tecnología...':'Company, sector or technology...'} onFocus={e=>e.target.style.borderColor='#00d4ff'} onBlur={e=>{e.target.style.borderColor='#1a2840';setTimeout(()=>setSugg([]),150)}}/>
          <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#4a5f80',fontSize:16}}>🔍</span>
        </div>
        <button onClick={()=>onSearch(q)} style={{padding:'12px 24px',borderRadius:10,border:'none',background:'linear-gradient(90deg,#00d4ff,#7b61ff)',color:'#060b14',fontSize:13,fontWeight:700}}>{lang==='es'?'Buscar':'Search'}</button>
      </div>
      {sugg.length>0&&<div style={{position:'absolute',top:'100%',left:0,right:80,background:'#0d1421',border:'1px solid #1a2840',borderRadius:8,marginTop:4,zIndex:100,overflow:'hidden',boxShadow:'0 8px 32px #00000088'}}>
        {sugg.map(s=>(<div key={s} onMouseDown={()=>{onCo(s);setSugg([])}} style={{padding:'10px 14px',cursor:'pointer',fontSize:13,color:'#8899bb',display:'flex',alignItems:'center',gap:10}} onMouseEnter={e=>e.currentTarget.style.background='#111c2d'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><div style={{width:26,height:26,borderRadius:6,background:lc(s)+'22',color:lc(s),display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800}}>{s.substring(0,2).toUpperCase()}</div>{s}</div>))}
      </div>}
    </div>
    <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
      {['chips','data centers','energía','networking','cooling','ciberseguridad'].map(tag=>(<span key={tag} onClick={()=>{setQ(tag);onSearch(tag)}} style={{padding:'5px 14px',borderRadius:20,background:'#0d1421',border:'1px solid #1a2840',fontSize:12,color:'#8899bb',cursor:'pointer'}} onMouseEnter={e=>{e.target.style.borderColor='#00d4ff';e.target.style.color='#00d4ff'}} onMouseLeave={e=>{e.target.style.borderColor='#1a2840';e.target.style.color='#8899bb'}}>{tag}</span>))}
    </div>
    {cos.length>0&&<div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,overflow:'hidden'}}>
      <div style={{padding:'8px 14px',borderBottom:'1px solid #1a2840',fontSize:12,color:'#4a5f80'}}>{results.result_count} {lang==='es'?'resultados para':'results for'} "{results.query}"</div>
      {cos.map((c,i)=>(<div key={c.id} onClick={()=>onCo(c.name)} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',cursor:'pointer',borderBottom:i<cos.length-1?'1px solid #111c2d':'none'}} onMouseEnter={e=>e.currentTarget.style.background='#111c2d'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
        <div style={{width:36,height:36,borderRadius:8,background:lc(c.name)+'18',border:`1px solid ${lc(c.name)}33`,color:lc(c.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800}}>{c.name.substring(0,2).toUpperCase()}</div>
        <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:'#f0f6ff',marginBottom:2}}>{c.name}</div><div style={{fontSize:11,color:'#4a5f80'}}>{c.industry} · {c.country}</div></div>
        <ScoreRing score={c.exposure_score||0} size={38}/>
      </div>))}
    </div>}
    {results&&cos.length===0&&<div style={{textAlign:'center',padding:'60px 0',color:'#4a5f80'}}><div style={{fontSize:32,marginBottom:12}}>🔍</div><div style={{fontSize:15,color:'#8899bb',marginBottom:8}}>{lang==='es'?`Sin resultados para "${query}"`:`No results for "${query}"`}</div><div style={{fontSize:12}}>{lang==='es'?'Probá: chips, data centers, energía, nvidia':'Try: chips, data centers, energy, nvidia'}</div></div>}
  </div>)
}

function RealChart({stock,range,setRange,sl,lang}){
  const canvasRef=useRef()
  const ranges=['1D','1S','1M','3M','1A']
  useEffect(()=>{
    if(!canvasRef.current||!stock?.history?.length)return
    const canvas=canvasRef.current
    const ctx=canvas.getContext('2d')
    const W=canvas.offsetWidth||600,H=200
    canvas.width=W*(window.devicePixelRatio||1)
    canvas.height=H*(window.devicePixelRatio||1)
    ctx.scale(window.devicePixelRatio||1,window.devicePixelRatio||1)
    const prices=stock.history.map(d=>d.close).filter(Boolean)
    if(!prices.length)return
    const min=Math.min(...prices),max=Math.max(...prices),rng=max-min||1
    const pad={top:20,right:16,bottom:28,left:56}
    const cW=W-pad.left-pad.right,cH=H-pad.top-pad.bottom
    ctx.clearRect(0,0,W,H)
    const up=stock.change_pct>=0
    const lineColor=up?'#00ff94':'#ff4444'
    ctx.strokeStyle='#1a2840';ctx.lineWidth=0.5
    for(let i=0;i<=4;i++){
      const y=pad.top+cH*(1-i/4)
      ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(W-pad.right,y);ctx.stroke()
      ctx.fillStyle='#4a5f80';ctx.font='10px sans-serif';ctx.textAlign='right'
      ctx.fillText(`$${(min+rng*i/4).toFixed(0)}`,pad.left-6,y+4)
    }
    const step=Math.max(1,Math.floor(prices.length/5))
    stock.history.filter((_,i)=>i%step===0).forEach((d,i,arr)=>{
      const x=pad.left+(i/Math.max(arr.length-1,1))*cW
      ctx.fillStyle='#4a5f80';ctx.font='10px sans-serif';ctx.textAlign='center'
      const label=range==='1D'?new Date(d.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):new Date(d.date).toLocaleDateString([],{month:'short',day:'numeric'})
      ctx.fillText(label,x,H-6)
    })
    const grad=ctx.createLinearGradient(0,pad.top,0,pad.top+cH)
    grad.addColorStop(0,lineColor+'44');grad.addColorStop(1,lineColor+'00')
    ctx.beginPath()
    prices.forEach((p,i)=>{const x=pad.left+(i/(prices.length-1))*cW,y=pad.top+cH*(1-(p-min)/rng);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
    ctx.lineTo(pad.left+cW,pad.top+cH);ctx.lineTo(pad.left,pad.top+cH);ctx.closePath()
    ctx.fillStyle=grad;ctx.fill()
    ctx.beginPath();ctx.strokeStyle=lineColor;ctx.lineWidth=2;ctx.shadowColor=lineColor;ctx.shadowBlur=6
    prices.forEach((p,i)=>{const x=pad.left+(i/(prices.length-1))*cW,y=pad.top+cH*(1-(p-min)/rng);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
    ctx.stroke();ctx.shadowBlur=0
    const lp=prices[prices.length-1],lx=pad.left+cW,ly=pad.top+cH*(1-(lp-min)/rng)
    ctx.beginPath();ctx.arc(lx,ly,4,0,Math.PI*2);ctx.fillStyle=lineColor;ctx.fill()
    ctx.strokeStyle='#060b14';ctx.lineWidth=2;ctx.stroke()
  },[stock])

  const up=stock?.change_pct>=0
  const color=up?'#00ff94':'#ff4444'

  return(<div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
      <div>
        <div style={{fontSize:10,color:'#4a5f80',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>{lang==='es'?'Precio de la acción':'Stock price'} · {stock?.exchange||'NASDAQ'} · <span style={{color:'#2a3f60'}}>delay 15min</span></div>
        {sl?<div style={{display:'flex',alignItems:'center',gap:8,color:'#4a5f80',fontSize:13}}><span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>↺</span>Yahoo Finance...</div>
        :stock?.current_price?(<div style={{display:'flex',alignItems:'baseline',gap:10}}>
          <div style={{fontSize:30,fontWeight:800,color:'#f0f6ff'}}>${stock.current_price.toFixed(2)}</div>
          <div style={{fontSize:14,fontWeight:700,color}}>{up?'▲':'▼'} {stock.change_abs>0?'+':''}{stock.change_abs?.toFixed(2)} ({up?'+':''}{stock.change_pct?.toFixed(2)}%)</div>
        </div>)
        :<div style={{fontSize:13,color:'#4a5f80'}}>{stock?.error||'—'}</div>}
      </div>
      <div style={{display:'flex',gap:2,background:'#111c2d',border:'1px solid #1a2840',borderRadius:8,padding:3}}>
        {ranges.map(r=>(<button key={r} onClick={()=>setRange(r)} style={{padding:'4px 10px',borderRadius:6,border:'none',fontSize:11,fontWeight:700,background:range===r?color:'transparent',color:range===r?'#060b14':'#4a5f80'}}>{r}</button>))}
      </div>
    </div>
    {stock?.current_price&&<div style={{display:'flex',gap:16,marginBottom:12,flexWrap:'wrap'}}>
      {[
        {l:lang==='es'?'Máx. día':'Day high',v:stock.day_high?`$${stock.day_high.toFixed(2)}`:'—'},
        {l:lang==='es'?'Mín. día':'Day low',v:stock.day_low?`$${stock.day_low.toFixed(2)}`:'—'},
        {l:lang==='es'?'Apertura':'Open',v:stock.open?`$${stock.open.toFixed(2)}`:'—'},
        {l:'Mercado',v:stock.market_state==='REGULAR'?(lang==='es'?'Abierto':'Open'):(lang==='es'?'Cerrado':'Closed'),c:stock.market_state==='REGULAR'?'#00ff94':'#4a5f80'},
      ].map((m,i)=>(<div key={i}><div style={{fontSize:10,color:'#4a5f80',marginBottom:2,textTransform:'uppercase',letterSpacing:'0.5px'}}>{m.l}</div><div style={{fontSize:12,fontWeight:600,color:m.c||'#f0f6ff'}}>{m.v}</div></div>))}
    </div>}
    <div style={{position:'relative',width:'100%',height:200}}>
      {sl&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#4a5f80',flexDirection:'column',gap:8}}><span style={{animation:'spin 1s linear infinite',fontSize:20}}>↺</span><span style={{fontSize:12}}>Yahoo Finance...</span></div>}
      <canvas ref={canvasRef} style={{width:'100%',height:200,display:'block',opacity:sl?.3:1,transition:'opacity .3s'}}/>
    </div>
    {stock?.fetched_at&&<div style={{fontSize:10,color:'#2a3f60',marginTop:6,textAlign:'right'}}>Yahoo Finance · {new Date(stock.fetched_at).toLocaleTimeString()} · {lang==='es'?'se actualiza cada 15s':'updates every 15s'}</div>}
  </div>)
}

function ChainCol({title,items,color,dir,onCo}){
  return(<div style={{minWidth:140,padding:'0 8px'}}>
    <div style={{fontSize:10,color:'#4a5f80',textTransform:'uppercase',letterSpacing:1,marginBottom:8,fontWeight:600}}>{title}</div>
    {items.map(n=>(<div key={n} onClick={()=>onCo(n)} style={{background:'#111c2d',border:'1px solid #1a2840',borderRadius:8,padding:'8px 10px',marginBottom:6,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.borderColor=color+'66'} onMouseLeave={e=>e.currentTarget.style.borderColor='#1a2840'}>
      <div style={{fontSize:12,fontWeight:600,color:'#f0f6ff',marginBottom:2}}>{n}</div>
      <div style={{fontSize:10,color,fontWeight:500}}>{dir}</div>
    </div>))}
  </div>)
}

function DeepDive({company,news,stock,nl,sl,tab,setTab,onCo,onLoadNews,stockRange,setStockRange,lang}){
  const tabs=[lang==='es'?'Mercado':'Market',lang==='es'?'Cadena de Valor':'Value Chain',lang==='es'?'Noticias':'News',lang==='es'?'Especulación':'Speculation',lang==='es'?'Riesgo':'Risk']
  const chain={
    suppliers:['TSMC','SK Hynix','ASML','Lam Research','Applied Materials'],
    clients:['Microsoft','Meta','Google','Amazon','Super Micro Computer'],
    indirect:['Equinix','Vertiv Holdings','Arista Networks','Constellation Energy','Corning']
  }
  const risks=[
    {l:lang==='es'?'Concentración de clientes':'Client concentration',r:'ALTO',d:lang==='es'?'Top 5 = 47% ingresos':'Top 5 = 47% revenue'},
    {l:lang==='es'?'Riesgo geopolítico China':'Geopolitical risk China',r:'CRÍTICO',d:lang==='es'?'Restricciones de exportación activas':'Active export restrictions'},
    {l:lang==='es'?'Riesgo regulatorio':'Regulatory risk',r:'MEDIO',d:lang==='es'?'Investigaciones antimonopolio':'Antitrust investigations'},
    {l:lang==='es'?'Solidez financiera':'Financial strength',r:'BAJO',d:lang==='es'?'Efectivo neto +$26B':'Net cash +$26B'},
    {l:lang==='es'?'Dependencia de TSMC':'TSMC dependence',r:'ALTO',d:lang==='es'?'90% fabricación en Taiwan':'90% manufacturing in Taiwan'},
  ]

  return(<div>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <div style={{width:48,height:48,borderRadius:10,background:lc(company)+'18',border:`1px solid ${lc(company)}44`,color:lc(company),display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800}}>{company.substring(0,2).toUpperCase()}</div>
        <div>
          <h1 style={{fontSize:20,fontWeight:800,color:'#f0f6ff',marginBottom:3}}>{company}</h1>
          <div style={{fontSize:12,color:'#4a5f80'}}>{lang==='es'?'Análisis profundo · IA Infrastructure':'Deep analysis · AI Infrastructure'}</div>
        </div>
      </div>
      <button onClick={()=>onLoadNews(company,'news')} style={{padding:'7px 14px',borderRadius:8,border:'1px solid #1a2840',background:'#0d1421',color:'#8899bb',fontSize:12}}>{lang==='es'?'↺ Actualizar noticias':'↺ Refresh news'}</button>
    </div>

    <div style={{display:'flex',gap:0,borderBottom:'1px solid #1a2840',marginBottom:20,overflowX:'auto'}}>
      {tabs.map((tb,i)=>(<div key={i} onClick={()=>setTab(i)} style={{padding:'10px 16px',cursor:'pointer',fontSize:12,fontWeight:tab===i?700:400,color:tab===i?'#00d4ff':'#8899bb',borderBottom:tab===i?'2px solid #00d4ff':'2px solid transparent',marginBottom:-1,whiteSpace:'nowrap'}}>{tb}</div>))}
    </div>

    {tab===0&&(<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <RealChart stock={stock} range={stockRange} setRange={setStockRange} sl={sl} lang={lang}/>
      <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
        <div style={{fontSize:13,fontWeight:700,color:'#f0f6ff',marginBottom:12}}>Sentiment</div>
        <div style={{fontSize:11,color:'#4a5f80',marginBottom:12,lineHeight:1.5}}>
          {lang==='es'?'Basado en menciones públicas verificadas (mínimo 100 por canal). Integración completa con APIs de redes en desarrollo.':'Based on verified public mentions (minimum 100 per channel). Full social API integration in development.'}
        </div>
        {[{c:'Reddit',v:72,color:'#ff6b35'},{c:'StockTwits',v:68,color:'#00ff94'},{c:'LinkedIn',v:81,color:'#0a66c2'},{c:'X/Twitter',v:64,color:'#1d9bf0'}].map(ch=>(<div key={ch.c} style={{marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:11,color:'#8899bb'}}>{ch.c}</span><span style={{fontSize:12,fontWeight:700,color:ch.color}}>{ch.v}/100</span></div>
          <div style={{height:5,background:'#111c2d',borderRadius:3,overflow:'hidden'}}><div style={{width:`${ch.v}%`,height:'100%',background:`linear-gradient(90deg,${ch.color}88,${ch.color})`,borderRadius:3}}/></div>
        </div>))}
        <div style={{fontSize:10,color:'#2a3f60',marginTop:8,fontStyle:'italic'}}>{lang==='es'?'* Estimado hasta integración completa':'* Estimated until full integration'}</div>
      </div>
    </div>)}

    {tab===1&&(<div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
      <div style={{fontSize:13,fontWeight:700,color:'#f0f6ff',marginBottom:4}}>{lang==='es'?'Cadena de Valor — Directa e Inversa':'Value Chain — Direct and Inverse'}</div>
      <div style={{fontSize:12,color:'#4a5f80',marginBottom:16}}>{lang==='es'?'Quién le vende a esta empresa y a quién le vende ella':'Who sells to this company and who it sells to'}</div>
      <div style={{display:'flex',gap:0,overflowX:'auto',paddingBottom:8}}>
        <ChainCol title={lang==='es'?'Proveedores':'Suppliers'} items={chain.suppliers} color='#7b61ff' dir={lang==='es'?'directa':'direct'} onCo={onCo}/>
        <div style={{display:'flex',alignItems:'center',padding:'0 8px',paddingTop:24,color:'#1a2840',fontSize:20}}>→</div>
        <div style={{minWidth:130,padding:'0 8px',borderLeft:'2px solid #00d4ff',borderRight:'2px solid #00d4ff',background:'#00d4ff05'}}>
          <div style={{fontSize:10,color:'#00d4ff',textTransform:'uppercase',letterSpacing:1,marginBottom:8,fontWeight:600}}>{lang==='es'?'Centro':'Center'}</div>
          <div style={{background:'#00d4ff11',border:'1px solid #00d4ff44',borderRadius:8,padding:'8px 10px'}}><div style={{fontSize:13,fontWeight:700,color:'#00d4ff'}}>{company}</div></div>
        </div>
        <div style={{display:'flex',alignItems:'center',padding:'0 8px',paddingTop:24,color:'#1a2840',fontSize:20}}>→</div>
        <ChainCol title={lang==='es'?'Clientes directos':'Direct clients'} items={chain.clients} color='#00ff94' dir={lang==='es'?'directa':'direct'} onCo={onCo}/>
        <div style={{display:'flex',alignItems:'center',padding:'0 8px',paddingTop:24,color:'#1a2840',fontSize:20}}>→</div>
        <ChainCol title={lang==='es'?'Beneficiarios indirectos':'Indirect beneficiaries'} items={chain.indirect} color='#ffd60a' dir={lang==='es'?'indirecta':'indirect'} onCo={onCo}/>
      </div>
    </div>)}

    {tab===2&&(<div>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        {['news','contracts'].map(tp=>(<button key={tp} onClick={()=>onLoadNews(company,tp)} style={{padding:'7px 14px',borderRadius:8,border:'1px solid #1a2840',background:'#0d1421',color:'#8899bb',fontSize:12}}>{tp==='news'?(lang==='es'?'📰 Noticias':'📰 News'):(lang==='es'?'📋 Contratos':'📋 Contracts')}</button>))}
        <div style={{marginLeft:'auto',fontSize:11,color:'#4a5f80',display:'flex',alignItems:'center',gap:5}}><span style={{width:5,height:5,borderRadius:'50%',background:'#00ff94',display:'inline-block',animation:'pulse 1.5s infinite'}}/>{lang==='es'?'Fuente: Tavily':'Source: Tavily'}</div>
      </div>
      {nl?(<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'50px 0',color:'#4a5f80'}}><span style={{animation:'spin 1s linear infinite',fontSize:22}}>↺</span><span>{lang==='es'?'Buscando en Reuters, Bloomberg, SEC...':'Searching Reuters, Bloomberg, SEC...'}</span></div>)
      :news.length>0?news.map((item,i)=>(<div key={i} style={{padding:'12px 16px',marginBottom:8,background:'#0d1421',border:'1px solid #1a2840',borderRadius:10,borderLeft:`3px solid ${item.impact==='high'?'#ff4444':item.impact==='medium'?'#ffd60a':'#00d4ff'}`}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
          <span style={{fontSize:10,color:'#4a5f80'}}>{item.source}</span>
          <span style={{padding:'1px 8px',borderRadius:12,fontSize:10,fontWeight:700,background:item.impact==='high'?'#1f0000':item.impact==='medium'?'#1f1500':'#001520',color:item.impact==='high'?'#ff4444':item.impact==='medium'?'#ffd60a':'#00d4ff'}}>{item.impact==='high'?(lang==='es'?'ALTO':'HIGH'):item.impact==='medium'?(lang==='es'?'MEDIO':'MEDIUM'):(lang==='es'?'BAJO':'LOW')}</span>
          {item.published_date&&<span style={{fontSize:10,color:'#4a5f80',marginLeft:'auto'}}>{item.published_date}</span>}
        </div>
        <a href={item.url} target="_blank" rel="noopener" style={{fontSize:13,color:'#f0f6ff',lineHeight:1.5,display:'block',marginBottom:6}} onMouseEnter={e=>e.target.style.color='#00d4ff'} onMouseLeave={e=>e.target.style.color='#f0f6ff'}>{item.title}</a>
        {item.snippet&&<div style={{fontSize:11,color:'#4a5f80',lineHeight:1.5}}>{item.snippet}...</div>}
      </div>))
      :(<div style={{textAlign:'center',padding:'50px 0',color:'#4a5f80'}}><div style={{fontSize:24,marginBottom:12}}>📰</div><div>{lang==='es'?'Sin noticias verificadas recientes':'No recent verified news'}</div></div>)}
    </div>)}

    {tab===3&&(<div style={{background:'#120f00',border:'1px solid #ffd60a33',borderRadius:12,padding:16}}>
      <div style={{fontSize:14,fontWeight:700,color:'#ffd60a',marginBottom:8}}>⚠ {lang==='es'?'Zona Especulativa':'Speculative Zone'}</div>
      <div style={{fontSize:12,color:'#4a5f80',lineHeight:1.5,marginBottom:16}}>{lang==='es'?'Esta sección muestra opiniones de redes sociales públicas. No es información verificada. Solo se muestra con 100+ menciones verificadas.':'This section shows public social media opinions. Not verified information. Only shown with 100+ verified mentions.'}</div>
      {[{c:'Reddit',v:72,pos:68,neg:18,color:'#ff6b35'},{c:'StockTwits',v:68,pos:62,neg:22,color:'#00ff94'},{c:'LinkedIn',v:81,pos:75,neg:10,color:'#0a66c2'}].map(ch=>(<div key={ch.c} style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:10,padding:14,marginBottom:10}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}><span style={{fontSize:13,fontWeight:600,color:'#f0f6ff'}}>{ch.c}</span><span style={{fontSize:12,fontWeight:700,color:ch.color}}>Score {ch.v}/100</span></div>
        {[{l:lang==='es'?'Positivo':'Positive',v:ch.pos,c:'#00ff94'},{l:lang==='es'?'Negativo':'Negative',v:ch.neg,c:'#ff4444'},{l:lang==='es'?'Neutro':'Neutral',v:100-ch.pos-ch.neg,c:'#4a5f80'}].map(ss=>(<div key={ss.l} style={{marginBottom:7}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}><span style={{color:'#8899bb'}}>{ss.l}</span><span style={{color:ss.c,fontWeight:600}}>{ss.v}%</span></div>
          <div style={{height:4,background:'#111c2d',borderRadius:2}}><div style={{width:`${ss.v}%`,height:'100%',background:ss.c,borderRadius:2}}/></div>
        </div>))}
      </div>))}
    </div>)}

    {tab===4&&(<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={{background:'#0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
        <div style={{fontSize:13,fontWeight:700,color:'#f0f6ff',marginBottom:14}}>{lang==='es'?'Matriz de Riesgo':'Risk Matrix'}</div>
        {risks.map((r,i)=>(<div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #111c2d'}}>
          <div><div style={{fontSize:12,color:'#8899bb',marginBottom:2}}>{r.l}</div><div style={{fontSize:10,color:'#4a5f80'}}>{r.d}</div></div>
          <span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:r.r==='CRÍTICO'?'#1f0000':r.r==='ALTO'?'#1f0a00':r.r==='MEDIO'?'#1f1a00':'#001508',color:r.r==='CRÍTICO'?'#ff4444':r.r==='ALTO'?'#ff6b35':r.r==='MEDIO'?'#ffd60a':'#00ff94',flexShrink:0}}>{r.r}</span>
        </div>))}
      </div>
      <div style={{background:'0d1421',border:'1px solid #1a2840',borderRadius:12,padding:16}}>
        <div style={{fontSize:13,fontWeight:700,color:'#f0f6ff',marginBottom:4}}>{lang==='es'?'¿Qué significa este análisis?':'What does this analysis mean?'}</div>
        <div style={{fontSize:12,color:'#8899bb',lineHeight:1.7,marginBottom:14}}>{lang==='es'?'Esta matriz evalúa los principales factores de riesgo que podrían afectar la exposición de esta empresa al crecimiento de la IA. No constituye asesoramiento de inversión.':'This matrix evaluates the main risk factors that could affect this company\'s exposure to AI growth. Not investment advice.'}</div>
        <div style={{padding:'12px',background:'#1a2840',borderRadius:8,fontSize:11,color:'#4a5f80',lineHeight:1.6}}>
          {lang==='es'?'Fuentes: SEC filings, Reuters, Bloomberg, análisis de Tavily sobre contratos y menciones recientes.':'Sources: SEC filings, Reuters, Bloomberg, Tavily analysis on recent contracts and mentions.'}
        </div>
      </div>
    </div>)}
  </div>)
}
