# Supply Alpha — MVP 1 Spec

## Objetivo

Plataforma web de inteligencia empresarial que permite descubrir las empresas ocultas detrás de grandes tendencias, conectando datos oficiales, financieros, regulatorios, contractuales y sociales. El usuario busca una empresa, ticker o tendencia y obtiene una ficha de análisis profundo con datos verificados, relaciones directas e indirectas, contratos públicos, señales sociales y scoring propio.

**No es** una plataforma de recomendación financiera. Es una plataforma de research, análisis, discovery e inteligencia de mercado.

Stack existente: Next.js 16, React 19, Tailwind 4, Vercel, Supabase (PostgreSQL).

---

## Requirements

### Must-have

1. **Buscador global** en la home que acepta nombre de empresa, ticker, tendencia o sector y devuelve resultados relevantes en menos de 2 segundos.
2. **Ficha de empresa** con tabs: Overview, Charts, Contratos, Relaciones, PESTEL, Noticias, Social Signals, Alertas.
3. **Overview** muestra: descripción, sector, industria, ticker, exchange, market cap, revenue, margen, deuda, empleados, sede, subsidiarias, riesgos principales y últimos eventos.
4. **Charts** muestra gráfico de precio histórico con selectores 1D / 1S / 1M / 3M / 1A, precio actual, variación diaria y volumen. Datos vía Yahoo Finance API (ya integrado).
5. **Contratos** lista contratos públicos federales de EE.UU. vinculados a la empresa, con: título, monto, agencia compradora, fecha de adjudicación, duración, NAICS, PSC, tipo (prime / subcontrato), nivel de confianza y link a fuente. Fuentes: USASpending.gov API y DoD Contract Announcements.
6. **Relaciones** muestra un listado (no grafo en MVP 1) de empresas vinculadas con: tipo de relación (proveedor / cliente / subsidiaria / competidor / partner / contratista), si es directa o indirecta, fuente y nivel de confianza. Datos extraídos de SEC filings y contratos.
7. **PESTEL básico** muestra los seis bloques (Political, Economic, Social, Technological, Environmental, Legal) con: score 0–100, resumen ejecutivo, hasta 3 señales recientes, fuentes y nivel de confianza. MVP 1 solo cubre P (contratos, regulaciones), E (datos financieros SEC + macro FRED) y L (litigios SEC, enforcement DOJ/FTC básico).
8. **Noticias** feed con las últimas 10 noticias verificadas de la empresa, clasificadas en Nivel A (oficial), Nivel B (Reuters/Bloomberg/AP) y Nivel C (otros). Fuente: Tavily API (ya integrado).
9. **Social Signals** muestra menciones de la empresa en X y Reddit con: volumen, sentimiento (positivo / neutral / negativo), velocidad de crecimiento en 24h y comentarios representativos. Solo mostrar si hay mínimo 100 menciones. Badge "Speculative / Not Confirmed" obligatorio en todo contenido social.
10. **Alertas** permite al usuario autenticado crear alertas por empresa o tendencia y recibe notificaciones cuando hay nuevo contrato, nuevo filing SEC o nueva señal social relevante. Persiste en Supabase (ya implementado).
11. **Sistema de verificación** clasifica toda información con badge visible: 🟢 Verificado Oficial / 🟡 Inferido / 🔴 Especulativo. Ningún dato aparece sin fuente y fecha.
12. **Disclaimer obligatorio** visible en la home y en cada ficha: "Esta plataforma no brinda asesoramiento financiero personalizado ni recomendaciones de compra o venta de activos. La información presentada tiene fines educativos, informativos y de research."
13. **Auth funcional** con registro, login y sesión persistente vía JWT. Usuarios guardados en Supabase (ya implementado).
14. **36 empresas iniciales** del dataset existente (`data/companies.json`) migradas a tabla `companies` en Supabase, editables sin redeploy.
15. **Home** con: hero, buscador global, tarjetas de top companies (NVIDIA, TSMC, AMD, Palantir, Lockheed Martin, SpaceX, OpenAI y otras del dataset), sección Live Trends (AI Infrastructure, Space Economy, Defense Tech, Semiconductors, Data Centers, Nuclear Energy) y feed de novedades recientes.
16. **Lenguaje de research** en toda la UI: "exposición detectada", "evidencia verificada", "relación inferida", "riesgo elevado", "señal especulativa", "contrato detectado". Nunca usar "comprá", "vendé", "va a subir", "garantiza retorno".
17. **Responsive** funciona en desktop y mobile.
18. **Dark mode** como modo por defecto, consistente con la estética actual del proyecto (background `#060b14`, accents cyan/violet/green/yellow).

