import React from 'react';
import { TicketCard } from './TicketCard';

export function TicketList({ tickets, emptyMessage, useBackgroundColors = false }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200 text-gray-500">
        <p>{emptyMessage || "Aucun ticket à afficher"}</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-4">
      {tickets.map(ticket => (
        <TicketCard 
          key={ticket.id} 
          ticket={ticket} 
          useBackgroundColor={useBackgroundColors} 
        />
      ))}
    </div>
  );
}