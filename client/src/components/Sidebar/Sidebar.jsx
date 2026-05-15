import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ChefHat, 
  UtensilsCrossed, 
  Settings, 
  LogOut,
  User,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/waiter/dashboard' },
    { icon: <LayoutDashboard size={20} />, label: 'Tables', path: '/waiter/tables' },
    { icon: <UtensilsCrossed size={20} />, label: 'Menu', path: '/waiter/menu' },
    { icon: <ChefHat size={20} />, label: 'Kitchen Tracker', path: '/kitchen/tracker' },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      <aside className={`dinesync-sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img 
              src="/logo-golden.png" 
              alt="Guesto Logo" 
              className="sidebar-logo-img" 
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <div className="header-actions-sidebar">
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="sidebar-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <NavLink 
              key={index} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn">
            <span className="nav-icon"><LogOut size={20} /></span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <nav className="dinesync-bottom-nav">
        {menuItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.path} 
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
