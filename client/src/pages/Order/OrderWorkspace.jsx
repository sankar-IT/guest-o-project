import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
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
import './OrderWorkspace.css';

const OrderWorkspace = () => {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const existingOrder = location.state?.existingOrder;
  const isEditing = location.state?.isEditing;

  const customerCount = existingOrder?.customerDetails?.numberOfGuests || searchParams.get('customers') || '1';
  const orderNumber = existingOrder?.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialCartJson, setInitialCartJson] = useState('[]');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});

  useEffect(() => {
    if (isEditing && existingOrder) {
      // Merge identical items from the existing order into the cart state
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

      console.log('DEBUG: Loaded and merged items into cart:', mergedItems);
      setCart(mergedItems);
      setInitialCartJson(JSON.stringify(mergedItems));
    }
  }, [isEditing, existingOrder]);

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
        console.log('Variants data from backend:', items.map(i => ({ name: i.name, variants: i.variants })));
        setMenuItems(items);
        setCategories(catRes.data.data || []);

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

    console.log('Adding to cart (merging enabled):', { product: item.name, size: sizeName, price });

    const existing = cart.find(i => i.id === cartItemId);
    if (existing) {
      setCart(cart.map(i => i.id === cartItemId ? {
        ...i,
        quantity: i.quantity + 1,
        totalPrice: (i.quantity + 1) * price
      } : i));
    } else {
      setCart([...cart, {
        id: cartItemId,
        menuItem: item._id,
        name: item.name,
        price: price, // For compatibility
        unitPrice: price,
        size: sizeName,
        quantity: 1,
        totalPrice: price,
        image: item.image
      }]);
    }
  };

  const updateCartQty = (id, delta) => {
    setCart(cart.map(item =>
      item.id === id ? {
        ...item,
        quantity: Math.max(0, item.quantity + delta),
        totalPrice: Math.max(0, item.quantity + delta) * item.price
      } : item
    ).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (isLoading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={48} />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main order-workspace menu-page">
        <div className="workspace-grid">
          {/* Menu Section */}
          <div className="menu-content-section">
            <div className="menu-sticky-header">
              <header className="workspace-header">
                <div className="header-left">
                  <button className="back-btn" onClick={() => navigate(`/staff/detail/${tableId}`)}>
                    <ArrowLeft size={20} />
                  </button>
                  <div className="header-info">
                    <h1>Table {tableId || '05'}</h1>
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
              {filteredItems.map(item => {
                const selectedVariant = selectedSizes[item._id] || (item.variants && item.variants[0]);
                const displayPrice = item.hasOffer ? item.offerPrice : (selectedVariant?.price || 0);
                const isOutOfStock = item.totalStock <= 0;

                return (
                  <div key={item._id} className={`menu-card dinesync-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
                    <div className="item-image-wrapper">
                      <img
                        src={item.image ? (item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format'}
                        alt={item.name}
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
                        className="add-to-cart-btn"
                        onClick={() => addToCart(item)}
                        disabled={isOutOfStock}
                      >
                        <Plus size={18} />
                        {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                );
              })}
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
                    onClick={() => navigate(`/staff/order-details/${tableId}/${existingOrder?._id}`)}
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  className="dinesync-btn dinesync-btn-primary confirm-order-btn"
                  disabled={!hasChanges}
                  onClick={() => {
                    navigate(`/staff/order-review/${tableId}`, {
                      state: {
                        cart,
                        customerCount,
                        orderNumber,
                        isEditing,
                        existingOrderId: existingOrder?._id
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
      </main>
    </div>
  );
};

export default OrderWorkspace;
