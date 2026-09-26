import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentTicket, setCurrentTicket] = useState(null);
  const [kkiapayPublicKey, setKkiapayPublicKey] = useState('27e327d0f43f11efb5aadb3c9a192eba');

  return (
    <AppContext.Provider value={{
      currentTicket,
      setCurrentTicket,
      kkiapayPublicKey,
      setKkiapayPublicKey
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
