import React from 'react';
import { Users, Clock, Trash2 } from 'lucide-react';
import './TableCard.css';

const TableCard = ({ tableNumber, status, capacity, occupiedSeats, timeActive, onClick, onDelete }) => {
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'available': return 'badge-available';
      case 'occupied': return 'badge-occupied';
      case 'warning': return 'badge-warning';
      default: return '';
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <div className={`dinesync-card table-card status-${status.toLowerCase()}`} onClick={onClick}>
      <div className="table-card-header">
        <span className="table-number">Table {tableNumber}</span>
        <div className="header-actions">
          <span className={`dinesync-badge ${getStatusBadgeClass(status)}`}>
            {status}
          </span>
          <button className="delete-table-btn" onClick={handleDelete} title="Remove Table">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="table-card-body">
        <div className="table-info">
          <Users size={16} />
          <span>{occupiedSeats || 0}/{capacity} Seats</span>
        </div>
        {timeActive && (
          <div className="table-info active-time">
            <Clock size={16} />
            <span>{timeActive}</span>
          </div>
        )}
      </div>

      <div className="table-card-footer">
        <button className="dinesync-btn dinesync-btn-secondary view-details-btn">
          View Details
        </button>
      </div>
    </div>
  );
};

export default TableCard;
