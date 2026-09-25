import React from 'react';
import { TRANSACTION_CATEGORIES, CATEGORY_ICONS } from '../utils/constants';
import './CategoryFilter.css';

export const CategoryFilter = ({ selectedCategory, onChangeCategory }) => {
  return (
    <div className="category-filter-container">
      <label htmlFor="category-filter-select" className="filter-label">
        Category:
      </label>
      <select
        id="category-filter-select"
        className="category-filter-select"
        value={selectedCategory}
        onChange={(e) => onChangeCategory(e.target.value)}
      >
        <option value="all">All Categories</option>
        {TRANSACTION_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {CATEGORY_ICONS[cat] || '📦'} {cat}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter;
