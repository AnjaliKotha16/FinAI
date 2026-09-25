import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import './PlaceholderPage.css';

export const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="User Profile"
        subtitle="Manage your personal information and account preferences."
        phaseBadge="Phase 2 Ready"
        icon="👤"
      />
      <div className="placeholder-card" style={{ textAlign: 'left', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            color: '#fff',
            fontSize: '1.75rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ color: '#f8fafc', fontSize: '1.3rem' }}>{user?.name}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{user?.email}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(15,23,42,0.5)', padding: '1.25rem', borderRadius: '12px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Account ID</span>
            <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '0.2rem' }}>{user?.id}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Account Status</span>
            <div style={{ color: '#34d399', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.2rem' }}>Verified & Active</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Created At</span>
            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', marginTop: '0.2rem' }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Session'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
