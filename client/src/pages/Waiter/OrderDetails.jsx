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
import api from '../../api/axiosInstance';
import './OrderDetails.css';

const OrderDetails = () => {
  const { tableId, orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [table, setTable] = useState(null);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnimating, setIsAnimating] = useState(null);

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

    if (orderId) {
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

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setIsDeleting(null);
  };

  const confirmRemoveItem = async () => {
    if (!isDeleting) return;

    try {
      // Start the removal animation
      setIsAnimating(isDeleting);
      setShowConfirmModal(false);

      // Wait for animation to finish (match CSS duration)
      setTimeout(async () => {
        try {
          const response = await api.patch(`/api/orders/${orderId}/items/${isDeleting}/remove`);

          if (response.data.success) {
            // Update items from the response to be most accurate
            setItems(response.data.data.items || []);
            setOrder(response.data.data);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
          }
        } catch (err) {
          console.error('Error removing item:', err);
          alert('Failed to remove item. Please try again.');
        } finally {
          setIsDeleting(null);
          setIsAnimating(null);
        }
      }, 400);
    } catch (error) {
      console.error('Error during item removal:', error);
      setIsDeleting(null);
      setIsAnimating(null);
    }
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
    navigate(`/waiter/order-review/${tableId}`, {
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
    navigate(`/waiter/tables/${tableId}`);
  };

  const handleAddItem = () => {
    navigate(`/waiter/order/${tableId}`, {
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
      <div className="ordered-details-page">
        <div className="skeleton-header"></div>
        <div className="skeleton-content">
          <div className="skeleton-main">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
          <div className="skeleton-sidebar"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="ordered-details-page empty-state">
        <div className="empty-content">
          <Info size={64} className="text-muted" />
          <h2>{error ? 'Error' : 'Order Not Found'}</h2>
          <p>{error || "We couldn't find the details for this order."}</p>
          <button className="dinesync-btn dinesync-btn-primary" onClick={() => navigate('/waiter/tables')}>
            Back to Tables
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (['delivered'].includes(s)) return 'status-green';
    if (['processing'].includes(s)) return 'status-yellow';
    if (['placed'].includes(s)) return 'status-red';
    if (['cancelled'].includes(s)) return 'status-gray';
    return '';
  };

  return (
    <div className="ordered-details-page page-fade-in">
      <header className="details-header">
        <div className="header-top">
          <button className="back-link-btn" onClick={handleCancel}>
            <ChevronLeft size={20} />
            <span>Back to Table</span>
          </button>
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
            <span className={`status-badge-large ${getStatusColor(order.orderStatus)}`}>
              {(order.orderStatus || '').charAt(0).toUpperCase() + (order.orderStatus || '').slice(1)}
            </span>
          </div>

          <div className="header-actions">
            <button className="icon-btn print-action-btn" onClick={handlePrint} title="Print Bill">
              <Printer size={20} />
            </button>
            <button className="icon-btn"><MoreVertical size={20} /></button>
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
              <div key={item._id || idx} className={`item-card dinesync-card ${isAnimating === (item._id || idx) ? 'item-removing' : ''}`}>
                <div className="item-main">
                  <div className="item-image">
                    <img src={item.menuItem?.image || '/images/salad.png'} alt={item.menuItem?.name} />
                  </div>
                  <div className="item-details">
                    <div className="item-header">
                      <h3>{item.menuItem?.name || 'Unknown Item'}</h3>
                      <span className={`status-pill ${getStatusColor(order.orderStatus)}`}>
                        {(order.orderStatus || '').charAt(0).toUpperCase() + (order.orderStatus || '').slice(1)}
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
                className="dinesync-btn dinesync-btn-primary full-width"
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

      {showConfirmModal && (
        <div className="dinesync-modal-overlay">
          <div className="dinesync-modal-content confirm-modal animate-slide-up">
            <div className="modal-icon warning">
              <AlertTriangle size={48} />
            </div>
            <h3>Remove Item?</h3>
            <p>Are you sure you want to remove this item from the order?</p>
            <div className="modal-footer">
              <button className="dinesync-btn dinesync-btn-secondary" onClick={handleCancelDelete}>Cancel</button>
              <button className="dinesync-btn dinesync-btn-danger" onClick={confirmRemoveItem}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="success-toast">
          <CheckCircle size={20} />
          <span>Item removed successfully</span>
        </div>
      )}

      {/* Printable bill remains the same */}
      <div className="printable-bill">
        {/* ... (keep existing bill content) */}
      </div>
    </div>
  );
};

export default OrderDetails;
