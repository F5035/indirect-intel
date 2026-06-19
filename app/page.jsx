'use client'
import { useState, useEffect, useRef } from 'react'

const s = {
  // Layout
  nav: { background:'#161b22', borderBottom:'1px solid #30363d', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 },
  brand: { fontWeight:700, fontSize:16, color:'#58a6ff', letterSpacing:'-0.5px' },
  brandSub: { color:'#8b949e', fontWeight:400 },
  main: { flex:1, padding:'32px 24px', maxWidth:1100, margin:'0 auto', width:'100%' },

  // Auth
  authWrap: { maxWidth:420, margin:'80px auto' },
  card: { background:'#161b22', border:'1px solid #30363d', borderRadius:8, padding:32 },
  cardTitle: { fontSize:20, fontWeight:600, marginBottom:24 },
  label: { display:'block', marginBottom:6, color:'#8b949e', fontSize:13 },
  input: { width:'100%', background:'#0d1117', border:'1px solid #30363d', borderRadius:8, padding:'10px 12px', color:'#e6edf3', fontSize:14, outline:'none', marginBottom:16 },
  authSwitch: { marginTop:16, textAlign:'center', color:'#8b949e', fontSize:13 },

  // Buttons
  btn: { display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer', border:'none', transition:'opacity .15s' },
  btnPrimary: { background:'#58a6ff', color:'#0d1117' },
  btnGhost: { background:'transparent', color:'#8b949e', border:'1px solid #30363d' },
  btnDanger: { background:'#f85149', color:'white' },
  btnSm: { padding:'5px 10px', fontSize:12 },
  btnFull: { width:'100%', justifyContent:'center' },

  // Disclaimer
  disclaimer: { background:'#1c1a0e', border:'1px solid #4d3d10', borderRadius:8, padding:'10px 14px', color:'#d29922', fontSize:12, marginBottom:24 },

  // Search
  searchBox: { display:'flex', gap:8, marginBottom:8 },
  searchInput: { flex:1, background:'#161b22', border:'1px solid #30363d', borderRadius:8, padding:'12px 16px', color:'#e6edf3', fontSize:15, outline:'none' },
  hint: { color:'#8b949e', fontSize:12, marginTop:8 },
  hintLink: { color:'#58a6ff', cursor:'pointer', fontWeight:500 },

  // Tabs
  tabs: { display:'flex', gap:4, marginBottom:24, borderBottom:'1px solid #30363d' },
  tab: { padding:'10px 16px', cursor:'pointer', fontSize:14, color:'#8b949e', borderBottom:'2px solid transparent', marginBottom:-1, transition:'all .2s' },
  tabActive: { color:'#e6edf3', borderBottomColor:'#58a6ff' },

  // Value chain
  vchain: { background:'#161b22', border:'1px solid #30363d', borderRadius:8, padding:20, marginBottom:24 },
  vchainTitle: { fontWeight:600, marginBottom:16, fontSize:13, color:'#8b949e', textTransform:'uppercase', letterSpacing:.5 },
  vchainGrid: { display:'flex', flexWrap:'wrap', gap:12 },
  vchainCat: { background:'#21262d', border:'1px solid #30363d', borderRadius:8, padding:'12px 16px', minWidth:160, flex:1 },
  vchainCatName: { fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:.5, marginBottom:8, color:'#58a6ff' },

  // Cards
  companyGrid: { display:'flex', flexDirection:'column', gap:12 },
  companyCard: { background:'#161b22', border:'1px solid #30363d', borderRadius:8, padding:20, cursor:'pointer', transition:'border-color .2s' },
  cardHeader: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 },
  cardName: { fontSize:16, fontWeight:600, marginBottom:4 },
  cardTags: { display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 },
  tag: { padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:500 },
  cardSummary: { color:'#8b949e', fontSize:13, lineHeight:1.5 },
  scoreBox: { textAlign:'center', minWidth:80 },
  scoreValue: { fontSize:28, fontWeight:700, lineHeight:1 },
  scoreLabel: { fontSize:11, color:'#8b949e', marginTop:2 },

  // Card details
  cardDetails: { marginTop:20, paddingTop:20, borderTop:'1px solid #30363d', display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  detailTitle: { fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:.5, color:'#8b949e', marginBottom:10 },
  evidenceItem: { background:'#21262d', borderRadius:6, padding:'10px 12px', marginBottom:8 },
  evidenceType: { fontSize:11, color:'#58a6ff', fontWeight:600, textTransform:'uppercase', marginBottom:4 },
  evidenceDesc: { fontSize:12, color:'#8b949e', lineHeight:1.4, marginBottom:6 },
  riskList: { listStyle:'none' },
  riskItem: { fontSize:12, color:'#8b949e', padding:'4px 0 4px 16px', position:'relative', lineHeight:1.4 },
  barRow: { display:'flex', alignItems:'center', gap:10, marginBottom:8 },
  barLabel: { fontSize:11, color:'#8b949e', width:110, flexShrink:0 },
  barTrack: { flex:1, background:'#21262d', borderRadius:4, height:6 },
  barFill: { height:'100%', borderRadius:4, background:'#58a6ff' },
  barVal: { fontSize:11, color:'#8b949e', width:24, textAlign:'right', flexShrink:0 },

  // Alerts
  alertPanel: { background:'#161b22', border:'1px solid #30363d', borderRadius:8, padding:20, marginBottom:24 },
  alertForm: { display:'flex', gap:8, flexWrap:'wrap' },
  alertInput: { background:'#0d1117', border:'1px solid #30363d', borderRadius:8, padding:'8px 12px', color:'#e6edf3', fontSize:13, flex:1, minWidth:180, outline:'none' },
  alertSelect: { background:'#0d1117', border:'1px solid #30363d', borderRadius:8, padding:'8px 12px', color:'#e6edf3', fontSize:13, outline:'none' },
  alertItem: { background:'#21262d', borderRadius:6, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 },

  // Misc
  muted: { color:'#8b949e' },
  error: { color:'#f85149', fontSize:13, marginTop:8 },
  loading: { display:'flex', alignItems:'center', gap:10, color:'#8b949e', padding:'40px 0', justifyContent:'center' },
  noResults: { textAlign:'center', padding:'60px 20px', color:'#8b949e' },
  termPill: { background:'#21262d', border:'1px solid #30363d', borderRadius:20, padding:'6px 14px', fontSize:12, cursor:'pointer', color:'#8b949e', display:'inline-block', margin:'4px' },
  badge: { background:'#21262d', color:'#8b949e', borderRadius:12, padding:'2px 8px', fontSize:12 },
  subExpired: { background:'#1a0a0a', border:'1px solid #5c1a1a', borderRadius:8, padding:40, textAlign:'center' },
  notifPanel: { background:'#161b22', border:'1px solid #30363d', borderRadius:8, padding:20, marginBottom:24 },
  notifItem: { padding:'10px 0', borderBottom:'1px solid #30363d', fontSize:13 },
}

const TAGS = {
  industry: { background:'#1f3040', color:'#58a6ff' },
  country: { background:'#1a2a1a', color:'#3fb950' },
  public: { background:'#1a2a1a', color:'#3fb950' },
  private: { background:'#2a1a1a', color:'#d29922' },
  cat: { background:'#21262d', color:'#8b949e' },
}

function scoreColor(s) {
  return s >= 70 ? '#3fb950' : s >= 45 ? '#d29922' : '#f85149'
}

const SCORE_LABELS = {
  evidence_quality: 'Evidencia',
  financial_health: 'Salud Fin.',
  momentum: 'Momentum',
  market_growth: 'Crecim. Mdo',
  valuation: 'Valuación',
  risk: 'Riesgo',
}
const SCORE_MAX = { evidence_quality:30, financial_health:14, momentum:10, market_growth:16, valuation:9, risk:9 }

export default function App() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [view, setView] = useState('search')
  const [authMode, setAuthMode] = useState('login')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const emailRef = React.useRef()
  const passRef = React.useRef()
  const compRef = React.useRef()
  const [alertForm, setAlertForm] = useState({ target:'', target_type:'trend', channel:'in_app' })

  useEffect(() => {
    const t = localStorage.getItem('ii_token')
    if (t) { setToken(t); loadUser(t) }
  }, [])

  async function api(path, opts = {}, tok = token) {
    const headers = { 'Content-Type': 'application/json' }
    if (tok) headers['Authorization'] = `Bearer ${tok}`
    const res = await fetch(path, { headers, ...opts })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Error')
    return data
  }

  async function loadUser(tok) {
    try {
      const u = await api('/api/auth/me', {}, tok)
      setUser(u)
      loadAlerts(tok)
      loadNotifications(tok)
    } catch { setToken(null); localStorage.removeItem('ii_token') }
  }

  async function login(email, password) {
    setLoading(true); setError(null)
    try {
      const d = await api('/api/auth/login', { method:'POST', body:JSON.stringify({ email, password }) })
      localStorage.setItem('ii_token', d.access_token)
      setToken(d.access_token)
      await loadUser(d.access_token)
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  async function register(email, password, company_name) {
    setLoading(true); setError(null)
    try {
      const d = await api('/api/auth/register', { method:'POST', body:JSON.stringify({ email, password, company_name }) })
      localStorage.setItem('ii_token', d.access_token)
      setToken(d.access_token)
      await loadUser(d.access_token)
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  function logout() {
    setToken(null); setUser(null); setResults(null)
    localStorage.removeItem('ii_token')
  }

  async function doSearch(q) {
    if (!q.trim()) return
    setQuery(q); setView('search'); setLoading(true); setResults(null); setError(null)
    try {
      const d = await api(`/api/search?q=${encodeURIComponent(q)}`)
      setResults(d)
    } catch(e) {
      if (e.message.includes('Suscripción')) setUser(u => ({ ...u, subscription_active: false }))
      else setError(e.message)
    }
    setLoading(false)
  }

  async function loadAlerts(tok) {
    try { const d = await api('/api/alerts', {}, tok || token); setAlerts(d.alerts || []) } catch {}
  }

  async function createAlert() {
    if (!alertForm.target.trim()) return
    try {
      await api('/api/alerts', { method:'POST', body:JSON.stringify(alertForm) })
      setAlertForm(f => ({ ...f, target:'' }))
      await loadAlerts()
      await loadNotifications()
    } catch(e) { setError(e.message) }
  }

  async function deleteAlert(id) {
    try { await api(`/api/alerts/${id}`, { method:'DELETE' }); await loadAlerts() } catch {}
  }

  async function loadNotifications(tok) {
    try { const d = await api('/api/notifications', {}, tok || token); setNotifications(d.notifications || []) } catch {}
  }

  // ── Auth ──
  if (!user) {
    const isLogin = authMode === 'login'
    const submit = () => isLogin
      ? login(emailRef.current?.value, passRef.current?.value)
      : register(emailRef.current?.value, passRef.current?.value, compRef.current?.value)

    return (
      <div>
        <nav style={s.nav}>
          <span style={s.brand}>Indirect Intel <span style={s.brandSub}>/ IA Infrastructure</span></span>
        </nav>
        <div style={s.authWrap}>
          <div style={s.card}>
            <div style={s.cardTitle}>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</div>
            <label style={s.label}>Email</label>
            <input ref={emailRef} type="email" style={s.input} placeholder="analista@empresa.com" />
            <label style={s.label}>Contraseña</label>
            <input ref={passRef} type="password" style={s.input} placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && submit()} />
            {!isLogin && <>
              <label style={s.label}>Nombre de la empresa</label>
              <input ref={compRef} type="text" style={s.input} placeholder="Ej: Acme Consulting" />
            </>}
            {error && <div style={s.error}>❌ {error}</div>}
            <button style={{ ...s.btn, ...s.btnPrimary, ...s.btnFull, marginTop:8 }} onClick={submit}>
              {loading ? '...' : isLogin ? 'Entrar' : 'Registrarse'}
            </button>
            <div style={s.authSwitch}>
              {isLogin
                ? <>¿No tenés cuenta? <a style={{ cursor:'pointer' }} onClick={() => { setAuthMode('register'); setError(null) }}>Registrate</a></>
                : <>¿Ya tenés cuenta? <a style={{ cursor:'pointer' }} onClick={() => { setAuthMode('login'); setError(null) }}>Iniciá sesión</a></>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Subscription expired ──
  if (!user.subscription_active) {
    return (
      <div>
        <nav style={s.nav}>
          <span style={s.brand}>Indirect Intel</span>
          <button style={{ ...s.btn, ...s.btnGhost, ...s.btnSm }} onClick={logout}>Salir</button>
        </nav>
        <div style={{ ...s.main }}>
          <div style={s.subExpired}>
            <h2 style={{ color:'#f85149', marginBottom:12 }}>Suscripción requerida</h2>
            <p style={{ color:'#8b949e', marginBottom:20 }}>Tu suscripción venció. Renovate para seguir accediendo.</p>
            <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => setUser(u => ({ ...u, subscription_active:true }))}>Renovar suscripción</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main app ──
  const tabs = [
    { id:'search', label:'🔍 Buscar' },
    { id:'alerts', label:`🔔 Alertas${alerts.length ? ` (${alerts.length})` : ''}` },
    { id:'notifications', label:`📬 Notificaciones${notifications.filter(n=>!n.read).length ? ' ●' : ''}` },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <nav style={s.nav}>
        <span style={s.brand}>Indirect Intel <span style={s.brandSub}>/ IA Infrastructure</span></span>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ color:'#8b949e', fontSize:12 }}>{user.company_name}</span>
          <button style={{ ...s.btn, ...s.btnGhost, ...s.btnSm }} onClick={logout}>Salir</button>
        </div>
      </nav>
      <div style={s.main}>
        <div style={s.tabs}>
          {tabs.map(t => (
            <div key={t.id} style={{ ...s.tab, ...(view===t.id ? s.tabActive : {}) }}
              onClick={() => { setView(t.id); if(t.id==='alerts') loadAlerts(); if(t.id==='notifications') loadNotifications() }}>
              {t.label}
            </div>
          ))}
        </div>

        {view === 'search' && <SearchView
          query={query} setQuery={setQuery} doSearch={doSearch}
          results={results} loading={loading} error={error}
          expanded={expanded} setExpanded={setExpanded}
          setAlertForm={setAlertForm} setView={setView} loadAlerts={loadAlerts}
        />}
        {view === 'alerts' && <AlertsView
          alerts={alerts} alertForm={alertForm} setAlertForm={setAlertForm}
          createAlert={createAlert} deleteAlert={deleteAlert}
        />}
        {view === 'notifications' && <NotificationsView notifications={notifications} />}
      </div>
    </div>
  )
}

function SearchView({ query, setQuery, doSearch, results, loading, error, expanded, setExpanded, setAlertForm, setView, loadAlerts }) {
  const suggestions = ['chips', 'data centers', 'energía', 'nvidia', 'servidores', 'cooling', 'fibra óptica', 'ciberseguridad']

  return (
    <div>
      <div style={s.disclaimer}>⚠ Este contenido es research informativo, no asesoramiento financiero. No constituye recomendación de compra o venta de activos.</div>
      <div style={s.searchBox}>
        <input style={s.searchInput} type="text" placeholder='Buscá una empresa o tendencia: "OpenAI", "chips", "data centers"...'
          value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch(query)} />
        <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => doSearch(query)}>🔍 Buscar</button>
      </div>
      <div style={s.hint}>
        Ej:{' '}
        {['nvidia','chips','data centers','energía','OpenAI','servidores'].map(t => (
          <span key={t} style={s.hintLink} onClick={() => doSearch(t)}> {t} · </span>
        ))}
      </div>
      {error && <div style={s.error}>❌ {error}</div>}

      {loading && <div style={s.loading}><span>⏳</span> Buscando empresas...</div>}

      {results && results.result_count === 0 && (
        <div style={s.noResults}>
          <h3 style={{ color:'#e6edf3', marginBottom:8 }}>Sin resultados para "{results.query}"</h3>
          <p>{results.message}</p>
          <div style={{ marginTop:16 }}>
            {(results.suggested_terms || suggestions).map(t => (
              <span key={t} style={s.termPill} onClick={() => doSearch(t)}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {results && results.result_count > 0 && (
        <>
          <ValueChainMap map={results.value_chain_map} doSearch={doSearch} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <span style={s.muted}><strong style={{ color:'#e6edf3' }}>{results.result_count}</strong> empresas para "<strong style={{ color:'#e6edf3' }}>{results.query}</strong>" · <span style={{ color:'#3fb950' }}>IA Infrastructure</span></span>
            <span style={{ fontSize:12, color:'#8b949e' }}>⏱ {results.response_time_seconds}s</span>
          </div>
          <div style={s.companyGrid}>
            {results.companies.map(c => (
              <CompanyCard key={c.id} company={c} expanded={expanded===c.id}
                onToggle={() => setExpanded(expanded===c.id ? null : c.id)}
                onAlert={(name) => { setAlertForm(f => ({ ...f, target:name, target_type:'company' })); setView('alerts'); loadAlerts() }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ValueChainMap({ map, doSearch }) {
  if (!map?.categories?.length) return null
  return (
    <div style={s.vchain}>
      <div style={s.vchainTitle}>🗺 Mapa de Cadena de Valor — IA Infrastructure</div>
      <div style={s.vchainGrid}>
        {map.categories.map(cat => (
          <div key={cat.name} style={s.vchainCat}>
            <div style={s.vchainCatName}>{cat.name}</div>
            {cat.companies.map(c => (
              <div key={c} style={{ fontSize:12, color:'#8b949e', cursor:'pointer', padding:'2px 0' }}
                onClick={() => doSearch(c)}>{c}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function CompanyCard({ company: c, expanded, onToggle, onAlert }) {
  const score = c.exposure_score || 0
  return (
    <div style={{ ...s.companyCard, ...(expanded ? { borderColor:'#58a6ff' } : {}) }} onClick={onToggle}>
      <div style={s.cardHeader}>
        <div style={{ flex:1 }}>
          <div style={s.cardName}>
            {c.name}
            {c.evidence_flag && <span style={{ background:'#2a1a00', border:'1px solid #5c3d00', borderRadius:4, padding:'2px 8px', fontSize:11, color:'#d29922', marginLeft:8 }}>⚠ evidencia insuficiente</span>}
          </div>
          <div style={s.cardTags}>
            <span style={{ ...s.tag, ...TAGS.industry }}>{c.industry}</span>
            <span style={{ ...s.tag, ...TAGS.country }}>🌍 {c.country}</span>
            <span style={{ ...s.tag, ...TAGS[c.type] }}>{c.type === 'public' ? '📈 Pública' : '🔒 Privada'}</span>
            {(c.categories || []).map(cat => <span key={cat} style={{ ...s.tag, ...TAGS.cat }}>{cat}</span>)}
          </div>
          <div style={s.cardSummary}>{c.summary}</div>
        </div>
        <div style={s.scoreBox}>
          <div style={{ ...s.scoreValue, color:scoreColor(score) }}>{score}</div>
          <div style={s.scoreLabel}>Score</div>
        </div>
      </div>

      {expanded && (
        <div style={s.cardDetails} onClick={e => e.stopPropagation()}>
          <div>
            <div>
              <div style={s.detailTitle}>Evidencia Trazable</div>
              {(c.evidence || []).map((ev, i) => (
                <div key={i} style={s.evidenceItem}>
                  <div style={s.evidenceType}>{ev.type}</div>
                  <div style={s.evidenceDesc}>{ev.description}</div>
                  {ev.url
                    ? <a href={ev.url} target="_blank" rel="noopener" style={{ fontSize:11, color:'#58a6ff' }} onClick={e=>e.stopPropagation()}>🔗 Ver fuente</a>
                    : <span style={{ fontSize:11, color:'#f85149' }}>⚠ Fuente no disponible</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop:16 }}>
              <div style={s.detailTitle}>Riesgos</div>
              <ul style={s.riskList}>
                {(c.risks || []).map((r,i) => <li key={i} style={s.riskItem}>⚠ {r}</li>)}
              </ul>
            </div>
          </div>
          <div>
            <div style={s.detailTitle}>Score Breakdown</div>
            {c.financial_note && <div style={{ color:'#d29922', fontSize:11, marginBottom:8 }}>ℹ {c.financial_note}</div>}
            {Object.entries(c.score_breakdown || {}).map(([k, v]) => {
              const max = SCORE_MAX[k] || 15
              const pct = Math.min(100, Math.round((v / max) * 100))
              return (
                <div key={k} style={s.barRow}>
                  <div style={s.barLabel}>{SCORE_LABELS[k] || k}</div>
                  <div style={s.barTrack}><div style={{ ...s.barFill, width:`${pct}%` }} /></div>
                  <div style={s.barVal}>{v}</div>
                </div>
              )
            })}
            <button style={{ ...s.btn, ...s.btnGhost, ...s.btnSm, marginTop:12 }}
              onClick={e => { e.stopPropagation(); onAlert(c.name) }}>
              🔔 Crear alerta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AlertsView({ alerts, alertForm, setAlertForm, createAlert, deleteAlert }) {
  return (
    <div style={s.alertPanel}>
      <div style={{ fontWeight:600, marginBottom:16 }}>🔔 Alertas</div>
      <div style={s.alertForm}>
        <input style={s.alertInput} type="text" placeholder="Empresa o tendencia (ej: nvidia, chips, energía)"
          value={alertForm.target} onChange={e => setAlertForm(f => ({ ...f, target:e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && createAlert()} />
        <select style={s.alertSelect} value={alertForm.target_type} onChange={e => setAlertForm(f => ({ ...f, target_type:e.target.value }))}>
          <option value="trend">Tendencia</option>
          <option value="company">Empresa</option>
        </select>
        <select style={s.alertSelect} value={alertForm.channel} onChange={e => setAlertForm(f => ({ ...f, channel:e.target.value }))}>
          <option value="in_app">In-app</option>
          <option value="email">Email</option>
        </select>
        <button style={{ ...s.btn, ...s.btnPrimary }} onClick={createAlert}>+ Crear alerta</button>
      </div>
      {alerts.length === 0
        ? <div style={{ color:'#8b949e', fontSize:13, padding:'12px 0' }}>No tenés alertas configuradas.</div>
        : alerts.map(a => (
          <div key={a.id} style={s.alertItem}>
            <div>
              <div style={{ fontWeight:600 }}>🔔 {a.target}</div>
              <div style={{ fontSize:11, color:'#8b949e', marginTop:2 }}>{a.target_type} · {a.channel} · {new Date(a.created_at).toLocaleDateString('es-AR')}</div>
            </div>
            <button style={{ ...s.btn, ...s.btnDanger, ...s.btnSm }} onClick={() => deleteAlert(a.id)}>Eliminar</button>
          </div>
        ))
      }
    </div>
  )
}

function NotificationsView({ notifications }) {
  return (
    <div style={s.notifPanel}>
      <div style={{ fontWeight:600, marginBottom:12 }}>📬 Notificaciones</div>
      {notifications.length === 0
        ? <div style={{ color:'#8b949e', fontSize:13 }}>No hay notificaciones.</div>
        : [...notifications].reverse().map(n => (
          <div key={n.id} style={s.notifItem}>
            <strong>{n.target}</strong> — {n.message}
            <div style={{ fontSize:11, color:'#8b949e', marginTop:4 }}>{new Date(n.created_at).toLocaleString('es-AR')}</div>
          </div>
        ))
      }
    </div>
  )
}
