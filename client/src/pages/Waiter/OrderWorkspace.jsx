import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Search,
  ShoppingCart,
  ChevronRight,
  Users,
  Loader2
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useCart } from '../../context/CartContext';
import './OrderWorkspace.css';

const OrderWorkspace = () => {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const tableNumberFromState = location.state?.tableNumber;
  const existingOrder = location.state?.existingOrder;
  const isEditing = location.state?.isEditing;

  const { getCartForTable, updateTableCart, addToCart: addToCartContext, updateQuantity: updateQuantityContext } = useCart();
  const tableCartData = getCartForTable(tableId);
  const cart = tableCartData.cart;

  const customerCount = existingOrder?.customerDetails?.numberOfGuests || tableCartData.customerCount || searchParams.get('customers') || '1';
  const orderNumber = existingOrder?.orderNumber || tableCartData.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialCartJson, setInitialCartJson] = useState('[]');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [tableData, setTableData] = useState(null);

  useEffect(() => {
    if (isEditing && existingOrder) {
      // Merge identical items from the existing order into a reference list
      const mergedItems = existingOrder.items.reduce((acc, item) => {
        const menuItemId = item.menuItem?._id || item.menuItem;
        const key = `${menuItemId}-${item.size}`;
        
        const existing = acc.find(i => i.id === key);
        if (existing) {
          existing.quantity += item.quantity;
          existing.totalPrice += (item.unitPrice || item.price) * item.quantity;
        } else {
          acc.push({
            ...item,
            id: key,
            menuItem: menuItemId,
            name: item.menuItem?.name || item.name,
            image: item.menuItem?.image || item.image,
            unitPrice: item.unitPrice || item.price,
            totalPrice: (item.unitPrice || item.price) * item.quantity
          });
        }
        return acc;
      }, []);

      // Always set initialCartJson for change detection logic
      setInitialCartJson(JSON.stringify(mergedItems));

      // Only initialize the cart state if we're not already editing this order
      // or if the cart is currently empty (first load of the edit session)
      if (tableCartData.orderNumber !== existingOrder.orderNumber || tableCartData.cart.length === 0) {
        console.log('DEBUG: Initializing edit cart for order:', existingOrder.orderNumber);
        updateTableCart(tableId, { 
          cart: mergedItems, 
          customerCount: existingOrder.customerDetails?.numberOfGuests || tableCartData.customerCount,
          orderNumber: existingOrder.orderNumber
        });
      }
    } else if (!tableCartData.orderNumber) {
      // Initial setup for new order - generate order number if not exists
      console.log('DEBUG: Initializing new order');
      updateTableCart(tableId, { 
        customerCount: searchParams.get('customers') || tableCartData.customerCount || '1',
        orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`
      });
    }
  }, [isEditing, existingOrder, tableId, tableCartData.orderNumber, tableCartData.cart.length]);

  useEffect(() => {
    if (isEditing) {
      setHasChanges(JSON.stringify(cart) !== initialCartJson);
    } else {
      setHasChanges(cart.length > 0);
    }
  }, [cart, initialCartJson, isEditing]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [menuRes, catRes] = await Promise.all([
          api.get('/api/menu'),
          api.get('/api/categories')
        ]);
        const items = menuRes.data.data || [];
        setMenuItems(items);
        setCategories(catRes.data.data || []);
        
        // Fetch table details separately to avoid blocking menu if it fails
        try {
          const tableRes = await api.get(`/api/tables/${tableId}`);
          if (tableRes.data.success) {
            setTableData(tableRes.data.data.table);
          }
        } catch (tableErr) {
          console.error('Error fetching table details:', tableErr);
        }

        // Initialize default sizes
        const defaults = {};
        items.forEach(item => {
          if (item.variants && item.variants.length > 0) {
            defaults[item._id] = item.variants[0];
          }
        });
        setSelectedSizes(defaults);
      } catch (error) {
        console.error('Error fetching menu data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const itemCategoryName = item.category?.name || '';
      const matchesCategory = activeCategory === 'All' ||
        item.foodType === activeCategory.toLowerCase() ||
        itemCategoryName === activeCategory;

      return matchesSearch && matchesCategory && !item.isBlocked;
    });
  }, [searchQuery, activeCategory, menuItems]);

  const handleSizeSelect = (itemId, variant) => {
    setSelectedSizes(prev => ({
      ...prev,
      [itemId]: variant
    }));
  };

  const addToCart = (item) => {
    const selectedVariant = selectedSizes[item._id] || (item.variants && item.variants[0]);
    if (!selectedVariant && item.variants?.length > 0) {
      alert("Please select a size first");
      return;
    }

    const sizeName = selectedVariant?.size || 'Standard';
    const price = item.hasOffer ? item.offerPrice : (selectedVariant?.price || 0);
    const cartItemId = `${item._id}-${sizeName}`;

    addToCartContext(tableId, {
      id: cartItemId,
      menuItem: item._id,
      name: item.name,
      price: price,
      unitPrice: price,
      size: sizeName,
      quantity: 1,
      totalPrice: price,
      image: item.image
    });
  };

  const updateCartQty = (id, delta) => {
    updateQuantityContext(tableId, id, delta);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="order-workspace menu-page">
        <div className="workspace-grid">
          {/* Menu Section */}
          <div className="menu-content-section">
            <div className="menu-sticky-header">
              <header className="workspace-header">
                <div className="header-left">
                  <button className="back-btn" onClick={() => navigate(`/waiter/tables/${tableId}`)}>
                    <ArrowLeft size={20} />
                  </button>
                  <div className="header-info">
                    <h1>Table {tableData?.tableNumber || tableNumberFromState || '00'}</h1>
                    <div className="table-meta">
                      <span className="order-id-tag">{orderNumber}</span>
                      <span className="divider"></span>
                      <Users size={16} />
                      <span>{customerCount} Customers</span>
                    </div>
                  </div>
                </div>
                <div className="search-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search food, drinks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  className={`mobile-cart-toggle ${cart.length > 0 ? 'has-items' : ''}`}
                  onClick={() => setIsCartOpen(!isCartOpen)}
                >
                  <ShoppingCart size={24} />
                  {cart.length > 0 && <span className="cart-badge">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
                </button>
              </header>

              <nav className="category-tabs no-scrollbar">
                <button
                  className={`category-tab ${activeCategory === 'All' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('All')}
                >
                  All
                </button>
                <button
                  className={`category-tab ${activeCategory === 'Veg' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('Veg')}
                >
                  Veg Only
                </button>
                <button
                  className={`category-tab ${activeCategory === 'Non-Veg' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('Non-Veg')}
                >
                  Non-Veg
                </button>
                <div className="tab-divider"></div>
                {categories.filter(c => c.isActive !== false).map(cat => (
                  <button
                    key={cat._id}
                    className={`category-tab ${activeCategory === cat.name ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.name)}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
            </div>

            <section className="menu-grid">
              {filteredItems.length === 0 ? (
                <div className="empty-menu-state">
                  <Loader2 className="empty-icon" size={48} />
                  <h3>No menu items found</h3>
                  <p>Try adjusting your search or category filters.</p>
                </div>
              ) : (
                filteredItems.map(item => {
                  const selectedVariant = selectedSizes[item._id] || (item.variants && item.variants[0]);
                  const displayPrice = item.hasOffer ? item.offerPrice : (selectedVariant?.price || 0);
                  const isOutOfStock = item.totalStock <= 0;

                  return (
                    <div key={item._id} className={`menu-card dinesync-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
                      <div className="item-image-wrapper">
                        <img
                          src={item.image ? (item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format'}
                          alt={item.name}
                          loading="lazy"
                        />
                        <span className={`type-tag ${item.foodType.toLowerCase()}`}>{item.foodType}</span>
                        {isOutOfStock && <div className="out-of-stock-overlay">Out of Stock</div>}
                      </div>
                      <div className="item-details">
                        <div className="item-header">
                          <div className="item-title-desc">
                            <h3>{item.name}</h3>
                            <p className="item-description-small">{item.description}</p>
                          </div>
                          <div className="price-badge-animated">
                            <span className="price">₹{displayPrice}</span>
                          </div>
                        </div>

                        {item.variants && item.variants.length > 0 && (
                          <div className="item-variants-selector">
                            <p className="selector-label">Select Size:</p>
                            <div className="variant-chips-group">
                              {item.variants.map((v, idx) => {
                                const isSelected = selectedVariant && selectedVariant.size === v.size;
                                return (
                                  <button
                                    key={idx}
                                    className={`variant-chip-btn ${isSelected ? 'active' : ''}`}
                                    onClick={() => handleSizeSelect(item._id, v)}
                                    disabled={isOutOfStock}
                                  >
                                    {v.size}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <button
                          className="add-to-cart-btn-modern"
                          onClick={() => addToCart(item)}
                          disabled={isOutOfStock}
                        >
                          <Plus size={18} />
                          {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>

          </div>

          {/* Cart Sidebar Section */}
          <aside className={`cart-sidebar-panel dinesync-card ${isCartOpen ? 'open' : ''}`}>
            {isCartOpen && (
              <button className="close-cart-btn" onClick={() => setIsCartOpen(false)}>
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="cart-header">
              <div className="cart-title">
                <ShoppingCart size={22} />
                <h2>Order Cart</h2>
              </div>
              <div className="cart-header-actions">
                <div className="add-item-shortcut" onClick={() => {
                  document.querySelector('.search-wrapper input')?.focus();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>
                  <Plus size={16} />
                  <span>Add Item</span>
                </div>
                <span className="item-count-badge">{cart.reduce((s, i) => s + i.quantity, 0)} Items</span>
              </div>
            </div>

            <div className="cart-items-scrollable no-scrollbar">
              {cart.length === 0 ? (
                <div className="empty-cart-state">
                  <div className="empty-illustration">
                    <ShoppingCart size={48} />
                  </div>
                  <h3>Your cart is empty</h3>
                  <p>Browse the menu and add items to your current order</p>
                </div>
              ) : (
                 cart.map(item => (
                  <div key={item.id} className="cart-item-card">
                    <div className="item-card-left">
                      <div className="item-card-image">
                        <img src={item.image || '/images/salad.png'} alt={item.name} />
                      </div>
                      <div className="item-card-details">
                        <span className="item-name">{item.name}</span>
                        <div className="item-meta-info">
                          <span className="item-size-badge">{item.size}</span>
                          <span className="item-unit-price">₹{item.unitPrice || item.price}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="item-card-right">
                      <div className="item-price-total">₹{item.totalPrice}</div>
                      <div className="item-card-actions">
                        <div className="qty-control-minimal">
                          <button onClick={() => updateCartQty(item.id, -1)} disabled={item.quantity <= 1}><Minus size={12} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateCartQty(item.id, 1)}><Plus size={12} /></button>
                        </div>
                        <button className="delete-item-icon" onClick={() => updateCartQty(item.id, -item.quantity)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-summary-footer">
              <div className="bill-details">
                <div className="bill-row">
                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="bill-row total">
                  <span>Grand Total</span>
                  <span>₹{cartTotal}</span>
                </div>
              </div>
              <div className="cart-actions-group">
                {isEditing && (
                  <button
                    className="dinesync-btn dinesync-btn-outline cancel-edit-btn"
                    onClick={() => navigate(`/waiter/order-details/${tableId}/${existingOrder?._id}`)}
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  className="dinesync-btn dinesync-btn-primary confirm-order-btn"
                  disabled={!hasChanges}
                  onClick={() => {
                    navigate(`/waiter/order-review/${tableId}`, {
                      state: {
                        cart,
                        customerCount,
                        orderNumber,
                        isEditing,
                        existingOrderId: existingOrder?._id,
                        tableNumber: tableData?.tableNumber || tableNumberFromState
                      }
                    });
                  }}
                >
                  {isEditing ? 'Review Changes' : 'Confirm Order'}
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </aside>
        </div>
    </div>
  );
};

export default OrderWorkspace;
