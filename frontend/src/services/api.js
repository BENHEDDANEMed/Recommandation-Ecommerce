// ── API service layer — all backend calls centralized here ──────────────────

const BASE_URL = 'http://127.0.0.1:8000'

/** Fetch recommendations for a given visitor ID */
export async function fetchRecommendations(visitorId) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/recommend/${visitorId}`)
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    const data = await res.json()
    return data.recommendations || []
  } catch (err) {
    console.warn("Backend injoignable pour les recommandations.")
    return []
  }
}

export async function fetchIngestionMetrics() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/metrics`)
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    const data = await res.json()
    return data
  } catch (err) {
    console.warn("Impossible de récupérer les métriques d'ingestion. Mode Démo actif.")
    return {
      total_events: 1250340,
      total_products: 417053,
      avg_latency_ms: 12.4
    }
  }
}

/** Fetch top users by transactions */
export async function fetchTopUsers() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/stats/top-users`)
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    const data = await res.json()
    return data.top_users || []
  } catch (err) {
    console.warn("Impossible de récupérer le top users.")
    return []
  }
}

/** Fetch abandoned products */
export async function fetchAbandonedProducts() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/stats/abandoned-products`)
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    const data = await res.json()
    return data.abandoned_products || []
  } catch (err) {
    console.error("fetchAbandonedProducts error:", err)
    return []
  }
}

export async function fetchTransactionsHistory() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/stats/transactions-30-days`)
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    const data = await res.json()
    return data.history || []
  } catch (err) {
    console.error("fetchTransactionsHistory error:", err)
    return []
  }
}

/** Fetch all products (paginated) */
export async function fetchProducts(page = 1, limit = 20) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/products?page=${page}&per_page=${limit}`)
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn("Backend injoignable pour les produits.")
    return { items: [], total_pages: 1 }
  }
}

/** Search products */
export async function searchProducts(query) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/products/search/query?q=${encodeURIComponent(query)}&per_page=30`)
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn("Backend injoignable pour la recherche.")
    return { results: [] }
  }
}

/** Fetch single product details */
export async function fetchProductDetails(itemId) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/products/${itemId}`)
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn("Backend injoignable pour le produit " + itemId)
    return null
  }
}

/** Fetch product categories */
export async function fetchCategories() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/products/meta/categories`)
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    const data = await res.json()
    return data.categories || []
  } catch (err) {
    console.warn("Backend injoignable pour les catégories.")
    return []
  }
}

/** Simulate a click event on a product → injects into Kafka */
export async function simulateProductClick(visitorId, itemId, eventType = 'view', isSimulated = false) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorid: Number(visitorId) || Math.floor(Math.random() * 1_000_000),
        itemid:    Number(itemId),
        event:     eventType,
        timestamp: Date.now(),
        is_simulated: isSimulated,
      }),
    })
    if (!res.ok) throw new Error(`Simulation échouée`)
    return res.json()
  } catch (err) {
    console.warn("Backend injoignable. Simulation interceptée en Mode Démo.")
    return { status: "success", mock: true }
  }
}

/** Trigger a model re-training batch job */
export async function triggerBatchTraining(params) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admin/trigger-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) throw new Error(`Entraînement échoué`)
    return res.json()
  } catch (err) {
    console.warn("Backend injoignable. Faux entraînement en Mode Démo.")
    return new Promise(resolve => setTimeout(() => resolve({ status: "success", mock: true }), 1500))
  }
}

/** Simulate a random user event (for the realtime section) */
export async function simulateRandomEvent(eventType = null) {
  const types = ['view', 'view', 'view', 'addtocart', 'transaction']
  const finalEvent = eventType || types[Math.floor(Math.random() * types.length)]
  return simulateProductClick(
    Math.floor(Math.random() * 1_400_000),
    Math.floor(Math.random() * 235_000),
    finalEvent,
    true
  )
}
