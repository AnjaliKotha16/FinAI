import React, { createContext, useContext, useState } from 'react';

/**
 * Global App Context Placeholder for Phase 0.
 * Future global states (user, auth, theme, active budget, notifications) will reside here.
 */
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [appInfo] = useState({
    name: 'FinAI Assistant',
    version: '0.1.0-phase0',
  });

  return (
    <AppContext.Provider value={{ appInfo }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
