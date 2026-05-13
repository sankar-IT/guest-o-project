import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Structure: { [tableId]: { cart: [], customerCount: 1, orderNumber: '...' } }
  const [tableCarts, setTableCarts] = useState(() => {
    const saved = localStorage.getItem('waiter_carts');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('waiter_carts', JSON.stringify(tableCarts));
  }, [tableCarts]);

  const getCartForTable = (tableId) => {
    return tableCarts[tableId] || { cart: [], customerCount: 1, orderNumber: null };
  };

  const updateTableCart = (tableId, data) => {
    setTableCarts(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        ...data
      }
    }));
  };

  const clearTableCart = (tableId) => {
    setTableCarts(prev => {
      const newCarts = { ...prev };
      delete newCarts[tableId];
      return newCarts;
    });
  };

  const addToCart = (tableId, item) => {
    setTableCarts(prev => {
      const tableData = prev[tableId] || { cart: [], customerCount: 1 };
      const existingItemIndex = tableData.cart.findIndex(i => i.id === item.id);
      
      let newCart;
      if (existingItemIndex > -1) {
        newCart = [...tableData.cart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + item.quantity,
          totalPrice: newCart[existingItemIndex].totalPrice + item.totalPrice
        };
      } else {
        newCart = [...tableData.cart, item];
      }

      return {
        ...prev,
        [tableId]: {
          ...tableData,
          cart: newCart
        }
      };
    });
  };

  const removeFromCart = (tableId, itemId) => {
    setTableCarts(prev => {
      const tableData = prev[tableId];
      if (!tableData) return prev;
      
      return {
        ...prev,
        [tableId]: {
          ...tableData,
          cart: tableData.cart.filter(item => item.id !== itemId)
        }
      };
    });
  };

  const updateQuantity = (tableId, itemId, delta) => {
    setTableCarts(prev => {
      const tableData = prev[tableId];
      if (!tableData) return prev;
      
      const newCart = tableData.cart.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(0, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            totalPrice: item.unitPrice * newQty
          };
        }
        return item;
      }).filter(item => item.quantity > 0);

      return {
        ...prev,
        [tableId]: {
          ...tableData,
          cart: newCart
        }
      };
    });
  };

  return (
    <CartContext.Provider value={{ 
      getCartForTable, 
      updateTableCart, 
      clearTableCart, 
      addToCart, 
      removeFromCart, 
      updateQuantity 
    }}>
      {children}
    </CartContext.Provider>
  );
};
