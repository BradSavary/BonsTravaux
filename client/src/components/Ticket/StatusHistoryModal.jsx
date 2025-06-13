import React from 'react';
import { getStatusColors } from '../../../lib/TicketStatus';
import { Modal } from '../ui/Modal';

export function StatusHistoryModal({ isOpen, onClose, history }) {
  if (!history || history.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Historique des changements"
      >
        <div className="text-center py-4 text-gray-500">
          Aucun historique de statut disponible.
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historique complet des changements"
    >
      <div className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto pr-1">
        {history.map(entry => {
          // Si c'est un transfert
          if (entry.transfer_type) {
            const transferTypeLabel = entry.transfer_type === 'transfer_only' 
              ? 'Transféré vers' 
              : 'Dupliqué vers';
              
            return (
              <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    {entry.username || `Utilisateur #${entry.user_id}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(entry.date_changement)}
                  </div>
                </div>
                
                <div className="flex items-center bg-gray-50 p-3 rounded-md">
                  <span className="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-800">
                    {transferTypeLabel}
                  </span>
                  <svg className="h-5 w-5 text-gray-400 mx-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800">
                    {entry.service_name || `Service #${entry.transferred_to_service_id}`}
                  </span>
                </div>
              </div>
            );
          }
          
          // Si c'est un changement de statut normal
          const oldStatusColors = getStatusColors(entry.old_status);
          const newStatusColors = getStatusColors(entry.new_status);
          
          // Extraire uniquement la date (sans l'heure) pour afficher le jour du changement de statut
          const dateOnly = entry.date_changement ? entry.date_changement.split(' ')[0] : '';
          
          return (
            <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex justify-between mb-2">
                <div className="font-medium text-gray-900">
                  {entry.username || `Utilisateur #${entry.user_id}`}
                </div>
                <div className="text-sm text-gray-500">
                  {/* Afficher la date au format court (jour/mois/année) */}
                  {dateOnly ? formatDateOnly(dateOnly) : formatDate(entry.date_changement)}
                </div>
              </div>
              
              <div className="flex items-center bg-gray-50 p-3 rounded-md">
                <span className={`px-3 py-1 text-sm rounded-full ${oldStatusColors.light} ${oldStatusColors.text}`}>
                  {entry.old_status}
                </span>
                <svg className="h-5 w-5 text-gray-400 mx-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className={`px-3 py-1 text-sm rounded-full ${newStatusColors.light} ${newStatusColors.text}`}>
                  {entry.new_status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

// Formate la date complète avec heure
function formatDate(dateString) {
  if (!dateString) return 'Date inconnue';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Formate seulement la date sans l'heure
function formatDateOnly(dateString) {
  if (!dateString) return 'Date inconnue';
  const dateParts = dateString.split('-');
  if (dateParts.length !== 3) return dateString;
  
  // Réarranger dans le format jour/mois/année
  return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
}