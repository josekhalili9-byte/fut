import { useState } from 'react';
import { motion } from 'framer-motion';
import { Product, SiteSettings } from '../types';
import { X, Check } from 'lucide-react';

export default function ProductModal({ product, onClose, onAddToCart, settings }: { product: Product, onClose: () => void, onAddToCart: (item: any) => void, settings?: SiteSettings | null }) {
  const [size, setSize] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [selectedPatch, setSelectedPatch] = useState('');
  
  const isComingSoon = product.category === 'Próximamente';

  const hasDiscount = settings?.discountActive && settings?.discountPercentage > 0;
  const finalPrice = hasDiscount ? product.price * (1 - settings.discountPercentage / 100) : product.price;

  const handleAddToCart = () => {
    if (isComingSoon) return;
    if (!size) {
      alert("Por favor selecciona una talla.");
      return;
    }
    
    onAddToCart({
      productId: product.id,
      name: product.name,
      team: product.team,
      league: product.league,
      season: product.season,
      price: finalPrice,
      originalPrice: product.price,
      size,
      customName: product.allowCustomName ? customName : undefined,
      customNumber: product.allowCustomNumber ? customNumber : undefined,
      selectedPatch: product.allowPatches ? selectedPatch : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        layoutId={`product-${product.id}`}
        className="relative bg-[#111111] w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto border border-[#222222]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="w-full md:w-1/2 bg-[#222222] flex items-center justify-center p-8 relative">
           <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none text-9xl font-black">KIT</div>
          <img src={product.imageUrl} alt={product.name} className="relative z-10 w-full h-auto object-contain max-h-[60vh]" />
        </div>
        
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col">
          <div className="mb-6">
            <p className="text-xs text-[#d4af37] font-bold uppercase tracking-[2px] mb-2">{product.league} • {product.season}</p>
            <h2 className="text-3xl font-black mb-2 uppercase">{product.name}</h2>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-white">${finalPrice.toFixed(2)}</p>
              {hasDiscount && (
                <p className="text-lg font-bold text-white/40 line-through">${product.price.toFixed(2)}</p>
              )}
            </div>
          </div>
          
          <p className="text-white/60 mb-8 text-sm leading-relaxed">{product.description}</p>
          
          {!isComingSoon ? (
            <div className="space-y-6 flex-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-white/50 mb-3">Talla</p>
                <div className="grid grid-cols-4 gap-2">
                  {['S (Niño)', 'M (Niño)', 'L (Niño)', 'XL (Niño)', 'S', 'M', 'L', 'XL'].map(s => (
                    <button 
                      key={s}
                      onClick={() => setSize(s)}
                      className={`py-3 text-sm font-bold rounded-sm border ${size === s ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'border-[#222222] text-white/50 hover:border-white/20'} transition-all`}
                    >
                      {s.replace(' (Niño)', '')}
                      {s.includes('Niño') && <span className="block text-[10px] opacity-60">Niño</span>}
                    </button>
                  ))}
                </div>
              </div>

              {(product.allowCustomName || product.allowCustomNumber) && (
                <div className="grid grid-cols-2 gap-4">
                  {product.allowCustomName && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-white/50 tracking-[1px] mb-2">Nombre (Opcional)</p>
                      <input type="text" maxLength={15} value={customName} onChange={e => setCustomName(e.target.value.toUpperCase())} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none uppercase text-white" placeholder="EJ. MESSI" />
                    </div>
                  )}
                  {product.allowCustomNumber && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-white/50 tracking-[1px] mb-2">Número (Opcional)</p>
                      <input type="text" maxLength={2} value={customNumber} onChange={e => setCustomNumber(e.target.value.replace(/[^0-9]/g, ''))} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" placeholder="10" />
                    </div>
                  )}
                </div>
              )}

              {product.allowPatches && product.availablePatches && product.availablePatches.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-white/50 tracking-[1px] mb-2">Parches (Opcional)</p>
                  <div className="flex flex-wrap gap-2">
                    {product.availablePatches.map(patch => (
                      <button 
                        key={patch} 
                        onClick={() => setSelectedPatch(p => p === patch ? '' : patch)}
                        className={`px-4 py-2 text-sm rounded-sm border ${selectedPatch === patch ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]' : 'border-[#222222] text-white/50 hover:border-white/20'}`}
                      >
                        {patch}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <button 
                onClick={handleAddToCart}
                className="w-full py-4 bg-[#d4af37] text-black rounded-sm font-bold uppercase tracking-wider hover:bg-[#f1d592] transition-colors mt-auto flex items-center justify-center gap-2 text-sm"
              >
                Añadir al carrito
              </button>
            </div>
          ) : (
            <div className="mt-auto">
               <div className="w-full py-4 bg-[#222222] text-white/50 rounded-sm font-bold uppercase tracking-wider flex items-center justify-center cursor-not-allowed text-sm">
                  Disponible próximamente
               </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
