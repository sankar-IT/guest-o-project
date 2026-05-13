import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axiosInstance';
import { showToast } from '../utils/sweetAlert';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  // ---------------------------------------------------------
  // 1. Online/Customer Cart Logic (from develop)
  // ---------------------------------------------------------
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [storeStatus, setStoreStatus] = useState({ isOpen: true, message: '' });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const checkStoreStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/api/settings/status');
      setStoreStatus(data.data);
      return data.data.isOpen;
    } catch (error) {
      console.error('Error checking store status:', error);
      return true;
    }
  }, []);

  const addToCart = useCallback((item, variant) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item._id && i.size === variant.size);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: item._id,
        name: item.name,
        price: variant.price,
        size: variant.size,
        image: item.image,
        quantity: 1,
        foodType: item.foodType
      }];
    });
  }, []);

  const removeFromCart = useCallback((id, size) => {
    setCartItems(prev => prev.filter(i => !(i.id === id && i.size === size)));
  }, []);

  const updateQuantity = useCallback((id, size, delta) => {
    setCartItems(prev => prev.map(i => {
      if (i.id === id && i.size === size) {
        return { ...i, quantity: Math.max(1, i.quantity + delta) };
      }
      return i;
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedOffer(null);
  }, []);

  // ---------------------------------------------------------
  // 2. Waiter/POS Cart Logic (from HEAD)
  // ---------------------------------------------------------
  const [tableCarts, setTableCarts] = useState(() => {
    const saved = localStorage.getItem('tableCarts');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeTableId, setActiveTableId] = useState(null);

  useEffect(() => {
    localStorage.setItem('tableCarts', JSON.stringify(tableCarts));
  }, [tableCarts]);

  const addToTableCart = useCallback((tableId, item, variant) => {
    setTableCarts(prev => {
      const currentCart = prev[tableId] || [];
      const existingIndex = currentCart.findIndex(i => i.menuItem === item._id && i.size === variant.size);
      
      let newItems;
      if (existingIndex > -1) {
        newItems = [...currentCart];
        newItems[existingIndex].quantity += 1;
        newItems[existingIndex].totalPrice = newItems[existingIndex].quantity * newItems[existingIndex].unitPrice;
      } else {
        newItems = [...currentCart, {
          menuItem: item._id,
          name: item.name,
          image: item.image || '',
          size: variant.size || 'Standard',
          quantity: 1,
          unitPrice: variant.price,
          totalPrice: variant.price,
          foodType: item.foodType
        }];
      }
      return { ...prev, [tableId]: newItems };
    });
  }, []);

  const removeFromTableCart = useCallback((tableId, index) => {
    setTableCarts(prev => {
      const currentCart = prev[tableId] || [];
      const newItems = currentCart.filter((_, i) => i !== index);
      const newCarts = { ...prev, [tableId]: newItems };
      if (newItems.length === 0) delete newCarts[tableId];
      return newCarts;
    });
  }, []);

  const updateTableCartQuantity = useCallback((tableId, index, delta) => {
    setTableCarts(prev => {
      const currentCart = [...(prev[tableId] || [])];
      if (!currentCart[index]) return prev;
      
      const item = { ...currentCart[index] };
      item.quantity = Math.max(1, item.quantity + delta);
      item.totalPrice = item.quantity * item.unitPrice;
      currentCart[index] = item;
      
      return { ...prev, [tableId]: currentCart };
    });
  }, []);

  const clearTableCart = useCallback((tableId) => {
    setTableCarts(prev => {
      const newCarts = { ...prev };
      delete newCarts[tableId];
      return newCarts;
    });
  }, []);

  const getTableCart = useCallback((tableId) => {
    return tableCarts[tableId] || [];
  }, [tableCarts]);

  // ---------------------------------------------------------
  // 3. Totals & Offers Logic (merged)
  // ---------------------------------------------------------
  const cartSubtotal = useMemo(() => 
    cartItems.reduce((acc, i) => acc + (i.price * i.quantity), 0), 
  [cartItems]);

  const value = {
    // Online Cart
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    storeStatus,
    checkStoreStatus,

    // Waiter Cart
    tableCarts,
    addToTableCart,
    removeFromTableCart,
    updateTableCartQuantity,
    clearTableCart,
    getTableCart,
    activeTableId,
    setActiveTableId
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
