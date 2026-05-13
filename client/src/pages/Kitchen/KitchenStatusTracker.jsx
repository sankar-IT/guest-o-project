import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import { Clock, CheckCircle2, AlertCircle, Menu } from 'lucide-react';
import './KitchenStatusTracker.css';

const KitchenStatusTracker = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const orders = [
    { id: 'ORD-101', table: '02', items: ['Grilled Salmon', 'Garden Salad'], time: '12m ago', status: 'In Progress', priority: 'High' },
    { id: 'ORD-102', table: '12', items: ['Beef Burger', 'Truffle Fries', 'Coke'], time: '8m ago', status: 'Pending', priority: 'Normal' },
    { id: 'ORD-103', table: '05', items: ['Mushroom Risotto'], time: '25m ago', status: 'Ready', priority: 'High' },
    { id: 'ORD-104', table: '08', items: ['Margherita Pizza', 'Garlic Bread'], time: '5m ago', status: 'In Progress', priority: 'Normal' },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Ready': return <CheckCircle2 className="status-ready" size={20} />;
      case 'In Progress': return <Clock className="status-progress" size={20} />;
      case 'Pending': return <AlertCircle className="status-pending" size={20} />;
      default: return null;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="dashboard-main-container kitchen-tracker-page">
        <header className="dashboard-header">
          <div className="header-left">
            <div className="title-row">
              <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={24} />
              </button>
              <h1>Kitchen Status Tracker</h1>
            </div>
            <p className="subtitle">Live order monitoring and priority management</p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-value">14</span>
              <span className="stat-label">Active Orders</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">8m</span>
              <span className="stat-label">Avg. Prep Time</span>
            </div>
          </div>
        </header>

        <section className="kitchen-grid">
          <div className="kitchen-column">
            <h2 className="column-title">Incoming & Pending</h2>
            <div className="orders-list">
              {orders.filter(o => o.status === 'Pending').map(order => (
                <div key={order.id} className="dinesync-card order-item">
                  <div className="order-header">
                    <span className="order-id">{order.id}</span>
                    <span className="order-table">Table {order.table}</span>
                  </div>
                  <ul className="order-items-list">
                    {order.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                  <div className="order-footer">
                    <span className="order-time">{order.time}</span>
                    <button className="dinesync-btn dinesync-btn-primary start-btn">Start</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="kitchen-column">
            <h2 className="column-title">In Preparation</h2>
            <div className="orders-list">
              {orders.filter(o => o.status === 'In Progress').map(order => (
                <div key={order.id} className="dinesync-card order-item in-progress">
                  <div className="order-header">
                    <span className="order-id">{order.id}</span>
                    <span className="order-table">Table {order.table}</span>
                  </div>
                  <ul className="order-items-list">
                    {order.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                  <div className="order-footer">
                    <div className="time-tracker">
                      <Clock size={16} />
                      <span>{order.time}</span>
                    </div>
                    <button className="dinesync-btn dinesync-btn-primary ready-btn">Mark Ready</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="kitchen-column">
            <h2 className="column-title">Ready for Pickup</h2>
            <div className="orders-list">
              {orders.filter(o => o.status === 'Ready').map(order => (
                <div key={order.id} className="dinesync-card order-item ready">
                  <div className="order-header">
                    <span className="order-id">{order.id}</span>
                    <span className="order-table">Table {order.table}</span>
                  </div>
                  <ul className="order-items-list">
                    {order.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                  <div className="order-footer">
                    <CheckCircle2 size={16} className="ready-icon" />
                    <span>Prepared</span>
                    <button className="dinesync-btn dinesync-btn-secondary notify-btn">Notify Waiter</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default KitchenStatusTracker;
