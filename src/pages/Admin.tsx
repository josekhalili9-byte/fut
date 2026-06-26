import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Product, Order, CATEGORIES, ORDER_STATUSES } from '../types';
import { Lock, LogOut, Package, ShoppingBag, Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('orders');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (localStorage.getItem('isAdmin') === 'true') {
        setIsAdmin(true);
      } else {
        const userId = localStorage.getItem('local_user_id');
        if (userId) {
          try {
            const roleRef = doc(db, 'roles', userId);
            const roleSnap = await getDoc(roleRef);
            if (roleSnap.exists() && roleSnap.data().isAdmin === true) {
              setIsAdmin(true);
              localStorage.setItem('isAdmin', 'true');
            }
          } catch(err) {
            console.error(err);
          }
        }
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    
    const unsubProds = onSnapshot(query(collection(db, 'products')), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });

    return () => {
      unsubProds();
      unsubOrders();
    };
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '8718') {
      try {
        const userId = localStorage.getItem('local_user_id') || 'admin_' + Math.random().toString(36).substring(2,15);
        localStorage.setItem('local_user_id', userId);
        localStorage.setItem('isAdmin', 'true');
        
        await setDoc(doc(db, 'roles', userId), {
          password: '8718',
          isAdmin: true
        });
      } catch (err) {
        console.warn("Could not save role to db", err);
      }
      setIsAdmin(true);
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('local_user_id');
    localStorage.removeItem('isAdmin');
    setIsAdmin(false);
    setPassword('');
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Cargando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-[#050505]">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="bg-[#111111] p-8 rounded-lg max-w-sm w-full shadow-2xl border border-[#222222]"
        >
          <div className="w-12 h-12 bg-[#222222] rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-5 h-5 text-white/50" />
          </div>
          <h2 className="text-2xl font-black text-center mb-6 uppercase tracking-wider text-white">ADMIN</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-center tracking-[0.5em] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white"
            />
            <button type="submit" className="w-full py-3 bg-[#d4af37] text-black rounded-sm font-bold uppercase hover:bg-[#f1d592] transition-colors text-sm">
              Ingresar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#050505] text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#111111] border-r border-[#222222] flex flex-col shrink-0">
        <div className="p-6">
          <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-[2px] mb-4">Panel de Control</p>
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm font-medium transition-colors text-sm ${activeTab === 'orders' ? 'bg-[#222222] text-[#d4af37] border-l-2 border-[#d4af37]' : 'text-white/60 hover:bg-[#222222] hover:text-white'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              Pedidos
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm font-medium transition-colors text-sm ${activeTab === 'products' ? 'bg-[#222222] text-[#d4af37] border-l-2 border-[#d4af37]' : 'text-white/60 hover:bg-[#222222] hover:text-white'}`}
            >
              <Package className="w-4 h-4" />
              Productos
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm font-medium transition-colors text-sm ${activeTab === 'settings' ? 'bg-[#222222] text-[#d4af37] border-l-2 border-[#d4af37]' : 'text-white/60 hover:bg-[#222222] hover:text-white'}`}
            >
              <Edit2 className="w-4 h-4" />
              Configuración
            </button>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-[#222222]">
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0a0a0a] to-[#151515] p-6 md:p-10">
        {activeTab === 'orders' ? <OrdersPanel orders={orders} /> : activeTab === 'products' ? <ProductsPanel products={products} /> : <SettingsPanel />}
      </main>
    </div>
  );
}

function OrdersPanel({ orders }: { orders: Order[] }) {
  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
    } catch (err) {
      alert("Error al actualizar estado");
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (confirm("¿Estás seguro de eliminar este pedido?")) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
      } catch (err) {
        alert("Error al eliminar pedido");
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black mb-8 uppercase text-white">Pedidos</h2>
      <div className="grid gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-[#111111] border border-[#222222] rounded-md p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-[#222222] gap-4">
              <div>
                <p className="text-xs text-white/50 mb-1">{new Date(order.createdAt).toLocaleString()}</p>
                <h3 className="text-xl font-bold text-[#d4af37]">{order.orderNumber}</h3>
                <p className="text-sm mt-1 text-white">{order.customerName} • {order.email} • {order.phone}</p>
                <p className="text-sm text-white/60">{order.address}, {order.department} {order.city} {order.zipCode}</p>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={order.status}
                  onChange={(e) => updateStatus(order.id!, e.target.value)}
                  className="bg-[#222222] border border-[#222222] rounded-sm px-3 py-2 text-sm focus:border-[#d4af37] outline-none text-white"
                >
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => deleteOrder(order.id!)} className="p-2 bg-red-500/10 text-red-500 rounded-sm hover:bg-red-500/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase text-white/50 tracking-[2px] mb-2">Productos ({order.items.length})</p>
              {order.items.map((itemStr, idx) => {
                const item = JSON.parse(itemStr);
                return (
                  <div key={idx} className="flex justify-between items-center text-sm bg-[#222222] p-3 rounded-sm border border-[#222222]">
                    <div>
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="text-xs text-white/50">
                        {item.team} • {item.league} • Talla: {item.size}
                        {item.customName && ` • Nombre: ${item.customName}`}
                        {item.customNumber && ` • Num: ${item.customNumber}`}
                        {item.selectedPatch && ` • Parche: ${item.selectedPatch}`}
                      </p>
                    </div>
                    <p className="font-bold text-[#d4af37]">${item.price.toFixed(2)}</p>
                  </div>
                )
              })}
              <div className="text-right mt-4 pt-4 border-t border-[#222222]">
                <p className="text-sm text-white/50">Total: <span className="text-xl font-bold text-white ml-2">${order.totalPrice.toFixed(2)}</span></p>
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-white/50">No hay pedidos.</p>
        )}
      </div>
    </div>
  )
}

