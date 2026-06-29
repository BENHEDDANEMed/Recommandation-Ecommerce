import React, { useState, useEffect } from 'react';
import { Search, Loader } from 'lucide-react';
import { fetchProducts, searchProducts, fetchRecommendations, fetchCategories } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/storefront/ProductCard';

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Charger les recommandations et catégories au montage
  useEffect(() => {
    if (user) {
      fetchRecommendations(user.id).then(data => setRecommendations(data.slice(0, 3)));
    }
    fetchCategories().then(data => setCategories(data));
  }, [user]);

  // Charger les produits quand la catégorie sélectionnée change ou au montage
  useEffect(() => {
    if (!query) {
      loadProducts(selectedCategory);
    }
  }, [selectedCategory]);

  const loadProducts = async (category = null) => {
    setLoading(true);
    // On passe null pour la page et la limit par défaut
    let data;
    if (category) {
      // Si on a une catégorie, on utilise search par défaut sur la catégorie
      data = await searchProducts(category);
    } else {
      data = await fetchProducts(1, 24);
    }
    setProducts(data.results || data.items || []);
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      loadProducts();
      return;
    }
    
    setSearching(true);
    const data = await searchProducts(query);
    setProducts(data.results || []);
    setSearching(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 animate-fadeUp">
      
      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-12">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, category, or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800"
            />
          </div>
          <button 
            type="submit"
            disabled={searching}
            className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            {searching ? <Loader className="animate-spin" size={20} /> : "Search"}
          </button>
        </form>
      </div>

      {/* Recommendations Banner (if not searching) */}
      {!query && recommendations.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-black text-slate-800 mb-6">Top Picks For You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((prod, idx) => (
              <ProductCard key={idx} product={prod} />
            ))}
          </div>
        </div>
      )}

      {/* Categories Filter */}
      {!query && categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${!selectedCategory ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            All Categories
          </button>
          {categories.map((cat, idx) => (
            <button 
              key={idx}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors capitalize ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* All Products Grid */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 mb-6">
          {query ? `Search Results for "${query}"` : selectedCategory ? `Products in ${selectedCategory}` : 'All Products'}
        </h2>
        
        {loading || searching ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader className="animate-spin mb-4" size={32} />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod, idx) => (
              <ProductCard key={idx} product={prod} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-700 mb-2">No products found</h3>
            <p className="text-slate-500">Try adjusting your search query.</p>
          </div>
        )}
      </div>

    </div>
  );
}
