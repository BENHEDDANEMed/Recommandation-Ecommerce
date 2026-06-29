import { useState } from 'react'
import { Search, Loader, Zap, Star, Tag, MousePointerClick, Activity, Send, Eye, ShoppingCart, CreditCard } from 'lucide-react'
import { getInitials } from '../data/mockData'
import { fetchRecommendations, simulateProductClick, simulateRandomEvent } from '../services/api'
import { useToast } from '../hooks/useToast'
import { useWebSocket } from '../hooks/useWebSocket'
import { EVENT_COLORS } from '../data/mockData'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getProductImage } from '../utils/imageMapping'

export default function SimulationVisualisation() {
  // Simulator State
  const [visitorId, setVisitorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [simulatingId, setSimulatingId] = useState(null)
  const [recs, setRecs] = useState([])
  
  // Shared State
  const [eventType, setEventType] = useState('view')
  
  // Realtime State
  const [simulating, setSimulating] = useState(false)
  
  // Hooks
  const { addToast } = useToast()
  const { events, chartData, pieData, status, addLocalEvent } = useWebSocket()

  // Simulator Handlers
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!visitorId.trim()) return

    setLoading(true)
    try {
      const data = await fetchRecommendations(visitorId)
      if (!data || data.length === 0) {
        addToast("Aucune recommandation trouvée pour ce visiteur.", "warning")
        setRecs([])
      } else {
        addToast(`Recommandations calculées pour le visiteur ${visitorId}`, "success")
        setRecs(data)
      }
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSimulateClick = async (itemId, type = eventType) => {
    setSimulatingId(itemId)
    try {
      if (status !== 'connected') {
        // Backend offline -> inject immediately
        await new Promise(r => setTimeout(r, 200)) // small fake delay
        addLocalEvent({
          visitorid: Number(visitorId) || Math.floor(Math.random() * 1_000_000),
          itemid: itemId,
          event: type,
          timestamp: Date.now(),
          is_simulated: true
        })
        addToast(`Action '${type}' simulée sur le produit #${itemId} (Mode Démo)`, "success")
      } else {
        // Backend online
        await simulateProductClick(visitorId, itemId, type, true)
        addToast(`Action '${type}' simulée sur le produit #${itemId}`, "success")
      }
    } catch (err) {
      addToast(`Erreur simulation Kafka: ${err.message}`, "error")
    } finally {
      setSimulatingId(null)
    }
  }

  // Realtime Handlers
  const handleSimulateRandom = async () => {
    setSimulating(true)
    try {
      if (status !== 'connected') {
        // Backend offline -> inject immediately without waiting for fetch
        await new Promise(r => setTimeout(r, 100)) // small fake delay
        addLocalEvent({
          visitorid: Math.floor(Math.random() * 1_000_000),
          itemid: Math.floor(Math.random() * 235_000),
          event: eventType,
          timestamp: Date.now(),
          is_simulated: true
        })
        addToast(`Événement aléatoire simulé : ${eventType} (Mode Démo) !`, "info")
      } else {
        // Backend online -> send to real API
        await simulateRandomEvent(eventType)
        addToast(`Événement aléatoire simulé : ${eventType} !`, "info")
      }
    } catch (e) {
      addToast("Erreur lors de la simulation", "error")
    } finally {
      setSimulating(false)
    }
  }

  return (
    <div className="space-y-8 animate-fadeUp">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Simulator Search (Left) */}
        <div className="glass p-6 rounded-3xl flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Simulateur B2C</h2>
              <p className="text-slate-400 text-xs">Testez l'algorithme de recommandation</p>
            </div>
          </div>
          <form onSubmit={handleSearch} className="w-full relative flex items-center">
            <input
              type="text"
              placeholder="ID Visiteur (ex: 10425)"
              value={visitorId}
              onChange={(e) => setVisitorId(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl py-3 pl-4 pr-32 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !visitorId.trim()}
              className="absolute right-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
              Prédire
            </button>
          </form>
        </div>

        {/* Action Type Selector & Random Sim (Right) */}
        <div className="glass p-6 rounded-3xl flex-1 flex flex-col justify-center border border-blue-500/20 bg-blue-900/10">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <MousePointerClick size={16} className="text-blue-400" />
            Sélecteur d'Action
          </h3>
          <div className="flex gap-2 mb-4">
            {['view', 'addtocart', 'transaction'].map(type => (
              <button
                key={type}
                onClick={() => setEventType(type)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                  eventType === type 
                    ? type === 'view' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                    : type === 'addtocart' ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {type === 'view' ? 'VUE' : type === 'addtocart' ? 'PANIER' : 'ACHAT'}
              </button>
            ))}
          </div>
          <button 
            onClick={handleSimulateRandom}
            disabled={simulating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg font-medium transition-colors border border-slate-600 disabled:opacity-50"
          >
            <Send size={16} className={simulating ? "animate-pulse" : ""} />
            Simuler un événement aléatoire ({eventType.toUpperCase()})
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Realtime Graph Area (Left Side - 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-5 rounded-2xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className={status === 'connected' ? 'text-emerald-400' : 'text-slate-500'} />
                Volume d'actions (Live Kafka)
              </h3>
            </div>
            
            <div className="h-[350px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorView" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="view" name="Vues" stroke="#3b82f6" fillOpacity={1} fill="url(#colorView)" />
                    <Area type="monotone" dataKey="addtocart" name="Ajouts Panier" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="transaction" name="Achats" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full border border-dashed border-slate-700 rounded-xl text-slate-500 text-sm">
                  En attente d'événements Kafka...
                </div>
              )}
            </div>
          </div>

          {/* Recommendations Results (Bottom of graph) */}
          {recs.length > 0 && (
            <div className="animate-slideIn">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-white">Résultats pour #{visitorId}</h3>
                <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  {recs.length} produits
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recs.slice(0, 9).map((item, idx) => (
                  <div key={idx} className="group glass p-4 rounded-2xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 border border-white/5 relative flex-shrink-0">
                        <img 
                          src={getProductImage(item.category, item.itemid)} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-500 font-mono uppercase truncate">{item.category}</p>
                        <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{item.name}</h4>
                        <div className="flex justify-between items-end mt-1">
                          <p className="text-blue-400 font-bold text-sm">{item.price} <span className="text-[10px]">MAD</span></p>
                          <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold">
                            <Star size={10} fill="currentColor" /> {item.score?.toFixed(2) || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 3 Action Buttons */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {/* Vue */}
                      <button 
                        onClick={() => handleSimulateClick(item.itemid, 'view')}
                        disabled={simulatingId === item.itemid}
                        title="Simuler une Vue"
                        className="py-1.5 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {simulatingId === item.itemid ? <Loader size={14} className="animate-spin" /> : <Eye size={14} />}
                      </button>
                      
                      {/* Panier */}
                      <button 
                        onClick={() => handleSimulateClick(item.itemid, 'addtocart')}
                        disabled={simulatingId === item.itemid}
                        title="Simuler un Ajout au Panier"
                        className="py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {simulatingId === item.itemid ? <Loader size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                      </button>
                      
                      {/* Achat */}
                      <button 
                        onClick={() => handleSimulateClick(item.itemid, 'transaction')}
                        disabled={simulatingId === item.itemid}
                        title="Simuler un Achat"
                        className="py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {simulatingId === item.itemid ? <Loader size={14} className="animate-spin" /> : <CreditCard size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side (Pie Chart & Ticker) */}
        <div className="space-y-6">
          <div className="glass p-5 rounded-2xl">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Répartition Globale</h3>
            <div className="h-[180px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">Aucune donnée</div>
              )}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>

          {/* Ticker Live */}
          <div className="glass p-5 rounded-2xl flex flex-col h-[300px]">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Derniers Événements</h3>
            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 pointer-events-none z-10" />
              <div className="space-y-2 h-full overflow-y-auto pr-2 custom-scrollbar">
                {events.slice(0, 20).map(ev => {
                  const ui = EVENT_COLORS[ev.event] || EVENT_COLORS.view
                  return (
                    <div key={ev._id} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0 animate-slideIn">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ui.dot }} />
                        <span className="text-xs font-medium" style={{ color: ui.text }}>{ui.label}</span>
                      </div>
                      <span className="text-xs text-slate-400">Item #{ev.itemid}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        User {String(ev.visitorid).substring(0,5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