function ProductsPanel({ products }: { products: Product[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  
  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentProduct({
      name: '', team: '', league: '', season: '', price: 0, description: '', stock: 0, category: CATEGORIES[0], imageUrl: '', allowCustomName: true, allowCustomNumber: true, allowPatches: true, availablePatches: []
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar producto?")) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black uppercase text-white">Productos</h2>
        <button onClick={handleAddNew} className="flex items-center gap-2 bg-[#d4af37] text-black px-4 py-2 rounded-sm font-bold hover:bg-[#f1d592] transition-colors text-sm uppercase">
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      <div className="grid gap-4">
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-4 bg-[#111111] border border-[#222222] p-4 rounded-md">
            <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded-sm bg-[#222222]" />
            <div className="flex-1">
              <h4 className="font-bold text-white">{p.name}</h4>
              <p className="text-xs text-white/50">{p.team} • {p.category}</p>
            </div>
            <p className="font-bold text-[#d4af37]">${p.price.toFixed(2)}</p>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(p)} className="p-2 hover:bg-[#222222] rounded-sm text-white/50 hover:text-white">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id!)} className="p-2 hover:bg-red-500/20 rounded-sm text-white/50 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <ProductEditorModal 
          product={currentProduct} 
          onClose={() => setIsEditing(false)} 
        />
      )}
    </div>
  )
}

