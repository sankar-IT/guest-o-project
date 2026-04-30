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
        
        {sizes && (
          <div className="menu-card-sizes flex gap-2 mb-3">
            {sizes.map((size) => (
              <span key={size} className="size-chip">
                {size}
              </span>
            ))}
          </div>
        )}

        <p className="menu-card-description">{description}</p>
        <button className="add-to-cart-btn">View Details</button>
      </div>
    </Link>
  );
};

export default MenuCard;
