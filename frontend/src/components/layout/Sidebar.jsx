import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Radio, BrainCircuit, ShoppingBag, ChevronRight,
  Cpu, Zap,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Tableau de bord',  badge: null },
  { to: '/simulation', icon: Radio,            label: 'Simulation & Live', badge: 'LIVE' },
  { to: '/mlops',      icon: BrainCircuit,     label: 'Modèle ML',         badge: null },
  { to: '/store',      icon: ShoppingBag,      label: 'Boutique (Client)', badge: 'NEW' },
]

export default function Sidebar({ wsStatus }) {
  return (
    <aside className="
      w-64 h-full shrink-0 flex flex-col z-40
      glass-dark border-r border-white/5
    ">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="
          flex items-center justify-center w-9 h-9 rounded-xl
          bg-gradient-to-br from-blue-500 to-violet-600
          shadow-lg shadow-blue-500/25
        ">
          <Cpu size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">RetailRocket</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold px-3 mb-2">Navigation</p>
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400">
                    {badge}
                  </span>
                )}
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold px-3 mb-2">Statut</p>
          <div className="px-3">
            <div className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
              ${wsStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}
            `}>
              <Zap size={18} className={wsStatus === 'connected' ? 'animate-pulse' : ''} />
              <span className="font-medium">
                {wsStatus === 'connected' ? 'Système Opérationnel' : 'Mode Démo (Local)'}
              </span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  )
}