function ProductEditorModal({ product, onClose }: { product: Partial<Product>, onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<Product>>(product);
  const [patchesStr, setPatchesStr] = useState(product.availablePatches?.join(', ') || '');
  const [uploading, setUploading] = useState(false);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed', 
      (snapshot) => {}, 
      (error) => {
        alert("Error al subir imagen");
        setUploading(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData(prev => ({...prev, imageUrl: downloadURL}));
        setUploading(false);
      }
    );
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    try {
      const dataToSave = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        availablePatches: patchesStr.split(',').map(s => s.trim()).filter(Boolean),
        updatedAt: serverTimestamp()
      };
      
      if (formData.id) {
        await updateDoc(doc(db, 'products', formData.id), dataToSave);
      } else {
        await addDoc(collection(db, 'products'), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch(err) {
      alert("Error al guardar producto");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} className="relative w-full max-w-xl bg-[#111111] h-full flex flex-col shadow-2xl border-l border-[#222222]">
        <div className="p-6 border-b border-[#222222] flex justify-between items-center bg-[#050505]">
          <h2 className="text-xl font-black uppercase text-white">{formData.id ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#222222] rounded-sm text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form id="product-form" onSubmit={handleSave} className="space-y-4">
            <input required type="text" placeholder="Nombre" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
            
            <div className="flex gap-4 items-center">
              <input required type="text" placeholder="URL de la imagen" value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="flex-1 bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
              <label className="shrink-0 flex items-center justify-center bg-[#222222] w-12 h-12 rounded-sm cursor-pointer hover:bg-[#333333] transition-colors border border-[#222222]">
                {uploading ? <div className="w-4 h-4 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" /> : <Upload className="w-5 h-5 text-white/50" />}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input required type="text" placeholder="Equipo" value={formData.team || ''} onChange={e => setFormData({...formData, team: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
              <input required type="text" placeholder="Temporada" value={formData.season || ''} onChange={e => setFormData({...formData, season: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input required type="number" step="0.01" placeholder="Precio" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
              <input required type="number" placeholder="Stock" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
            </div>

            <select required value={formData.category || CATEGORIES[0]} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <input required type="text" placeholder="Liga (ej. Premier League)" value={formData.league || ''} onChange={e => setFormData({...formData, league: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" />
            
            <textarea required placeholder="Descripción" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none h-24 resize-none text-white" />
            
            <div className="p-4 bg-[#222222] border border-[#222222] rounded-sm space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.allowCustomName || false} onChange={e => setFormData({...formData, allowCustomName: e.target.checked})} className="w-4 h-4 accent-[#d4af37]" />
                <span className="text-sm text-white">Permitir nombre personalizado</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.allowCustomNumber || false} onChange={e => setFormData({...formData, allowCustomNumber: e.target.checked})} className="w-4 h-4 accent-[#d4af37]" />
                <span className="text-sm text-white">Permitir número personalizado</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.allowPatches || false} onChange={e => setFormData({...formData, allowPatches: e.target.checked})} className="w-4 h-4 accent-[#d4af37]" />
                <span className="text-sm text-white">Permitir parches</span>
              </label>
              
              {formData.allowPatches && (
                <input type="text" placeholder="Parches disponibles (separados por coma)" value={patchesStr} onChange={e => setPatchesStr(e.target.value)} className="w-full bg-[#111111] border border-[#222222] rounded-sm px-4 py-2 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none mt-2 text-white" />
              )}
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-[#222222] bg-[#050505]">
          <button form="product-form" type="submit" className="w-full py-4 bg-[#d4af37] text-black rounded-sm font-bold uppercase tracking-wider hover:bg-[#f1d592] transition-colors text-sm">Guardar Producto</button>
        </div>
      </motion.div>
    </div>
  )
}

function SettingsPanel() {
  const [settings, setSettings] = useState<any>({
    discountActive: false,
    discountPercentage: 0,
    promoText: '',
    bannerText: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      alert('Configuración guardada correctamente');
    } catch (err) {
      console.error(err);
      alert('Error al guardar configuración');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">Configuración del Sitio</h1>
          <p className="text-sm text-white/50 mt-1">Gestiona textos y descuentos</p>
        </div>
      </div>
      
      <form onSubmit={handleSave} className="bg-[#111111] border border-[#222222] rounded-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">Texto Promocional (Barra superior)</label>
          <input 
            type="text" 
            value={settings.promoText} 
            onChange={e => setSettings({...settings, promoText: e.target.value})} 
            className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white" 
            placeholder="Ej: ENVÍO GRATIS A TODO EL MUNDO" 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">Texto del Banner (Inicio)</label>
          <textarea 
            value={settings.bannerText} 
            onChange={e => setSettings({...settings, bannerText: e.target.value})} 
            className="w-full bg-[#222222] border border-[#222222] rounded-sm px-4 py-3 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white h-24 resize-none" 
            placeholder="Texto del banner principal en la portada" 
          />
        </div>

        <div className="p-4 bg-[#222222] border border-[#222222] rounded-sm space-y-4">
          <h3 className="font-bold text-white uppercase tracking-wide text-sm">Sistema de Descuentos</h3>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.discountActive} 
              onChange={e => setSettings({...settings, discountActive: e.target.checked})} 
              className="w-4 h-4 accent-[#d4af37]" 
            />
            <span className="text-sm text-white">Activar descuento global</span>
          </label>
          
          {settings.discountActive && (
            <div>
              <label className="block text-xs text-white/70 mb-2">Porcentaje de descuento (%)</label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={settings.discountPercentage} 
                onChange={e => setSettings({...settings, discountPercentage: Number(e.target.value)})} 
                className="w-full bg-[#111111] border border-[#222222] rounded-sm px-4 py-2 text-sm focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-white max-w-[200px]" 
              />
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-[#d4af37] text-black rounded-sm font-bold uppercase tracking-wider hover:bg-[#f1d592] transition-colors text-sm disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  );
}
