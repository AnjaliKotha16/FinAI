import React from 'react';
import { TRANSACTION_CATEGORIES, CATEGORY_ICONS } from '../utils/constants';

export const CategorySelect = ({ value, onChange, disabled = false, id = 'category' }) => {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required
    >
      {TRANSACTION_CATEGORIES.map((cat) => (
        <option key={cat} value={cat}>
          {CATEGORY_ICONS[cat] || '📦'} {cat}
        </option>
      ))}
    </select>
  );
};

export default CategorySelect;
