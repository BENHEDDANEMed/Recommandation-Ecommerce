import { useState, useCallback } from 'react'
import { createContext, useContext } from 'react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => onRemove(toast.id)}
          className={`
            animate-fadeUp pointer-events-auto
            flex items-center gap-3 px-4 py-3 rounded-xl
            shadow-2xl cursor-pointer select-none
            backdrop-blur-md border text-sm font-medium
            transition-all duration-200
            ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' : ''}
            ${toast.type === 'error'   ? 'bg-red-950/80 border-red-500/30 text-red-300' : ''}
            ${toast.type === 'warning' ? 'bg-amber-950/80 border-amber-500/30 text-amber-300' : ''}
            ${toast.type === 'info'    ? 'bg-slate-800/80 border-slate-600/30 text-slate-300' : ''}
          `}
        >
          <span className="text-base leading-none">
            {toast.type === 'success' ? '✓' :
             toast.type === 'error'   ? '✗' :
             toast.type === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
