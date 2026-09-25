import React from 'react';
import { CATEGORY_ICONS } from '../utils/constants';
import './CategoryBadge.css';

export const CategoryBadge = ({ category }) => {
  const icon = CATEGORY_ICONS[category] || '📦';

  return (
    <span className="category-badge">
      <span className="category-badge-icon">{icon}</span>
      <span className="category-badge-name">{category || 'Others'}</span>
    </span>
  );
};

export default CategoryBadge;
