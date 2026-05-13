import React from 'react';
import { Link } from 'react-router-dom';

const MenuCard = ({ id, title, description, price, image, tags, sizes }) => {
  return (
    <Link to={`/product/${id}`} className="menu-card group block">
      <div className="menu-card-image-container">
        <img src={image} alt={title} className="menu-card-image" />
        {tags && (
          <div className="menu-card-tags">
            {tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="menu-card-content">
        <div className="menu-card-header">
          <h3 className="menu-card-title">{title}</h3>
          <span className="menu-card-price">₹{price}</span>
        </div>
        
        {sizes && sizes.length > 0 && (
          <div className="menu-card-sizes mt-2 mb-4">
            <span className="sizes-label block text-[10px] uppercase tracking-wider text-muted mb-2 font-bold opacity-60">Available Sizes:</span>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <span key={size} className="size-chip px-2 py-1 bg-surface-muted text-secondary text-[11px] font-bold rounded-md border border-border">
                  {size}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="menu-card-description">{description}</p>
        <button className="add-to-cart-btn">View Details</button>
      </div>
    </Link>
  );
};

export default MenuCard;
