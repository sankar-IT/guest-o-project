import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Filter,
  Clock,
  ChevronRight,
  Menu as MenuIcon
} from 'lucide-react';
import api from '../../api/axiosInstance';
import './WaiterOrders.css';

const WaiterOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();
  const { setIsSidebarOpen } = useOutletContext() || { setIsSidebarOpen: () => { } };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/orders');
        if (response.data.success) {
          setOrders(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = filter === 'All'
    ? orders
    : orders.filter(o => o.orderStatus?.toLowerCase() === filter.toLowerCase());

  return (
    <div className="waiter-orders-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="title-row">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <MenuIcon size={24} />
            </button>
            <h1>Active Orders</h1>
          </div>
          <p className="subtitle">Monitor and manage all active table orders</p>
        </div>
      </header>

      <section className="dashboard-controls">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input type="text" placeholder="Search orders by ID or table..." />
        </div>
        <div className="filter-chips">
          {['All', 'Placed', 'Processing', 'Delivered'].map(f => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      <section className="orders-list">
        {loading ? (
          <div className="loading-state">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">No orders found.</div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div
                key={order._id}
                className="order-card dinesync-card"
                onClick={() => navigate(`/waiter/order-details/${order.table?._id || 'unknown'}/${order._id}`)}
              >
                <div className="order-card-header">
                  <div className="order-id">#{order.orderNumber}</div>
                  <div className={`order-status-badge ${(order.orderStatus || '').toLowerCase()}`}>
                    {(order.orderStatus || '').charAt(0).toUpperCase() + (order.orderStatus || '').slice(1)}
                  </div>
                </div>
                <div className="order-card-body">
                  <div className="table-info">
                    <span className="label">Table</span>
                    <span className="value">{order.table?.tableNumber || 'N/A'}</span>
                  </div>
                  <div className="item-count">
                    <span className="label">Items</span>
                    <span className="value">{order.items?.length || 0}</span>
                  </div>
                  <div className="order-time">
                    <Clock size={14} />
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="order-card-footer">
                  <div className="total-amount">₹{order.totalAmount?.toLocaleString()}</div>
                  <ChevronRight size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default WaiterOrders;
