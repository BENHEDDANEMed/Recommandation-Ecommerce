import { useState, useEffect, useRef } from 'react'
import { Server, Database, Activity, Code2, TrendingUp, AlertTriangle, Users } from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'
import { fetchIngestionMetrics, fetchTopUsers, fetchAbandonedProducts, fetchTransactionsHistory } from '../services/api'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { getProductImage } from '../utils/imageMapping'

export default function DashboardOverview() {
  const { realEvents: events, realChartData: chartData } = useWebSocket()
  
  const [metrics, setMetrics] = useState({
    total_events: 0,
    total_products: 0,
    avg_latency_ms: 0
  })
  const [topUsers, setTopUsers] = useState([])
  const [abandoned, setAbandoned] = useState([])
  const [history, setHistory] = useState([])
  
  // États pour "Lire plus"
  const [expandedWhales, setExpandedWhales] = useState(false)
  const [expandedAbandoned, setExpandedAbandoned] = useState(false)

  // Pour l'incrémentation dynamique
  const lastEventId = useRef(null)

  useEffect(() => {
    if (events.length > 0) {
      const topEvent = events[0]
      if (lastEventId.current && topEvent._id !== lastEventId.current) {
         setMetrics(prev => ({ ...prev, total_events: prev.total_events + 1 }))
         
         // Mise à jour dynamique pour les achats (rafraîchissement des stats en BD)
         if (topEvent.event === 'transaction') {
           fetchTransactionsHistory().then(setHistory)
           fetchTopUsers().then(setTopUsers)
         }
      }
      lastEventId.current = topEvent._id
    }
  }, [events])

  useEffect(() => {
    async function loadData() {
      const [m, u, a, h] = await Promise.all([
        fetchIngestionMetrics(),
        fetchTopUsers(),
        fetchAbandonedProducts(),
        fetchTransactionsHistory()
      ])
      setMetrics(m)
      setTopUsers(u)
      setAbandoned(a)
      setHistory(h)
    }
    loadData()
  }, [])

  const stats = [
    { label: "Événements Session", value: events.length.toLocaleString('fr-FR'), icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Produits au Catalogue", value: metrics.total_products.toLocaleString('fr-FR'), icon: Database, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { label: "Événements Historiques", value: metrics.total_events.toLocaleString('fr-FR'), icon: Code2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Latence Moyenne", value: `${metrics.avg_latency_ms}ms`, icon: Server, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  ]

  return (
    <div className="space-y-8 animate-fadeUp">
      
      {/* Hero Welcome */}
      <div className="glass-dark p-8 rounded-3xl relative overflow-hidden border border-blue-500/20">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Activity size={200} className="text-blue-500" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Bienvenue sur le Système de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Recommandation Temps Réel</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-6">
            Cette interface de supervision permet de piloter l'ensemble de l'architecture Big Data : ingestion Kafka, entraînement du modèle ALS sur PySpark, et monitoring des performances de l'API.
          </p>
          <div className="flex gap-4">
            <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg font-mono border border-slate-700">FastAPI</span>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg font-mono border border-slate-700">PySpark</span>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg font-mono border border-slate-700">Kafka</span>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg font-mono border border-slate-700">MongoDB</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className={`glass p-6 rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
              <h3 className="text-slate-400 text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Graphes (Temps Réel & Historique 30 jours) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Temps Réel */}
        <div className="glass p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-blue-400" />
              Trafic Client en Temps Réel
            </h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-xs text-blue-400 font-bold">LIVE</span>
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViewDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="timeStr" stroke="#64748b" fontSize={11} tickMargin={8} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => Math.round(v)} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                    itemStyle={{ fontSize: '13px' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="view" name="Vues" stroke="#3b82f6" fillOpacity={1} fill="url(#colorViewDash)" />
                  <Area type="monotone" dataKey="addtocart" name="Ajouts Panier" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="transaction" name="Achats" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full border border-dashed border-slate-700/50 rounded-xl text-slate-500 text-sm">
                En attente d'événements (Naviguez sur la boutique...)
              </div>
            )}
          </div>
        </div>

        {/* Historique 30 jours */}
        <div className="glass p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Transactions (30 Derniers Jours)</h3>
          </div>
          
          <div className="h-[280px] w-full">
            {history && history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickMargin={8}
                    tickFormatter={(tick) => tick.substring(5)} 
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => Math.round(v)} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                    itemStyle={{ color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '12px' }}
                  />
                  <Bar dataKey="transactions" name="Transactions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full border border-dashed border-slate-700/50 rounded-xl text-slate-500 text-sm">
                Chargement de l'historique...
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Section BI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cluster State */}
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">État Cluster</h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {['API FastAPI', 'Cluster Kafka', 'MongoDB'].map((srv, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Server size={18} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-200">{srv}</span>
                </div>
                <div className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold">En ligne</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users (Whales) */}
        <div className={`glass p-6 rounded-2xl flex flex-col transition-all duration-300 ${expandedWhales ? 'row-span-2' : ''}`}>
          <div className="flex items-center gap-2 mb-6">
            <Users size={20} className="text-blue-400" />
            <h3 className="text-lg font-bold text-white">Top Acheteurs</h3>
          </div>
          <div className={`space-y-4 ${expandedWhales ? 'max-h-96 overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
            {topUsers.slice(0, expandedWhales ? topUsers.length : 5).map((user, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-400 border border-blue-500/20">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Visiteur #{user.visitorid}</p>
                    <p className="text-[10px] text-slate-500">Baleine BI</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                  {user.transactions} achats
                </span>
              </div>
            ))}
            {topUsers.length === 0 && <p className="text-slate-500 text-sm">Chargement...</p>}
          </div>
          
          {topUsers.length > 5 && (
            <button 
              onClick={() => setExpandedWhales(!expandedWhales)}
              className="mt-4 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors self-center py-2 px-4 rounded-full bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20"
            >
              {expandedWhales ? "Réduire" : `Lire plus (+${topUsers.length - 5})`}
            </button>
          )}
        </div>

        {/* Abandoned Products */}
        <div className={`glass p-6 rounded-2xl flex flex-col transition-all duration-300 ${expandedAbandoned ? 'row-span-2' : ''}`}>
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={20} className="text-amber-400" />
            <h3 className="text-lg font-bold text-white">Abandons de Panier</h3>
          </div>
          <div className={`space-y-4 ${expandedAbandoned ? 'max-h-96 overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
            {abandoned.slice(0, expandedAbandoned ? abandoned.length : 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/5 relative flex-shrink-0">
                     <img 
                      src={getProductImage(item.category, item.itemid)} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200 line-clamp-1 max-w-[120px]">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.category}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded text-right flex flex-col items-end flex-shrink-0">
                  {item.views} vues
                  <span className="text-[8px] text-amber-500/70">0 achat</span>
                </span>
              </div>
            ))}
            {abandoned.length === 0 && <p className="text-slate-500 text-sm">Chargement...</p>}
          </div>

          {abandoned.length > 5 && (
            <button 
              onClick={() => setExpandedAbandoned(!expandedAbandoned)}
              className="mt-4 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors self-center py-2 px-4 rounded-full bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20"
            >
              {expandedAbandoned ? "Réduire" : `Lire plus (+${abandoned.length - 5})`}
            </button>
          )}
        </div>

      </div>
      
    </div>
  )
}