import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Users, 
  ClipboardList, 
  UtensilsCrossed, 
  TrendingUp,
  Clock,
  Menu as MenuIcon
} from 'lucide-react';
import './WaiterDashboard.css';

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const { setIsSidebarOpen } = useOutletContext();
  const [statsData, setStatsData] = React.useState({
    activeTables: 0,
    placedOrders: 0,
    todaysSales: 0
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/waiter/stats`);
        const data = await response.json();
        if (data.success) {
          setStatsData(data.data);
        }
      } catch (error) {
        console.error('Error fetching waiter stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { 
      label: 'Active Tables', 
      value: loading ? '...' : statsData.activeTables.toString(), 
      icon: <Users size={24} />, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Placed Orders', 
      value: loading ? '...' : statsData.placedOrders.toString(), 
      icon: <ClipboardList size={24} />, 
      color: 'bg-amber-500' 
    },
    { 
      label: 'Today\'s Sales', 
      value: loading ? '...' : `₹${statsData.todaysSales.toLocaleString()}`, 
      icon: <TrendingUp size={24} />, 
      color: 'bg-emerald-500' 
    },
  ];

  const quickActions = [
    { label: 'Table View', icon: <Users size={32} />, path: '/waiter/tables', description: 'Manage floor and seating' },
    { label: 'New Order', icon: <Plus size={32} />, path: '/waiter/tables', description: 'Start a new table order' },
    { label: 'Menu List', icon: <UtensilsCrossed size={32} />, path: '/waiter/menu', description: 'View current offerings' },
  ];

  return (
    <div className="waiter-dashboard-container flex-1">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="title-row">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <MenuIcon size={24} />
            </button>
            <h1>Waiter Dashboard</h1>
          </div>
          <p className="subtitle">Welcome back! Here's what's happening today.</p>
        </div>
      </header>

      <section className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card dinesync-card">
            <div className={`stat-icon-wrapper ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="dashboard-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action, i) => (
            <button 
              key={i} 
              className="action-card dinesync-card"
              onClick={() => navigate(action.path)}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <h3>{action.label}</h3>
                <p>{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

// Simple Plus icon fallback since it wasn't imported from lucide-react in the list above
const Plus = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default WaiterDashboard;
