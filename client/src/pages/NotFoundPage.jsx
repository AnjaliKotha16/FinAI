import React from 'react';

export const NotFoundPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f87171' }}>404</h1>
      <h2>Page Not Found</h2>
      <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
        The requested page does not exist.
      </p>
    </div>
  );
};
