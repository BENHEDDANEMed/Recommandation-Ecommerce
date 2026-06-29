import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, CreditCard, ArrowLeft, ShieldCheck, Truck, Loader } from 'lucide-react';
import { fetchProductDetails, simulateProductClick, fetchRecommendations } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import ProductCard from '../../components/storefront/ProductCard';
import { getProductImage } from '../../utils/imageMapping';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      window.scrollTo(0, 0);
      
      const prodData = await fetchProductDetails(id);
      setProduct(prodData);
      
      if (prodData && user) {
        // Envoi automatique de l'événement 'view' à Kafka
        simulateProductClick(user.id, prodData.itemid, 'view').catch(console.error);
        
        // Charger quelques recs pour le bas de page
        fetchRecommendations(user.id).then(data => setSimilarProducts(data.slice(0, 4)));
      }
      
      setLoading(false);
    }
    
    loadData();
  }, [id, user]);

  const handleAction = async (actionType) => {
    if (!product || !user) return;
    setActionLoading(actionType);
    
    try {
      await simulateProductClick(user.id, product.itemid, actionType);
      const actionName = actionType === 'addtocart' ? 'ajouté au panier' : 'acheté';
      addToast(`Produit ${actionName} avec succès !`, "success");
    } catch (e) {
      addToast(`Erreur lors de l'action`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/store/products')} className="text-blue-600 hover:underline">Return to products</button>
      </div>
    );
  }

  const imgSrc = getProductImage(product.category, product.itemid);
  const price = (product.itemid % 300 + 50).toFixed(2);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 animate-fadeUp">
      
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-8 font-semibold text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white rounded-3xl p-8 shadow-sm mb-16 flex flex-col md:flex-row gap-12">
        {/* Image Gallery */}
        <div className="md:w-1/2">
          <div className="w-full aspect-square bg-slate-50 rounded-2xl flex items-center justify-center p-8">
            <img 
              src={imgSrc} 
              alt={product.name} 
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="md:w-1/2 space-y-6">
          <div>
            <p className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-2">{product.category}</p>
            <h1 className="text-3xl font-black text-slate-800 leading-tight">{product.name}</h1>
          </div>
          
          <p className="text-4xl font-black text-slate-800">$ {price} <span className="text-lg text-slate-400 font-normal">USD</span></p>
          
          <p className="text-slate-600 leading-relaxed">
            Experience premium quality with the {product.name}. Designed specifically for the {product.category} category, 
            it delivers outstanding performance, durability, and a sleek modern aesthetic. Perfect for elevating your daily routine.
          </p>

          <div className="pt-6 border-t border-slate-100 flex gap-4">
            <button 
              onClick={() => handleAction('addtocart')}
              disabled={actionLoading !== null}
              className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'addtocart' ? <Loader className="animate-spin" size={20} /> : <ShoppingCart size={20} />}
              Add to Cart
            </button>
            <button 
              onClick={() => handleAction('transaction')}
              disabled={actionLoading !== null}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'transaction' ? <Loader className="animate-spin" size={20} /> : <CreditCard size={20} />}
              Buy Now
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-4 rounded-xl">
              <Truck className="text-slate-400" size={24} />
              <span className="text-sm font-semibold">Free Delivery<br/><span className="text-xs text-slate-400 font-normal">On orders over $50</span></span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-4 rounded-xl">
              <ShieldCheck className="text-slate-400" size={24} />
              <span className="text-sm font-semibold">2 Year Warranty<br/><span className="text-xs text-slate-400 font-normal">Included standard</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-slate-800 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map((prod, idx) => (
              <ProductCard key={idx} product={prod} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
