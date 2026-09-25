import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CATEGORY_ICONS } from '../utils/constants';
import './ExpenseCategoryChart.css';

const COLOR_PALETTE = [
  '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a7f3d0',
  '#c084fc', '#f472b6', '#818cf8', '#fb923c', '#94a3b8'
];

export const ExpenseCategoryChart = ({ categoryData = [] }) => {
  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3>Expense by Category</h3>
        </div>
        <div className="no-data-notice">
          <span>📊 No expense categories recorded for this period.</span>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-chart-tooltip">
          <strong>{CATEGORY_ICONS[data.category] || '📦'} {data.category}</strong>
          <div>₹{data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({data.percentage}%)</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Expense by Category</h3>
        <span className="chart-tag">Breakdown</span>
      </div>

      <div className="category-chart-flex">
        {/* Doughnut Chart */}
        <div className="pie-chart-wrapper" style={{ width: 180, height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Progress Bars */}
        <div className="category-legend-list">
          {categoryData.slice(0, 5).map((item, index) => (
            <div key={item.category} className="legend-row">
              <div className="legend-row-top">
                <span className="legend-cat-name">
                  <span
                    className="legend-color-dot"
                    style={{ background: COLOR_PALETTE[index % COLOR_PALETTE.length] }}
                  />
                  {CATEGORY_ICONS[item.category] || '📦'} {item.category}
                </span>
                <span className="legend-amt">₹{item.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${item.percentage}%`,
                    background: COLOR_PALETTE[index % COLOR_PALETTE.length]
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpenseCategoryChart;
