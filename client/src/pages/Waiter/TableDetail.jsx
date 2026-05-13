import api from '../../api/axiosInstance';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Clock,
  Receipt,
  Plus,
  ChevronRight,
  PlusCircle,
  AlertCircle,
  X,
  Minus,
  User
} from 'lucide-react';
import './TableDetail.css';

const TableDetail = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(1);

  useEffect(() => {
    const fetchTableDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/tables/${tableId}`);
        if (response.data.success) {
          setTable(response.data.data.table);
          const activeOrders = response.data.data.activeOrders || [];
          setOrders(activeOrders);
        }
      } catch (error) {
        console.error('Error fetching table details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTableDetails();
  }, [tableId]);

  const occupiedSeatsCount = table?.occupiedSeats || 0;
  const remainingSeats = table?.availableSeats ?? ((table?.capacity || 4) - occupiedSeatsCount);

  const calculateOrderTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const combinedTotal = orders.reduce((sum, order) => sum + (order.totalAmount || calculateOrderTotal(order.items)), 0);

  const handleAddNewOrder = () => {
    setIsModalOpen(true);
    setNewOrderCount(1);
  };

  const handleCreateOrder = () => {
    navigate(`/waiter/order/${tableId}?newOrder=true&customers=${newOrderCount}`, {
      state: { tableNumber: table?.tableNumber }
    });
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await api.patch(`/api/orders/${orderId}`, { orderStatus: newStatus });
      if (response.data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    }
  };

  if (loading) return <div className="loading-overlay">Loading...</div>;
  if (!table) return <div className="error-overlay">Table not found</div>;

  return (
    <div className="table-detail-container detailed-view">
      <header className="detailed-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/waiter/tables')}>
            <ArrowLeft size={20} />
          </button>
          <div className="title-group">
            <h1>Table {table.tableNumber}</h1>
            <span className="occupancy-badge">{occupiedSeatsCount}/{table.capacity} Capacity</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="dinesync-btn dinesync-btn-secondary">
            <Receipt size={18} />
            Split Bill
          </button>
          <button
            className="dinesync-btn dinesync-btn-primary"
            disabled={remainingSeats === 0}
            onClick={handleAddNewOrder}
          >
            <Plus size={18} />
            Add Order
          </button>
        </div>
      </header>

      <section className="occupancy-section-vertical dinesync-card">
        <div className="section-title">
          <Users size={18} />
          <h2>Seating Overview</h2>
        </div>
        <div className="seat-map">
          {[...Array(table.capacity)].map((_, i) => {
            const seatNum = i + 1;
            const isOccupied = i < occupiedSeatsCount;
            return (
              <div key={seatNum} className={`seat-item ${isOccupied ? 'occupied' : 'available'}`}>
                <div className="seat-icon">
                  <User size={16} />
                </div>
                <span className="seat-label">{seatNum}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="orders-grid-layout">
        <div className="active-orders-column">
          <div className="column-header">
            <h3>Active Orders</h3>
            <span className="badge">{orders.length}</span>
          </div>

          <div className="orders-stack">
            {orders.map((order) => {
              const orderTotal = order.totalAmount || calculateOrderTotal(order.items);
              return (
                <div
                  key={order._id}
                  className="dinesync-card order-card-modern clickable-card"
                  onClick={() => navigate(`/waiter/order-details/${tableId}/${order._id}`)}
                >
                  <div className="order-card-header">
                    <div className="order-info">
                      <div className="id-status">
                        <span className="order-id">#{order.orderNumber}</span>
                        <div className="status-selector-container">
                          <select
                            className={`status-pill-select ${(order.orderStatus || '').toLowerCase()}`}
                            value={order.orderStatus}
                            onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          >
                            <option value="placed">Placed</option>
                            <option value="processing">Processing</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                      <h4 className="customer-name">{order.customerDetails?.name || 'Walk-in'}</h4>
                      <div className="linked-seats">
                        <span className="seat-tag">{order.orderType}</span>
                      </div>
                    </div>
                    <div className="order-price-summary">
                      <span className="label">Amount</span>
                      <span className="value">₹{orderTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="order-items-preview">
                    {order.items.slice(0, 2).map((item, i) => (
                      <div key={i} className="preview-row">
                        <span>{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                        <span>₹{(item.quantity * item.price).toLocaleString()}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="more-items">+{order.items.length - 2} more items</div>
                    )}
                  </div>

                </div>
              );
            })}

            {remainingSeats > 0 ? (
              <div className="add-order-slot" onClick={handleAddNewOrder}>
                <div className="slot-content">
                  <div className="plus-icon">
                    <PlusCircle size={32} />
                  </div>
                  <h4>Seat Available</h4>
                  <p>Add new customer order to this table</p>
                  <button className="slot-btn">Create Order</button>
                </div>
              </div>
            ) : (
              <div className="full-capacity-notice">
                <AlertCircle size={20} />
                <span>All seats are occupied</span>
              </div>
            )}
          </div>
        </div>

        <aside className="billing-panel-detailed">
          <div className="dinesync-card summary-card-modern">
            <h3>Table Summary</h3>
            <div className="stat-rows">
              <div className="stat-row">
                <div className="stat-label">
                  <Clock size={16} />
                  <span>Active Since</span>
                </div>
                <span className="stat-value">
                  {orders.length > 0 ? new Date(orders[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </span>
              </div>
              <div className="stat-row">
                <div className="stat-label">
                  <Users size={16} />
                  <span>Total Orders</span>
                </div>
                <span className="stat-value">{orders.length} Active</span>
              </div>
            </div>

            <div className="billing-divider"></div>

            <div className="billing-totals">
              {orders.map(order => (
                <div key={order._id} className="bill-split-row">
                  <span>Order #{order.orderNumber}</span>
                  <span>₹{(order.totalAmount || calculateOrderTotal(order.items)).toLocaleString()}</span>
                </div>
              ))}
              <div className="total-row-main">
                <span>Combined Total</span>
                <span className="amount">₹{combinedTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="panel-actions">
              <button className="dinesync-btn dinesync-btn-primary full-width large">
                Finalize & Checkout
                <ChevronRight size={20} />
              </button>
              <button className="dinesync-btn dinesync-btn-secondary full-width">
                Print All Drafts
              </button>
            </div>
          </div>
        </aside>
      </div>

      {isModalOpen && (
        <div className="dinesync-modal-overlay">
          <div className="dinesync-modal-content animate-slide-up">
            <div className="modal-header">
              <div className="header-text">
                <h3>New Customer Order</h3>
                <p>Table {table.tableNumber} • Available Seats: {remainingSeats}</p>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="customer-selector">
                <label>How many customers?</label>
                <div className="stepper">
                  <button
                    disabled={newOrderCount <= 1}
                    onClick={() => setNewOrderCount(prev => prev - 1)}
                  >
                    <Minus size={20} />
                  </button>
                  <span className="count-display">{newOrderCount}</span>
                  <button
                    disabled={newOrderCount >= remainingSeats}
                    onClick={() => setNewOrderCount(prev => prev + 1)}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {newOrderCount >= remainingSeats && remainingSeats > 0 && (
                  <span className="validation-msg">Maximum available capacity reached</span>
                )}
              </div>

              <div className="occupancy-preview">
                <label>Seating Preview</label>
                <div className="seat-visual-map">
                  {[...Array(table.capacity)].map((_, i) => {
                    const seatNum = i + 1;
                    const isOccupied = i < occupiedSeatsCount;
                    const isTentative = !isOccupied && (i < occupiedSeatsCount + newOrderCount);

                    return (
                      <div key={seatNum} className={`seat-indicator ${isOccupied ? 'occupied' : isTentative ? 'tentative' : 'available'}`}>
                        <User size={16} />
                        <span className="seat-num">{seatNum}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="legend">
                  <div className="legend-item"><span className="dot occupied"></span> Occupied</div>
                  <div className="legend-item"><span className="dot tentative"></span> New Order</div>
                  <div className="legend-item"><span className="dot available"></span> Available</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="dinesync-btn dinesync-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="dinesync-btn dinesync-btn-primary" onClick={handleCreateOrder}>
                Proceed to Menu
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableDetail;
