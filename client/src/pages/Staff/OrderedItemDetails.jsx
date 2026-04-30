import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  Printer,
  RefreshCcw,
  ChevronLeft,
  Receipt,
  Info,
  MoreVertical,
  ChevronRight,
  Edit2,
  Hash,
  Trash2,
  Plus,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar/Sidebar';
import api from '../../api/axiosInstance';
import './OrderedItemDetails.css';

const OrderedItemDetails = () => {
  const { tableId, orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [table, setTable] = useState(null);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null); // Stores item ID being deleted
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/orders/${orderId}`);

        if (response.data.success) {
          const orderData = response.data.data;
          setOrder(orderData);
          setItems(orderData.items || []);
          setTable(orderData.table);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (tableId) {
      fetchDetails();
    }
  }, [tableId, orderId]);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  const total = subtotal;

  const handleRemoveClick = (itemId) => {
    setIsDeleting(itemId);
    setShowConfirmModal(true);
  };

  const confirmRemoveItem = () => {
    if (!isDeleting) return;
    
    // Remove instantly from UI with animation
    const updatedItems = items.filter(item => (item._id || item.id) !== isDeleting);
    setItems(updatedItems);
    
    setShowConfirmModal(false);
    setIsDeleting(null);
    
    // Show success toast
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const response = await api.patch(`/api/orders/${orderId}`, {
        items: items.map(item => ({
          menuItem: item.menuItem?._id || item.menuItem,
          size: item.size || 'Regular',
          quantity: item.quantity,
          price: item.price,
          instructions: item.instructions
        }))
      });

      if (response.data.success) {
        setOrder(response.data.data);
        alert('Order updated successfully');
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReviewChanges = () => {
    navigate(`/staff/order-review/${tableId}`, {
      state: {
        cart: items.map(item => ({
          id: item.menuItem?._id || item.menuItem,
          name: item.menuItem?.name || 'Item',
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          instructions: item.instructions
        })),
        customerCount: order?.customerDetails?.numberOfGuests || 1,
        orderNumber: order?.orderNumber,
        isEditing: true,
        existingOrderId: orderId
      }
    });
  };

  const handleCancel = () => {
    navigate(`/staff/detail/${tableId}`);
  };

  const handleAddItem = () => {
    navigate(`/order/${tableId}`, {
      state: {
        existingOrder: order,
        isEditing: true
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main ordered-details-page">
          <div className="skeleton-header"></div>
          <div className="skeleton-content">
            <div className="skeleton-main">
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
            </div>
            <div className="skeleton-sidebar"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main ordered-details-page empty-state">
          <div className="empty-content">
            <Info size={64} className="text-muted" />
            <h2>{error ? 'Error' : 'Order Not Found'}</h2>
            <p>{error || "We couldn't find the details for this order. It might have been cleared or cancelled."}</p>
            <button className="dinesync-btn dinesync-btn-primary" onClick={() => navigate('/staff/tables')}>
              Back to Tables
            </button>
          </div>
        </main>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (['served', 'delivered', 'ready'].includes(s)) return 'status-green';
    if (['preparing', 'processing'].includes(s)) return 'status-yellow';
    if (['pending', 'placed'].includes(s)) return 'status-red';
    if (['approved', 'ready'].includes(s)) return 'status-blue';
    return '';
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main ordered-details-page page-fade-in">
        <header className="details-header">
          <div className="header-top">
            <button className="back-link-btn" onClick={handleCancel}>
              <ChevronLeft size={20} />
              <span>Back to Table</span>
            </button>
            <div className="header-actions">
              <button className="icon-btn print-action-btn" onClick={handlePrint} title="Print Bill">
                <Printer size={20} />
              </button>
              <button className="icon-btn"><MoreVertical size={20} /></button>
            </div>
          </div>

          <div className="header-main-info">
            <div className="info-group">
              <span className="label">Table</span>
              <h1 className="value">Table #{table?.tableNumber || order.orderNumber}</h1>
            </div>
            <div className="divider"></div>
            <div className="info-group">
              <span className="label">Type</span>
              <div className="value-with-icon">
                <span className="capitalize">{order.orderType}</span>
              </div>
            </div>
            <div className="divider"></div>
            <div className="info-group">
              <span className="label">Order Time</span>
              <div className="value-with-icon">
                <Clock size={18} />
                <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <div className="info-group">
              <span className="label">Order ID</span>
              <div className="value-with-icon">
                <Hash size={18} />
                <span>{order.orderNumber}</span>
              </div>
            </div>
            <div className="divider"></div>
            <div className="info-group">
              <span className="label">Overall Status</span>
              <span className={`status-badge-large ${getStatusColor(order.orderStatus || order.status)}`}>
                {order.orderStatus || order.status}
              </span>
            </div>
          </div>
        </header>

        <div className="details-content-grid">
          <section className="items-section">
            <div className="section-header">
              <h2>Ordered Items</h2>
              <span className="item-count">{items.length} Items</span>
            </div>

            <div className="items-list">
              {items.map((item, idx) => (
                <div key={item._id || idx} className={`item-card dinesync-card ${isDeleting === (item._id || idx) ? 'item-removing' : ''}`}>
                  <div className="item-main">
                    <div className="item-image">
                      <img src={item.menuItem?.image || '/images/salad.png'} alt={item.menuItem?.name} />
                    </div>
                    <div className="item-details">
                      <div className="item-header">
                        <h3>{item.menuItem?.name || 'Unknown Item'}</h3>
                        <span className={`status-pill ${getStatusColor(item.kitchenStatus || order.orderStatus || order.status)}`}>
                          {item.kitchenStatus || order.orderStatus || order.status}
                        </span>
                      </div>
                      <div className="item-meta">
                        <span className="portion">{item.size || 'Regular'} Portion</span>
                        <span className="dot"></span>
                        <span className="quantity">Qty: {item.quantity}</span>
                      </div>
                      {item.instructions && (
                        <div className="item-instructions">
                          <Info size={14} />
                          <span>{item.instructions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="item-right-group">
                    <div className="item-pricing">
                      <div className="price-unit">₹{item.price.toLocaleString()} / item</div>
                      <div className="price-total">₹{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                    <button 
                      className="remove-item-btn" 
                      onClick={() => handleRemoveClick(item._id || idx)}
                      title="Remove Item"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="summary-sidebar">
            <div className="summary-card dinesync-card">
              <h3>Order Summary</h3>
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="divider-dashed"></div>
                <div className="summary-row total">
                  <span>Grand Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="action-buttons-grid">
                <button
                  className="dinesync-btn dinesync-btn-outline"
                  onClick={handleAddItem}
                >
                  <Plus size={18} />
                  Add Item
                </button>
                <button
                  className="dinesync-btn dinesync-btn-primary"
                  disabled={isSaving}
                  onClick={handleSaveChanges}
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  className="dinesync-btn dinesync-btn-secondary full-width"
                  onClick={handleReviewChanges}
                >
                  <Receipt size={18} />
                  Review Changes
                </button>
                <button className="dinesync-btn dinesync-btn-outline full-width" onClick={handleCancel}>
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="dinesync-modal-overlay">
            <div className="dinesync-modal-content confirm-modal animate-slide-up">
              <div className="modal-icon warning">
                <AlertTriangle size={48} />
              </div>
              <h3>Remove Item?</h3>
              <p>Are you sure you want to remove this item from the order?</p>
              <div className="modal-footer">
                <button className="dinesync-btn dinesync-btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                <button className="dinesync-btn dinesync-btn-danger" onClick={confirmRemoveItem}>Remove</button>
              </div>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="success-toast">
            <CheckCircle size={20} />
            <span>Item removed successfully</span>
          </div>
        )}

        {/* Printable Bill Template */}
        <div className="printable-bill">
          <div className="bill-header">
            <h1>GUESTO RESTO</h1>
            <p>123 Restaurant Street, City Name</p>
            <p>Phone: +91 98765 43210</p>
            <div className="bill-divider-solid"></div>
            <h2>GUEST CHECK</h2>
          </div>
          
          <div className="bill-info">
            <div className="info-row">
              <span>Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="info-row">
              <span>Time:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="info-row">
              <span>Table:</span>
              <span>#{table?.tableNumber || order.orderNumber}</span>
            </div>
            <div className="info-row">
              <span>Order ID:</span>
              <span>{order.orderNumber}</span>
            </div>
          </div>

          <div className="bill-divider-solid"></div>

          <table className="bill-items-table">
            <thead>
              <tr>
                <th align="left">Item</th>
                <th align="center">Qty</th>
                <th align="right">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="bill-item-name">{item.menuItem?.name}</div>
                    <div className="bill-item-size">{item.size}</div>
                  </td>
                  <td align="center">{item.quantity}</td>
                  <td align="right">₹{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bill-divider-solid"></div>

          <div className="bill-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>GRAND TOTAL</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="bill-footer">
            <div className="bill-divider-solid"></div>
            <p>Thank You for Visiting!</p>
            <p>Please visit again.</p>
            <div className="qr-placeholder">
              {/* Optional: Add a QR code for feedback or payment */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderedItemDetails;
