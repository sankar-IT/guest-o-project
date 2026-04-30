import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { menuItems } from '../../data/menuData';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { theme, toggleTheme } = useTheme();
  const product = menuItems.find((item) => item.id === parseInt(id));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!product) {
    return (
      <div className="container pt-40 pb-20 text-center">
        <h2 className="text-3xl font-serif mb-4">Product Not Found</h2>
        <Link to="/menu" className="text-secondary hover:underline">Back to Menu</Link>
      </div>
    );
  }

  return (
    <div className="product-detail-page pt-4 pb-12">
      <div className="container-menu">
        <div className="header-top flex justify-between items-center mb-6">
          <div className="logo-container">
            <Link to="/menu">
              <img 
                src={theme === 'dark' ? "/logo-light.png" : "/logo-dark.png"} 
                alt="Guesto Logo" 
                className="menu-logo" 
              />
            </Link>
          </div>
          <button 
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <Link to="/menu" className="back-link flex items-center gap-2 mb-6 text-xs uppercase tracking-widest font-semibold text-primary/60 hover:text-secondary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Menu
        </Link>

        <div className="product-layout grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="product-image-section">
            <div className="product-image-wrapper rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700" 
              />
            </div>
          </div>

          <div className="product-info-section">
            <div className="mb-6">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-2 block">
                {product.category}
              </span>
              <h1 className="text-3xl lg:text-5xl font-serif font-bold text-primary mb-3 leading-tight">
                {product.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <span className="text-2xl lg:text-3xl font-sans font-medium text-primary">
                  ₹{product.price}
                </span>
                <div className="h-4 w-[1px] bg-primary/20"></div>
                
                {product.sizes && (
                  <div className="flex gap-2">
                    {product.sizes.map((size) => (
                      <span key={size} className="px-3 py-1 border border-primary/20 text-[10px] uppercase tracking-wider font-bold rounded-md text-primary/60 bg-surface-menu">
                        {size}
                      </span>
                    ))}
                  </div>
                )}

                <div className="h-4 w-[1px] bg-primary/20"></div>
                <div className="flex gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-tertiary/10 text-[10px] uppercase tracking-wider font-bold rounded-full text-primary/70">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="product-description mb-10">
              <p className="text-base lg:text-lg text-on-surface-variant leading-relaxed mb-6">
                {product.longDescription || product.description}
              </p>
              
              {product.ingredients && (
                <div className="ingredients-section mt-8">
                  <h3 className="text-sm uppercase tracking-widest font-bold text-primary mb-4">Ingredients</h3>
                  <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                    {product.ingredients.map((ing) => (
                      <li key={ing} className="text-sm text-on-surface-variant flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary/40"></span>
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.nutritionalInfo && (
                <div className="nutritional-info mt-8 p-4 bg-surface-alt rounded-xl border border-primary/5">
                  <p className="text-xs text-on-surface-variant/70 italic">
                    {product.nutritionalInfo}
                  </p>
                </div>
              )}
            </div>

            <div className="actions flex flex-col sm:flex-row gap-3">
              <button className="flex-1 py-4 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-primary-light transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5">
                Add to Selection
              </button>
              <button className="flex-1 py-4 border border-primary/20 text-primary rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all">
                Customise Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
