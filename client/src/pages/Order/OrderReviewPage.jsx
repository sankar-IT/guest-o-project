import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  ClipboardList, 
  ChevronRight,
  UtensilsCrossed,
  Info,
  CheckCircle2
} from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import api from '../../api/axiosInstance';
import './OrderReviewPage.css';

const OrderReviewPage = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get cart data passed from OrderWorkspace
  const initialCart = location.state?.cart || [];
  const customerCount = location.state?.customerCount || 1;
  const orderNumber = location.state?.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const isEditing = location.state?.isEditing;
  const existingOrderId = location.state?.existingOrderId;

  const [cart, setCart] = useState(initialCart);
  const [instructions, setInstructions] = useState('');
  const [isPlaced, setIsPlaced] = useState(false);

  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), 
  [cart]);
  
  const total = subtotal;

  const updateQty = (id, delta) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ).filter(item => item.quantity > 0));
  };

  const handlePlaceOrder = async () => {
    try {
      const orderData = {
        tableId,
        customerCount,
        orderSource: 'waiter',
        items: cart.map(item => ({
          menuItem: item.menuItem,
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice || item.price,
          price: item.price,
          totalPrice: item.totalPrice || (item.price * item.quantity),
          image: item.image
        })),
        customerDetails: {
          numberOfGuests: customerCount
        }
      };

      let response;
      if (isEditing && existingOrderId) {
        response = await api.patch(`/api/orders/${existingOrderId}`, orderData);
      } else {
        response = await api.post('/api/orders', orderData);
      }
      
      if (response.data.success) {
        setIsPlaced(true);
        setTimeout(() => {
          navigate(`/staff/detail/${tableId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to process order. Please try again.');
    }
  };

  if (isPlaced) {
    return (
      <div className="order-success-overlay">
        <div className="success-content">
          <div className="success-icon-wrapper">
            <CheckCircle2 size={80} className="text-success" />
          </div>
          <h1>{isEditing ? 'Order Updated!' : 'Order Placed!'}</h1>
          <p>{isEditing ? 'Changes have been saved successfully.' : 'Sending items to the kitchen for preparation.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main order-review-page">
        <div className="review-container">
          {/* Header */}
          <header className="review-header">
            <div className="header-left">
              <button className="back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
              </button>
              <div className="header-title-group">
                <h1>{isEditing ? 'Review Changes' : 'Review Order'}</h1>
                <div className="header-meta">
                  <span className="table-badge">Table {tableId || '05'}</span>
                  <span className="order-dot"></span>
                  <span className="order-id">{orderNumber}</span>
                  <span className="order-dot"></span>
                  <span className="customer-count">{customerCount} People</span>
                </div>
              </div>
            </div>
          </header>

          <div className="review-content-grid">
            {/* Left Column: Order Items */}
            <div className="review-main-content">
              <section className="order-summary-section dinesync-card">
                <div className="section-header">
                  <ClipboardList size={20} />
                  <h2>Order Summary</h2>
                </div>
                
                <div className="order-items-list">
                  {cart.length === 0 ? (
                    <div className="empty-review">
                      <p>No items in cart</p>
                      <button className="dinesync-btn dinesync-btn-secondary" onClick={() => navigate(-1)}>
                        Go Back to Menu
                      </button>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="review-item-card">
                        <div className="item-info">
                          <div className="item-title-row">
                            <span className="item-name">{item.name}</span>
                            <span className="item-size-badge">{item.size}</span>
                          </div>
                          <span className="item-unit-price">₹{item.price} per unit</span>
                        </div>
                        <div className="item-actions">
                          <div className="qty-controls">
                            <button onClick={() => updateQty(item.id, -1)}><Minus size={16} /></button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, 1)}><Plus size={16} /></button>
                          </div>
                          <div className="item-total">₹{item.totalPrice || (item.price * item.quantity)}</div>
                          <button className="remove-btn" onClick={() => updateQty(item.id, -item.quantity)}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="special-instructions dinesync-card">
                <div className="section-header">
                  <Info size={20} />
                  <h2>Special Instructions</h2>
                </div>
                <textarea 
                  placeholder="Example: Less spicy, No onions, allergy warnings..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="instructions-input"
                />
              </section>
            </div>

            {/* Right Column: Pricing & Payment */}
            <div className="review-side-panel">
              <section className="pricing-card dinesync-card">
                <h2>Payment Details</h2>
                <div className="bill-breakdown">
                  <div className="bill-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="bill-divider"></div>
                  <div className="bill-row total">
                    <span>Grand Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </section>

              <div className="action-buttons-stack">
                <button 
                  className="dinesync-btn dinesync-btn-primary place-order-btn-large"
                  disabled={cart.length === 0}
                  onClick={handlePlaceOrder}
                >
                  <UtensilsCrossed size={20} />
                  {isEditing ? 'Save Changes' : 'Place Order to Kitchen'}
                  <ChevronRight size={20} />
                </button>
                <button 
                  className="dinesync-btn dinesync-btn-outline full-width"
                  onClick={() => navigate(`/staff/detail/${tableId}`)}
                >
                  {isEditing ? 'Cancel Changes' : 'Back to Table'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderReviewPage;
