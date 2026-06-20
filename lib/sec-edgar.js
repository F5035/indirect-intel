// lib/sec-edgar.js
// SEC EDGAR Data API — free, no key required
// Docs: https://data.sec.gov

const BASE = 'https://data.sec.gov'
const TIMEOUT = 8000

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'SupplyAlpha research@supply-alpha.com',
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    })
    clearTimeout(id)
    return res
  } catch (e) {
    clearTimeout(id)
    throw e
  }
}

/**
 * Get company submissions/filings by CIK
 */
export async function getCompanySubmissions(cik) {
  if (!cik) return null
  const paddedCik = cik.replace(/^0+/, '').padStart(10, '0')
  try {
    const res = await fetchWithTimeout(`${BASE}/submissions/CIK${paddedCik}.json`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Get recent filings for a company (10-K, 10-Q, 8-K)
 */
export async function getRecentFilings(cik, { types = ['10-K', '10-Q', '8-K'], limit = 10 } = {}) {
  const sub = await getCompanySubmissions(cik)
  if (!sub) return []

  const filings = sub.filings?.recent || {}
  const forms = filings.form || []
  const dates = filings.filingDate || []
  const accessions = filings.accessionNumber || []
  const descriptions = filings.primaryDocument || []

  const results = []
  for (let i = 0; i < forms.length && results.length < limit; i++) {
    if (types.includes(forms[i])) {
      const accession = accessions[i]?.replace(/-/g, '') || ''
      results.push({
        form: forms[i],
        date: dates[i],
        accession: accessions[i],
        url: accession
          ? `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, '')}/${accession}/${descriptions[i] || ''}`
          : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${forms[i]}`,
        source: 'SEC EDGAR',
        confidence_level: 'A',
      })
    }
  }

  return results
}

/**
 * Get company financial facts (revenue, income, etc.)
 */
export async function getCompanyFacts(cik) {
  if (!cik) return null
  const paddedCik = cik.replace(/^0+/, '').padStart(10, '0')
  try {
    const res = await fetchWithTimeout(`${BASE}/api/xbrl/companyfacts/CIK${paddedCik}.json`)
    if (!res.ok) return null
    const data = await res.json()

    const usgaap = data.facts?.['us-gaap'] || {}

    // Extract key financial metrics
    function getLatestValue(metric) {
      const m = usgaap[metric]
      if (!m?.units) return null
      const units = Object.values(m.units)[0] || []
      const annual = units.filter(u => u.form === '10-K' && u.filed).sort((a, b) =>
        new Date(b.filed) - new Date(a.filed)
      )
      return annual[0] || null
    }

    return {
      revenue: getLatestValue('Revenues') || getLatestValue('RevenueFromContractWithCustomerExcludingAssessedTax'),
      net_income: getLatestValue('NetIncomeLoss'),
      total_assets: getLatestValue('Assets'),
      total_debt: getLatestValue('LongTermDebt'),
      cash: getLatestValue('CashAndCashEquivalentsAtCarryingValue'),
      employees: getLatestValue('EntityNumberOfEmployees'),
      rd_expense: getLatestValue('ResearchAndDevelopmentExpense'),
      operating_income: getLatestValue('OperatingIncomeLoss'),
    }
  } catch {
    return null
  }
}

/**
 * Look up CIK by ticker symbol
 */
export async function lookupCIK(ticker) {
  try {
    const res = await fetchWithTimeout(`${BASE}/submissions/tickers.json`)
    if (!res.ok) return null
    // This endpoint doesn't exist; use EDGAR search instead
    return null
  } catch {
    return null
  }
}

/**
 * Search EDGAR full-text for company name
 */
export async function searchEdgar(companyName) {
  try {
    const q = encodeURIComponent(companyName)
    const res = await fetchWithTimeout(
      `https://efts.sec.gov/LATEST/search-index?q=%22${q}%22&dateRange=custom&startdt=2023-01-01&forms=8-K,10-K&hits.hits._source=period_of_report,display_names,file_date,form_type`
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.hits?.hits || []).slice(0, 5).map(h => ({
      form: h._source?.form_type,
      date: h._source?.file_date,
      company: h._source?.display_names?.[0]?.name,
      url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(companyName)}&type=10-K&dateb=&owner=include&count=10`,
      source: 'SEC EDGAR',
      confidence_level: 'A',
    }))
  } catch {
    return []
  }
}
