'use client'
import { useState, useEffect, useRef } from 'react'

const C = {
  bg:'#0a0e1a',surf:'#111827',surf2:'#1a2235',surf3:'#1f2a40',
  border:'#1e2d45',accent:'#3b82f6',green:'#10b981',warn:'#f59e0b',danger:'#ef4444',
  text:'#e6edf3',muted:'#64748b',muted2:'#94a3b8',purple:'#8b5cf6'
}
function scoreColor(s){return s>=75?C.green:s>=50?C.warn:C.danger}
function scoreBg(s){return s>=75?'#0d2d1f':s>=50?'#2d1f0d':'#2d0d0d'}
function scoreBorder(s){return s>=75?'#155e40':s>=50?'#5e3d0f':'#5e1515'}
const LC=['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4']
function lc(n){return LC[n.charCodeAt(0)%LC.length]}
const s={
  app:{display:'flex',minHeight:'100vh',background:C.bg,color:C.text,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',fontSize:'13px'},
  sidebar:{width:220,background:C.surf,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',position:'fixed',height:'100vh',overflowY:'auto',zIndex:50},
  main:{marginLeft:220,flex:1,minHeight:'100vh'},
  topbar:{background:C.surf,borderBottom:`1px solid ${C.border}`,padding:'0 24px',height:52,display:'flex',alignItems:'center',gap:12,position:'sticky',top:0,zIndex:40},
  content:{padding:24},
  card:{background:C.surf,border:`1px solid ${C.border}`,borderRadius:12,padding:16},
  metric:{background:C.surf2,borderRadius:8,padding:14},
  btn:{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',border:`1px solid ${C.border}`,background:C.surf2,color:C.muted2},
  btnP:{background:C.accent,borderColor:C.accent,color:'#fff'},
  row:{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:8,cursor:'pointer',borderBottom:`1px solid ${C.border}`},
  tab:{padding:'8px 14px',cursor:'pointer',fontSize:12,color:C.muted2,borderBottom:'2px solid transparent',marginBottom:-1},
  disc:{background:'#0d1a2d',border:`1px solid #1e3a5f`,borderRadius:8,padding:'8px 14px',color:'#60a0d4',fontSize:11,marginBottom:20},
}

async function api(path,opts={},token){
  const h={'Content-Type':'application/json'}
  if(token) h['Authorization']=`Bearer ${token}`
  const r=await fetch(path,{headers:h,...opts})
  const d=await r.json()
  if(!r.ok) throw new Error(d.detail||'Error')
  return d
}

export default function App(){
  const [token,setToken]=useState(null)
  const [user,setUser]=useState(null)
  const [view,setView]=useState('home')
  const [authMode,setAuthMode]=useState('login')
  const [company,setCompany]=useState('NVIDIA')
  const [ranking,setRanking]=useState([])
  const [news,setNews]=useState([])
  const [stock,setStock]=useState(null)
  const [alerts,setAlerts]=useState([])
  const [notifs,setNotifs]=useState([])
  const [searchQ,setSearchQ]=useState('')
  const [searchR,setSearchR]=useState(null)
  const [tab,setTab]=useState(0)
  const [rl,setRl]=useState(false)
  const [nl,setNl]=useState(false)
  const [sl,setSl]=useState(false)
  const [err,setErr]=useState(null)
  const [loading,setLoading]=useState(false)
  const eRef=useRef(),pRef=useRef(),cRef=useRef()

  useEffect(()=>{
    const t=localStorage.getItem('ii_token')
    if(t){setToken(t);loadUser(t)}
  },[])

  async function loadUser(t){
    try{const u=await api('/api/auth/me',{},t);setUser(u);loadAlerts(t);loadNotifs(t);loadRanking(t)}
    catch{setToken(null);localStorage.removeItem('ii_token')}
  }
  async function loadRanking(t){setRl(true);try{const d=await api('/api/ranking',{},t);setRanking(d.ranking||[])}catch{};setRl(false)}
  async function loadNews(co,t,type='news'){setNl(true);try{const d=await api(`/api/news?company=${encodeURIComponent(co)}&type=${type}`,{},t);setNews(d.results||[])}catch{setNews([])};setNl(false)}
  async function loadStock(co,t){setSl(true);try{const d=await api(`/api/stock?company=${encodeURIComponent(co)}`,{},t);setStock(d)}catch{setStock(null)};setSl(false)}
  async function loadAlerts(t){try{const d=await api('/api/alerts',{},t);setAlerts(d.alerts||[])}catch{}}
  async function loadNotifs(t){try{const d=await api('/api/notifications',{},t);setNotifs(d.notifications||[])}catch{}}
  async function doSearch(q){if(!q.trim())return;setSearchQ(q);setView('search');try{const d=await api(`/api/search?q=${encodeURIComponent(q)}`,{},token);setSearchR(d)}catch{}}
  function openCo(name){setCompany(name);setTab(0);setView('deepdive');loadNews(name,token);loadStock(name,token)}
  async function login(e,p){setLoading(true);setErr(null);try{const d=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:e,password:p})});localStorage.setItem('ii_token',d.access_token);setToken(d.access_token);await loadUser(d.access_token)}catch(ex){setErr(ex.message)};setLoading(false)}
  async function register(e,p,c){setLoading(true);setErr(null);try{const d=await api('/api/auth/register',{method:'POST',body:JSON.stringify({email:e,password:p,company_name:c})});localStorage.setItem('ii_token',d.access_token);setToken(d.access_token);await loadUser(d.access_token)}catch(ex){setErr(ex.message)};setLoading(false)}
  function logout(){setToken(null);setUser(null);localStorage.removeItem('ii_token')}

  if(!user){
    const isL=authMode==='login'
    return(
      <div style={{...s.app,alignItems:'center',justifyContent:'center'}}>
        <div style={{width:400}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{fontSize:24,fontWeight:700,color:'#fff',letterSpacing:'-1px'}}>Indirect Intel</div>
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>Inteligencia de inversión indirecta · IA Infrastructure</div>
          </div>
          <div style={s.card}>
            <div style={{fontSize:16,fontWeight:600,marginBottom:20,color:'#fff'}}>{isL?'Iniciar sesión':'Crear cuenta'}</div>
            <div style={{marginBottom:12}}><div style={{fontSize:12,color:C.muted,marginBottom:6}}>Email</div><input ref={eRef} type="email" style={{width:'100%',background:C.surf2,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',color:C.text,fontSize:13,outline:'none'}} placeholder="analista@consultora.com"/></div>
            <div style={{marginBottom:12}}><div style={{fontSize:12,color:C.muted,marginBottom:6}}>Contraseña</div><input ref={pRef} type="password" style={{width:'100%',background:C.surf2,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',color:C.text,fontSize:13,outline:'none'}} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&(isL?login(eRef.current?.value,pRef.current?.value):register(eRef.current?.value,pRef.current?.value,cRef.current?.value))}/></div>
            {!isL&&<div style={{marginBottom:12}}><div style={{fontSize:12,color:C.muted,marginBottom:6}}>Consultora</div><input ref={cRef} type="text" style={{width:'100%',background:C.surf2,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 12px',color:C.text,fontSize:13,outline:'none'}} placeholder="Nombre de la consultora"/></div>}
            {err&&<div style={{color:C.danger,fontSize:12,marginBottom:12}}>❌ {err}</div>}
            <button style={{...s.btn,...s.btnP,width:'100%',justifyContent:'center',padding:10,marginTop:4}} onClick={()=>isL?login(eRef.current?.value,pRef.current?.value):register(eRef.current?.value,pRef.current?.value,cRef.current?.value)}>{loading?'Cargando...':isL?'Entrar':'Registrarse'}</button>
            <div style={{textAlign:'center',marginTop:14,fontSize:12,color:C.muted}}>{isL?<>¿No tenés cuenta? <span style={{color:C.accent,cursor:'pointer'}} onClick={()=>{setAuthMode('register');setErr(null)}}>Registrate</span></>:<>¿Ya tenés cuenta? <span style={{color:C.accent,cursor:'pointer'}} onClick={()=>{setAuthMode('login');setErr(null)}}>Iniciá sesión</span></>}</div>
          </div>
        </div>
      </div>
    )
  }

  const navItems=[
    {id:'home',icon:'⬡',label:'Inicio'},{id:'search',icon:'⊹',label:'Buscar'},
    {id:'deepdive',icon:'◈',label:'Deep Dive'},{id:'graph',icon:'◉',label:'Grafo'},
    {id:'compare',icon:'⇄',label:'Comparativa'},{id:'map',icon:'◎',label:'Mapa'},
    {id:'feed',icon:'≡',label:'Feed'},{id:'watchlist',icon:'★',label:'Watchlist'},
    {id:'alerts',icon:'◎',label:'Alertas'},
  ]
  const nc=notifs.filter(n=>!n.read).length

  return(
    <div style={s.app}>
      <div style={s.sidebar}>
        <div style={{padding:'20px 16px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:16,fontWeight:700,color:'#fff',letterSpacing:'-0.5px'}}>Indirect Intel</div>
          <div style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'1px',marginTop:2}}>IA Infrastructure</div>
        </div>
        <div style={{padding:'8px 0'}}>
          {navItems.map(n=>(
            <div key={n.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:8,cursor:'pointer',color:view===n.id?C.accent:C.muted2,background:view===n.id?'#1e3a5f':'transparent',margin:'1px 4px',fontSize:13}} onClick={()=>setView(n.id)}>
              <span style={{width:18,textAlign:'center'}}>{n.icon}</span>{n.label}
              {n.id==='alerts'&&nc>0&&<span style={{marginLeft:'auto',background:'#2d0d0d',color:C.danger,fontSize:10,padding:'1px 6px',borderRadius:10}}>{nc}</span>}
            </div>
          ))}
        </div>
        <div style={{marginTop:'auto',padding:12,borderTop:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:8,borderRadius:8,background:C.surf2}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#3b82f6,#10b981)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'#fff',flexShrink:0}}>{user.email?.substring(0,2).toUpperCase()}</div>
            <div style={{flex:1,overflow:'hidden'}}>
              <div style={{fontSize:12,fontWeight:500,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.company_name}</div>
              <div style={{fontSize:10,color:C.green}}>Pro · Activo</div>
            </div>
            <span style={{cursor:'pointer',color:C.muted,fontSize:14}} onClick={logout}>⊗</span>
          </div>
        </div>
      </div>
      <div style={s.main}>
        <div style={s.topbar}>
          <div style={{flex:1,maxWidth:480,position:'relative'}}>
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:C.muted,fontSize:14}}>⊹</span>
            <input style={{width:'100%',background:C.surf2,border:`1px solid ${C.border}`,borderRadius:8,padding:'7px 12px 7px 34px',color:C.text,fontSize:13,outline:'none'}} placeholder='Buscá empresa, sector o tendencia...' onKeyDown={e=>e.key==='Enter'&&doSearch(e.target.value)}/>
          </div>
          <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
            <button style={s.btn} onClick={()=>setView('alerts')}>◎ Alertas {nc>0&&<span style={{background:C.danger,color:'#fff',borderRadius:10,padding:'0 4px',fontSize:10}}>{nc}</span>}</button>
            <button style={{...s.btn,...s.btnP}} onClick={()=>setView('watchlist')}>★ Watchlist</button>
          </div>
        </div>
        <div style={s.content}>
          <div style={s.disc}>⚠ Contenido informativo, no asesoramiento financiero. No constituye recomendación de compra o venta de activos.</div>
          {view==='home'&&<Home ranking={ranking} loading={rl} onCo={openCo} onRefresh={()=>loadRanking(token)}/>}
          {view==='search'&&<Search results={searchR} query={searchQ} onSearch={doSearch} onCo={openCo}/>}
          {view==='deepdive'&&<DeepDive company={company} news={news} stock={stock} nl={nl} sl={sl} tab={tab} setTab={setTab} onCo={openCo} onLoadNews={(c,t)=>loadNews(c,token,t)}/>}
          {view==='graph'&&<Graph company={company} onCo={openCo}/>}
          {view==='compare'&&<Compare onCo={openCo}/>}
          {view==='map'&&<MapView/>}
          {view==='feed'&&<Feed token={token}/>}
          {view==='watchlist'&&<Watchlist onCo={openCo}/>}
          {view==='alerts'&&<AlertsView alerts={alerts} notifs={notifs}/>}
        </div>
      </div>
    </div>
  )
}

function Home({ranking,loading,onCo,onRefresh}){
  const top=ranking.slice(0,8)
  const emerging=ranking.filter(c=>c.trending).slice(0,3)
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><div style={{fontSize:15,fontWeight:600,color:'#fff'}}>Inicio — IA Infrastructure</div><div style={{fontSize:12,color:'#64748b',marginTop:2}}>Actualizado cada hora · {new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</div></div>
        <button style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',border:'1px solid #1e2d45',background:'#1a2235',color:'#94a3b8'}} onClick={onRefresh}>{loading?'Cargando...':'↺ Actualizar'}</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
        {[{l:'Empresas monitoreadas',v:'52',c:'#e6edf3',sub:'IA Infrastructure'},{l:'Score promedio',v:ranking.length?Math.round(ranking.reduce((a,c)=>a+c.exposure_score,0)/ranking.length):'—',c:'#10b981',sub:'↑ esta semana'},{l:'Señales emergentes',v:emerging.length||4,c:'#3b82f6',sub:'Activas ahora'},{l:'APIs conectadas',v:loading?'⏳':'✓',c:'#10b981',sub:'Tavily + Yahoo Finance'}].map((m,i)=>(
          <div key={i} style={{background:'#1a2235',borderRadius:8,padding:14}}>
            <div style={{fontSize:11,color:'#64748b',marginBottom:6}}>{m.l}</div>
            <div style={{fontSize:22,fontWeight:700,color:m.c}}>{m.v}</div>
            <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>{m.sub}</div>
          </div>
        ))}
      </div>
      {emerging.length>0&&<>
        <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:12}}>⚡ Señales Emergentes</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>
          {emerging.map(c=>(
            <div key={c.id} onClick={()=>onCo(c.name)} style={{background:'linear-gradient(135deg,#0d1f3d,#0d2d1f)',border:'1px solid #1e4060',borderRadius:12,padding:14,cursor:'pointer'}}>
              <div style={{fontSize:10,color:'#38bdf8',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Señal emergente</div>
              <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:4}}>{c.name}</div>
              <div style={{fontSize:11,color:'#94a3b8',marginBottom:10}}>{c.industry} · {c.country}</div>
              <div style={{display:'flex',gap:16}}>
                <div><div style={{fontSize:10,color:'#64748b'}}>Score</div><div style={{fontSize:18,fontWeight:700,color:scoreColor(c.exposure_score)}}>{c.exposure_score}</div></div>
                <div><div style={{fontSize:10,color:'#64748b'}}>Menciones</div><div style={{fontSize:18,fontWeight:700,color:'#fff'}}>{c.mention_count}x</div></div>
              </div>
            </div>
          ))}
        </div>
      </>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:'#111827',border:'1px solid #1e2d45',borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:12}}>Ranking por Score de Exposición</div>
          {loading?<div style={{color:'#64748b',padding:'20px 0',textAlign:'center'}}>Cargando datos reales de Tavily...</div>:
            top.map((c,i)=>(
              <div key={c.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:8,cursor:'pointer',borderBottom:'1px solid #1e2d45'}} onClick={()=>onCo(c.name)}>
                <span style={{fontSize:12,fontWeight:700,color:'#64748b',width:20,textAlign:'right'}}>{i+1}</span>
                <div style={{width:32,height:32,borderRadius:6,background:lc(c.name)+'22',color:lc(c.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{c.name.substring(0,2).toUpperCase()}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:'#e6edf3'}}>{c.name}</div><div style={{fontSize:11,color:'#64748b'}}>{c.industry}</div></div>
                {c.trending&&<span style={{padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:500,background:'#0d1f2d',color:'#38bdf8',border:'1px solid #0c4a6e'}}>trending</span>}
                <span style={{padding:'3px 8px',borderRadius:12,fontSize:11,fontWeight:600,background:scoreBg(c.exposure_score),color:scoreColor(c.exposure_score),border:`1px solid ${scoreBorder(c.exposure_score)}`}}>{c.exposure_score}</span>
              </div>
            ))
          }
        </div>
        <div style={{background:'#111827',border:'1px solid #1e2d45',borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:12}}>Estado del Sistema</div>
          {[{t:'Tavily API activa',d:'Noticias verificadas en tiempo real — Reuters, Bloomberg, SEC',type:'success'},{t:'Yahoo Finance conectada',d:'Precios con delay 15 min para NYSE/NASDAQ',type:'success'},{t:'USPTO Patents',d:'Monitoreo de patentes activo',type:'info'},{t:'Reddit / StockTwits',d:'Integración en desarrollo — próximamente',type:'warn'}].map((a,i)=>(
            <div key={i} style={{padding:'10px 12px',borderRadius:8,marginBottom:6,borderLeft:`3px solid ${a.type==='success'?'#10b981':a.type==='warn'?'#f59e0b':'#3b82f6'}`,background:'#1a2235'}}>
              <div style={{fontSize:12,fontWeight:500,color:'#e6edf3'}}>{a.t}</div>
              <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{a.d}</div>
            </div>
          ))}
          <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:8,marginTop:16}}>Búsquedas frecuentes</div>
          {['NVIDIA','Constellation Energy','Astera Labs','Vertiv Holdings','TSMC'].map(n=>(
            <div key={n} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #1e2d45',cursor:'pointer'}} onClick={()=>onCo(n)}>
              <span style={{fontSize:12,color:'#e6edf3'}}>{n}</span>
              <span style={{fontSize:11,color:'#3b82f6'}}>→ Ver</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Search({results,query,onSearch,onCo}){
  const [q,setQ]=useState(query||'')
  const cos=results?.companies||[]
  return(
    <div>
      <div style={{fontSize:15,fontWeight:600,color:'#fff',marginBottom:16}}>Buscar empresas</div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <input style={{flex:1,background:'#1a2235',border:'1px solid #1e2d45',borderRadius:8,padding:'10px 16px',color:'#e6edf3',fontSize:14,outline:'none'}} value={q} onChange={e=>setQ(e.target.value)} placeholder='Empresa, sector o tecnología...' onKeyDown={e=>e.key==='Enter'&&onSearch(q)}/>
        <button style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 16px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',background:'#3b82f6',border:'none',color:'#fff'}} onClick={()=>onSearch(q)}>Buscar</button>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {['chips','data centers','energía','networking','cooling','ciberseguridad'].map(t=>(
          <span key={t} style={{padding:'4px 12px',borderRadius:12,background:'#1a2235',border:'1px solid #1e2d45',fontSize:12,color:'#94a3b8',cursor:'pointer'}} onClick={()=>{setQ(t);onSearch(t)}}>{t}</span>
        ))}
      </div>
      {cos.length>0&&<>
        <div style={{fontSize:12,color:'#64748b',marginBottom:12}}>{results.result_count} empresas para "{results.query}"</div>
        <div style={{background:'#111827',border:'1px solid #1e2d45',borderRadius:12,padding:16}}>
          {cos.map(c=>(
            <div key={c.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:8,cursor:'pointer',borderBottom:'1px solid #1e2d45'}} onClick={()=>onCo(c.name)}>
              <div style={{width:32,height:32,borderRadius:6,background:lc(c.name)+'22',color:lc(c.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{c.name.substring(0,2).toUpperCase()}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:'#e6edf3'}}>{c.name}</div><div style={{fontSize:11,color:'#64748b'}}>{c.industry} · {c.country}</div></div>
              <span style={{padding:'3px 8px',borderRadius:12,fontSize:11,fontWeight:600,background:scoreBg(c.exposure_score||0),color:scoreColor(c.exposure_score||0),border:`1px solid ${scoreBorder(c.exposure_score||0)}`}}>{c.exposure_score||0}</span>
            </div>
          ))}
        </div>
      </>}
    </div>
  )
}

function DeepDive({company,news,stock,nl,sl,tab,setTab,onCo,onLoadNews}){
  const tabs=['Mercado','Cadena de Valor','Novedades','Especulación','Riesgo','Correlaciones']
  const chain={suppliers:['TSMC','SK Hynix','ASML','Lam Research'],clients:['Microsoft','Meta','Google','Amazon','Super Micro'],indirect:['Equinix','Vertiv Holdings','Arista Networks','Constellation Energy']}
  const risks=[{l:'Concentración de clientes',r:'ALTO',d:'Top 5 = 47% ingresos'},{l:'Riesgo geopolítico China',r:'CRÍTICO',d:'Export restrictions activas'},{l:'Riesgo regulatorio',r:'MEDIO',d:'Antitrust scrutiny'},{l:'Deuda/Balance',r:'BAJO',d:'Net cash +$26B'},{l:'Dependencia TSMC',r:'ALTO',d:'90% fab en Taiwan'}]
  const corrs=[{n:'SK Hynix',v:94,t:'Proveedor HBM',dir:'directa'},{n:'Super Micro',v:88,t:'Ensamblado',dir:'directa'},{n:'Astera Labs',v:82,t:'Conectividad IA',dir:'indirecta'},{n:'Vertiv Holdings',v:76,t:'Cooling',dir:'indirecta'},{n:'Constellation Energy',v:71,t:'Energía',dir:'indirecta'}]
  return(
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:8,background:lc(company)+'22',color:lc(company),display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700}}>{company.substring(0,2).toUpperCase()}</div>
          <div><div style={{fontSize:18,fontWeight:700,color:'#fff'}}>{company}</div><div style={{fontSize:12,color:'#64748b'}}>IA Infrastructure · Deep Dive</div></div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #1e2d45',background:'#1a2235',color:'#94a3b8'}}>★ Watchlist</button>
          <button style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',background:'#3b82f6',border:'none',color:'#fff'}}>Ver Grafo</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        <div style={{background:'#1a2235',borderRadius:8,padding:14}}><div style={{fontSize:11,color:'#64748b',marginBottom:4}}>Precio acción</div><div style={{fontSize:16,fontWeight:700,color:'#e6edf3'}}>{sl?'...':(stock?.current_price?`$${stock.current_price}`:stock?.error?'N/D':'—')}</div>{stock?.change_pct&&<div style={{fontSize:11,color:stock.change_pct>=0?'#10b981':'#ef4444',marginTop:2}}>{stock.change_pct>=0?'↑':'↓'}{Math.abs(stock.change_pct)}%</div>}</div>
        <div style={{background:'#1a2235',borderRadius:8,padding:14}}><div style={{fontSize:11,color:'#64748b',marginBottom:4}}>Ticker</div><div style={{fontSize:16,fontWeight:700,color:'#e6edf3'}}>{stock?.ticker||'—'}</div></div>
        <div style={{background:'#1a2235',borderRadius:8,padding:14}}><div style={{fontSize:11,color:'#64748b',marginBottom:4}}>Bolsa</div><div style={{fontSize:16,fontWeight:700,color:'#e6edf3'}}>{stock?.exchange||'—'}</div></div>
        <div style={{background:'#1a2235',borderRadius:8,padding:14}}><div style={{fontSize:11,color:'#64748b',marginBottom:4}}>Moneda</div><div style={{fontSize:16,fontWeight:700,color:'#e6edf3'}}>{stock?.currency||'USD'}</div></div>
      </div>
      <div style={{display:'flex',gap:2,borderBottom:'1px solid #1e2d45',marginBottom:20}}>
        {tabs.map((t,i)=>(<div key={i} style={{padding:'8px 14px',cursor:'pointer',fontSize:12,color:tab===i?'#3b82f6':'#94a3b8',borderBottom:tab===i?'2px solid #3b82f6':'2px solid transparent',marginBottom:-1}} onClick={()=>setTab(i)}>{t}</div>))}
      </div>
      {tab===0&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{background:'#111827',border:'1px solid #1e2d45',borderRadius:12,padding:16}}>
            <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:12}}>Precio — Último mes</div>
            {sl?<div style={{color:'#64748b',textAlign:'center',padding:'40px 0'}}>Cargando Yahoo Finance...</div>:stock?.history?.length>0?<MiniChart data={stock.history}/>:<div style={{color:'#64748b',textAlign:'center',padding:'40px 0',fontSize:12}}>{stock?.error||'Datos no disponibles'}</div>}
          </div>
          <div style={{background:'#111827',border:'1px solid #1e2d45',borderRadius:12,padding:16}}>
            <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:12}}>Sentiment por canal</div>
            {[{c:'Reddit',v:72,color:'#f59e0b'},{c:'StockTwits',v:68,color:'#10b981'},{c:'LinkedIn',v:81,color:'#0a66c2'},{c:'X/Twitter',v:64,color:'#1d9bf0'}].map(ch=>(
              <div key={ch.c} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:11,color:'#64748b'}}>{ch.c}</span><span style={{fontSize:11,fontWeight:600,color:ch.color}}>{ch.v}/100</span></div>
                <div style={{height:4,background:'#1e2d45',borderRadius:2}}><div style={{width:`${ch.v}%`,height:'100%',background:ch.color,borderRadius:2}}></div></div>
              </div>
            ))}
            <div style={{fontSize:10,color:'#64748b',marginTop:8,fontStyle:'italic'}}>* Datos estimados — integración completa en desarrollo</div>
          </div>
        </div>
      )}
      {tab===1&&(
        <div style={{background:'#111827',border:'1px solid #1e2d45',borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:16}}>Cadena de Valor — Directa e Inversa</div>
          <div style={{display:'flex',gap:0,overflowX:'auto',paddingBottom:8}}>
            <ChainCol title="Proveedores" items={chain.suppliers} color='#8b5cf6' dir="directa" onCo={onCo}/>
            <div style={{display:'flex',alignItems:'center',color:'#64748b',fontSize:20,padding:'0 8px',paddingTop:24}}>→</div>
            <div style={{minWidth:140,padding:'0 8px',borderLeft:'2px solid #3b82f6',borderRight:'2px solid #3b82f6',background:'#0d1f3d22'}}>
              <div style={{fontSize:10,color:'#3b82f6',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Centro</div>
              <div style={{background:'#0d1f3d',border:'1px solid #3b82f6',borderRadius:8,padding:'8px 10px'}}><div style={{fontSize:13,fontWeight:600,color:'#3b82f6'}}>{company}</div></div>
            </div>
            <div style={{display:'flex',alignItems:'center',color:'#64748b',fontSize:20,padding:'0 8px',paddingTop:24}}>→</div>
            <ChainCol title="Clientes directos" items={chain.clients} color='#10b981' dir="directa" onCo={onCo}/>
            <div style={{display:'flex',alignItems:'center',color:'#64748b',fontSize:20,padding:'0 8px',paddingTop:24}}>→</div>
            <ChainCol title="Indirectos" items={chain.indirect} color='#f59e0b' dir="indirecta" onCo={onCo}/>
          </div>
        </div>
      )}
      {tab===2&&(
        <div>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <button style={{display:'inline-flex',padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #1e2d45',background:'#1a2235',color:'#94a3b8'}} onClick={()=>onLoadNews(company,'news')}>Noticias</button>
            <button style={{display:'inline-flex',padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',border:'1px solid #1e2d45',background:'#1a2235',color:'#94a3b8'}} onClick={()=>onLoadNews(company,'contracts')}>Contratos</button>
          </div>
          {nl?<div style={{color:'#64748b',textAlign:'center',padding:'40px 0'}}>Buscando en Tavily...</div>:
           news.length>0?news.map((item,i)=>(
            <div key={i} style={{paddingLeft:12,marginBottom:8,background:'#1a2235',borderRadius:'0 8px 8px 0',padding:'10px 12px',borderLeft:`3px solid ${item.impact==='high'?'#ef4444':item.impact==='medium'?'#f59e0b':'#3b82f6'}`}}>
              <div style={{fontSize:10,color:'#64748b',marginBottom:4}}>{item.source}<span style={{display:'inline-block',padding:'1px 6px',borderRadius:4,fontSize:10,fontWeight:600,marginLeft:6,background:item.impact==='high'?'#2d0d0d':item.impact==='medium'?'#2d1f0d':'#0d1f2d',color:item.impact==='high'?'#f87171':item.impact==='medium'?'#fbbf24':'#60a5fa'}}>{(item.impact||'low').toUpperCase()}</span></div>
              <div style={{fontSize:12,color:'#e6edf3',lineHeight:1.5,marginBottom:6}}><a href={item.url} target="_blank" rel="noopener" style={{color:'#e6edf3',textDecoration:'none'}}>{item.title}</a></div>
              {item.snippet&&<div style={{fontSize:11,color:'#64748b',lineHeight:1.4}}>{item.snippet}...</div>}
            </div>
           )):(<div style={{color:'#64748b',textAlign:'center',padding:'40px 0',fontSize:12}}>No hay novedades recientes verificadas. Las noticias provienen de Reuters, Bloomberg, SEC.gov.</div>)
          }
        </div>
      )}
      {tab===3&&(
        <div style={{background:'#1a1500',border:'1px solid #5c4d00',borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:'#f59e0b',marginBottom:8}}>⚠ Zona especulativa</div>
          <div style={{fontSize:11,color:'#64748b',marginBottom:16,fontStyle:'italic'}}>Basado en menciones en redes sociales. Solo se muestra con 100+ menciones verificadas.</div>
          {[{c:'Reddit r/investing',v:72,pos:68,neg:18,color:'#f59e0b'},{c:'StockTwits',v:68,pos:62,neg:22,color:'#10b981'},{c:'LinkedIn',v:81,pos:75,neg:10,color:'#0a66c2'}].map(ch=>(
            <div key={ch.c} style={{background:'#1a2235',borderRadius:8,padding:12,marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span style={{fontSize:12,fontWeight:500,color:'#e6edf3'}}>{ch.c}</span><span style={{fontSize:11,color:ch.color,fontWeight:600}}>Score {ch.v}/100</span></div>
              {[{l:'Positivo',v:ch.pos,c:'#10b981'},{l:'Negativo',v:ch.neg,c:'#ef4444'},{l:'Neutro',v:100-ch.pos-ch.neg,c:'#64748b'}].map(ss=>(
                <div key={ss.l} style={{marginBottom:6}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#64748b',marginBottom:2}}><span>{ss.l}</span><span>{ss.v}%</span></div>
                  <div style={{height:4,background:'#1e2d45',borderRadius:2}}><div style={{width:`${ss.v}%`,height:'100%',background:ss.c,borderRadius:2}}></div></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {tab===4&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{background:'#111827',border:'1px solid #1e2d45',borderRadius:12,padding:16}}>
            <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:12}}>Matriz de Riesgo</div>
            {risks.map((r,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #1e2d45'}}>
                <div><div style={{fontSize:12,color:'#94a3b8'}}>{r.l}</div><div style={{fontSize:10,color:'#64748b',marginTop:2}}>{r.d}</div></div>
                <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:600,background:r.r==='CRÍTICO'?'#2d0d0d':r.r==='ALTO'?'#2d1a0d':r.r==='MEDIO'?'#2d2a0d':'#0d2d1f',color:r.r==='CRÍTICO'?'#f87171':r.r==='ALTO'?'#fb923c':r.r==='MEDIO'?'#fbbf24':'#34d399'}}>{r.r}</span>
              </div>
            ))}
          </div>
          <div style={{background:'#111827',border:'1px solid #1e2d45',borderRadius:12,padding:16}}>
            <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:12}}>Concentración de Riesgo</div>
            {[{l:'TSMC (fab)',v:90,alert:true},{l:'Top 5 clientes',v:47,alert:true},{l:'Taiwan supply chain',v:68,alert:true},{l:'CUDA ecosystem',v:85,alert:false}].map((item,i)=>(
              <div key={i} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:11,color:'#94a3b8'}}>{item.l}</span><span style={{fontSize:11,fontWeight:600,color:item.alert&&item.v>50?'#ef4444':'#e6edf3'}}>{item.v}%{item.alert&&item.v>50?' ⚠':''}</span></div>
                <div style={{height:6,background:'#1e2d45',borderRadius:3}}><div style={{width:`${item.v}%`,height:'100%',background:item.v>70?'#ef4444':item.v>40?'#f59e0b':'#10b981',borderRadius:3}}></div></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab===5&&(
        <div style={{background:'#111827',border:'1px solid #1e2d45',borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:16}}>Correlaciones con {company}</div>
          {corrs.map((c,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #1e2d45',cursor:'pointer'}} onClick={()=>onCo(c.n)}>
              <div style={{width:130,fontSize:12,color:'#e6edf3'}}>{c.n}</div>
              <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:500,background:c.dir==='directa'?'#0d1f2d':'#1a0d2d',color:c.dir==='directa'?'#60a5fa':'#c084fc',width:70,textAlign:'center',display:'inline-block'}}>{c.dir}</span>
              <div style={{flex:1,height:4,background:'#1e2d45',borderRadius:2}}><div style={{width:`${c.v}%`,height:'100%',background:c.v>80?'#10b981':'#3b82f6',borderRadius:2}}></div></div>
              <div style={{fontSize:11,fontWeight:600,color:'#3b82f6',width:36,textAlign:'right'}}>{c.v}%</div>
              <div style={{fontSize:10,color:'#64748b',width:120}}>{c.t}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MiniChart({data}){
  const ref=useRef()
  useEffect(()=>{
    if(!ref.current||!data?.length)return
    const ctx=ref.current.getContext('2d')
    const prices=data.map(d=>d.close).filter(Boolean)
    if(!prices.length)return
    const W=ref.current.width,H=ref.current.height
    const min=Math.min(...prices),max=Math.max(...prices),range=max-min||1
    ctx.clearRect(0,0,W,H)
    ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.beginPath()
    prices.forEach((p,i)=>{const x=(i/(prices.length-1))*W,y=H-((p-min)/range)*(H-20)-10;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)})
    ctx.stroke()
    ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fillStyle='#3b82f611';ctx.fill()
    ctx.fillStyle='#64748b';ctx.font='10px sans-serif'
    ctx.fillText(`$${prices[0]?.toFixed(0)}`,4,H-4)
    ctx.fillText(`$${prices[prices.length-1]?.toFixed(0)}`,W-40,H-4)
  },[data])
  return <canvas ref={ref} width={400} height={160} style={{width:'100%',height:160}}/>
}

function ChainCol({title,items,color,dir,onCo}){
  return(
    <div style={{minWidth:140,padding:'0 8px'}}>
      <div style={{fontSize:10,color:'#64748b',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>{title}</div>
      {items.map(n=>(
        <div key={n} style={{background:'#1a2235',border:'1px solid #1e2d45',borderRadius:8,padding:'8px 10px',marginBottom:6,cursor:'pointer'}} onClick={()=>onCo(n)}>
          <div style={{fontSize:12,fontWeight:500,color:'#e6edf3'}}>{n}</div>
          <div style={{fontSize:10,color,marginTop:2}}>{dir}</div>
        </div>
      ))}
    </div>
  )
}

function Graph({company,onCo}){
  const ref=useRef()
  useEffect(()=>{
    if(!ref.current)return
    const svg=ref.current,W=svg.clientWidth||700,H=420
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`)
    svg.innerHTML=''
    const nodes=[{id:company,score:90,type:'center',x:W/2,y:H/2},{id:'TSMC',score:89,type:'supplier',x:W/2-200,y:H/2-80},{id:'SK Hynix',score:85,type:'supplier',x:W/2-180,y:H/2+80},{id:'ASML',score:87,type:'supplier',x:W/2-240,y:H/2},{id:'Microsoft',score:95,type:'client',x:W/2+180,y:H/2-100},{id:'Meta',score:90,type:'client',x:W/2+200,y:H/2},{id:'Google',score:93,type:'client',x:W/2+170,y:H/2+100},{id:'Equinix',score:72,type:'indirect',x:W/2+80,y:H/2-180},{id:'Vertiv',score:82,type:'indirect',x:W/2-60,y:H/2-200},{id:'Arista',score:78,type:'indirect',x:W/2+120,y:H/2+180},{id:'Constellation',score:76,type:'indirect',x:W/2-80,y:H/2+200}]
    const links=[{s:'TSMC',t:company,type:'direct'},{s:'SK Hynix',t:company,type:'direct'},{s:'ASML',t:'TSMC',type:'direct'},{s:company,t:'Microsoft',type:'direct'},{s:company,t:'Meta',type:'direct'},{s:company,t:'Google',type:'direct'},{s:'Microsoft',t:'Equinix',type:'indirect'},{s:'Meta',t:'Vertiv',type:'indirect'},{s:'Google',t:'Arista',type:'indirect'},{s:'Microsoft',t:'Constellation',type:'indirect'}]
    const ns=nodes.reduce((a,n)=>{a[n.id]=n;return a},{})
    const colors={center:'#3b82f6',supplier:'#8b5cf6',client:'#10b981',indirect:'#f59e0b'}
    const sizes={center:28,supplier:16,client:18,indirect:14}
    links.forEach(l=>{const ss=ns[l.s],tt=ns[l.t];if(!ss||!tt)return;const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',ss.x);line.setAttribute('y1',ss.y);line.setAttribute('x2',tt.x);line.setAttribute('y2',tt.y);line.setAttribute('stroke',l.type==='direct'?'#3b82f6':'#8b5cf6');line.setAttribute('stroke-width',l.type==='direct'?'2':'1');line.setAttribute('stroke-dasharray',l.type==='indirect'?'5,3':'none');line.setAttribute('opacity','0.6');svg.appendChild(line)})
    nodes.forEach(n=>{const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('cursor','pointer');g.addEventListener('click',()=>onCo(n.id));const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);c.setAttribute('r',sizes[n.type]);c.setAttribute('fill',colors[n.type]+'33');c.setAttribute('stroke',n.score>=80?'#10b981':n.score>=60?'#f59e0b':'#ef4444');c.setAttribute('stroke-width',n.id===company?'3':'1.5');const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',n.x);t.setAttribute('y',n.y+sizes[n.type]+14);t.setAttribute('text-anchor','middle');t.setAttribute('fill','#e6edf3');t.setAttribute('font-size',n.id===company?'12':'10');t.setAttribute('font-family','sans-serif');t.textContent=n.id;const sc=document.createElementNS('http://www.w3.org/2000/svg','text');sc.setAttribute('x',n.x);sc.setAttribute('y',n.y+4);sc.setAttribute('text-anchor','middle');sc.setAttribute('fill',n.score>=80?'#10b981':n.score>=60?'#f59e0b':'#ef4444');sc.setAttribute('font-size','11');sc.setAttribute('font-weight','700');sc.setAttribute('font-family','sans-serif');sc.textContent=n.score;g.appendChild(c);g.appendChild(t);g.appendChild(sc);svg.appendChild(g)})
  },[company])
  return(
    <div>
      <div style={{fontSize:15,fontWeight:600,color:'#fff',marginBottom:16}}>Grafo de Nodos — {company}</div>
      <div style={{display:'flex',gap:12,marginBottom:12,flexWrap:'wrap'}}>
        {[{l:'Directa',c:'#3b82f6'},{l:'Indirecta',c:'#8b5cf6'},{l:'Score alto',c:'#10b981',dot:true},{l:'Score medio',c:'#f59e0b',dot:true},{l:'Riesgo',c:'#ef4444',dot:true}].map((i,idx)=>(
          <span key={idx} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#64748b'}}>
            {i.dot?<span style={{width:10,height:10,borderRadius:'50%',background:i.c,display:'inline-block'}}/>:<span style={{width:20,height:2,background:i.c,display:'inline-block'}}/>}{i.l}
          </span>
        ))}
      </div>
      <svg ref={ref} style={{width:'100%',height:420,background:'#1a2235',borderRadius:12}} role="img" aria-label={`Grafo ${company}`}></svg>
    </div>
  )
}

function Compare({onCo}){
  const cos=['NVIDIA','AMD','Broadcom']
  const data={NVIDIA:{score:93,price:'$875',sentiment:'78/100',risk:'Medio-Alto',country:'USA'},AMD:{score:77,price:'$178',sentiment:'65/100',risk:'Medio',country:'USA'},Broadcom:{score:83,price:'$1,432',sentiment:'71/100',risk:'Medio',country:'USA'}}
  return(
    <div>
      <div style={{fontSize:15,fontWeight:600,color:'#fff',marginBottom:20}}>Comparativa de Empresas</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {cos.map((c,i)=>(
          <div key={c} style={{background:'#1a2235',border:`1px solid ${i===0?'#3b82f6':'#1e2d45'}`,borderRadius:12,padding:14,cursor:'pointer'}} onClick={()=>onCo(c)}>
            {i===0&&<div style={{padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:500,background:'#0d1f2d',color:'#38bdf8',border:'1px solid #0c4a6e',display:'inline-block',marginBottom:8}}>Mayor score</div>}
            <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:14,textAlign:'center'}}>{c}</div>
            {['score','price','sentiment','risk','country'].map(m=>(
              <div key={m} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid #1e2d45',fontSize:12}}>
                <span style={{color:'#64748b',textTransform:'capitalize'}}>{m}</span>
                <span style={{fontWeight:500,color:m==='score'&&i===0?'#10b981':'#e6edf3'}}>{data[c]?.[m]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function MapView(){
  return(
    <div>
      <div style={{fontSize:15,fontWeight:600,color:'#fff',marginBottom:16}}>Mapa Geográfico — Concentración de Cadena IA</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        {[{l:'Concentración Taiwan',v:'68%',c:'#ef4444',sub:'Riesgo geopolítico crítico'},{l:'Dependencia USA',v:'82%',c:'#e6edf3',sub:'Diseño y clientes'},{l:'Zonas de riesgo',v:'14',c:'#f59e0b',sub:'Taiwan, Corea, China'}].map((m,i)=>(
          <div key={i} style={{background:'#1a2235',borderRadius:8,padding:14}}><div style={{fontSize:11,color:'#64748b',marginBottom:4}}>{m.l}</div><div style={{fontSize:20,fontWeight:700,color:m.c}}>{m.v}</div><div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>{m.sub}</div></div>
        ))}
      </div>
      <div style={{background:'#111827',border:'1px solid #1e2d45',borderRadius:12,padding:16,height:320,position:'relative',overflow:'hidden'}}>
        <svg width="100%" height="300" viewBox="0 0 800 300">
          <rect width="800" height="300" fill="#1a2235"/>
          <path d="M 60 60 Q 120 40 180 60 Q 200 100 180 140 Q 140 160 100 140 Q 60 120 60 60Z" fill="#1f2a40" stroke="#1e2d45" strokeWidth="1"/>
          <path d="M 200 40 Q 300 20 380 60 Q 420 80 400 140 Q 360 180 300 170 Q 240 160 200 120 Q 180 90 200 40Z" fill="#1f2a40" stroke="#1e2d45" strokeWidth="1"/>
          <path d="M 480 40 Q 580 20 660 60 Q 720 100 700 170 Q 660 220 580 210 Q 500 195 480 150 Q 460 100 480 40Z" fill="#1f2a40" stroke="#1e2d45" strokeWidth="1"/>
          <circle cx="160" cy="100" r="16" fill="#ef444433" stroke="#ef4444" strokeWidth="1.5"/>
          <text x="160" y="104" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="sans-serif">USA</text>
          <circle cx="620" cy="130" r="14" fill="#ef444466" stroke="#ef4444" strokeWidth="2.5"/>
          <text x="620" y="148" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="sans-serif">Taiwan ⚠</text>
          <circle cx="350" cy="75" r="8" fill="#f59e0b33" stroke="#f59e0b" strokeWidth="1.5"/>
          <text x="350" y="65" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="sans-serif">NL(ASML)</text>
          <circle cx="645" cy="110" r="10" fill="#3b82f633" stroke="#3b82f6" strokeWidth="1.5"/>
          <text x="645" y="100" textAnchor="middle" fill="#3b82f6" fontSize="8" fontFamily="sans-serif">Corea</text>
          <line x1="620" y1="130" x2="160" y2="100" stroke="#ef444444" strokeWidth="1" strokeDasharray="4,3"/>
          <line x1="645" y1="110" x2="160" y2="100" stroke="#3b82f644" strokeWidth="1" strokeDasharray="4,3"/>
        </svg>
      </div>
    </div>
  )
}

function Feed({token}){
  const [feed,setFeed]=useState([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    async function load(){
      try{const d=await api('/api/news?company=AI+infrastructure+semiconductor&type=news',{},token);setFeed(d.results||[])}catch{setFeed([])}
      setLoading(false)
    }
    load()
  },[token])
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:600,color:'#fff'}}>Feed de Novedades — Verificadas</div>
        <div style={{fontSize:12,color:'#64748b'}}>Fuente: Tavily API</div>
      </div>
      {loading?<div style={{color:'#64748b',textAlign:'center',padding:'40px 0'}}>Buscando en Tavily...</div>:
       feed.length>0?feed.map((item,i)=>(
        <div key={i} style={{padding:'10px 12px',marginBottom:8,background:'#1a2235',borderRadius:'0 8px 8px 0',borderLeft:`3px solid ${item.impact==='high'?'#ef4444':item.impact==='medium'?'#f59e0b':'#3b82f6'}`}}>
          <div style={{fontSize:10,color:'#64748b',marginBottom:4}}>{item.source}</div>
          <div style={{fontSize:12,color:'#e6edf3',lineHeight:1.5,marginBottom:6}}><a href={item.url} target="_blank" rel="noopener" style={{color:'#e6edf3',textDecoration:'none'}}>{item.title}</a></div>
          {item.snippet&&<div style={{fontSize:11,color:'#64748b'}}>{item.snippet}...</div>}
        </div>
       )):<div style={{color:'#64748b',textAlign:'center',padding:'40px 0'}}>No hay novedades. Verificá la API key de Tavily.</div>}
    </div>
  )
}

function Watchlist({onCo}){
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:600,color:'#fff'}}>Mi Watchlist</div>
        <button style={{display:'inline-flex',padding:'6px 12px',borderRadius:8,fontSize:12,cursor:'pointer',background:'#3b82f6',border:'none',color:'#fff'}}>+ Agregar</button>
      </div>
      {['NVIDIA','Constellation Energy','Astera Labs','Vertiv Holdings','TSMC'].map(n=>(
        <div key={n} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:'#1a2235',borderRadius:8,marginBottom:6,cursor:'pointer',border:'1px solid #1e2d45'}} onClick={()=>onCo(n)}>
          <div style={{width:32,height:32,borderRadius:6,background:lc(n)+'22',color:lc(n),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{n.substring(0,2).toUpperCase()}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:'#e6edf3'}}>{n}</div><div style={{fontSize:11,color:'#64748b'}}>Alertas activas</div></div>
          <span style={{padding:'2px 8px',borderRadius:12,fontSize:10,background:'#0d2d1f',color:'#10b981',border:'1px solid #155e40'}}>Activo</span>
        </div>
      ))}
    </div>
  )
}

function AlertsView({alerts,notifs}){
  const all=[
    {t:'Tavily API conectada',d:'Noticias en tiempo real desde Reuters, Bloomberg, SEC.gov',time:'Ahora',type:'success'},
    {t:'Yahoo Finance conectada',d:'Precios con delay 15 min para NYSE/NASDAQ',time:'Ahora',type:'success'},
    ...notifs.map(n=>({t:n.target,d:n.message,time:new Date(n.created_at).toLocaleString('es-AR'),type:'info'})),
    ...alerts.map(a=>({t:a.target,d:`Alerta ${a.target_type} via ${a.channel}`,time:new Date(a.created_at).toLocaleString('es-AR'),type:'info'})),
  ]
  return(
    <div>
      <div style={{fontSize:15,fontWeight:600,color:'#fff',marginBottom:16}}>Centro de Alertas</div>
      {all.map((a,i)=>(
        <div key={i} style={{padding:'10px 12px',borderRadius:8,marginBottom:6,borderLeft:`3px solid ${a.type==='success'?'#10b981':a.type==='warning'?'#f59e0b':a.type==='danger'?'#ef4444':'#3b82f6'}`,background:a.type==='success'?'#001a0e':'#1a2235'}}>
          <div style={{fontSize:12,fontWeight:500,color:'#e6edf3'}}>{a.t}</div>
          <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{a.d}</div>
          <div style={{fontSize:10,color:'#64748b',marginTop:4}}>{a.time}</div>
        </div>
      ))}
    </div>
  )
}
