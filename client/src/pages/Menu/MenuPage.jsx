import React, { useState, useEffect } from 'react';
import MenuCard from '../../components/MenuCard';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Search, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';

const MenuPage = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [menuRes, catRes] = await Promise.all([
          api.get('/api/menus?all=true'),
          api.get('/api/categories')
        ]);
        setMenuItems(menuRes.data.data || menuRes.data || []);
        setCategories((catRes.data.data || catRes.data || []).filter(c => c.isActive));
      } catch (error) {
        console.error('Error fetching menu data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || 
                            (item.category && (item.category.name === activeCategory || item.category === activeCategory || item.category._id === activeCategory));
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="menu-page">
      <div className="container-menu">
        <div className="header-top flex justify-between items-center">
          <div className="header-left-actions flex items-center gap-4">
            <button 
              className="back-btn p-2 hover:bg-surface-muted rounded-full transition-all" 
              onClick={() => navigate(-1)}
              title="Go Back"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="logo-container">
              <img 
                src="/logo-golden.png" 
                alt="Guesto Logo" 
                className="menu-logo h-10 w-auto" 
              />
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <header className="section-header">
          <h1 className="section-title">Our Menu</h1>
          <p className="section-subtitle">
            Discover a curated collection of seasonal flavors, meticulously crafted by our chefs to bring the essence of fine dining to your table.
          </p>
        </header>

        <section className="menu-section">
          <div className="search-container mb-8">
            <div className="search-wrapper">
              <input 
                type="text" 
                placeholder="Search for dishes, ingredients..." 
                className="menu-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="search-icon" size={20} />
            </div>
          </div>

          <div className="category-tabs flex justify-center gap-4 mb-12 flex-wrap">
            <button 
              className={`category-tab ${activeCategory === 'All' ? 'active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button 
                key={cat._id} 
                className={`category-tab ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <MenuCard 
                  key={item._id} 
                  id={item._id}
                  title={item.name}
                  description={item.description}
                  price={item.hasOffer ? item.offerPrice : (item.variants?.[0]?.price || '0')}
                  image={item.image}
                  tags={[item.foodType, ...(item.isBlocked ? ['Unavailable'] : [])]}
                  sizes={item.variants?.map(v => v.size).filter(Boolean)}
                />
              ))
            ) : (
              <div className="no-results col-span-full py-20 text-center">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-serif text-primary mb-2">No delicacies found</h3>
                <p className="text-on-surface-variant">Try adjusting your search or category filter to find what you're looking for.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MenuPage;
