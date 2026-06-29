import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShoppingBag, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';

export default function StorefrontLayout() {
  const { user, logout } = useAuth();
  
  // Si l'utilisateur n'est pas connecté, on force la modale sans lui laisser la possibilité de la fermer.
  const isAuthModalOpen = !user;

  return (
    <div className="min-h-screen bg-[#f4f6fa] font-sans text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/store" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-2 h-4 bg-white rounded-sm" />
              <div className="w-2 h-6 bg-blue-300 rounded-sm ml-0.5" />
            </div>
            <span className="font-black tracking-tight text-xl">CRESCENDO</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link to="/store" className="hover:text-blue-600 transition-colors">Home</Link>
            <Link to="/store/products" className="hover:text-blue-600 transition-colors">Products</Link>
            <span className="cursor-pointer hover:text-blue-600 transition-colors">About</span>
            <span className="cursor-pointer hover:text-blue-600 transition-colors">Find us</span>
            <span className="cursor-pointer hover:text-blue-600 transition-colors">Pages</span>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <button className="text-slate-600 hover:text-blue-600 transition-colors">
              <ShoppingBag size={20} />
            </button>
            
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700">{user.name}</span>
                <button 
                  onClick={logout}
                  title="Déconnexion"
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 relative">
        {/* Si l'utilisateur n'est pas connecté, on floute le contenu derrière la modale */}
        <div className={!user ? "filter blur-sm pointer-events-none opacity-50" : ""}>
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-slate-500 text-sm">
          &copy; 2026 Crescendo Audio. Simulated E-commerce Environment for RetailRocket.
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => {}} mandatory={!user} />
    </div>
  );
}
