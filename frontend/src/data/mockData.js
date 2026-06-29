// ── Mock Data for testing without live API ────────────────────────────────────

export const MOCK_RECOMMENDATIONS = [
  { itemid: 244812, name: 'Casque Audio Sony WH-1000XM5', category: 'Électronique', price: 279.99, score: 1.82 },
  { itemid: 103456, name: 'Tablette Samsung Galaxy Tab S9', category: 'Informatique', price: 649.00, score: 1.71 },
  { itemid: 387201, name: 'Montre Connectée Apple Watch SE', category: 'Accessoires', price: 249.00, score: 1.65 },
  { itemid: 512034, name: 'Chargeur USB-C 65W Anker PowerPort', category: 'Électronique', price: 34.99, score: 1.58 },
  { itemid: 198432, name: 'Écouteurs Bose QuietComfort Buds', category: 'Audio', price: 179.00, score: 1.51 },
  { itemid: 654321, name: 'Clavier Mécanique Logitech MX Keys', category: 'Informatique', price: 109.99, score: 1.44 },
  { itemid: 321654, name: 'SSD Samsung 970 EVO Plus 1To', category: 'Stockage', price: 89.90, score: 1.38 },
  { itemid: 789012, name: 'Lampe de Bureau LED Philips Hue', category: 'Maison', price: 59.99, score: 1.29 },
  { itemid: 456789, name: 'Station de Recharge MagSafe', category: 'Accessoires', price: 44.90, score: 1.22 },
  { itemid: 123987, name: 'Souris Ergonomique Logitech MX Master 3', category: 'Informatique', price: 99.99, score: 1.15 },
]

export const MOCK_MODEL_HISTORY = [
  { id: 1, date: '2026-06-17 23:41', rank: 50, maxIter: 20, regParam: 0.01, rmse: 2.07, status: 'success' },
  { id: 2, date: '2026-06-16 18:22', rank: 15, maxIter: 10, regParam: 0.01, rmse: 2.5825, status: 'success' },
  { id: 3, date: '2026-06-15 10:05', rank: 10, maxIter: 10, regParam: 0.1,  rmse: 2.5912, status: 'success' },
]

export const MOCK_TOP_TRENDING = [
  { itemid: 244812, name: 'Sony WH-1000XM5', category: 'Électronique', views: 147, trend: '+23%' },
  { itemid: 103456, name: 'Samsung Galaxy Tab S9', category: 'Informatique', views: 98, trend: '+15%' },
  { itemid: 387201, name: 'Apple Watch SE', category: 'Accessoires', views: 85, trend: '+11%' },
  { itemid: 512034, name: 'Anker PowerPort 65W', category: 'Électronique', views: 73, trend: '+8%' },
  { itemid: 198432, name: 'Bose QC Buds', category: 'Audio', views: 62, trend: '+5%' },
  { itemid: 654321, name: 'Logitech MX Keys', category: 'Informatique', views: 55, trend: '+3%' },
]

export const GRADIENTS = [
  'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #3b0764 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
  'linear-gradient(135deg, #1e1b4b 0%, #6366f1 100%)',
  'linear-gradient(135deg, #831843 0%, #ec4899 100%)',
  'linear-gradient(135deg, #134e4a 0%, #14b8a6 100%)',
  'linear-gradient(135deg, #422006 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #1c1917 0%, #78716c 100%)',
  'linear-gradient(135deg, #0c4a6e 0%, #38bdf8 100%)',
]

export const getGradient = (seed) => {
  const idx = seed ? String(seed).charCodeAt(0) % GRADIENTS.length : 0
  return GRADIENTS[idx]
}

export const getInitials = (name) => {
  if (!name) return 'PR'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

export const EVENT_COLORS = {
  view:        { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', label: 'Vue',    dot: '#3b82f6' },
  addtocart:   { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', label: 'Panier', dot: '#f59e0b' },
  transaction: { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', label: 'Achat',  dot: '#10b981' },
}
