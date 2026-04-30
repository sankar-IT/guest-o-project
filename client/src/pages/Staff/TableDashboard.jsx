import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import TableCard from '../../components/TableCard/TableCard';
import { Search, Filter, Plus, X, Users, Hash, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './TableDashboard.css';

import api from '../../api/axiosInstance';

const TableDashboard = () => {
  const [filter, setFilter] = useState('All');
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: 4 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tables');
      if (response.data.success) {
        setTables(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = async (e) => {
    if (e) e.preventDefault();
    if (!newTable.tableNumber) {
      Swal.fire('Error', 'Table number is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/api/tables', {
        ...newTable,
        tableNumber: Number(newTable.tableNumber)
      });
      if (response.data.success) {
        Swal.fire('Success', 'Table created successfully', 'success');
        setIsAddModalOpen(false);
        setNewTable({ tableNumber: '', capacity: 4 });
        fetchTables();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create table';
      Swal.fire('Error', msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (tableId, tableNumber) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete Table ${tableNumber}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4d4f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await api.delete(`/api/tables/${tableId}`);
        if (response.data.success) {
          Swal.fire('Deleted!', 'Table has been removed.', 'success');
          fetchTables();
        }
      } catch (error) {
        const msg = error.response?.data?.message || 'Failed to delete table';
        Swal.fire('Error', msg, 'error');
      }
    }
  };

  const filteredTables = filter === 'All' 
    ? tables 
    : tables.filter(t => {
        const uiStatus = t.status === 'empty' ? 'Available' : t.status === 'full' ? 'Occupied' : 'Warning';
        return uiStatus === filter;
      });

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <div className="title-row">
              <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={24} />
              </button>
              <h1>Table Dashboard</h1>
            </div>
            <p className="subtitle">Real-time floor management</p>
          </div>
          <div className="header-actions">
            <button className="dinesync-btn dinesync-btn-secondary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={20} />
              Add Table
            </button>
            <button className="dinesync-btn dinesync-btn-primary">
              <Plus size={20} />
              New Order
            </button>
          </div>
        </header>

        <section className="dashboard-controls">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input type="text" placeholder="Search tables..." />
          </div>
          <div className="filter-chips">
            {['All', 'Available', 'Occupied', 'Warning'].map(f => (
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

        <section className="tables-grid">
          {filteredTables.map(table => (
            <TableCard 
              key={table._id}
              tableNumber={table.tableNumber}
              status={table.status === 'empty' ? 'Available' : table.status === 'full' ? 'Occupied' : 'Warning'}
              capacity={table.capacity}
              occupiedSeats={table.occupiedSeats}
              timeActive={table.timeActive || 'N/A'}
              onClick={() => navigate(`/staff/detail/${table._id}`)}
              onDelete={() => handleDeleteTable(table._id, table.tableNumber)}
            />
          ))}
        </section>

        {isAddModalOpen && (
          <div className="dinesync-modal-overlay">
            <div className="dinesync-modal-content animate-slide-up">
              <div className="modal-header">
                <div className="header-text">
                  <h3>Add New Table</h3>
                  <p>Register a new table to your floor plan</p>
                </div>
                <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddTable}>
                <div className="modal-body">
                  <div className="form-group-modern">
                    <label>
                      <Hash size={18} />
                      Table Number
                    </label>
                    <input 
                      type="number" 
                      placeholder="e.g. 15" 
                      required
                      value={newTable.tableNumber}
                      onChange={(e) => setNewTable({...newTable, tableNumber: e.target.value})}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>
                      <Users size={18} />
                      Seating Capacity
                    </label>
                    <div className="capacity-options">
                      {[2, 4, 6, 8, 12].map(cap => (
                        <button
                          key={cap}
                          type="button"
                          className={`cap-btn ${newTable.capacity === cap ? 'active' : ''}`}
                          onClick={() => setNewTable({...newTable, capacity: cap})}
                        >
                          {cap}
                        </button>
                      ))}
                      <div className="custom-cap">
                        <input 
                          type="number" 
                          placeholder="Custom"
                          value={![2, 4, 6, 8, 12].includes(newTable.capacity) ? newTable.capacity : ''}
                          onChange={(e) => setNewTable({...newTable, capacity: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="dinesync-btn dinesync-btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="dinesync-btn dinesync-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Table'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TableDashboard;
