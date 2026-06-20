// lib/pestel.js
// Build PESTEL signals from available data sources

import { supabaseAdmin } from './supabase.js'

/**
 * Get or build PESTEL signals for a company
 * MVP 1 covers P, E, L only
 */
export async function getPestelSignals(companyId, companyName, ticker) {
  // Check cache in Supabase (< 24h)
  const { data: cached } = await supabaseAdmin
    .from('pestel_signals')
    .select('*')
    .eq('company_id', companyId)
    .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: false })

  if (cached?.length > 0) return cached

  // Build signals from available data
  const signals = buildStaticSignals(companyName, ticker)

  // Store in Supabase
  if (signals.length > 0) {
    await supabaseAdmin.from('pestel_signals').insert(
      signals.map(s => ({ ...s, company_id: companyId }))
    )
  }

  return signals
}

/**
 * Build static PESTEL signals based on company metadata
 * In MVP 1 these are derived from known data until live API integration
 */
function buildStaticSignals(companyName, ticker) {
  const signals = []
  const now = new Date().toISOString()

  // Political signals — based on contract presence and sector
  signals.push({
    category: 'P',
    signal_type: 'opportunity',
    description: `${companyName} operates in sectors receiving significant US federal investment. Monitor SAM.gov and USASpending for contract activity.`,
    source_name: 'USASpending.gov',
    source_url: `https://www.usaspending.gov/search/?hash=...`,
    confidence_level: 'A',
    impact_score: 65,
    timestamp: now,
  })

  // Economic signals — based on SEC filings
  if (ticker) {
    signals.push({
      category: 'E',
      signal_type: 'opportunity',
      description: `${companyName} (${ticker}) financial data available via SEC EDGAR. Revenue trends, margins and cash flow tracked from quarterly filings.`,
      source_name: 'SEC EDGAR',
      source_url: `https://data.sec.gov/submissions/`,
      confidence_level: 'A',
      impact_score: 70,
      timestamp: now,
    })
  }

  // Legal signals — general compliance
  signals.push({
    category: 'L',
    signal_type: 'risk',
    description: `Monitor SEC enforcement actions, FTC investigations, and DOJ proceedings relevant to ${companyName}'s sector.`,
    source_name: 'SEC / DOJ / FTC',
    source_url: 'https://www.sec.gov/litigation/litreleases.htm',
    confidence_level: 'B',
    impact_score: 45,
    timestamp: now,
  })

  // Social placeholder
  signals.push({
    category: 'S',
    signal_type: 'opportunity',
    description: `Social signal monitoring for ${companyName} via Reddit and public forums. Data marked speculative until verified.`,
    source_name: 'Reddit / Social',
    source_url: `https://reddit.com/search/?q=${encodeURIComponent(companyName)}`,
    confidence_level: 'D',
    impact_score: 40,
    timestamp: now,
  })

  return signals
}

/**
 * Compute PESTEL scores per category (0-100)
 */
export function computePestelScores(signals) {
  const categories = ['P', 'E', 'S', 'T', 'En', 'L']
  const scores = {}

  for (const cat of categories) {
    const catSignals = signals.filter(s => s.category === cat)
    if (!catSignals.length) {
      scores[cat] = { score: 0, signals: [], status: 'No data' }
      continue
    }
    const avgImpact = catSignals.reduce((a, s) => a + (s.impact_score || 50), 0) / catSignals.length
    scores[cat] = {
      score: Math.round(avgImpact),
      signals: catSignals.slice(0, 3),
      status: avgImpact >= 70 ? 'High exposure' : avgImpact >= 45 ? 'Moderate' : 'Low exposure',
    }
  }

  return scores
}

export const PESTEL_LABELS = {
  P: { label: 'Political', icon: '🏛️', color: '#7b61ff' },
  E: { label: 'Economic', icon: '📊', color: '#00d4ff' },
  S: { label: 'Social', icon: '👥', color: '#00ff94' },
  T: { label: 'Technological', icon: '⚙️', color: '#ffd60a' },
  En: { label: 'Environmental', icon: '🌿', color: '#00ff94' },
  L: { label: 'Legal', icon: '⚖️', color: '#ff6b35' },
}
