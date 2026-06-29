import React, { useState } from 'react';
import { X, User, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function AuthModal({ isOpen, onClose, mandatory = false }) {
  const [visitorId, setVisitorId] = useState('');
  const { login } = useAuth();
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    if (!visitorId.trim()) return;
    
    login(Number(visitorId));
    addToast(`Connecté en tant que visiteur #${visitorId}`, "success");
    onClose();
  };

  const handleRandomLogin = () => {
    const randomId = Math.floor(Math.random() * 1000000) + 1500000; // New user ID range
    login(randomId);
    addToast(`Nouveau compte créé : #${randomId}`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeUp">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        {!mandatory && (
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        )}
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Connexion Requise</h2>
        <p className="text-slate-500 text-sm mb-6">Simulez la connexion d'un utilisateur existant ou créez un nouveau compte.</p>
        
        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">ID Visiteur Existant</label>
            <input 
              type="text" 
              placeholder="Ex: 10425"
              value={visitorId}
              onChange={(e) => setVisitorId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>
          <button 
            type="submit"
            disabled={!visitorId.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <User size={18} />
            Se Connecter
          </button>
        </form>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold">Ou</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button 
          onClick={handleRandomLogin}
          className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <UserPlus size={18} />
          Créer un Nouveau Compte
        </button>
      </div>
    </div>
  );
}
