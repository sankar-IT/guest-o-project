import React, { useState } from 'react';
import MenuCard from '../../components/MenuCard';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Search } from 'lucide-react';
import { menuItems } from '../../data/menuData';

const MenuPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="menu-page">
      <div className="container-menu">
        <div className="header-top flex justify-between items-center">
          <div className="logo-container">
            <img 
              src={theme === 'dark' ? "/logo-light.png" : "/logo-dark.png"} 
              alt="Guesto Logo" 
              className="menu-logo" 
            />
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

          <div className="category-tabs flex justify-center gap-4 mb-12">
            {['All', 'Starters', 'Mains', 'Desserts', 'Drinks'].map((cat) => (
              <button 
                key={cat} 
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <MenuCard key={item.id} {...item} />
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
