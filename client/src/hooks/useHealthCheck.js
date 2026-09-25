import { useState, useEffect } from 'react';
import { checkBackendHealth } from '../services/healthService';

/**
 * Custom hook to verify backend connection and retrieve health status
 */
export const useHealthCheck = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await checkBackendHealth();
      if (res.ok) {
        setHealthData(res.data);
      } else {
        setError(res.error || 'Failed to connect to backend server.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return { healthData, loading, error, refetch: fetchHealth };
};
