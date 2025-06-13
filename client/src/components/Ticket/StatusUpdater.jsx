import React, { useState } from 'react';
import { apiRequest } from '../../../lib/api-request';
import { getStatusColors, TICKET_STATUS } from '../../../lib/TicketStatus';

export function StatusUpdater({ ticketId, currentStatus, onStatusUpdated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);

  const statusOptions = [
    { value: TICKET_STATUS.EN_COURS, label: TICKET_STATUS.EN_COURS },
    { value: TICKET_STATUS.RESOLU, label: TICKET_STATUS.RESOLU },
    { value: TICKET_STATUS.FERME, label: TICKET_STATUS.FERME }
  ];

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
  };

  const handleSubmit = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await apiRequest.put(
        `tickets/${ticketId}?action=updateStatus`,
        { newStatus: selectedStatus },
        true
      );

      if (response.status === 'success') {
        setSelectedStatus(null);
        if (onStatusUpdated) {
          onStatusUpdated(response.data);
        }
      } else {
        setError(response.message || 'Erreur lors de la mise à jour du statut');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <h3 className="text-base font-semibold mb-3 text-gray-700">Modifier le statut</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      <div className="flex flex-wrap items-center gap-3">
        {statusOptions.map(option => {
          const colors = getStatusColors(option.value);
          const isDisabled = option.value === currentStatus;
          const isSelected = selectedStatus === option.value;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleStatusSelect(option.value)}
              disabled={isDisabled}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all
                ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500' : ''}
                ${isSelected && !isDisabled ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                ${!isDisabled && !isSelected ? `${colors.light} ${colors.text} hover:${colors.medium}` : ''}
                ${isSelected && !isDisabled ? `${colors.medium} ${colors.text}` : ''}
              `}
            >
              {option.label}
            </button>
          );
        })}
        
        {selectedStatus && selectedStatus !== currentStatus && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mise à jour...
              </span>
            ) : (
              <span>Confirmer</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}