import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useWebSocket } from '../../hooks/useWebSocket'

const ROUTE_TITLES = {
  '/': 'Vue Générale',
  '/simulation': 'Simulation & Live Kafka',
  '/mlops': 'Paramètres Modèle ALS',
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const { status, events } = useWebSocket() // Global WS connection

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0f172a] text-slate-200 font-sans flex">
      {/* Sidebar: Fixed width, non-scrolling */}
      <Sidebar wsStatus={status} />

      {/* Main Content Area: Flex-1 takes remaining space */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar: Spans full width of the main content column */}
        <Topbar 
          pageTitle={pathname === '/' ? 'Vue d\'ensemble' : pathname.replace('/', '').toUpperCase()} 
          wsStatus={status}
          eventCount={events.length}
        />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <WSContext.Provider value={{ status, events }}>
              <Outlet />
            </WSContext.Provider>
          </div>
        </main>
      </div>
    </div>
  )
}

import { createContext, useContext } from 'react'
const WSContext = createContext({ status: 'disconnected', events: [] })
export const useGlobalWS = () => useContext(WSContext)
