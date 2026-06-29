import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchRecommendations, fetchCategories, fetchProducts } from '../../services/api';
import { getProductImage } from '../../utils/imageMapping';
import ProductCard from '../../components/storefront/ProductCard';

export default function HomePage() {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecsDropdown, setShowRecsDropdown] = useState(false);
  const [allRecommendations, setAllRecommendations] = useState([]);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        // Charger les catégories de la DB
        const cats = await fetchCategories();
        // Prendre au maximum 3 catégories pour l'affichage Home
        setCategories(cats.slice(0, 3));

        if (user) {
          // If logged in, fetch personalized recommendations from our ALS model
          const data = await fetchRecommendations(user.id);
          setAllRecommendations(data || []);
          
          if (data && data.length > 0) {
            setFeaturedProducts(data.slice(0, 3));
          } else {
            // Fallback to real products from the DB
            const realProds = await fetchProducts(1, 3);
            setFeaturedProducts(realProds.items || []);
          }
        }
      } catch (err) {
        // Fallback en cas d'erreur API
        const fallbackProds = await fetchProducts(1, 3);
        setFeaturedProducts(fallbackProds.items || []);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [user]);

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-16 animate-fadeUp">
      
      {/* Hero Section */}
      <section className="bg-[#2d58a7] rounded-[2rem] overflow-hidden relative flex flex-col md:flex-row items-center justify-between p-12 text-white shadow-2xl">
        <div className="md:w-1/2 space-y-6 z-10 relative">
          <h1 className="text-5xl font-black leading-tight tracking-tight">
            Elevate Your Audio Journey
          </h1>
          <p className="text-blue-100/80 leading-relaxed max-w-md">
            Experience Sound In Its Purest Form. Discover our premium collection of earbuds, headphones, and speakers crafted for the ultimate auditory experience.
          </p>
          <div className="flex gap-4 pt-4">
            <button className="px-8 py-3 bg-[#4a72d1] hover:bg-white hover:text-[#2d58a7] font-bold rounded-full transition-all">
              Shop Now
            </button>
            <button className="px-8 py-3 border border-blue-300/30 hover:bg-blue-300/10 font-bold rounded-full transition-all">
              Learn More
            </button>
          </div>
        </div>
        <div className="md:w-1/2 absolute md:relative right-0 opacity-20 md:opacity-100 flex justify-end">
          <div className="w-96 h-96 bg-blue-400/20 rounded-full flex items-center justify-center">
             <img src={getProductImage('casque', 1)} alt="Hero Audio" className="w-80 h-80 object-cover rounded-full mix-blend-screen" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        </div>
      </section>

      {/* Featured Products (Recommendations) */}
      <section className="space-y-6">
        <div className="flex items-end justify-between relative">
          <div>
            <h2 className="text-3xl font-black text-slate-800">
              {allRecommendations.length > 0 ? 'Recommended For You' : 'Featured Products'}
            </h2>
            {allRecommendations.length > 0 && <p className="text-sm text-slate-500 mt-1">Based on your recent activity (ALS Model)</p>}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowRecsDropdown(!showRecsDropdown)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-blue-600/20"
            >
              See All Recommendations
            </button>
            
            {/* Dropdown Recommandations */}
            {showRecsDropdown && allRecommendations.length > 0 && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 p-2 max-h-96 overflow-y-auto">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2 px-2 pt-2">Vos recommandations ({allRecommendations.length})</div>
                {allRecommendations.map((prod, idx) => (
                  <Link 
                    key={idx} 
                    to={`/store/product/${prod.itemid}`}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group"
                  >
                    <div className="w-12 h-12 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                       <img 
                          src={getProductImage(prod.category, prod.itemid)} 
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                       />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{prod.name}</p>
                      <p className="text-xs text-blue-600 font-semibold">$ {(Number(prod.itemid || 0) % 300 + 50).toFixed(2)}</p>
                    </div>
                    <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
                       <ChevronRight size={16} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">Loading your recommendations...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProducts.map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Shop By Category */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-black text-slate-800">Shop By Category</h2>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-slate-800 hover:text-slate-800 transition-colors">
               &larr;
            </button>
            <button className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-slate-800 hover:text-slate-800 transition-colors">
               &rarr;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.length > 0 ? categories.map((catName, idx) => (
            <div key={idx} className="bg-slate-100 rounded-2xl p-6 flex flex-col group cursor-pointer hover:shadow-xl transition-all h-[320px]">
              <h3 className="text-xl font-bold text-slate-800 mb-2 capitalize">{catName}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-3">Premium quality {catName.toLowerCase()} to enhance your experience from our dataset.</p>
              <button className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                View Category <ChevronRight size={14} />
              </button>
              <div className="mt-auto flex justify-center h-32 relative">
                <img 
                  src={getProductImage(catName, 0)} 
                  alt={catName} 
                  className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                  onError={(e) => { e.target.style.display = 'none'; }} 
                />
              </div>
            </div>
          )) : (
            <div className="col-span-3 text-center text-slate-400 py-10">Loading categories...</div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-slate-100 rounded-2xl p-12 text-center space-y-10">
        <h2 className="text-3xl font-black text-slate-800">Experience Streamlined<br/>Shopping With Crescendo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center space-y-3">
            <Package size={32} className="text-slate-700" strokeWidth={1.5} />
            <h4 className="font-bold text-lg text-slate-800">Free Delivery</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Fast and secure delivery to your doorstep, completely free of charge.</p>
          </div>
          <div className="flex flex-col items-center space-y-3">
            <Truck size={32} className="text-slate-700" strokeWidth={1.5} />
            <h4 className="font-bold text-lg text-slate-800">Self Pickup</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Order online and pick up at your nearest Crescendo store at your convenience.</p>
          </div>
          <div className="flex flex-col items-center space-y-3">
            <ShieldCheck size={32} className="text-slate-700" strokeWidth={1.5} />
            <h4 className="font-bold text-lg text-slate-800">Warranty</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">All our products come with a comprehensive 2-year warranty for peace of mind.</p>
          </div>
        </div>
        <button className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-600/20">
          Shop Now
        </button>
      </section>

    </div>
  );
}