### Out of scope en MVP 1

- Grafo interactivo de relaciones (MVP 2)
- Módulos S, T, Environmental del PESTEL completo (MVP 2)
- Comparador de empresas (MVP 2)
- Exportación PDF / CSV (MVP 2)
- Fuentes: EPA, OSHA, USPTO, FRED detallado, BLS, ClinicalTrials, CourtListener, OFAC, BIS (MVP 2)
- Empresas privadas sin ticker (parcial — SpaceX y OpenAI se cubren con contratos públicos)
- Neo4j / graph database (MVP 3)
- Elasticsearch / embeddings (MVP 3)
- APIs B2B / enterprise dashboard (MVP 3)
- Portfolio exposure (MVP 3)
- Modo claro (MVP 3)
- Multilenguaje / internacionalización (MVP 3)
- Stripe / pagos (MVP 2)

---

## Inputs & Outputs

### Inputs del usuario
- Búsqueda libre: nombre de empresa, ticker, tendencia, sector, agencia
- Selección de empresa desde tarjetas de home
- Selección de tendencia desde Live Trends
- Rango de fechas en charts
- Configuración de alertas (empresa o tendencia + canal)

### Outputs del sistema
- Ficha de empresa con todos los módulos mencionados
- Feed de contratos paginado (20 por página)
- Lista de relaciones con tipo y confianza
- Bloques PESTEL con score y señales
- Feed de noticias clasificado por nivel
- Social signals con sentimiento y badge especulativo
- Notificaciones de alertas en tiempo real (o near real-time)

### Formatos
- Todo JSON desde APIs internas Next.js
- Gráficos con recharts o similar (ya disponible en el proyecto)
- Tablas con sorting y filtros básicos
- Badges de confianza con color coding

---

## Fuentes de datos — MVP 1

| Fuente | Datos | API | Estado |
|--------|-------|-----|--------|
| Yahoo Finance | Precios, OHLC, volumen | Endpoint no oficial (ya integrado) | ✅ Funcionando |
| Tavily | Noticias, research | API oficial (ya integrado) | ✅ Funcionando |
| USASpending.gov | Contratos federales, awards, subawards | api.usaspending.gov — gratuita | 🔲 A integrar |
| DoD Contracts | Contratos defensa diarios | defense.gov RSS/JSON | 🔲 A integrar |
| SEC EDGAR | Filings, companyfacts, submissions | data.sec.gov — gratuita | 🔲 A integrar |
| SAM.gov | Entity info, contratos, UEI | api.sam.gov — gratuita con key | 🔲 A integrar |
| FRED | Macro: tasas, inflación, GDP | api.stlouisfed.org — gratuita | 🔲 A integrar (básico) |
| Reddit | Posts, sentiment | Reddit API — gratuita con key | 🔲 A integrar |
| Supabase | Users, alerts, notifications, companies | supabase-js (ya integrado) | ✅ Funcionando |

---

## Modelo de datos — tablas Supabase a agregar

