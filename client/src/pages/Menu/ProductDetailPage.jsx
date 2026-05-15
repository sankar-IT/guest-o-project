import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useCart } from '../../context/CartContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { addToCart, addToTableCart, activeTableId } = useCart();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/api/menus/${id}`);
        const data = response.data.data || response.data;
        setProduct(data);
        if (data.variants?.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-menu pt-40 pb-20 text-center bg-surface">
        <h2 className="text-3xl font-serif mb-4 text-primary">Product Not Found</h2>
        <button 
          onClick={() => navigate(-1)} 
          className="text-secondary hover:underline flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft size={20} /> Back to Menu
        </button>
      </div>
    );
  }

  const price = product.hasOffer ? product.offerPrice : (selectedVariant?.price || '0');
  const tags = [product.foodType, ...(product.isBlocked ? ['Unavailable'] : [])];

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    const isWaiter = window.location.pathname.startsWith('/waiter');
    
    if (isWaiter && activeTableId) {
      addToTableCart(activeTableId, product, selectedVariant);
      // Optional: show feedback
      import('../../utils/sweetAlert').then(({ showToast }) => {
        showToast('success', 'Item added to table order');
      });
    } else {
      addToCart(product, selectedVariant);
      import('../../utils/sweetAlert').then(({ showToast }) => {
        showToast('success', 'Item added to cart');
      });
    }
  };

  return (
    <div className="product-detail-page pt-4 pb-12 min-h-screen bg-menu">
      <div className="container-menu">
        <div className="header-top flex justify-between items-center mb-6">
          <div className="logo-container">
            <Link to={window.location.pathname.startsWith('/waiter') ? "/waiter/dashboard" : "/menu"}>
              <img 
                src="/logo-golden.png" 
                alt="Guesto Logo" 
                className="menu-logo h-10 w-auto" 
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

        <button 
          onClick={() => navigate(-1)} 
          className="back-link flex items-center gap-2 mb-10 text-[10px] uppercase tracking-[0.2em] font-bold text-primary-menu opacity-60 hover:opacity-100 hover:text-secondary-menu transition-all bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Selection
        </button>

        <div className="product-layout grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="product-image-section">
            <div className="product-image-wrapper rounded-[40px] overflow-hidden shadow-[0_30px_80px_rgba(50,23,22,0.15)] border border-border-menu">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-auto object-cover transform hover:scale-110 transition-transform duration-[1.2s] ease-out" 
              />
            </div>
          </div>

          <div className="product-info-section">
            <div className="mb-8">
              <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-secondary-menu mb-4 block">
                {product.category?.name || 'Curated Selection'}
              </span>
              <h1 className="text-4xl lg:text-6xl font-serif font-bold text-primary-menu mb-6 leading-[1.1] letter-spacing-[-0.02em]">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-6 mb-10">
                <span className="text-3xl lg:text-4xl font-sans font-bold text-secondary-menu">
                  ₹{price}
                </span>
                <div className="h-8 w-[1px] bg-border-menu"></div>
                <div className="flex gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-surface-muted-menu text-[10px] uppercase tracking-wider font-bold rounded-full text-text-secondary-menu">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="product-description mb-12">
              <h3 className="text-sm uppercase tracking-widest font-bold text-primary-menu mb-4 opacity-40">Description</h3>
              <p className="text-lg lg:text-xl text-text-secondary-menu font-sans leading-relaxed italic opacity-90">
                "{product.description}"
              </p>
            </div>

            {product.variants?.length > 0 && (
              <div className="product-variants mb-12">
                <h3 className="text-sm uppercase tracking-widest font-bold text-primary-menu mb-4 opacity-40">Select Size</h3>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v) => (
                    <button 
                      key={v.size} 
                      onClick={() => setSelectedVariant(v)}
                      className={`dinesync-variant-chip ${
                        selectedVariant?.size === v.size ? 'active' : ''
                      }`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {window.location.pathname.startsWith('/waiter') && (
              <div className="actions flex flex-col sm:flex-row gap-4 mt-12">
                <button 
                  onClick={handleAddToCart}
                  disabled={product.isBlocked || product.totalStock <= 0}
                  className="dinesync-btn dinesync-btn-primary w-full py-5"
                >
                  {product.isBlocked ? 'Currently Unavailable' : product.totalStock <= 0 ? 'Out of Stock' : 'Add to Order'}
                </button>
              </div>
            )}

            <div className="mt-10 pt-10 border-t border-border-menu flex items-center justify-between">
              <div className="availability flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${product.totalStock > 0 ? 'bg-status-available' : 'bg-status-unavailable'}`}></div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-text-muted opacity-60">
                  Stock: {product.totalStock} Available
                </span>
              </div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-text-muted opacity-60">
                Item ID: {product._id?.substring(0, 8)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
