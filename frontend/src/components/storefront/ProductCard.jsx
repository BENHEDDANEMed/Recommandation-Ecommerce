import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { getProductImage } from '../../utils/imageMapping';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function ProductCard({ product }) {
  const [simulating, setSimulating] = useState(null);
  const { user } = useAuth();
  const { addToast } = useToast();

  const navigateToProduct = () => {};

  // Résoudre l'image
  const numericId = Number(product.itemid) || 0;
  const imgSrc = getProductImage(product.category, product.itemid);

  return (
    <div className="bg-slate-50 rounded-2xl p-4 transition-all hover:shadow-lg flex flex-col group/card">
      {/* Image */}
      <Link to={`/store/product/${product.itemid}`} className="w-full aspect-square bg-white rounded-xl mb-4 relative overflow-hidden flex items-center justify-center cursor-pointer">
        <img 
          src={imgSrc} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 group-hover/card:scale-105"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </Link>

      {/* Info */}
      <div className="flex-1">
        <p className="text-xs text-slate-500 mb-1">{product.category}</p>
        <Link to={`/store/product/${product.itemid}`}>
          <h4 className="text-slate-800 font-bold mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors">{product.name}</h4>
        </Link>
        <p className="text-blue-600 font-bold text-lg">
          $ {(numericId % 300 + 50).toFixed(2)} USD
        </p>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <Link 
          to={`/store/product/${product.itemid}`}
          className="w-full py-2 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors gap-2 font-semibold text-sm"
        >
          <Eye size={18} /> View Product
        </Link>
      </div>
    </div>
  );
}
