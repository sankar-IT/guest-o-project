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
  const [settings, setSettings] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/api/settings');
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, []);

  const checkStoreStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/api/settings/status');
      if (data.success) {
        setStoreStatus(data.data);
        return data.data.isOpen;
      }
      return true;
    } catch (error) {
      console.error('Error checking store status:', error);
      return true;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    checkStoreStatus();
  }, [fetchSettings, checkStoreStatus]);

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
      const tableData = prev[tableId] || { cart: [], customerCount: '1', orderNumber: null };
      const currentCart = tableData.cart || [];
      
      const itemToMatch = {
        menuItem: item._id || item.menuItem,
        size: variant?.size || item.size || 'Standard'
      };

      const existingIndex = currentCart.findIndex(i => 
        i.menuItem === itemToMatch.menuItem && i.size === itemToMatch.size
      );

      let newCart;
      if (existingIndex > -1) {
        newCart = currentCart.map((cartItem, idx) => {
          if (idx === existingIndex) {
            const newQty = cartItem.quantity + 1;
            return {
              ...cartItem,
              quantity: newQty,
              totalPrice: newQty * (cartItem.unitPrice || cartItem.price)
            };
          }
          return cartItem;
        });
      } else {
        const price = variant?.price || item.unitPrice || item.price || 0;
        const newItem = {
          id: `${itemToMatch.menuItem}-${itemToMatch.size}`,
          menuItem: itemToMatch.menuItem,
          name: item.name,
          image: item.image || '',
          size: itemToMatch.size,
          quantity: 1,
          unitPrice: price,
          price: price,
          totalPrice: price,
          foodType: item.foodType
        };
        newCart = [...currentCart, newItem];
      }
      return { ...prev, [tableId]: { ...tableData, cart: newCart } };
    });
  }, []);

  const updateTableCart = useCallback((tableId, data) => {
    setTableCarts(prev => {
      const current = prev[tableId] || { cart: [], customerCount: '1', orderNumber: null };
      return {
        ...prev,
        [tableId]: { ...current, ...data }
      };
    });
  }, []);

  const getCartForTable = useCallback((tableId) => {
    const data = tableCarts[tableId] || { cart: [], customerCount: '1', orderNumber: null };
    return data;
  }, [tableCarts]);

  const removeFromTableCart = useCallback((tableId, index) => {
    setTableCarts(prev => {
      const tableData = prev[tableId] || { cart: [] };
      const newItems = (tableData.cart || []).filter((_, i) => i !== index);
      return { ...prev, [tableId]: { ...tableData, cart: newItems } };
    });
  }, []);

  const updateTableCartQuantity = useCallback((tableId, itemId, delta) => {
    setTableCarts(prev => {
      const tableData = prev[tableId] || { cart: [] };
      const currentCart = [...(tableData.cart || [])];
      const index = currentCart.findIndex(i => i.id === itemId);
      
      if (index === -1) return prev;

      const newQuantity = currentCart[index].quantity + delta;
      
      if (newQuantity <= 0) {
        // Remove item if quantity is 0 or less
        const newCart = currentCart.filter((_, i) => i !== index);
        return { ...prev, [tableId]: { ...tableData, cart: newCart } };
      }

      const item = { ...currentCart[index] };
      item.quantity = newQuantity;
      item.totalPrice = item.quantity * (item.unitPrice || item.price);
      currentCart[index] = item;

      return { ...prev, [tableId]: { ...tableData, cart: currentCart } };
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
    settings,
    checkStoreStatus,
    fetchSettings,

    // Waiter Cart
    tableCarts,
    addToTableCart,
    removeFromTableCart,
    updateTableCartQuantity,
    updateQuantity: updateTableCartQuantity, // Alias for waiter pages
    clearTableCart,
    getTableCart,
    getCartForTable,
    updateTableCart,
    activeTableId,
    setActiveTableId
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
