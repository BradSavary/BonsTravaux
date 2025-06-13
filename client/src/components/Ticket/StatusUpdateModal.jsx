import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../../lib/api-request';
import { getStatusColors, TICKET_STATUS } from '../../../lib/TicketStatus';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { FormSelect } from '../Form/FormSelect';

export function StatusUpdateModal({ isOpen, onClose, ticketId, currentStatus, onStatusUpdated }) {
  const { currentUser } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusDate, setStatusDate] = useState(new Date().toISOString().split('T')[0]); // Format YYYY-MM-DD
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [potentialIntervenants, setPotentialIntervenants] = useState([]);
  const [selectedIntervenant, setSelectedIntervenant] = useState('');
  const [loadingIntervenants, setLoadingIntervenants] = useState(false);
  const [showIntervenantSelector, setShowIntervenantSelector] = useState(false);

  // Vérifier si le ticket peut être modifié (pas fermé ou résolu)
  const canUpdateStatus = ![TICKET_STATUS.FERME, TICKET_STATUS.RESOLU].includes(currentStatus);
  // Déterminer si la sélection d'intervenant est nécessaire
  useEffect(() => {
    // Afficher le sélecteur d'intervenant pour tout changement de statut si l'utilisateur n'est pas bloqué
    // Y compris pour les statuts FERME et RESOLU
    if (selectedStatus) {
      setShowIntervenantSelector(!currentUser.is_lock);
      if (!currentUser.is_lock) {
        // Nous n'appelons plus loadPotentialIntervenants ici car il est déjà appelé quand la modale s'ouvre
        // et l'utilisateur courant est déjà sélectionné par défaut
      }
    } else {
      setShowIntervenantSelector(false);
    }
  }, [selectedStatus, currentUser.is_lock, currentStatus]);
  // Réinitialiser l'état quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(null);
      setStatusDate(new Date().toISOString().split('T')[0]); // Réinitialiser à la date du jour
      setError('');
      setSuccess(false);
      setSelectedIntervenant('');
      
      // Si l'utilisateur n'est pas bloqué, pré-charger les intervenants potentiels
      if (!currentUser.is_lock) {
        loadPotentialIntervenants();
      }
    }
  }, [isOpen]);
  
  // Charger la liste des intervenants potentiels
  const loadPotentialIntervenants = async () => {
    if (currentUser.is_lock) return;
    
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

  const statusOptions = [
    { value: TICKET_STATUS.OUVERT, label: TICKET_STATUS.OUVERT },
    { value: TICKET_STATUS.EN_COURS, label: TICKET_STATUS.EN_COURS },
    { value: TICKET_STATUS.RESOLU, label: TICKET_STATUS.RESOLU },
    { value: TICKET_STATUS.FERME, label: TICKET_STATUS.FERME }
  ];

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
  };

  const handleSubmit = async () => {
    // Vérification supplémentaire pour empêcher la modification des tickets fermés ou résolus
    if (!canUpdateStatus) {
      setError(`Les tickets avec le statut "${currentStatus}" ne peuvent plus être modifiés.`);
      return;
    }

    if (!selectedStatus || selectedStatus === currentStatus) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const payload = { 
        newStatus: selectedStatus,
        statusDate: statusDate // Envoi de la date sélectionnée
      };
      
      // Ajouter l'intervenant personnalisé si sélectionné
      if (showIntervenantSelector && selectedIntervenant) {
        payload.customIntervenantId = selectedIntervenant;
      }
      
      const response = await apiRequest.put(
        `tickets/${ticketId}?action=updateStatus`,
        payload,
        true
      );

      if (response.status === 'success') {
        setSuccess(true);
        
        // S'assurer que les données sont valides avant d'appeler onStatusUpdated
        if (response.data) {
          const updatedTicket = response.data.ticket || response.data;
          
          // Si l'API renvoie directement les données du ticket mis à jour, les utiliser
          // pour mettre à jour l'état dans le composant parent
          setTimeout(() => {
            if (onStatusUpdated) {
              onStatusUpdated({
                ticket: {
                  ...updatedTicket,
                  statut: selectedStatus // S'assurer que le statut est correct même si l'API ne le renvoie pas correctement
                },
                history: response.data.history || []
              });
            }
            onClose();
          }, 1000); // Délai légèrement plus long pour permettre de voir le message de succès
          window.location.reload();
        } else {
          // Si les données ne sont pas comme attendues, tout de même fermer la modal après un délai
          setTimeout(() => {
            onClose();
            // Recharger la page comme solution de secours
            window.location.reload();
          }, 1000);
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

  const resetAndClose = () => {
    setSelectedStatus(null);
    setError('');
    setSuccess(false);
    onClose();
  };

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={resetAndClose}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Annuler
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedStatus || isSubmitting || selectedStatus === currentStatus || success || !canUpdateStatus}
        className={`ml-3 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
        ${(!selectedStatus || isSubmitting || selectedStatus === currentStatus || success || !canUpdateStatus)
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
      >
        {isSubmitting ? 'Mise à jour...' : success ? 'Succès !' : 'Confirmer'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Modifier le statut du bon"
      footer={footerButtons}
    >
      <div className="mb-4">
        <div className="flex items-center mb-4">
          <span className="text-sm font-medium text-gray-700 mr-3">Statut actuel:</span>
          <span className={`px-2.5 py-1 text-sm rounded-full ${getStatusColors(currentStatus).light} ${getStatusColors(currentStatus).text}`}>
            {currentStatus}
          </span>
        </div>

        {!canUpdateStatus && (
          <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 text-sm rounded-md border border-yellow-200">
            Les tickets avec le statut "{currentStatus}" ne peuvent plus être modifiés.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
            Statut mis à jour avec succès !
          </div>
        )}

        <div className="mt-5">
          <label className="text-sm font-medium text-gray-700 block mb-3">
            Sélectionner le nouveau statut:
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {statusOptions.map(option => {
              const colors = getStatusColors(option.value);
              const isDisabled = option.value === currentStatus || !canUpdateStatus;
              const isSelected = selectedStatus === option.value;
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleStatusSelect(option.value)}
                  disabled={isDisabled || success}
                  className={`
                    flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-all
                    ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500' : ''}
                    ${isSelected && !isDisabled ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                    ${!isDisabled && !isSelected ? `${colors.light} ${colors.text} hover:${colors.medium}` : ''}
                    ${isSelected && !isDisabled ? `${colors.medium} ${colors.text}` : ''}
                    ${success ? 'opacity-75 cursor-not-allowed' : ''}
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Sélecteur d'intervenant - visible si l'utilisateur n'est pas bloqué pour tous les changements de statut */}
        {showIntervenantSelector && (
          <div className="mt-5">
            <FormSelect
              label="Sélectionner l'intervenant:"
              name="intervenant"
              value={selectedIntervenant}
              onChange={(e) => setSelectedIntervenant(e.target.value)}
              options={[
                ...potentialIntervenants.map(intervenant => ({
                  value: intervenant.id,
                  label: intervenant.username
                }))
              ]}
              disabled={isSubmitting || success}
              loading={loadingIntervenants}
              helpText="Vous pouvez assigner ce bon à un autre technicien."
            />
          </div>
        )}
        
        {/* Ajout du sélecteur de date */}
        <div className="mt-5">
          <label htmlFor="statusDate" className="text-sm font-medium text-gray-700 block mb-2">
            Date du changement de statut:
          </label>
          <input
            type="date"
            id="statusDate"
            name="statusDate"
            value={statusDate}
            onChange={(e) => setStatusDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]} // Empêche la sélection de dates futures
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isSubmitting || success}
          />
          <p className="mt-1 text-sm text-gray-500">
            Vous pouvez sélectionner une date antérieure si nécessaire.
          </p>
        </div>
      </div>
    </Modal>
  );
}