import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OrderItem, SiteSettings } from '../types';

export default function CartModal({ items, onClose, onRemove, onClear, settings }: { items: OrderItem[], onClose: () => void, onRemove: (index: number) => void, onClear: () => void, settings?: SiteSettings | null }) {
  const [step, setStep] = useState(1); // 1: cart, 2: checkout, 3: success
  const [formData, setFormData] = useState({
    customerName: '', phone: '', email: '', address: '', department: '', city: '', zipCode: '', notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasDiscount = settings?.discountActive && settings?.discountPercentage > 0;
  
  const originalTotalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const totalPrice = hasDiscount ? originalTotalPrice * (1 - settings.discountPercentage / 100) : originalTotalPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setIsSubmitting(true);
    setError('');

    try {
      const userId = localStorage.getItem('local_user_id') || 'anonymous';
      const orderNumber = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      // Compute final prices for each item
      const finalItems = items.map(item => {
        const itemPrice = hasDiscount ? item.price * (1 - settings.discountPercentage / 100) : item.price;
        return { ...item, price: itemPrice, originalPrice: item.price };
      });

      await addDoc(collection(db, 'orders'), {
        userId: userId,
        orderNumber,
        status: 'Pendiente',
        ...formData,
        items: finalItems.map(item => JSON.stringify(item)),
        totalPrice,
        originalTotalPrice,
        discountApplied: hasDiscount ? settings.discountPercentage : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setStep(3);
      onClear();
    } catch(err: any) {
      setError(err.message || 'Error al procesar el pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-[#111111] h-full flex flex-col shadow-2xl border-l border-[#222222]"
      >
        <div className="p-6 border-b border-[#222222] flex justify-between items-center bg-[#050505]">
          <h2 className="text-xl font-black uppercase tracking-wider text-white">
            {step === 1 ? 'Tu Carrito' : step === 2 ? 'Checkout' : 'Pedido Confirmado'}
          </h2>
          {step !== 3 && (
            <button onClick={onClose} className="p-2 hover:bg-[#222222] rounded-sm transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="p-6 flex flex-col min-h-full">
              {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-white/50 text-sm">
                  Tu carrito está vacío.
                </div>
              ) : (
                <>
                  <div className="space-y-4 flex-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 bg-[#222222] p-4 rounded-md border border-[#222222]">
                        <div className="flex-1">
                          <h4 className="font-bold text-sm mb-1 text-white">{item.name}</h4>
                          <p className="text-xs text-white/50 mb-2">Talla: {item.size}</p>
                          {(item.customName || item.customNumber) && (
                            <p className="text-[10px] text-[#d4af37] uppercase">
                              Pers: {item.customName} {item.customNumber}
                            </p>
                          )}
                          {item.selectedPatch && (
                            <p className="text-[10px] text-[#d4af37] uppercase">Parche: {item.selectedPatch}</p>
                          )}
                        </div>
                        <div className="text-right flex flex-col justify-between items-end">
                          <p className="font-bold text-white">${item.price.toFixed(2)}</p>
                          <button onClick={() => onRemove(idx)} className="text-white/50 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-[#222222]">
                    {hasDiscount && (
                      <div className="flex justify-between items-center mb-2 text-sm text-white/70">
                        <span>Subtotal</span>
                        <span>${originalTotalPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {hasDiscount && (
                      <div className="flex justify-between items-center mb-4 text-sm text-red-500 font-bold">
                        <span>Descuento ({settings.discountPercentage}%)</span>
                        <span>-${(originalTotalPrice - totalPrice).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-6 text-lg font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-[#d4af37]">${totalPrice.toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={() => setStep(2)}
                      className="w-full py-4 bg-[#d4af37] text-black rounded-sm font-bold uppercase tracking-wider hover:bg-[#f1d592] transition-colors text-sm"
                    >
                      Continuar con el pago
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-sm text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-white/50 mb-2">Información de contacto</h3>
                <input required type="text" placeholder="Nombre completo" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
                <input required type="email" placeholder="Correo electrónico" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
                <input required type="tel" placeholder="Teléfono (WhatsApp)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
              </div>
              
              <div className="space-y-3 pt-4 border-t border-[#222222]">
                <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-white/50 mb-2">Dirección de envío</h3>
                <input required type="text" placeholder="Dirección completa" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Departamento (Opcional)" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
                  <input required type="text" placeholder="Código Postal" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
                </div>
                <input required type="text" placeholder="Ciudad" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
                <textarea placeholder="Notas para el pedido (Opcional)" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none min-h-[80px] resize-none text-white" />
              </div>

              <div className="pt-6 mt-4 border-t border-[#222222]">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#d4af37] text-black rounded-sm font-bold uppercase tracking-wider hover:bg-[#f1d592] transition-colors disabled:opacity-50 text-sm"
                >
                  {isSubmitting ? 'Procesando...' : `Confirmar Pedido ($${totalPrice.toFixed(2)})`}
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full py-4 text-white/50 text-xs hover:text-white mt-2">
                  Volver al carrito
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="p-8 flex flex-col items-center justify-center text-center h-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
              <h2 className="text-2xl font-black mb-4 uppercase text-white">Pedido Confirmado</h2>
              <p className="text-white/60 mb-6 text-sm">
                Gracias por tu compra. Tu pedido ha sido registrado correctamente.
              </p>
              <div className="bg-[#222222] border border-[#222222] rounded-md p-6 mb-8 w-full">
                <p className="text-sm text-white/80 mb-2">El tiempo estimado de entrega es de <strong className="text-white">2 a 3 semanas</strong>.</p>
                <p className="text-xs text-white/50">Nos comunicaremos contigo por WhatsApp o correo electrónico para confirmar tu pedido.</p>
              </div>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-[#d4af37] text-black rounded-sm font-bold uppercase tracking-wider hover:bg-[#f1d592] transition-colors text-sm"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
