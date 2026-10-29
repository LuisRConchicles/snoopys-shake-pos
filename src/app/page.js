'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, Coffee, Delete, ArrowLeft, Sparkles, 
  ShoppingCart, Search, Plus, Minus, Trash2, LogOut, Receipt, 
  CheckCircle2, Utensils, CupSoda, Zap, Boxes, Store, 
  Clock, PlusCircle, Edit3, Calendar, Check, DollarSign, 
  CreditCard, Banknote, ArrowDownCircle, ArrowUpCircle, Wallet, FileText, Printer
} from 'lucide-react';

export default function App() {
  // --- NAVEGACIÓN Y SESIÓN ---
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'ventas', 'caja', 'inventario', 'turnos'
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeUser, setActiveUser] = useState(null);

  // --- TURNOS TIEMPO REAL ---
  const [currentShiftStart, setCurrentShiftStart] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);

  // --- POS / CARRITO Y PAGO ---
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo'); 
  const [cashGiven, setCashGiven] = useState('');

  // --- ESTADO PARA TICKET A IMPRIMIR ---
  const [ticketToPrint, setTicketToPrint] = useState(null);

  // --- HISTORIAL DE VENTAS Y CONTROL DE CAJA ---
  const [salesHistory, setSalesHistory] = useState([]);
  const [cashMovements, setCashMovements] = useState([]); 
  
  // Fondo Inicial ahora se edita dinámicamente (inicia por defecto en 500)
  const [initialCash, setInitialCash] = useState(500); 

  // Formulario nuevo movimiento de caja
  const [movementType, setMovementType] = useState('retiro'); 
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  // --- INVENTARIO ---
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Café en Grano (Especialidad)', category: 'Granos / Esencias', stock: 12.5, unit: 'Kg', minStock: 3.0 },
    { id: 2, name: 'Leche Entera', category: 'Lácteos', stock: 24, unit: 'Litros', minStock: 5 },
    { id: 3, name: 'Leche de Almendra', category: 'Lácteos', stock: 8, unit: 'Litros', minStock: 2 },
    { id: 4, name: 'Azúcar Blanca Standard', category: 'Endulzantes', stock: 15.0, unit: 'Kg', minStock: 4.0 },
    { id: 5, name: 'Harina de Trigo Pre-mezcla', category: 'Repostería', stock: 20.0, unit: 'Kg', minStock: 5.0 },
    { id: 6, name: 'Jarabe de Chocolate Artesanal', category: 'Jarabes & Salsas', stock: 4, unit: 'Botellas', minStock: 1 },
    { id: 7, name: 'Vasos Térmicos 12oz (Snoopy Print)', category: 'Desechables', stock: 150, unit: 'Piezas', minStock: 30 },
    { id: 8, name: 'Servilletas de Papel', category: 'Desechables', stock: 500, unit: 'Piezas', minStock: 100 },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'General', stock: '', unit: 'Kg', minStock: '1' });
  const [editingStockId, setEditingStockId] = useState(null);
  const [tempStockValue, setTempStockValue] = useState('');

  // --- ADMINISTRADORES ---
  const admins = [
    {
      id: 1,
      nombre: 'Annett Italiby Dueñas Duran',
      rol: 'Administrador Principal',
      badge: '👑 Master Barista',
      color: 'bg-[#F4C430]',
      avatarBg: 'bg-black text-white',
      initials: 'A1',
      defaultPin: '1234'
    },
    {
      id: 2,
      nombre: 'Sarahy Elideth Dueñas Duran',
      rol: 'Administrador de Turno',
      badge: '☕ Barista Pro',
      color: 'bg-[#E63946]',
      avatarBg: 'bg-white text-black border-2 border-black',
      initials: 'A2',
      defaultPin: '5678'
    }
  ];

  // --- CATÁLOGO POS ---
  const categories = [
    { id: 'todos', label: 'Todo el Menú', icon: Utensils },
    { id: 'refresco', label: 'Bebidas con Refresco', icon: CupSoda },
    { id: 'icetea', label: 'Ice Tea', icon: CupSoda },
    { id: 'lattes', label: 'Lattes & Cafés', icon: Coffee },
  ];

  const products = [
    // --- BEBIDAS CON REFRESCO ---
    { id: 1, name: 'Lucy y su Limonada Roja', category: 'refresco', price: 60, emoji: '🍓', desc: 'Jamaica y Sandía' },
    { id: 2, name: 'Mango de Charlie Brown', category: 'refresco', price: 60, emoji: '🥭', desc: 'Mango y Fresa' },
    { id: 3, name: 'Paty y el Kiwi', category: 'refresco', price: 60, emoji: '🥝', desc: 'Kiwi y Menta' },
    { id: 4, name: 'Sally y su Chicle de Menta', category: 'refresco', price: 60, emoji: '🍬', desc: 'Fresa y Menta' },
    { id: 5, name: 'Maracuya de Snoopy', category: 'refresco', price: 65, emoji: '🍊', desc: 'Maracuyá, Kiwi y Naranja' },

    // --- ICE TEA ---
    { id: 6, name: 'Snoopy Asoleado', category: 'icetea', price: 55, emoji: '🍹', desc: 'Té negro, Naranja y Miel' },
    { id: 7, name: 'Siesta de Linus', category: 'icetea', price: 55, emoji: '🍋', desc: 'Jazmín con Limón' },
    { id: 8, name: 'Snoopy Enamoradísimo', category: 'icetea', price: 55, emoji: '❤️', desc: 'Té negro y Maracuyá' },
    { id: 9, name: 'Snoopy con Antojo de Fresa', category: 'icetea', price: 55, emoji: '🍓', desc: 'Té negro y Fresa' },

    // --- LATTES & ESPECIALES ---
    { id: 10, name: 'Sally Dulce Obsesión', category: 'lattes', price: 65, emoji: '☕', desc: 'Espresso con un toque especial dulce' },
    { id: 11, name: 'Snoopy y Vitamina C', category: 'lattes', price: 65, emoji: '🍊', desc: 'Receta especial de la casa' },
    { id: 12, name: 'Snoopy Minion Banana', category: 'lattes', price: 65, emoji: '🍌', desc: 'Latte con sabor a plátano dulce' },
    { id: 13, name: 'Woodstock Migajitas', category: 'lattes', price: 65, emoji: '🍪', desc: 'Espresso cremoso con toque crocante' },
    { id: 14, name: 'Snoopy Mangocito Sabroso', category: 'lattes', price: 68, emoji: '🥭', desc: 'Especialidad frutal cremosa' },
    { id: 15, name: 'Paty Cajeta Pop', category: 'lattes', price: 65, emoji: '🍯', desc: 'Latte espeso sabor cajeta' },
    { id: 16, name: 'Brown Vainilla', category: 'lattes', price: 60, emoji: '🍦', desc: 'Clásico espresso suave con vainilla' },
    { id: 17, name: 'Lucy Choco Gruñona', category: 'lattes', price: 65, emoji: '🍫', desc: 'Latte cremoso con chocolate concentrado' },
    { id: 18, name: 'Snoopy Mazapancito', category: 'lattes', price: 68, emoji: '🥜', desc: 'Especialidad sabor mazapán artesanal' }
  ];

  // --- LOGIN / LOGOUT ---
  const handleNumClick = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) validatePin(newPin);
    }
  };

  const handleBackspace = () => { setPin(pin.slice(0, -1)); setError(''); };
  const handleClear = () => { setPin(''); setError(''); };

  const validatePin = (inputPin) => {
    if (inputPin === selectedAdmin.defaultPin) {
      setActiveUser(selectedAdmin);
      setIsLoggedIn(true);
      setCurrentShiftStart(new Date());
    } else {
      setError('❌ PIN incorrecto. Intenta de nuevo.');
      setPin('');
    }
  };

  const handleLogout = () => {
    if (currentShiftStart && activeUser) {
      const horaSalidaReal = new Date();
      const diffMs = horaSalidaReal - currentShiftStart;
      const totalMinutos = Math.floor(diffMs / (1000 * 60));
      const hrs = Math.floor(totalMinutos / 60);
      const mins = totalMinutos % 60;

      const formatTime = (d) => d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

      const newShiftRecord = {
        id: Date.now(),
        adminName: activeUser.nombre,
        fecha: currentShiftStart.toLocaleDateString('es-MX'),
        entrada: formatTime(currentShiftStart),
        salida: formatTime(horaSalidaReal),
        duracion: hrs > 0 ? `${hrs} hrs ${mins} mins` : `${mins} min(s)`
      };
      setShiftHistory((prev) => [newShiftRecord, ...prev]);
    }

    setIsLoggedIn(false);
    setSelectedAdmin(null);
    setPin('');
    setError('');
    setActiveUser(null);
    setCurrentShiftStart(null);
    setCart([]);
    setActiveTab('pos');
  };

  // --- CARRITO Y VENTA ---
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const changeValue = parseFloat(cashGiven) > total ? (parseFloat(cashGiven) - total).toFixed(2) : '0.00';

  // FUNCION DE IMPRESIÓN DIRECTA
  const triggerPrintTicket = (saleData) => {
    setTicketToPrint(saleData);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // FUNCION DE COBRO CON CONEXIÓN A SUPABASE
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const now = new Date();
    const newSale = {
      id: Date.now(),
      time_str: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }),
      date_str: now.toLocaleDateString('es-MX'),
      items: cart,
      total: total,
      payment_method: paymentMethod, 
      atendido_por: activeUser ? activeUser.nombre.split(' ')[0] : 'Barista',
      cash_given: paymentMethod === 'efectivo' ? (parseFloat(cashGiven) || total) : total,
      change_given: paymentMethod === 'efectivo' ? parseFloat(changeValue) : 0
    };

    // 1. Guardar en la base de datos de Supabase
    try {
      const { error } = await supabase.from('sales').insert([newSale]);
      if (error) {
        console.error('Error guardando en Supabase:', error);
      }
    } catch (err) {
      console.error('Error de red al conectar con Supabase:', err);
    }

    // 2. Formato para actualizar el estado local en pantalla
    const localSaleFormat = {
      ...newSale,
      time: newSale.time_str,
      date: newSale.date_str,
      paymentMethod: newSale.payment_method,
      atendidoPor: newSale.atendido_por,
      cashGiven: newSale.cash_given,
      changeGiven: newSale.change_given
    };

    setSalesHistory((prev) => [localSaleFormat, ...prev]);
    setOrderSuccess(true);

    // Manda a imprimir a la POS-58
    triggerPrintTicket(localSaleFormat);

    setTimeout(() => {
      setOrderSuccess(false);
      setCart([]);
      setCashGiven('');
    }, 2000);
  };

  // --- MOVIMIENTOS DE CAJA ---
  const handleAddMovement = (e) => {
    e.preventDefault();
    const amount = parseFloat(movementAmount);
    if (isNaN(amount) || amount <= 0 || !movementReason) return;

    const now = new Date();
    const newMovement = {
      id: Date.now(),
      type: movementType, 
      amount: amount,
      reason: movementReason,
      time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: now.toLocaleDateString('es-MX'),
      user: activeUser.nombre.split(' ')[0]
    };

    setCashMovements((prev) => [newMovement, ...prev]);
    setMovementAmount('');
    setMovementReason('');
  };

  // CÁLCULOS GENERALES DE CAJA Y VENTAS
  const totalSalesAmount = salesHistory.reduce((sum, s) => sum + s.total, 0);
  const salesByEfectivo = salesHistory.filter(s => s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0);
  const salesByTarjeta = salesHistory.filter(s => s.paymentMethod === 'tarjeta').reduce((sum, s) => sum + s.total, 0);
  const salesByTransfer = salesHistory.filter(s => s.paymentMethod === 'transferencia').reduce((sum, s) => sum + s.total, 0);

  const totalIngresosExtra = cashMovements.filter(m => m.type === 'ingreso').reduce((sum, m) => sum + m.amount, 0);
  const totalRetiros = cashMovements.filter(m => m.type === 'retiro').reduce((sum, m) => sum + m.amount, 0);

  const parsedInitialCash = parseFloat(initialCash) || 0;
  const cashInDrawerTotal = parsedInitialCash + salesByEfectivo + totalIngresosExtra - totalRetiros;

  // --- INVENTARIO LOGIC ---
  const startEditingStock = (item) => { setEditingStockId(item.id); setTempStockValue(item.stock.toString()); };
  const saveStockValue = (id) => {
    const val = parseFloat(tempStockValue);
    if (!isNaN(val) && val >= 0) {
      setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, stock: val } : item)));
    }
    setEditingStockId(null);
  };

  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.stock) return;
    setInventory((prev) => [...prev, {
      id: Date.now(), name: newItem.name, category: newItem.category || 'General', stock: parseFloat(newItem.stock) || 0, unit: newItem.unit, minStock: parseFloat(newItem.minStock) || 1
    }]);
    setNewItem({ name: '', category: 'General', stock: '', unit: 'Kg', minStock: '1' });
    setShowAddModal(false);
  };

  const filteredProducts = products.filter((p) => (selectedCategory === 'todos' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredInventory = inventory.filter((item) => item.name.toLowerCase().includes(inventorySearch.toLowerCase()) || item.category.toLowerCase().includes(inventorySearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E1E1E] flex flex-col justify-between p-3 md:p-6 font-sans selection:bg-[#F4C430]">

      {/* TICKET IMPRESO PARA POS-58 (OCULTO EN PANTALLA) */}
      {ticketToPrint && (
        <div id="thermal-ticket" className="hidden print:block text-black p-1 text-[11px] leading-tight">
          <div className="text-center mb-2">
            <p className="font-bold text-sm uppercase">Snoopy&apos;s SHAKE</p>
            <p className="text-[10px]">Café & Repostería</p>
            <p className="text-[9px]">--------------------------------</p>
          </div>

          <div className="mb-2 text-[10px]">
            <p>Ticket: #{ticketToPrint.id.toString().slice(-6)}</p>
            <p>Fecha: {ticketToPrint.date} - {ticketToPrint.time}</p>
            <p>Barista: {ticketToPrint.atendidoPor}</p>
            <p>--------------------------------</p>
          </div>

          <div className="mb-2">
            {ticketToPrint.items.map((item, idx) => (
              <div key={idx} className="mb-1">
                <p className="font-bold">{item.name}</p>
                <div className="flex justify-between text-[10px]">
                  <span>{item.quantity} x ${item.price}</span>
                  <span className="font-bold">${item.quantity * item.price}</span>
                </div>
              </div>
            ))}
            <p className="text-[9px]">--------------------------------</p>
          </div>

          <div className="text-right mb-2 text-[10px]">
            <p className="font-extrabold text-xs">TOTAL: ${ticketToPrint.total}</p>
            <p>Pago: {ticketToPrint.paymentMethod.toUpperCase()}</p>
            {ticketToPrint.paymentMethod === 'efectivo' && (
              <>
                <p>Paga con: ${ticketToPrint.cashGiven}</p>
                <p>Cambio: ${ticketToPrint.changeGiven}</p>
              </>
            )}
          </div>

          <div className="text-center text-[9px] mt-3 border-t border-black pt-1">
            <p className="font-bold">¡Gracias por tu compra!</p>
            <p>☕ Snoopy te espera pronto 🐾</p>
          </div>
        </div>
      )}

      {/* LÍNEA DECORATIVA */}
      <div className="w-full h-3 bg-[#F4C430] border-y-2 border-black mb-4 bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:8px_8px]" />

      {/* HEADER */}
      <header className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center gap-3 mb-4 pb-4 border-b-2 border-black/10">
        <div className="inline-flex items-center gap-3 bg-white px-6 py-2.5 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_#1e1e1e]">
          <Coffee className="w-7 h-7 text-[#E63946] animate-bounce" />
          <h1 className="text-xl md:text-3xl font-black tracking-wider uppercase">
            Snoopy&apos;s Shake <span className="text-xs bg-[#E63946] text-white px-2.5 py-1 rounded-lg ml-1 align-middle">POS</span>
          </h1>
        </div>

        {/* NAVEGACIÓN COMPLETA */}
        {isLoggedIn && activeUser && (
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center justify-center gap-2 bg-white p-1.5 rounded-2xl border-3 border-black shadow-[3px_3px_0px_0px_#1e1e1e]">
              <button
                onClick={() => setActiveTab('pos')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs uppercase transition-all ${
                  activeTab === 'pos' ? 'bg-[#F4C430] border-2 border-black text-black shadow-[2px_2px_0px_0px_#1e1e1e]' : 'hover:bg-gray-100'
                }`}
              >
                <Store className="w-4 h-4" /> Ventas (POS)
              </button>

              <button
                onClick={() => setActiveTab('ventas')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs uppercase transition-all ${
                  activeTab === 'ventas' ? 'bg-[#F4C430] border-2 border-black text-black shadow-[2px_2px_0px_0px_#1e1e1e]' : 'hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4" /> Historial Ventas
              </button>

              <button
                onClick={() => setActiveTab('caja')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs uppercase transition-all ${
                  activeTab === 'caja' ? 'bg-[#F4C430] border-2 border-black text-black shadow-[2px_2px_0px_0px_#1e1e1e]' : 'hover:bg-gray-100'
                }`}
              >
                <Wallet className="w-4 h-4" /> Control Caja
              </button>

              <button
                onClick={() => setActiveTab('inventario')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs uppercase transition-all ${
                  activeTab === 'inventario' ? 'bg-[#F4C430] border-2 border-black text-black shadow-[2px_2px_0px_0px_#1e1e1e]' : 'hover:bg-gray-100'
                }`}
              >
                <Boxes className="w-4 h-4" /> Inventario
              </button>

              <button
                onClick={() => setActiveTab('turnos')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs uppercase transition-all ${
                  activeTab === 'turnos' ? 'bg-[#F4C430] border-2 border-black text-black shadow-[2px_2px_0px_0px_#1e1e1e]' : 'hover:bg-gray-100'
                }`}
              >
                <Clock className="w-4 h-4" /> Turnos
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 rounded-2xl shadow-[2px_2px_0px_0px_#1e1e1e]">
                <div className={`w-7 h-7 rounded-xl ${activeUser.avatarBg} border border-black flex items-center justify-center font-black text-xs`}>
                  {activeUser.initials}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black leading-tight">{activeUser.nombre.split(' ')[0]}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="bg-[#E63946] hover:bg-red-600 text-white font-black px-3 py-2 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_#1e1e1e] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 text-xs uppercase"
              >
                <LogOut className="w-4 h-4" /> Salir
              </button>
            </div>
          </div>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto w-full flex-1">
        {!isLoggedIn ? (
          /* ==================== LOGIN ==================== */
          <div className="max-w-md mx-auto my-auto py-8">
            <div className="bg-white rounded-3xl border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_#1e1e1e] relative overflow-hidden">
              <div className="bg-[#FFF9E6] border-2 border-black rounded-2xl p-3 mb-6 text-center shadow-[2px_2px_0px_0px_#1e1e1e]">
                <p className="text-xs md:text-sm font-extrabold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F4C430]" />
                  {selectedAdmin ? `Ingresa el PIN para ${selectedAdmin.nombre}` : '¡Bienvenido! Selecciona tu usuario'}
                </p>
              </div>

              {!selectedAdmin ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-black text-center uppercase tracking-wide mb-2 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#E63946]" /> Seleccionar Barista
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {admins.map((admin) => (
                      <button
                        key={admin.id}
                        onClick={() => { setSelectedAdmin(admin); setPin(''); setError(''); }}
                        className={`${admin.color} text-black border-4 border-black rounded-2xl p-4 flex items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1e1e1e] active:translate-y-0 active:shadow-none text-left w-full group`}
                      >
                        <div className={`w-14 h-14 rounded-xl ${admin.avatarBg} border-2 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_0px_#1e1e1e]`}>
                          {admin.initials}
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                            {admin.badge}
                          </span>
                          <h3 className="text-base font-black leading-tight">{admin.nombre}</h3>
                          <p className="text-xs font-bold opacity-80">{admin.rol}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center font-black text-sm group-hover:bg-black group-hover:text-white transition-colors">
                          ➔
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <button onClick={() => setSelectedAdmin(null)} className="inline-flex items-center gap-1.5 text-xs font-black bg-gray-100 hover:bg-gray-200 border-2 border-black px-3 py-1.5 rounded-xl">
                    <ArrowLeft className="w-4 h-4" /> Cambiar Usuario
                  </button>
                  <div className="flex items-center gap-3 bg-gray-50 border-2 border-black rounded-2xl p-3">
                    <div className={`w-10 h-10 rounded-xl ${selectedAdmin.avatarBg} border-2 border-black flex items-center justify-center font-black text-sm`}>
                      {selectedAdmin.initials}
                    </div>
                    <div>
                      <h3 className="font-black text-sm leading-tight">{selectedAdmin.nombre}</h3>
                      <p className="text-xs text-gray-600 font-bold">{selectedAdmin.rol}</p>
                    </div>
                  </div>

                  <div className="flex justify-center items-center gap-3 py-2">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className={`w-12 h-12 rounded-2xl border-4 border-black flex items-center justify-center ${pin.length > index ? 'bg-[#F4C430] scale-105 shadow-[2px_2px_0px_0px_#1e1e1e]' : 'bg-gray-100'}`}>
                        {pin.length > index && <div className="w-4 h-4 bg-black rounded-full" />}
                      </div>
                    ))}
                  </div>

                  {error && <p className="text-xs font-black text-[#E63946] text-center bg-red-50 border-2 border-[#E63946] p-2 rounded-xl">{error}</p>}

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button key={num} onClick={() => handleNumClick(num.toString())} className="bg-white hover:bg-[#FFF9E6] border-2 border-black text-xl font-black rounded-2xl py-3 shadow-[3px_3px_0px_0px_#1e1e1e] active:translate-y-1 active:shadow-none">
                        {num}
                      </button>
                    ))}
                    <button onClick={handleClear} className="bg-red-100 hover:bg-red-200 border-2 border-black text-xs font-black rounded-2xl py-3 text-[#E63946] shadow-[3px_3px_0px_0px_#1e1e1e] uppercase">Borrar</button>
                    <button onClick={() => handleNumClick('0')} className="bg-white hover:bg-[#FFF9E6] border-2 border-black text-xl font-black rounded-2xl py-3 shadow-[3px_3px_0px_0px_#1e1e1e]">0</button>
                    <button onClick={handleBackspace} className="bg-gray-100 border-2 border-black flex items-center justify-center rounded-2xl py-3 shadow-[3px_3px_0px_0px_#1e1e1e]"><Delete className="w-5 h-5" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'pos' ? (
          /* ==================== POS CON FORMA DE PAGO SELECCIONABLE ==================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
                  {categories.map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs uppercase border-2 border-black transition-all whitespace-nowrap ${
                          selectedCategory === cat.id ? 'bg-[#F4C430] shadow-[3px_3px_0px_0px_#1e1e1e] -translate-y-0.5' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" /> {cat.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded-2xl pl-9 pr-4 py-2 text-xs font-bold focus:outline-none shadow-[2px_2px_0px_0px_#1e1e1e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white border-3 border-black rounded-3xl p-4 shadow-[4px_4px_0px_0px_#1e1e1e] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1e1e1e] active:translate-y-0 transition-all cursor-pointer flex flex-col justify-between border-2 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl p-2 bg-[#FFF9E6] border-2 border-black rounded-2xl shadow-[2px_2px_0px_0px_#1e1e1e]">
                          {product.emoji}
                        </span>
                        <span className="bg-[#F4C430] text-black font-black text-sm px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#1e1e1e]">
                          ${product.price}
                        </span>
                      </div>
                      <h3 className="font-black text-base leading-tight mb-1">{product.name}</h3>
                      <p className="text-xs font-bold text-gray-500 mb-3">{product.desc}</p>
                    </div>
                    <button className="w-full bg-black text-white hover:bg-[#E63946] font-black text-xs py-2 rounded-xl uppercase flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" /> Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CARRITO Y PANEL DE PAGO */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
              <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-[8px_8px_0px_0px_#1e1e1e] space-y-4">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-[#E63946]" />
                    <h2 className="font-black text-lg uppercase tracking-wider">Orden Actual</h2>
                  </div>
                  <span className="bg-black text-white font-black text-xs px-2.5 py-1 rounded-full">
                    {cart.reduce((s, i) => s + i.quantity, 0)} ítems
                  </span>
                </div>

                {orderSuccess && (
                  <div className="bg-green-100 border-3 border-green-800 text-green-900 p-3 rounded-2xl text-center animate-bounce">
                    <CheckCircle2 className="w-7 h-7 text-green-700 mx-auto" />
                    <p className="font-black text-xs uppercase">¡Venta cobrada e impresa con éxito!</p>
                  </div>
                )}

                <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-10 space-y-2 text-gray-400">
                      <ShoppingCart className="w-10 h-10 mx-auto stroke-1" />
                      <p className="font-black text-xs uppercase text-gray-500">Agrega productos</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="bg-[#FDFBF7] border-2 border-black rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-[2px_2px_0px_0px_#1e1e1e]">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-xs truncate">{item.name}</h4>
                          <p className="text-[11px] font-bold text-gray-500">
                            ${item.price} c/u = <span className="text-black font-extrabold">${item.price * item.quantity}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-lg bg-white border border-black font-black text-xs flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                          <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-lg bg-white border border-black font-black text-xs flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                          <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-lg bg-red-100 text-[#E63946] border border-black flex items-center justify-center ml-1"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* FORMA DE PAGO */}
                <div className="border-t-2 border-black pt-3 space-y-3">
                  <p className="text-[11px] font-black uppercase text-gray-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Seleccionar Forma de Pago:
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`p-2.5 rounded-2xl border-2 border-black font-black text-xs flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'efectivo'
                          ? 'bg-[#F4C430] shadow-[3px_3px_0px_0px_#1e1e1e] -translate-y-0.5'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <Banknote className="w-5 h-5" />
                      <span>Efectivo</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('tarjeta')}
                      className={`p-2.5 rounded-2xl border-2 border-black font-black text-xs flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'tarjeta'
                          ? 'bg-[#F4C430] shadow-[3px_3px_0px_0px_#1e1e1e] -translate-y-0.5'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>Tarjeta</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('transferencia')}
                      className={`p-2.5 rounded-2xl border-2 border-black font-black text-xs flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === 'transferencia'
                          ? 'bg-[#F4C430] shadow-[3px_3px_0px_0px_#1e1e1e] -translate-y-0.5'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <Zap className="w-5 h-5" />
                      <span>Transfer</span>
                    </button>
                  </div>

                  {/* CÁLCULO DE CAMBIO SI ES EFECTIVO */}
                  {paymentMethod === 'efectivo' && total > 0 && (
                    <div className="bg-[#FFF9E6] border-2 border-black p-2.5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span>Paga con ($):</span>
                        <input
                          type="number"
                          placeholder="Monto"
                          value={cashGiven}
                          onChange={(e) => setCashGiven(e.target.value)}
                          className="w-24 bg-white border-2 border-black rounded-lg px-2 py-1 text-right text-xs font-black"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs font-black text-[#E63946] border-t border-black/20 pt-1">
                        <span>Cambio a regresar:</span>
                        <span className="text-sm font-black">${changeValue}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-end pt-1">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-gray-500">Atendido por:</p>
                      <p className="text-xs font-black">{activeUser.nombre.split(' ')[0]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold uppercase text-gray-500">Total a Pagar:</p>
                      <p className="text-3xl font-black text-[#1E1E1E] leading-none">${total}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className={`w-full font-black py-3 rounded-2xl border-3 border-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      cart.length > 0
                        ? 'bg-[#F4C430] hover:bg-yellow-400 text-black shadow-[4px_4px_0px_0px_#1e1e1e] cursor-pointer'
                        : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Printer className="w-4 h-4" /> Cobrar e Imprimir Ticket (POS-58)
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'ventas' ? (
          /* ==================== VISTA HISTORIAL DE VENTAS ==================== */
          <div className="space-y-6">
            {/* CARDS RESUMEN DE VENTAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-3 border-black p-4 rounded-3xl shadow-[4px_4px_0px_0px_#1e1e1e] text-center">
                <p className="text-xs font-black text-gray-500 uppercase">Ventas Totales</p>
                <p className="text-3xl font-black text-[#1E1E1E]">${totalSalesAmount}</p>
                <p className="text-[10px] font-bold text-gray-400">{salesHistory.length} órdenes registradas</p>
              </div>

              <div className="bg-white border-3 border-black p-4 rounded-3xl shadow-[4px_4px_0px_0px_#1e1e1e] text-center">
                <p className="text-xs font-black text-gray-500 uppercase flex items-center justify-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-green-600" /> Efectivo
                </p>
                <p className="text-2xl font-black text-green-700">${salesByEfectivo}</p>
              </div>

              <div className="bg-white border-3 border-black p-4 rounded-3xl shadow-[4px_4px_0px_0px_#1e1e1e] text-center">
                <p className="text-xs font-black text-gray-500 uppercase flex items-center justify-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Tarjeta
                </p>
                <p className="text-2xl font-black text-blue-700">${salesByTarjeta}</p>
              </div>

              <div className="bg-white border-3 border-black p-4 rounded-3xl shadow-[4px_4px_0px_0px_#1e1e1e] text-center">
                <p className="text-xs font-black text-gray-500 uppercase flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-purple-600" /> Transferencia
                </p>
                <p className="text-2xl font-black text-purple-700">${salesByTransfer}</p>
              </div>
            </div>

            {/* TABLA DE VENTAS REGISTRADAS */}
            <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#1e1e1e] space-y-4">
              <h2 className="text-xl font-black uppercase flex items-center justify-center gap-2 border-b-2 border-black pb-3 text-center">
                <FileText className="w-6 h-6 text-[#E63946]" />
                Registro Detallado de Ventas
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-[#FFF9E6] border-2 border-black text-xs uppercase font-black">
                      <th className="p-3 border-r-2 border-black text-center">Hora / Fecha</th>
                      <th className="p-3 border-r-2 border-black text-center">Atendido Por</th>
                      <th className="p-3 border-r-2 border-black text-center">Productos</th>
                      <th className="p-3 border-r-2 border-black text-center">Método Pago</th>
                      <th className="p-3 border-r-2 border-black text-center">Total Venta</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black text-xs font-bold">
                    {salesHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-400 font-bold">
                          Aún no se han realizado ventas en esta sesión.
                        </td>
                      </tr>
                    ) : (
                      salesHistory.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50 border-b-2 border-black">
                          <td className="p-3 border-r-2 border-black font-bold text-center">
                            {sale.time} <span className="text-[10px] text-gray-400">({sale.date})</span>
                          </td>
                          <td className="p-3 border-r-2 border-black font-black text-center">{sale.atendidoPor}</td>
                          <td className="p-3 border-r-2 border-black text-center">
                            {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                          </td>
                          <td className="p-3 border-r-2 border-black text-center">
                            <span className="bg-gray-100 border border-black px-3 py-1 rounded-full text-[10px] font-black uppercase inline-block">
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3 border-r-2 border-black text-center font-black text-sm text-[#1E1E1E]">
                            ${sale.total}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => triggerPrintTicket(sale)}
                              className="bg-[#FFF9E6] hover:bg-[#F4C430] border-2 border-black px-2.5 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1 shadow-[2px_2px_0px_0px_#1e1e1e]"
                              title="Reimprimir Ticket"
                            >
                              <Printer className="w-3.5 h-3.5" /> Ticket
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'caja' ? (
          /* ==================== VISTA CONTROL DE CAJA (FONDO INICIAL EDITABLE) ==================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* PANEL DE CÁLCULO DE CAJA */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-[8px_8px_0px_0px_#1e1e1e] space-y-4">
                <h2 className="text-lg font-black uppercase border-b-2 border-black pb-2 flex items-center justify-center gap-2 text-center">
                  <Wallet className="w-5 h-5 text-[#E63946]" /> Resumen Efectivo en Caja
                </h2>

                <div className="space-y-2 text-xs font-bold">
                  {/* FONDO INICIAL ES UN INPUT EDITABLE */}
                  <div className="flex justify-between items-center p-2 bg-[#FFF9E6] rounded-xl border border-black">
                    <span className="font-black text-[#1E1E1E]">Fondo Inicial de Caja:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-black text-[#1E1E1E]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={initialCash}
                        onChange={(e) => setInitialCash(e.target.value)}
                        className="w-24 bg-white border-2 border-black rounded-lg px-2 py-0.5 text-right font-black text-xs text-[#1E1E1E] focus:bg-[#F4C430] outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between p-2 bg-green-50 rounded-xl border border-black text-green-800">
                    <span>(+) Ventas en Efectivo:</span>
                    <span className="font-black">+${salesByEfectivo}</span>
                  </div>

                  <div className="flex justify-between p-2 bg-blue-50 rounded-xl border border-black text-blue-800">
                    <span>(+) Ingresos Extra a Caja:</span>
                    <span className="font-black">+${totalIngresosExtra}</span>
                  </div>

                  <div className="flex justify-between p-2 bg-red-50 rounded-xl border border-black text-red-800">
                    <span>(-) Retiros / Salidas de Caja:</span>
                    <span className="font-black">-${totalRetiros}</span>
                  </div>

                  <div className="border-t-2 border-black pt-2 flex justify-between items-center">
                    <span className="font-black uppercase text-sm">Total Efectivo Teórico:</span>
                    <span className="text-2xl font-black text-[#1E1E1E] bg-[#F4C430] border-2 border-black px-3 py-0.5 rounded-xl">
                      ${cashInDrawerTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* FORMULARIO RETIRO / INGRESO */}
              <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-[8px_8px_0px_0px_#1e1e1e] space-y-3">
                <h3 className="font-black text-sm uppercase text-center">Registrar Entrada / Salida de Dinero</h3>

                <form onSubmit={handleAddMovement} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMovementType('retiro')}
                      className={`p-2 rounded-xl border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-1 ${
                        movementType === 'retiro' ? 'bg-[#E63946] text-white' : 'bg-gray-100'
                      }`}
                    >
                      <ArrowDownCircle className="w-4 h-4" /> Retiro (Salida)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType('ingreso')}
                      className={`p-2 rounded-xl border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-1 ${
                        movementType === 'ingreso' ? 'bg-green-600 text-white' : 'bg-gray-100'
                      }`}
                    >
                      <ArrowUpCircle className="w-4 h-4" /> Ingreso (Entrada)
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-gray-500 block text-center mb-1">Monto ($):</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej. 150.00"
                      value={movementAmount}
                      onChange={(e) => setMovementAmount(e.target.value)}
                      className="w-full bg-[#FDFBF7] border-2 border-black rounded-xl p-2 text-xs font-black text-center"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-gray-500 block text-center mb-1">Motivo / Concepto:</label>
                    <input
                      type="text"
                      placeholder="Ej. Compra de hielos, Cambio inicial"
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      className="w-full bg-[#FDFBF7] border-2 border-black rounded-xl p-2 text-xs font-bold text-center"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-[#F4C430] hover:text-black border-2 border-black font-black py-2.5 rounded-xl uppercase text-xs transition-colors"
                  >
                    Guardar Movimiento
                  </button>
                </form>
              </div>
            </div>

            {/* HISTORIAL MOVIMIENTOS CAJA */}
            <div className="lg:col-span-7 bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#1e1e1e] space-y-4">
              <h2 className="text-xl font-black uppercase border-b-2 border-black pb-3 text-center">Historial de Movimientos de Caja</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-[#FFF9E6] border-2 border-black text-xs uppercase font-black">
                      <th className="p-3 border-r-2 border-black text-center">Tipo</th>
                      <th className="p-3 border-r-2 border-black text-center">Hora / Fecha</th>
                      <th className="p-3 border-r-2 border-black text-center">Concepto</th>
                      <th className="p-3 border-r-2 border-black text-center">Barista</th>
                      <th className="p-3 text-center">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black text-xs font-bold">
                    {cashMovements.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-400 font-bold">
                          No hay retiros ni ingresos adicionales registrados hoy.
                        </td>
                      </tr>
                    ) : (
                      cashMovements.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50 border-b-2 border-black">
                          <td className="p-3 border-r-2 border-black text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-black inline-block ${
                              m.type === 'retiro' ? 'bg-red-100 text-[#E63946]' : 'bg-green-100 text-green-800'
                            }`}>
                              {m.type}
                            </span>
                          </td>
                          <td className="p-3 border-r-2 border-black font-bold text-center">
                            {m.time} <span className="text-[10px] text-gray-400">({m.date})</span>
                          </td>
                          <td className="p-3 border-r-2 border-black font-extrabold text-center">{m.reason}</td>
                          <td className="p-3 border-r-2 border-black text-center">{m.user}</td>
                          <td className={`p-3 text-center font-black ${m.type === 'retiro' ? 'text-red-600' : 'text-green-700'}`}>
                            {m.type === 'retiro' ? '-' : '+'}${m.amount}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'inventario' ? (
          /* ==================== INVENTARIO ==================== */
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#1e1e1e] space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-black pb-4 text-center sm:text-left">
              <div>
                <h2 className="text-xl font-black uppercase flex items-center justify-center sm:justify-start gap-2">
                  <Boxes className="w-6 h-6 text-[#E63946]" /> Control de Inventario & Insumos
                </h2>
                <p className="text-xs font-bold text-gray-500">Ajusta las existencias en tiempo real</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-[#F4C430] hover:bg-yellow-400 border-2 border-black font-black text-xs px-4 py-2 rounded-2xl shadow-[2px_2px_0px_0px_#1e1e1e] flex items-center justify-center gap-1.5 uppercase transition-all"
                >
                  <PlusCircle className="w-4 h-4" /> Agregar Insumo
                </button>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar insumo..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full bg-[#FDFBF7] border-2 border-black rounded-2xl pl-9 pr-4 py-2 text-xs font-bold shadow-[2px_2px_0px_0px_#1e1e1e] text-center"
                  />
                </div>
              </div>
            </div>

            {showAddModal && (
              <div className="bg-[#FFF9E6] border-3 border-black p-4 rounded-2xl space-y-3 shadow-[4px_4px_0px_0px_#1e1e1e]">
                <h3 className="font-black text-sm uppercase text-center">Nuevo Insumo</h3>
                <form onSubmit={handleAddNewItem} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <input type="text" placeholder="Nombre" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="bg-white border-2 border-black rounded-xl p-2 text-xs font-bold text-center" required />
                  <input type="text" placeholder="Categoría" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="bg-white border-2 border-black rounded-xl p-2 text-xs font-bold text-center" />
                  <input type="number" step="0.01" placeholder="Cantidad" value={newItem.stock} onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })} className="bg-white border-2 border-black rounded-xl p-2 text-xs font-bold text-center" required />
                  <select value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} className="bg-white border-2 border-black rounded-xl p-2 text-xs font-bold text-center">
                    <option value="Kg">Kg</option>
                    <option value="Litros">Litros</option>
                    <option value="Piezas">Piezas</option>
                    <option value="Botellas">Botellas</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-black text-white font-black text-xs py-2 rounded-xl uppercase">Guardar</button>
                    <button type="button" onClick={() => setShowAddModal(false)} className="bg-gray-200 border-2 border-black font-black text-xs px-3 rounded-xl">X</button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-[#FFF9E6] border-2 border-black text-xs uppercase font-black">
                    <th className="p-3 border-r-2 border-black text-center">Insumo</th>
                    <th className="p-3 border-r-2 border-black text-center">Categoría</th>
                    <th className="p-3 border-r-2 border-black text-center">Stock</th>
                    <th className="p-3 border-r-2 border-black text-center">Estado</th>
                    <th className="p-3 text-center">Modificar</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black text-xs font-bold">
                  {filteredInventory.map((item) => {
                    const isLow = item.stock <= item.minStock;
                    const isEditing = editingStockId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 border-b-2 border-black">
                        <td className="p-3 border-r-2 border-black font-black text-center">{item.name}</td>
                        <td className="p-3 border-r-2 border-black text-center">
                          <span className="bg-gray-100 border border-black px-2 py-0.5 rounded-md text-[10px] font-black uppercase inline-block">{item.category}</span>
                        </td>
                        <td className="p-3 border-r-2 border-black text-center font-black">{item.stock} <span className="text-xs text-gray-500 font-bold">{item.unit}</span></td>
                        <td className="p-3 border-r-2 border-black text-center">
                          {isLow ? <span className="bg-red-100 text-[#E63946] border border-[#E63946] px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-block">⚠️ Stock Bajo</span> : <span className="bg-green-100 text-green-800 border border-green-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-block">✓ Normal</span>}
                        </td>
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <input type="number" step="0.01" value={tempStockValue} onChange={(e) => setTempStockValue(e.target.value)} className="w-24 bg-white border-2 border-black px-2 py-1 rounded-lg text-xs font-black text-center" autoFocus />
                              <button onClick={() => saveStockValue(item.id)} className="bg-[#F4C430] border-2 border-black p-1 rounded-lg font-black"><Check className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <button onClick={() => startEditingStock(item)} className="bg-gray-100 hover:bg-[#FFF9E6] border-2 border-black px-3 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#1e1e1e]">
                              <Edit3 className="w-3.5 h-3.5" /> Cambiar Cantidad
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ==================== VISTA TURNOS ==================== */
          <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#1e1e1e] space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-black pb-4 text-center sm:text-left">
              <div>
                <h2 className="text-xl font-black uppercase flex items-center justify-center sm:justify-start gap-2">
                  <Clock className="w-6 h-6 text-[#E63946]" /> Control de Turnos de Baristas
                </h2>
                <p className="text-xs font-bold text-gray-500">Horarios en tiempo real registrados al Iniciar/Cerrar sesión</p>
              </div>

              {currentShiftStart && (
                <div className="bg-[#FFF9E6] border-2 border-black px-4 py-2 rounded-2xl flex items-center gap-2 shadow-[2px_2px_0px_0px_#1e1e1e]">
                  <span className="w-3 h-3 rounded-full bg-green-500 animate-ping" />
                  <p className="text-xs font-black">
                    Turno Activo desde: <span className="text-[#E63946]">{currentShiftStart.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-[#FFF9E6] border-2 border-black text-xs uppercase font-black">
                    <th className="p-3 border-r-2 border-black text-center">Administrador / Barista</th>
                    <th className="p-3 border-r-2 border-black text-center">Fecha</th>
                    <th className="p-3 border-r-2 border-black text-center">Hora Entrada</th>
                    <th className="p-3 border-r-2 border-black text-center">Hora Salida</th>
                    <th className="p-3 text-center">Tiempo Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black text-xs font-bold">
                  {shiftHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-400 font-bold">
                        Aún no hay turnos cerrados en esta sesión. Al dar clic en <strong>&quot;SALIR&quot;</strong> se guardará tu registro aquí.
                      </td>
                    </tr>
                  ) : (
                    shiftHistory.map((shift) => (
                      <tr key={shift.id} className="hover:bg-gray-50 border-b-2 border-black">
                        <td className="p-3 border-r-2 border-black font-black text-sm text-center">
                          ☕ {shift.adminName}
                        </td>
                        <td className="p-3 border-r-2 border-black text-center font-bold">
                          <span className="inline-flex items-center justify-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-500" />{shift.fecha}</span>
                        </td>
                        <td className="p-3 border-r-2 border-black text-center text-green-700 font-black">{shift.entrada}</td>
                        <td className="p-3 border-r-2 border-black text-center text-red-600 font-black">{shift.salida}</td>
                        <td className="p-3 text-center">
                          <span className="bg-[#F4C430] text-black border border-black px-2.5 py-1 rounded-full font-black text-[11px] shadow-[1px_1px_0px_0px_#1e1e1e] inline-block">
                            {shift.duracion}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto w-full text-center mt-6 pt-3 border-t-2 border-black/10">
        <p className="text-xs font-black text-gray-500">
          ☕ Snoopy&apos;s Shake POS System • Versión Completa (Ventas, Caja, Inventario y Turnos)
        </p>
      </footer>
    </div>
  );
}