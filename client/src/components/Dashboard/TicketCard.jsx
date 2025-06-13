import React from 'react';
import { formatRelativeTime } from '../../../lib/date-helpers';
import { getStatusColors } from '../../../lib/TicketStatus';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function TicketCard({ ticket, useBackgroundColor = false }) {
  const statusColors = getStatusColors(ticket.statut);
  const { currentUser } = useAuth();
  const createdByCurrentUser = currentUser.id === ticket.user_id;
  
  return (
    <Link to={`/ticket/${ticket.id}`}>
      <div className={`overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200 border border-gray-100
        ${useBackgroundColor ? `${statusColors.light} ` : 'bg-white'}`}>
        <div className="px-4 py-3 flex flex-col gap-2">
          <div className="flex justify-between items-start">
              <span className="text-xs text-gray-600">
                {formatRelativeTime(ticket.date_creation)}
              </span>
              {createdByCurrentUser && (
                <span className="text-xs text-blue-600 font-medium">
                  Créé par vous
                </span>
              )}
          </div>
          <div className="font-medium text-sm text-gray-700 truncate">
            {ticket.service_nom}
          </div>
          
          <div className="text-sm text-gray-600 line-clamp-2 break-words">
            {ticket.details}
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            Service intervenant: {ticket.service_intervenant_name}
          </div>
        </div>
      </div>
    </Link>
  );
}