```sql
-- Empresas (migrar desde companies.json)
companies (
  id uuid PK,
  legal_name text,
  display_name text,
  ticker text,
  cik text,                    -- SEC
  uei text,                    -- SAM.gov
  exchange text,
  sector text,
  industry text,
  country text DEFAULT 'USA',
  description text,
  founded_year int,
  employees int,
  website text,
  keywords text[],
  categories text[],
  score_breakdown jsonb,
  risks text[],
  evidence jsonb,
  last_updated timestamptz DEFAULT now()
)

-- Contratos federales
contracts (
  id uuid PK,
  company_id uuid FK → companies,
  source text,                 -- 'usaspending' | 'dod' | 'nasa' | 'sam'
  title text,
  description text,
  buyer_agency text,
  awardee text,
  prime_contractor text,
  subcontractor text,
  amount numeric,
  currency text DEFAULT 'USD',
  award_date date,
  start_date date,
  end_date date,
  naics text,
  psc text,
  place_of_performance text,
  contract_type text,          -- 'prime' | 'subcontract'
  contract_number text,
  source_url text,
  confidence_level text,       -- 'A' | 'B' | 'C'
  pestel_category text[],
  last_checked timestamptz DEFAULT now()
)

-- Relaciones entre empresas
relationships (
  id uuid PK,
  source_company_id uuid FK → companies,
  target_company_id uuid FK → companies,
  relationship_type text,      -- 'supplier' | 'customer' | 'subsidiary' | 'partner' | 'competitor' | 'contractor'
  direct_or_indirect text,     -- 'direct' | 'indirect'
  confidence_score int,        -- 0-100
  evidence_source text,
  source_url text,
  pestel_category text,
  first_seen timestamptz,
  last_seen timestamptz DEFAULT now()
)

-- Señales PESTEL
pestel_signals (
  id uuid PK,
  company_id uuid FK → companies,
  category text,               -- 'P' | 'E' | 'S' | 'T' | 'En' | 'L'
  signal_type text,            -- 'risk' | 'opportunity'
  description text,
  source_name text,
  source_url text,
  confidence_level text,       -- 'A' | 'B' | 'C' | 'D'
  impact_score int,            -- 0-100
  timestamp timestamptz DEFAULT now()
)

-- Señales sociales
social_signals (
  id uuid PK,
  company_id uuid FK → companies,
  platform text,               -- 'reddit' | 'x' | 'stocktwits'
  mentions_count int,
  sentiment_positive numeric,
  sentiment_neutral numeric,
  sentiment_negative numeric,
  growth_24h numeric,
  representative_comments jsonb,
  status text DEFAULT 'speculative',
  captured_at timestamptz DEFAULT now()
)

-- Scores calculados
scores (
  id uuid PK,
  company_id uuid FK → companies,
  score_type text,             -- 'exposure' | 'pestel' | 'hidden_winner' | 'contract_momentum' | 'trend_exposure'
  value int,                   -- 0-100
  explanation text,
  inputs jsonb,
  calculated_at timestamptz DEFAULT now()
)
```

---

## Arquitectura de la aplicación

```
app/
  page.jsx                    → Home (hero + buscador + top companies + live trends + feed)
  company/[slug]/
    page.jsx                  → Ficha de empresa (tabs)
  trend/[slug]/
    page.jsx                  → Ficha de tendencia
  api/
    search/route.js           → Búsqueda (companies + trends) ← ya existe, migrar a Supabase
    ranking/route.js          → Top companies con scores ← ya existe, mejorar
    stock/route.js            → Yahoo Finance ← ya existe ✅
    news/route.js             → Tavily ← ya existe ✅
    contracts/route.js        → USASpending + DoD ← a crear
    relationships/route.js    → Relaciones de empresa ← a crear
    pestel/route.js           → Señales PESTEL ← a crear
    social/route.js           → Reddit sentiment ← a crear
    companies/
      [slug]/route.js         → Detalle de empresa desde Supabase ← a crear
    alerts/route.js           ← ya existe ✅
    notifications/route.js    ← ya existe ✅
    auth/                     ← ya existe ✅

lib/
  supabase.js                 ← ya existe ✅
  auth.js                     ← ya existe ✅
  data.js                     ← migrar a Supabase
  usaspending.js              ← a crear
  sec-edgar.js                ← a crear
  pestel.js                   ← a crear
  scoring.js                  ← a crear
  reddit.js                   ← a crear
```

---

## Pipeline de ingesta — MVP 1

Dado que MVP 1 usa Vercel (serverless), no hay workers persistentes. El pipeline es on-demand + cron jobs de Vercel:

```
On-demand (cuando el usuario abre una ficha):
  → Verificar si datos en Supabase tienen < 24h
  → Si frescos: devolver desde Supabase
  → Si stale: fetch desde API externa → normalizar → guardar en Supabase → devolver

Cron jobs de Vercel (vercel.json):
  → /api/cron/contracts   → cada 24h → USASpending + DoD
  → /api/cron/sec         → cada 6h  → nuevos filings SEC
  → /api/cron/pestel      → cada 24h → Federal Register + Congress.gov básico
  → /api/cron/social      → cada 6h  → Reddit mentions
```

---

## Sistema de verificación — reglas

| Nivel | Badge | Color | Fuentes |
|-------|-------|-------|---------|
| A — Verificado Oficial | 🟢 Verificado | Verde | SEC, SAM.gov, USASpending, DoD, NASA, Federal Register |
| B — Confirmado confiable | 🟡 Confirmado | Amarillo | Reuters, Bloomberg, FT, WSJ, AP, PR Newswire |
| C — Señal débil | 🟠 Pendiente | Naranja | Blogs, newsletters, medios chicos |
| D — Especulación social | 🔴 Especulativo | Rojo/Violeta | X, Reddit, Stocktwits |

