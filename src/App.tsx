import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router';
import { ShoppingCart, Heart, Search, ShieldCheck, Menu, X } from 'lucide-react';
import Home from './pages/Home';
import Admin from './pages/Admin';
import { auth, db } from './lib/firebase';
import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import CartModal from './components/CartModal';
import { SiteSettings } from './types';

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  // Use a locally generated ID for favorites and orders since anonymous auth may be restricted
  const [userId] = useState(() => {
    let id = localStorage.getItem('local_user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('local_user_id', id);
    }
    return id;
  });

  useEffect(() => {
    const favRef = collection(db, 'users', userId, 'favorites');
    const unsubFav = onSnapshot(favRef, (snap) => {
      setFavorites(snap.docs.map(d => d.data().productId));
    });
    
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as SiteSettings);
      }
    });

    return () => {
      unsubFav();
      unsubSettings();
    };
  }, [userId]);

  const addToCart = (item: any) => {
    setCartItems(prev => [...prev, item]);
  };

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCartItems([]);

  return (
    <BrowserRouter>
      <div className="h-screen bg-[#050505] text-[#ffffff] font-sans flex flex-col selection:bg-[#d4af37]/30 overflow-hidden">
        {settings?.promoText && (
          <div className="shrink-0 bg-[#d4af37] text-black text-center py-1.5 px-4 text-xs font-bold uppercase tracking-widest">
            {settings.promoText}
          </div>
        )}
        <header className="shrink-0 h-[70px] bg-[#050505] border-b border-[#222222] flex items-center px-4 md:px-8 justify-between z-40">
          <Link to="/" className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span className="text-[#d4af37]">ELITE KITS</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/admin" className="text-[#ffffff]/60 hover:text-[#d4af37] transition-colors flex items-center gap-1 text-sm font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>ADMIN</span>
            </Link>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative text-[#d4af37] hover:text-[#f1d592] transition-colors font-bold text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>CART ({cartItems.length})</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          <Routes>
            <Route path="/" element={<Home favorites={favorites} addToCart={addToCart} settings={settings} />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        
        {/* WhatsApp Float */}
        <a 
          href="https://wa.me/5613063929" 
          target="_blank" 
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 w-[50px] h-[50px] bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:scale-110 transition-transform z-50"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
        </a>

        <AnimatePresence>
          {isCartOpen && (
            <CartModal 
              items={cartItems} 
              onClose={() => setIsCartOpen(false)} 
              onRemove={removeFromCart}
              onClear={clearCart}
              settings={settings}
            />
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}
