import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import './HealthTrendChart.css';

export const HealthTrendChart = ({ trends = [] }) => {
  if (!trends || trends.length === 0) {
    return (
      <div className="trend-chart-card">
        <div className="trend-chart-header">
          <h3>Monthly Financial Trends</h3>
        </div>
        <div className="no-trend-notice">
          <span>📊 Not enough monthly transaction history to plot trends yet.</span>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="trend-custom-tooltip">
          <strong>{label}</strong>
          {payload.map((entry, idx) => (
            <div key={`item-${idx}`} style={{ color: entry.color }}>
              {entry.name}: ₹{Number(entry.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="trend-chart-card">
      <div className="trend-chart-header">
        <div className="title-area">
          <h3>Monthly Financial Trends</h3>
          <span className="trend-tag">Historical Breakdown</span>
        </div>
      </div>

      <div className="chart-wrapper" style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trends} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} />
            <YAxis
              stroke="#94a3b8"
              tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="income" name="Income" fill="#34d399" radius={[6, 6, 0, 0]} barSize={25} />
            <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[6, 6, 0, 0]} barSize={25} />
            <Bar dataKey="savings" name="Savings" fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={25} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HealthTrendChart;
