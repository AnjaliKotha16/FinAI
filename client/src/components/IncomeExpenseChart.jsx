import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import './IncomeExpenseChart.css';

export const IncomeExpenseChart = ({ income = 0, expenses = 0 }) => {
  const data = [
    { name: 'Income', amount: income, color: '#34d399' },
    { name: 'Expenses', amount: expenses, color: '#f87171' }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="custom-chart-tooltip">
          <strong>{item.name}</strong>
          <div>₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Income vs Expenses</h3>
        <span className="chart-tag">Period Comparison</span>
      </div>

      <div className="chart-container" style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={45}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeExpenseChart;
