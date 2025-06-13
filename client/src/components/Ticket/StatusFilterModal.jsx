import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { FormCheckbox } from '../Form/FormCheckbox';
import { getStatusColors } from '../../../lib/TicketStatus';

export function StatusFilterModal({ isOpen, onClose, statusOptions, initialSelected, onApplyFilters }) {
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  // Initialiser les statuts sélectionnés quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSelectedStatuses(initialSelected || []);
    }
  }, [isOpen, initialSelected]);

  const handleToggleStatus = (status) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedStatuses(statusOptions.map(option => option.value));
  };

  const handleClearAll = () => {
    setSelectedStatuses([]);
  };

  const handleApply = () => {
    onApplyFilters(selectedStatuses);
    onClose();
  };

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        Annuler
      </button>
      <button
        type="button"
        onClick={handleApply}
        disabled={selectedStatuses.length === 0}
        className={`ml-3 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
          ${selectedStatuses.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        Appliquer ({selectedStatuses.length})
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filtrer par statut"
      footer={footerButtons}
    >
      <div className="space-y-4">
        <div className="flex justify-between mb-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Tout sélectionner
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Tout désélectionner
          </button>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {statusOptions.map((option) => {
            const colors = getStatusColors(option.value);
            return (
              <div 
                key={option.value}
                className={`p-3 border rounded-md transition-all ${
                  selectedStatuses.includes(option.value) 
                    ? `${colors.light} ${colors.border}` 
                    : 'border-gray-200'
                }`}
              >
                <FormCheckbox
                  label={
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.light} ${colors.text} mr-2`}>
                        {option.value}
                      </span>
                      <span className="text-gray-700">{option.label || option.value}</span>
                    </div>
                  }
                  name={`status-${option.value}`}
                  checked={selectedStatuses.includes(option.value)}
                  onChange={() => handleToggleStatus(option.value)}
                />
              </div>
            );
          })}
        </div>

        {selectedStatuses.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Statuts sélectionnés:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedStatuses.map(status => {
                const colors = getStatusColors(status);
                return (
                  <span 
                    key={status} 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.light} ${colors.text}`}
                  >
                    {status}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}