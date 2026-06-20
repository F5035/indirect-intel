// scripts/seed-companies.js
// Run: node scripts/seed-companies.js
// Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env vars manually
const envPath = join(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
    .filter(([k]) => k)
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

// Ticker map for known companies
const TICKERS = {
  'NVIDIA': { ticker: 'NVDA', exchange: 'NASDAQ', cik: '0001045810' },
  'AMD': { ticker: 'AMD', exchange: 'NASDAQ', cik: '0000002488' },
  'Intel': { ticker: 'INTC', exchange: 'NASDAQ', cik: '0000050863' },
  'TSMC': { ticker: 'TSM', exchange: 'NYSE', cik: '0001046179' },
  'Equinix': { ticker: 'EQIX', exchange: 'NASDAQ', cik: '0001101239' },
  'Digital Realty': { ticker: 'DLR', exchange: 'NYSE', cik: '0001297996' },
  'Vertiv Holdings': { ticker: 'VRT', exchange: 'NYSE', cik: '0001737708' },
  'Eaton Corporation': { ticker: 'ETN', exchange: 'NYSE', cik: '0000031462' },
  'Vistra Energy': { ticker: 'VST', exchange: 'NYSE', cik: '0001692819' },
  'Constellation Energy': { ticker: 'CEG', exchange: 'NASDAQ', cik: '0001868275' },
  'Arista Networks': { ticker: 'ANET', exchange: 'NYSE', cik: '0001313925' },
  'Broadcom': { ticker: 'AVGO', exchange: 'NASDAQ', cik: '0001730168' },
  'Marvell Technology': { ticker: 'MRVL', exchange: 'NASDAQ', cik: '0001058057' },
  'Micron Technology': { ticker: 'MU', exchange: 'NASDAQ', cik: '0000723125' },
  'Lam Research': { ticker: 'LRCX', exchange: 'NASDAQ', cik: '0000707549' },
  'ASML': { ticker: 'ASML', exchange: 'NASDAQ', cik: '0000937556' },
  'Applied Materials': { ticker: 'AMAT', exchange: 'NASDAQ', cik: '0000796343' },
  'Corning': { ticker: 'GLW', exchange: 'NYSE', cik: '0000024741' },
  'Palo Alto Networks': { ticker: 'PANW', exchange: 'NASDAQ', cik: '0001327567' },
  'CrowdStrike': { ticker: 'CRWD', exchange: 'NASDAQ', cik: '0001535527' },
  'Super Micro Computer': { ticker: 'SMCI', exchange: 'NASDAQ', cik: '0000866385' },
  'Dell Technologies': { ticker: 'DELL', exchange: 'NYSE', cik: '0001571123' },
  'Hewlett Packard Enterprise': { ticker: 'HPE', exchange: 'NYSE', cik: '0001645590' },
  'Oklo': { ticker: 'OKLO', exchange: 'NYSE', cik: '0001849429' },
  'Amphenol': { ticker: 'APH', exchange: 'NYSE', cik: '0000820313' },
  'Bloom Energy': { ticker: 'BE', exchange: 'NYSE', cik: '0001368308' },
  'Celestica': { ticker: 'CLS', exchange: 'NYSE', cik: '0001061219' },
  'Flex Ltd': { ticker: 'FLEX', exchange: 'NASDAQ', cik: '0000866374' },
  'Iron Mountain': { ticker: 'IRM', exchange: 'NYSE', cik: '0001020569' },
  'IronMountain': { ticker: 'IRM', exchange: 'NYSE', cik: '0001020569' },
  'Qualcomm': { ticker: 'QCOM', exchange: 'NASDAQ', cik: '0000804328' },
  'Credo Technology': { ticker: 'CRDO', exchange: 'NASDAQ', cik: '0001807excl' },
  'Astera Labs': { ticker: 'ALAB', exchange: 'NASDAQ', cik: '0001884508' },
  'Arm Holdings': { ticker: 'ARM', exchange: 'NASDAQ', cik: '0001973755' },
  'Cadence Design Systems': { ticker: 'CDNS', exchange: 'NASDAQ', cik: '0000813672' },
  'Synopsys': { ticker: 'SNPS', exchange: 'NASDAQ', cik: '0000883241' },
  'GE Vernova': { ticker: 'GEV', exchange: 'NYSE', cik: '0001823076' },
  'Lattice Semiconductor': { ticker: 'LSCC', exchange: 'NASDAQ', cik: '0000855658' },
  'Wolfspeed': { ticker: 'WOLF', exchange: 'NYSE', cik: '0000895419' },
}

// Private companies (no public ticker)
const PRIVATE = ['SpaceX', 'OpenAI', 'SK Hynix', 'Schneider Electric', 'Cambricon Technologies',
  'NuScale Power', 'Coherent Corp', 'TE Connectivity', 'Onto Innovation', 'Wiwynn',
  'Taiwan Semiconductor (TSMC ADR)', 'Benchmark Electronics', 'Vertiv (REIT-adjacente)',
  'Celestica (Networking)', 'Nvent Electric', 'Advanced Energy Industries']

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function seed() {
  const raw = readFileSync(join(__dirname, '../data/companies.json'), 'utf8')
  const companies = JSON.parse(raw)

  console.log(`Seeding ${companies.length} companies...`)

  for (const c of companies) {
    const meta = TICKERS[c.name] || {}
    const isPrivate = PRIVATE.includes(c.name)

    const row = {
      legacy_id: c.id,
      legal_name: c.name,
      display_name: c.name,
      ticker: meta.ticker || null,
      cik: meta.cik || null,
      exchange: meta.exchange || null,
      sector: c.categories?.[0] || 'Technology',
      industry: c.industry,
      country: c.country || 'USA',
      company_type: isPrivate ? 'private' : (c.type || 'public'),
      description: c.summary,
      keywords: c.keywords || [],
      categories: c.categories || [],
      score_breakdown: c.score_breakdown || {},
      risks: c.risks || [],
      evidence: c.evidence || [],
      slug: slugify(c.name),
      has_ticker: !!meta.ticker,
    }

    const { error } = await supabase
      .from('companies')
      .upsert(row, { onConflict: 'slug' })

    if (error) {
      console.error(`Error seeding ${c.name}:`, error.message)
    } else {
      console.log(`✓ ${c.name} (${meta.ticker || 'private'})`)
    }
  }

  console.log('\nDone! Companies seeded to Supabase.')
}

seed().catch(console.error)
