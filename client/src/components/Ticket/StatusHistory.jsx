import React from 'react';
import { getStatusColors } from '../../../lib/TicketStatus';

export function StatusHistory({ history, onViewFullHistory }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-3 text-gray-500 text-sm">
        Aucun historique disponible
      </div>
    );
  }

  // Afficher seulement les 3 derniers changements pour le résumé
  const recentHistory = history.slice(0, 3);
  const hasMoreHistory = history.length > 3;

  return (
    <div className="space-y-2">
      <div className="space-y-3">
        {recentHistory.map((entry, index) => {
          // Si c'est un transfert
          if (entry.transfer_type) {
            const transferTypeLabel = entry.transfer_type === 'transfer_only' 
              ? 'Transféré vers' 
              : 'Dupliqué vers';
              
            return (
              <div key={entry.id} className="bg-white border border-gray-100 rounded-md p-3 transition-shadow hover:shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-gray-700">
                    {entry.username || `Utilisateur #${entry.user_id}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDateShort(entry.date_changement)}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                    {transferTypeLabel}
                  </span>
                  <svg className="h-4 w-4 text-gray-400 mx-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {entry.service_name || `Service #${entry.transferred_to_service_id}`}
                  </span>
                </div>
              </div>
            );
          }
          
          // Si c'est un changement de statut normal
          const oldStatusColors = getStatusColors(entry.old_status);
          const newStatusColors = getStatusColors(entry.new_status);
          
          return (
            <div key={entry.id} className="bg-white border border-gray-100 rounded-md p-3 transition-shadow hover:shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium text-gray-700">
                  {entry.username || `Utilisateur #${entry.user_id}`}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDateShort(entry.date_changement)}
                </div>
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${oldStatusColors.light} ${oldStatusColors.text}`}>
                  {entry.old_status}
                </span>
                <svg className="h-4 w-4 text-gray-400 mx-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${newStatusColors.light} ${newStatusColors.text}`}>
                  {entry.new_status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {hasMoreHistory && (
        <button 
          onClick={onViewFullHistory}
          className="w-full mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center p-2 border border-gray-200 rounded-md hover:bg-gray-50"
        >
          <span>Voir l'historique complet ({history.length} changements)</span>
          <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}

function formatDateShort(dateString) {
  if (!dateString) return '';
  
  // Si la date est au format avec heure, extraire seulement la partie date
  const datePart = dateString.split(' ')[0];
  
  // Formater la date au format JJ/MM/AA
  const date = new Date(datePart);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}