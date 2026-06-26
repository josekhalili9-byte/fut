import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Product, CATEGORIES, SiteSettings } from '../types';
import { Heart, Search, ChevronRight } from 'lucide-react';
import ProductModal from '../components/ProductModal';

export default function Home({ favorites, addToCart, settings }: { favorites: string[], addToCart: (item: any) => void, settings?: SiteSettings | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsub = onSnapshot(q, snap => {
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(prods);
    });
    return () => unsub();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory !== 'Todos') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.team.toLowerCase().includes(q) || 
        p.league.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, selectedCategory, searchQuery]);

  const toggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    const userId = localStorage.getItem('local_user_id') || 'anonymous';
    const isFav = favorites.includes(productId);
    try {
      if (isFav) {
        await deleteDoc(doc(db, 'users', userId, 'favorites', productId));
      } else {
        await setDoc(doc(db, 'users', userId, 'favorites', productId), {
          productId,
          createdAt: serverTimestamp()
        });
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden w-full h-full">
      {/* Sidebar */}
      <aside className="w-[220px] bg-[#111111] border-r border-[#222222] p-5 hidden md:flex flex-col gap-4 overflow-y-auto shrink-0">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#222222] border-none rounded-sm pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition-shadow text-white placeholder:text-white/50"
          />
        </div>

        <h3 className="text-[10px] uppercase text-[#d4af37] tracking-[2px] mb-2 font-bold">Ligas & Colecciones</h3>
        {['Todos', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-left text-sm py-2 border-b border-white/5 transition-colors ${
              selectedCategory === cat ? 'text-white font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0a0a0a] to-[#151515] flex flex-col relative">
        {/* Mobile category/search wrapper */}
        <div className="md:hidden p-4 border-b border-[#222222] bg-[#111111] flex flex-col gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#222222] border-none rounded-sm pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition-shadow text-white placeholder:text-white/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['Todos', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-sm text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-white text-black' : 'bg-[#222222] text-white/60'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div id="grid-start" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 px-4 md:px-5 pb-8">
          {filteredProducts.map(product => {
            const hasDiscount = settings?.discountActive && settings?.discountPercentage > 0;
            const finalPrice = hasDiscount ? product.price * (1 - settings.discountPercentage / 100) : product.price;

            return (
            <motion.div 
              key={product.id}
              layoutId={`product-${product.id}`}
              onClick={() => setSelectedProduct(product)}
              className="bg-[#111111] border border-[#222222] rounded-lg p-3 flex flex-col gap-2 relative cursor-pointer hover:border-[#d4af37]/50 transition-colors group"
            >
              <div className="h-[160px] bg-[#222222] rounded-md relative flex items-center justify-center overflow-hidden">
                {/* Fallback pattern in case image fails */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none text-6xl font-black">KIT</div>
                <img src={product.imageUrl} alt={product.name} className="relative z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                
                <button 
                  onClick={(e) => toggleFavorite(e, product.id!)}
                  className="absolute top-2 right-2 z-20 w-8 h-8 bg-black/60 backdrop-blur-md rounded-sm flex items-center justify-center text-white hover:bg-black transition-colors"
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(product.id!) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                
                {hasDiscount && (
                  <div className="absolute top-2 left-2 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                    -{settings.discountPercentage}%
                  </div>
                )}
                
                {product.category === 'Próximamente' && (
                  <div className="absolute top-2 left-2 z-20 bg-white text-black text-[10px] font-black uppercase px-2 py-1 rounded-sm">
                    Soon
                  </div>
                )}
              </div>
              
              <div className="flex flex-col flex-1 py-1">
                <h4 className="font-semibold text-sm line-clamp-1">{product.name}</h4>
                <p className="text-[11px] text-white/50 mb-2 line-clamp-1">{product.league} • {product.team}</p>
                <div className="flex items-center gap-2 mt-auto mb-3">
                  <div className="text-[#d4af37] font-bold text-sm">
                    {product.category === 'Próximamente' ? 'TBD' : `$${finalPrice.toFixed(2)}`}
                  </div>
                  {hasDiscount && product.category !== 'Próximamente' && (
                    <div className="text-white/40 font-bold text-xs line-through">
                      ${product.price.toFixed(2)}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(product.category !== 'Próximamente') {
                      setSelectedProduct(product);
                    }
                  }}
                  className={`w-full py-2 bg-transparent border border-[#d4af37] text-[#d4af37] text-[11px] font-bold uppercase rounded-sm transition-colors ${
                    product.category === 'Próximamente' ? 'opacity-50 border-neutral-600 text-neutral-500 cursor-not-allowed' : 'hover:bg-[#d4af37] hover:text-black'
                  }`}
                >
                  {product.category === 'Próximamente' ? 'Disponible próximamente' : 'Ver Detalles'}
                </button>
              </div>
            </motion.div>
          )})}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-white/50 text-sm">
            No se encontraron productos.
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onAddToCart={(item) => {
              addToCart(item);
              setSelectedProduct(null);
            }}
            settings={settings}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
