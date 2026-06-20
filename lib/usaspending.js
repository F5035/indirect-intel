// lib/usaspending.js
// USASpending.gov API — free, no key required
// Docs: https://api.usaspending.gov

const BASE = 'https://api.usaspending.gov/api/v2'
const TIMEOUT = 8000

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (e) {
    clearTimeout(id)
    throw e
  }
}

/**
 * Search federal awards (contracts) for a company name
 * Returns normalized contract objects
 */
export async function searchContracts(companyName, { limit = 20, page = 1 } = {}) {
  try {
    const body = {
      filters: {
        award_type_codes: ['A', 'B', 'C', 'D'], // contracts only
        recipient_search_text: [companyName],
        time_period: [{ start_date: '2022-01-01', end_date: new Date().toISOString().split('T')[0] }],
      },
      fields: [
        'Award ID', 'Recipient Name', 'Award Amount', 'Awarding Agency',
        'Awarding Sub Agency', 'Award Type', 'Start Date', 'End Date',
        'Award Date', 'Description', 'Place of Performance State Code',
        'NAICS Code', 'NAICS Description', 'PSC Code', 'PSC Description',
        'Contract Award Type',
      ],
      page,
      limit,
      sort: 'Award Amount',
      order: 'desc',
    }

    const res = await fetchWithTimeout(`${BASE}/search/spending_by_award/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) return { contracts: [], total: 0, error: `USASpending ${res.status}` }

    const data = await res.json()
    const results = data.results || []

    const contracts = results.map(r => ({
      id: r['Award ID'] || crypto.randomUUID(),
      source: 'usaspending',
      title: r['Description'] || `Contract ${r['Award ID']}`,
      description: r['NAICS Description'] || r['PSC Description'] || '',
      buyer_agency: r['Awarding Agency'] || r['Awarding Sub Agency'] || 'Unknown Agency',
      awardee: r['Recipient Name'] || companyName,
      amount: parseFloat(r['Award Amount']) || 0,
      currency: 'USD',
      award_date: r['Award Date'] || r['Start Date'] || null,
      start_date: r['Start Date'] || null,
      end_date: r['End Date'] || null,
      naics: r['NAICS Code'] || null,
      psc: r['PSC Code'] || null,
      place_of_performance: r['Place of Performance State Code'] || 'USA',
      contract_type: 'prime',
      contract_number: r['Award ID'] || null,
      source_url: r['Award ID']
        ? `https://www.usaspending.gov/award/${encodeURIComponent(r['Award ID'])}`
        : 'https://www.usaspending.gov',
      confidence_level: 'A',
      pestel_category: ['P', 'E'],
    }))

    return { contracts, total: data.page_metadata?.total || contracts.length, error: null }
  } catch (e) {
    if (e.name === 'AbortError') return { contracts: [], total: 0, error: 'timeout' }
    return { contracts: [], total: 0, error: e.message }
  }
}

/**
 * Get agency breakdown for a company (which agencies buy from them)
 */
export async function getAgencyBreakdown(companyName) {
  try {
    const body = {
      filters: {
        award_type_codes: ['A', 'B', 'C', 'D'],
        recipient_search_text: [companyName],
        time_period: [{ start_date: '2022-01-01', end_date: new Date().toISOString().split('T')[0] }],
      },
      category: 'awarding_agency',
      limit: 10,
    }

    const res = await fetchWithTimeout(`${BASE}/search/spending_by_category/awarding_agency/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) return []

    const data = await res.json()
    return (data.results || []).map(r => ({
      agency: r.name,
      amount: r.amount,
      count: r.transaction_count,
    }))
  } catch {
    return []
  }
}
