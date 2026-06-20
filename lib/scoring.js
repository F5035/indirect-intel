// lib/scoring.js
// Compute all scores per spec

export const SCORE_WEIGHTS = {
  evidence_quality: 0.30,
  financial_health: 0.15,
  momentum: 0.15,
  market_growth: 0.15,
  valuation: 0.15,
  risk: 0.10,
}

/**
 * Compute exposure score from score_breakdown
 */
export function computeExposureScore(company) {
  const b = company.score_breakdown || {}
  return Math.min(Math.round(Object.values(b).reduce((a, v) => a + (v || 0), 0)), 100)
}

/**
 * Compute contract momentum score (0-100)
 * Based on number and size of recent contracts
 */
export function computeContractMomentum(contracts = []) {
  if (!contracts.length) return 0

  const totalAmount = contracts.reduce((a, c) => a + (c.amount || 0), 0)
  const count = contracts.length

  // Score components
  const countScore = Math.min(count * 5, 40)       // up to 40 pts for volume
  const amountScore = Math.min(totalAmount / 1e8, 40) // up to 40 pts for $100M+
  const agencyScore = new Set(contracts.map(c => c.buyer_agency)).size * 5 // 5 pts per unique agency, up to 20

  return Math.min(Math.round(countScore + amountScore + agencyScore), 100)
}

/**
 * Compute PESTEL risk score (0-100, higher = more risk/exposure)
 */
export function computePestelScore(signals = []) {
  if (!signals.length) return 50 // neutral default

  const byCategory = {}
  for (const s of signals) {
    if (!byCategory[s.category]) byCategory[s.category] = []
    byCategory[s.category].push(s.impact_score || 50)
  }

  const categoryScores = Object.values(byCategory).map(scores =>
    scores.reduce((a, b) => a + b, 0) / scores.length
  )

  return Math.round(categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length)
}

/**
 * Compute hidden winner score (0-100)
 * Higher = more likely to be an undervalued indirect beneficiary
 */
export function computeHiddenWinnerScore(company, contracts = [], relationships = []) {
  const exposure = computeExposureScore(company)
  const contractMomentum = computeContractMomentum(contracts)
  const relationshipDepth = Math.min(relationships.length * 10, 30)
  const isObvious = ['NVIDIA', 'AMD', 'TSMC', 'Microsoft', 'Apple', 'Google'].includes(company.display_name)
  const obscurityBonus = isObvious ? 0 : 20

  return Math.min(Math.round(
    exposure * 0.3 +
    contractMomentum * 0.3 +
    relationshipDepth +
    obscurityBonus
  ), 100)
}

/**
 * Classify confidence level badge
 */
export function confidenceBadge(level) {
  const badges = {
    'A': { label: 'Verified Official', color: '#00ff94', bg: '#001f0f', icon: '🟢' },
    'B': { label: 'Confirmed', color: '#ffd60a', bg: '#1f1500', icon: '🟡' },
    'C': { label: 'Weak Signal', color: '#ff8c00', bg: '#1f0a00', icon: '🟠' },
    'D': { label: 'Speculative', color: '#ff4444', bg: '#1f0000', icon: '🔴' },
  }
  return badges[level] || badges['C']
}
