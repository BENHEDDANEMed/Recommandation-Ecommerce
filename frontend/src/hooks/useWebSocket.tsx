import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react'

const WS_URL = 'ws://127.0.0.1:8000/api/v1/ws/events'
const MAX_EVENTS = 300

const WSContext = createContext(null)

export function WSProvider({ children }) {
  const [events, setEvents]   = useState([])
  const [status, setStatus]   = useState('connecting') 
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    setStatus('connecting')

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen  = () => setStatus('connected')
    ws.onclose = () => {
      setStatus('disconnected')
      reconnectRef.current = setTimeout(connect, 3000)
    }
    ws.onerror = () => setStatus('error')

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        setEvents(prev => {
          const next = [{ ...data, _id: Date.now() + Math.random() }, ...prev]
          return next.slice(0, MAX_EVENTS)
        })
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const clearEvents = useCallback(() => setEvents([]), [])

  const addLocalEvent = useCallback((data) => {
    setEvents(prev => {
      const next = [{ ...data, _id: Date.now() + Math.random() }, ...prev]
      return next.slice(0, MAX_EVENTS)
    })
  }, [])

  // ── Derived data ──────────────────────────────────────────────
  const chartData = useMemo(() => {
    const groups = {}
    const sorted = [...events].reverse()
    sorted.forEach(ev => {
      const bin = Math.floor(ev.timestamp / 5000) * 5000
      if (!groups[bin]) {
        const d = new Date(bin)
        groups[bin] = {
          timeStr: `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`,
          view: 0, addtocart: 0, transaction: 0, total: 0,
        }
      }
      groups[bin][ev.event] = (groups[bin][ev.event] || 0) + 1
      groups[bin].total++
    })
    return Object.values(groups).slice(-20)
  }, [events])

  const realEvents = useMemo(() => events.filter(e => !e.is_simulated), [events])

  const realChartData = useMemo(() => {
    const groups = {}
    const sorted = [...realEvents].reverse()
    sorted.forEach(ev => {
      const bin = Math.floor(ev.timestamp / 5000) * 5000
      if (!groups[bin]) {
        const d = new Date(bin)
        groups[bin] = {
          timeStr: `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`,
          view: 0, addtocart: 0, transaction: 0, total: 0,
        }
      }
      groups[bin][ev.event] = (groups[bin][ev.event] || 0) + 1
      groups[bin].total++
    })
    return Object.values(groups).slice(-20)
  }, [realEvents])

  const pieData = useMemo(() => {
    const counts = { view: 0, addtocart: 0, transaction: 0 }
    events.forEach(ev => { if (counts[ev.event] !== undefined) counts[ev.event]++ })
    return [
      { name: 'Vues',    value: counts.view,        color: '#3b82f6' },
      { name: 'Paniers', value: counts.addtocart,   color: '#f59e0b' },
      { name: 'Achats',  value: counts.transaction, color: '#10b981' },
    ].filter(d => d.value > 0)
  }, [events])

  const topItems = useMemo(() => {
    const freq = {}
    events.forEach(ev => {
      freq[ev.itemid] = (freq[ev.itemid] || 0) + 1
    })
    return Object.entries(freq)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 6)
      .map(([itemid, count]) => ({ itemid: Number(itemid), count }))
  }, [events])

  const value = { events, realEvents, status, chartData, realChartData, pieData, topItems, clearEvents, addLocalEvent }

  return <WSContext.Provider value={value}>{children}</WSContext.Provider>
}

export function useWebSocket() {
  const context = useContext(WSContext)
  if (!context) throw new Error('useWebSocket must be used within WSProvider')
  return context
}
