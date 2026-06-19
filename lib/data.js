import companies from '../data/companies.json'

export const COMPANIES = companies

export const SCORE_WEIGHTS = {
  evidence_quality: 0.30,
  financial_health: 0.15,
  momentum: 0.15,
  market_growth: 0.15,
  valuation: 0.15,
  risk: 0.10,
}

export function computeScore(company) {
  const b = company.score_breakdown || {}
  return Math.min(Object.values(b).reduce((a, v) => a + v, 0), 100)
}

export function checkEvidence(company) {
  const ev = company.evidence || []
  return ev.length > 0 && ev.some(e => e.url && e.description)
}

export function searchCompanies(query) {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const results = []
  for (const company of COMPANIES) {
    const keywords = company.keywords || []
    const match =
      q.includes(company.name.toLowerCase()) ||
      company.name.toLowerCase().includes(q) ||
      keywords.some(kw => q.includes(kw) || kw.includes(q)) ||
      company.industry.toLowerCase().includes(q) ||
      company.summary.toLowerCase().includes(q)
    if (match) {
      results.push({ ...company, exposure_score: computeScore(company) })
    }
  }
  results.sort((a, b) => b.exposure_score - a.exposure_score)
  return results
}

export function buildValueChainMap(companies) {
  const map = {}
  for (const c of companies) {
    for (const cat of c.categories || []) {
      if (!map[cat]) map[cat] = []
      if (!map[cat].includes(c.name)) map[cat].push(c.name)
    }
  }
  return { categories: Object.entries(map).map(([name, companies]) => ({ name, companies })) }
}
