import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useCart } from '../../context/CartContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { theme, toggleTheme } = useTheme();
  const { addToCart } = useCart();
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
        <Link to="/menu" className="text-secondary hover:underline flex items-center justify-center gap-2">
          <ArrowLeft size={20} /> Back to Menu
        </Link>
      </div>
    );
  }

  const price = product.hasOffer ? product.offerPrice : (selectedVariant?.price || '0');
  const tags = [product.foodType, ...(product.isBlocked ? ['Unavailable'] : [])];

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addToCart(product, selectedVariant);
  };

  return (
    <div className="product-detail-page pt-4 pb-12 min-h-screen bg-surface">
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
          <ArrowLeft size={16} />
          Back to Menu
        </Link>

        <div className="product-layout grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="product-image-section">
            <div className="product-image-wrapper rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700" 
              />
            </div>
          </div>

          <div className="product-info-section">
            <div className="mb-6">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-2 block">
                {product.category?.name || 'Category'}
              </span>
              <h1 className="text-3xl lg:text-5xl font-serif font-bold text-primary mb-3 leading-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <span className="text-2xl lg:text-3xl font-sans font-medium text-primary">
                  ₹{price}
                </span>
                
                {product.variants?.length > 0 && (
                  <>
                    <div className="h-4 w-[1px] bg-primary/20"></div>
                    <div className="flex gap-2">
                      {product.variants.map((v) => (
                        <button 
                          key={v.size} 
                          onClick={() => setSelectedVariant(v)}
                          className={`px-3 py-1 border transition-all text-[10px] uppercase tracking-wider font-bold rounded-md ${
                            selectedVariant?.size === v.size 
                            ? 'border-primary bg-primary text-white' 
                            : 'border-primary/20 text-primary/60 bg-surface-menu'
                          }`}
                        >
                          {v.size}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="h-4 w-[1px] bg-primary/20"></div>
                <div className="flex gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-tertiary/10 text-[10px] uppercase tracking-wider font-bold rounded-full text-primary/70">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="product-description mb-10">
              <p className="text-base lg:text-lg text-on-surface-variant leading-relaxed mb-6">
                {product.description}
              </p>
              
              <div className="nutritional-info mt-8 p-4 bg-surface-alt rounded-xl border border-primary/5">
                <p className="text-xs text-on-surface-variant/70 italic">
                  Available Stock: {product.totalStock} units
                </p>
              </div>
            </div>

            <div className="actions flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleAddToCart}
                disabled={product.isBlocked || product.totalStock <= 0}
                className="flex-1 py-4 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-primary-light transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.isBlocked ? 'Currently Unavailable' : product.totalStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
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
