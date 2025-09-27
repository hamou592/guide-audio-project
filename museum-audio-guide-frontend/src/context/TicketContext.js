import React, { createContext, useState, useContext } from 'react';

const TicketContext = createContext();

export function TicketProvider({ children }) {
  const [ticketCode, setTicketCode] = useState(() => localStorage.getItem('ticketCode') || null);

  const updateTicketCode = (code) => {
    setTicketCode(code);
    if (code) {
      localStorage.setItem('ticketCode', code);
    } else {
      localStorage.removeItem('ticketCode');
    }
  };

  return (
    <TicketContext.Provider value={{ ticketCode, updateTicketCode }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTicket() {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicket must be used within a TicketProvider');
  }
  return context;
}