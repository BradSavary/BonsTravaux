import React, { useState, useEffect } from 'react';
import { TICKET_STATUS } from '../../../lib/TicketStatus';
import { getStatusColors } from '../../../lib/TicketStatus';
import { apiRequest } from '../../../lib/api-request';
import { useAuth } from '../../context/AuthContext';
import { LockStatus } from '../Admin/LockStatus';

export function InlineStatusUpdater({ 
  ticketId, 
  currentStatus, 
  onStatusUpdated,
  serviceId,
  onMessageSent,
  chatMessage,
  onRequireMessage
}) {
  const { currentUser } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusDate, setStatusDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [potentialIntervenants, setPotentialIntervenants] = useState([]);
  const [selectedIntervenant, setSelectedIntervenant] = useState('');
  const [loadingIntervenants, setLoadingIntervenants] = useState(false);
  const [showIntervenantSelector, setShowIntervenantSelector] = useState(false);

  // Déterminer les statuts disponibles selon le statut actuel
  const getAvailableStatuses = () => {
    const statuses = [];
    if (currentStatus === TICKET_STATUS.OUVERT) {
      statuses.push(TICKET_STATUS.EN_COURS);
      statuses.push(TICKET_STATUS.FERME);
    } else if (currentStatus === TICKET_STATUS.EN_COURS) {
      statuses.push(TICKET_STATUS.RESOLU);
      statuses.push(TICKET_STATUS.FERME);
    } else if (currentStatus === TICKET_STATUS.RESOLU) {
      return []; // Aucun changement possible depuis "résolu"
    } else if (currentStatus === TICKET_STATUS.FERME) {
      return []; // Aucun changement possible depuis "Fermé"
    }
    return statuses;
  };   // Charger la liste des intervenants potentiels
    const loadPotentialIntervenants = async () => {
      // Ne pas charger la liste si l'utilisateur est bloqué
      if (currentUser.is_lock) {
        return;
      }
      
      setLoadingIntervenants(true);
      try {
        const response = await apiRequest.get(`tickets/${ticketId}?action=getTechnicians`, true);
        if (response.status === 'success' && response.data) {
          setPotentialIntervenants(response.data.technicians || []);
          
          // Si un technicien est déjà assigné, présélectionnons-le dans la liste
          if (response.data.currentIntervenant && response.data.currentIntervenant.id) {
            setSelectedIntervenant(response.data.currentIntervenant.id);
          } 
          // Sinon, sélectionner l'utilisateur connecté par défaut
          else {
            // Trouver l'ID de l'utilisateur connecté dans la liste des techniciens
            const currentUserInList = response.data.technicians.find(
              tech => tech.username === currentUser.username
            );
            
            if (currentUserInList) {
              setSelectedIntervenant(currentUserInList.id);
            }
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des techniciens:", err);
      } finally {
        setLoadingIntervenants(false);
      }
    };

  const availableStatuses = getAvailableStatuses();  // Déterminer si la sélection d'intervenant est nécessaire  
  useEffect(() => {
    // Pour le passage en cours, permettre le choix de l'intervenant sauf si l'utilisateur est bloqué
    if (selectedStatus === TICKET_STATUS.EN_COURS) {
      // Ne pas montrer le sélecteur si l'utilisateur est bloqué
      if (currentUser.is_lock) {
        setShowIntervenantSelector(false);
        setSelectedIntervenant(currentUser.id); // Utiliser l'utilisateur connecté directement
      } else {
        setShowIntervenantSelector(true);
        loadPotentialIntervenants();
      }
    } else {
      setShowIntervenantSelector(false);
    }

    // Si statut Résolu, indiquer qu'un message est requis dans le chat
    if (selectedStatus === TICKET_STATUS.RESOLU && onRequireMessage) {
      onRequireMessage(true);
    } else if (onRequireMessage) {
      onRequireMessage(false);
    }
  }, [selectedStatus, onRequireMessage, ticketId, currentUser]);


  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setError('');
    setSuccess(false);
  };

  const handleIntervenantChange = (e) => {
    setSelectedIntervenant(e.target.value);
  };

  const handleDateChange = (e) => {
    setStatusDate(e.target.value);
  };
  // Suppression de la fonction handleMessageChange  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedStatus) {
      setError("Veuillez sélectionner un statut");
      return;
    }

    if (selectedStatus === TICKET_STATUS.RESOLU && (!chatMessage || !chatMessage.trim())) {
      setError("Un message dans le chat est requis pour passer le ticket en Résolu");
      return;
    }    // Ne pas faire cette validation si l'utilisateur est bloqué, car il sera automatiquement assigné
    if (!currentUser.is_lock && showIntervenantSelector && !selectedIntervenant) {
      setError("Veuillez sélectionner un intervenant");
      return;
    }

    setIsSubmitting(true);
    setError('');
      try {
      const payload = {
        newStatus: selectedStatus,
        statusDate: statusDate
      };      // Ajouter l'intervenant dans la payload
      if (selectedStatus === TICKET_STATUS.EN_COURS) {
        if (currentUser.is_lock) {
          // Si l'utilisateur est bloqué, utiliser son ID directement
          payload.customIntervenantId = currentUser.id;
        } else if (selectedIntervenant) {
          // Sinon utiliser l'intervenant sélectionné
          payload.customIntervenantId = selectedIntervenant;
        }
      }
      
      // Pour les messages de résolution, ajouter le message dans la payload
      if (selectedStatus === TICKET_STATUS.RESOLU && chatMessage && chatMessage.trim() !== "") {
        payload.resolutionMessage = chatMessage;
      }
      
      const response = await apiRequest.put(`tickets/${ticketId}?action=updateStatus`, payload, true);

      if (response.status === "success") {
        setSuccess(true);
          // Notifier le parent que le statut a été mis à jour
        if (onStatusUpdated) {
          onStatusUpdated();
        }
        
        // Déclencher une mise à jour des messages pour afficher le message de résolution
        if (onMessageSent) {
          // Donner un peu de temps aux messages d'être enregistrés en base de données
          setTimeout(() => {
            onMessageSent();
          }, 1000); // Augmenter le délai à 1 seconde pour s'assurer que le message est bien enregistré
        }

        // Réinitialiser le formulaire
        setSelectedStatus(null);
        setSelectedIntervenant('');
      } else {
        setError(response.message || "Une erreur est survenue");
      }
    } catch (err) {
      setError("Erreur lors de la mise à jour du statut: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ne rien afficher s'il n'y a pas de changements d'états possibles
  if (availableStatuses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mt-4">
      <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center border-b pb-2">
        <svg className="w-4 h-4 mr-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>        
        <span>Modifier le statut</span>

      </h3>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-2">
          <label className="block text-xs font-medium text-gray-700">
            Modifier le statut vers:
          </label>
          <div className="flex flex-wrap gap-2">
            {availableStatuses.map(status => {
              const colors = getStatusColors(status);
              const isSelected = selectedStatus === status;
              
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  className={`
                    relative px-2 py-1 rounded-md flex items-center text-xs
                    ${isSelected 
                      ? `${colors.dark} border border-${colors.border} text-white` 
                      : `bg-white border border-gray-300 text-gray-700 hover:bg-gray-50`
                    }
                  `}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isSelected ? 'bg-white' : colors.dark}`}
                  />
                  <span>{status}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <div>
            <label htmlFor="status-date" className="block text-xs font-medium text-gray-700 mb-1">
              Date du changement
            </label>
            <input
              type="date"
              id="status-date"
              name="status-date"
              value={statusDate}
              onChange={handleDateChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs py-1 px-2"
            />
          </div>          {/* Afficher le sélecteur d'intervenant si nécessaire et si l'utilisateur n'est pas bloqué */}
          {showIntervenantSelector && !currentUser.is_lock && (
            <div>
              <label htmlFor="intervenant" className="block text-xs font-medium text-gray-700 mb-1">
                Assigner à un intervenant
              </label>
              <select
                id="intervenant"
                name="intervenant"
                value={selectedIntervenant}
                onChange={handleIntervenantChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs py-1 px-2"
                required={showIntervenantSelector}
                disabled={loadingIntervenants}
              >
                <option value="">{loadingIntervenants ? 'Chargement...' : 'Sélectionnez un intervenant'}</option>
                {potentialIntervenants.map(i => (
                  <option key={i.id} value={i.id}>{i.username}</option>
                ))}
              </select>
            </div>
          )}
          
          
        </div>        
        {selectedStatus === TICKET_STATUS.RESOLU && (
          <div className="mt-2">
            <div className="bg-green-50 border-2 border-green-300 p-3 rounded-md text-xs text-green-800">
              <svg className="inline-block h-4 w-4 mr-1 -mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Message de résolution :</span> Écrivez une message pour conclure la résolution du bon.
            </div>
          </div>
        )}

        {error && (
          <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-md text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-md text-xs">
            Le statut a été mis à jour avec succès
          </div>
        )}        <div className="flex justify-end mt-3">          <button
            type="submit"
            disabled={isSubmitting || (!selectedStatus) || (selectedStatus === TICKET_STATUS.RESOLU && (!chatMessage || !chatMessage.trim()))}
            className={`inline-flex items-center px-2.5 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white ${
              isSubmitting || (!selectedStatus) || (selectedStatus === TICKET_STATUS.RESOLU && (!chatMessage || !chatMessage.trim()))
                ? 'bg-blue-300 cursor-not-allowed'
                : selectedStatus === TICKET_STATUS.RESOLU
                  ? 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500'
            }`}
          >
            Appliquer
          </button>
        </div>
      </form>
    </div>
  );
}
