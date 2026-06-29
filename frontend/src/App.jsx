import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './hooks/useToast'
import { WSProvider } from './hooks/useWebSocket'
import { AuthProvider } from './contexts/AuthContext'

import AdminLayout from './components/layout/AdminLayout'
import StorefrontLayout from './components/storefront/StorefrontLayout'
import HomePage from './pages/storefront/HomePage'
import ProductsPage from './pages/storefront/ProductsPage'
import ProductDetailsPage from './pages/storefront/ProductDetailsPage'
import DashboardOverview from './pages/DashboardOverview'
import SimulationVisualisation from './pages/SimulationVisualisation'
import MLOpsPanel from './pages/MLOpsPanel'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <WSProvider>
            <Routes>
              {/* ADMIN DASHBOARD ROUTES */}
              <Route path="/" element={<AdminLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="simulation" element={<SimulationVisualisation />} />
              <Route path="mlops" element={<MLOpsPanel />} />
            </Route>
            
            {/* STOREFRONT ROUTES */}
            <Route path="/store" element={<StorefrontLayout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="product/:id" element={<ProductDetailsPage />} />
            </Route>
          </Routes>
        </WSProvider>
      </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}