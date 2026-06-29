import { Bell, Activity } from 'lucide-react'

export default function Topbar({ pageTitle, wsStatus, eventCount = 0 }) {
  return (
    <header className="
      h-16 shrink-0 z-30
      glass-dark border-b border-white/5
      flex items-center justify-between px-8
    ">
      {/* Page title */}
      <div>
        <h1 className="text-sm font-semibold text-white">{pageTitle}</h1>
        <p className="text-[10px] text-slate-500">EMSI · Système de Recommandation E-commerce</p>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Event counter */}
        {eventCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Activity size={12} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-400 tabular-nums">
              {eventCount.toLocaleString('fr-FR')} events
            </span>
          </div>
        )}

        {/* WS pill */}
        <div className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
          border transition-colors duration-300
          ${wsStatus === 'connected'
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/25 text-amber-400'}
        `}>
          <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          {wsStatus === 'connected' ? 'Kafka LIVE' : 'MODE DÉMO'}
        </div>

        {/* Notification bell (decorative) */}
        <button className="
          relative p-2 rounded-xl text-slate-500
          hover:text-slate-300 hover:bg-white/5
          transition-colors duration-200
        ">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
        </button>
      </div>
    </header>
  )
}