Reglas duras:
- Ningún dato sin fuente y fecha
- Social signals solo si ≥ 100 menciones
- Social signals siempre con badge D visible
- Si una señal D se confirma con fuente A/B, cambiar estado a "Confirmado"
- La IA no afirma relaciones sin evidencia: si no hay fuente, mostrar "Sin evidencia suficiente para confirmar esta relación"

---

## Edge Cases & Error Handling

- **Empresa no encontrada**: mostrar sugerencias de búsqueda y empresas relacionadas a la query
- **API externa caída** (Yahoo Finance, Tavily, USASpending): mostrar último dato conocido con timestamp "Último dato disponible: X"
- **Sin contratos detectados**: mostrar "No se detectaron contratos federales para esta empresa en los últimos 12 meses" (no pantalla vacía)
- **Sin señales sociales** (< 100 menciones): ocultar módulo Social Signals completamente
- **PESTEL sin datos**: mostrar bloques con "Datos en procesamiento" en lugar de scores vacíos
- **Usuario no autenticado** intentando crear alerta: redirigir a login con mensaje claro
- **Timeout de API > 5s**: devolver datos de Supabase si existen, aunque sean stale, con aviso
- **Rate limiting de APIs externas**: queue con backoff exponencial, no fallar silenciosamente
- **Empresa privada** (SpaceX, OpenAI): mostrar ficha basada en contratos públicos y noticias; omitir módulos que requieren ticker (Charts financieros)

---

## Constraints

- Stack: Next.js 16 / React 19 / Tailwind 4 / Vercel / Supabase PostgreSQL
- No agregar bases de datos adicionales en MVP 1 (todo va a Supabase)
- Respetar términos de uso de todas las APIs. No scraping si existe API oficial
- Todas las API routes son server-side (no exponer keys al browser)
- `SUPABASE_SERVICE_ROLE_KEY` solo en server-side, nunca en `NEXT_PUBLIC_`
- Las APIs externas gratuitas (SEC, USASpending, SAM.gov, FRED) tienen rate limits — implementar caché en Supabase obligatorio
- Lenguaje de UI siempre en inglés (la plataforma apunta a mercado USA); mensajes de error pueden ser en español durante desarrollo
- Responsive mínimo: mobile 375px, desktop 1280px
- Performance: Time to First Byte < 1.5s en Vercel Edge

---

## Definition of Done

- [ ] Home carga en < 2s con hero, buscador, tarjetas de top 10 companies y 6 live trends
- [ ] Búsqueda de "NVIDIA" devuelve resultado en < 2s
- [ ] Ficha de NVIDIA muestra Overview con todos los campos requeridos
- [ ] Chart de NVIDIA muestra precio histórico con selector 1M funcional
- [ ] Ficha de NVIDIA muestra al menos 3 contratos reales de USASpending
- [ ] Ficha de NVIDIA muestra al menos 3 relaciones con tipo y nivel de confianza
- [ ] PESTEL de NVIDIA muestra bloques P, E y L con score y al menos 1 señal cada uno
- [ ] Noticias de NVIDIA muestra 5+ artículos con badge de nivel (A/B/C)
- [ ] Social Signals muestra menciones de Reddit con sentimiento y badge "Especulativo"
- [ ] Búsqueda de "SpaceX" devuelve ficha sin charts financieros pero con contratos NASA/DoD
- [ ] Búsqueda de "AI Infrastructure" devuelve ficha de tendencia con empresas relacionadas
- [ ] Usuario puede registrarse, loguearse y crear una alerta — persiste en Supabase
- [ ] Disclaimer visible en home y en cada ficha de empresa
- [ ] Todo dato tiene fuente y fecha visible
- [ ] Todo contenido social tiene badge "Speculative / Not Confirmed"
- [ ] Sin errores en consola en producción (Vercel)
- [ ] Funciona en mobile 375px y desktop 1280px
- [ ] Dark mode consistente en toda la app

---

## Roadmap post-MVP 1

**MVP 2** (siguiente fase):
- Grafo interactivo de relaciones (D3.js o Cytoscape)
- PESTEL completo (S, T, Environmental)
- EPA, OSHA, USPTO, CourtListener, OFAC, BIS
- Comparador de empresas
- Exportación PDF / CSV
- Stripe / modelo freemium

**MVP 3** (escala):
- Graph database (Neo4j o pgvector)
- Elasticsearch para búsqueda semántica
- APIs B2B / enterprise dashboard
- Portfolio exposure
- Watchlists avanzadas
- Expansión Europa / UK / Canadá
