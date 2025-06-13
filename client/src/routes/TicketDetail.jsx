import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api-request';
import { ticketImageService } from '../../lib/ticket-image-service';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StatusHistory } from '../components/Ticket/StatusHistory';
import { StatusHistoryModal } from '../components/Ticket/StatusHistoryModal';
import { getStatusColors } from '../../lib/TicketStatus';
import { TransferTicketModal } from '../components/Ticket/TransferTicketModal';
import { ImageGalleryModal } from '../components/Ticket/ImageGalleryModal';
import { TicketChat } from '../components/Chat/TicketChat';
import { AutoCompleteInput } from '../components/Form/AutoCompleteInput';
import { formatDate } from '../../lib/date-helpers';


export function TicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useAuth();
    const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isImageGalleryModalOpen, setIsImageGalleryModalOpen] = useState(false);
  const [ticketImages, setTicketImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showChat, setShowChat] = useState(true);

   const toggleChat = () => {
    setShowChat(prev => !prev);
  };
  
    // Déterminer si l'utilisateur actuel peut mettre à jour le statut
    const canUpdateStatus = () => {
      if (!ticket || !currentUser) return false;
      
      
      // Vérifier si l'utilisateur fait partie du service intervenant du ticket
      const permissionRequired = ticket.service_intervenant_name?.replace(/\s+/g, '') + 'Ticket';
      return hasPermission(permissionRequired);
    };


      // Ajouter ces fonctions
    const handleOpenTransferModal = () => {
      setIsTransferModalOpen(true);
    };
      const handleCloseTransferModal = () => {
      setIsTransferModalOpen(false);
    };
    
    const handleTicketTransferred = (data) => {
      // Rafraîchir les données du ticket
      fetchTicketDetails();
    };
      
  const handleCategorySelected = async (category) => {
    try {
      const response = await apiRequest.post(`tickets/${ticketId}?action=update-category`, {
        categoryId: category?.id || null
      }, true);
      
      if (response.status === 'success') {
        setTicket(prev => ({
          ...prev, 
          category_id: category?.id || null,
          category_name: category?.name || null
        }));
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la catégorie:", err);
    }
  };
  
  // Rechercher des catégories pour l'autocomplétion directe
  const searchCategories = async (query) => {
    if (!ticket?.service_intervenant_id) return [];
    
    try {
      const response = await apiRequest.get(
        `ticket-categories?serviceId=${ticket.service_intervenant_id}&query=${encodeURIComponent(query)}`, 
        true
      );
      
      if (response.status === 'success' && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('Erreur lors de la recherche de catégories:', err);
      return [];
    }
  };// Ajouter cette fonction pour déterminer si l'utilisateur peut transférer le ticket
    const canTransferTicket = () => {
      // Le ticket ne peut être transféré que si l'utilisateur est du service intervenant
      // et si le ticket n'est pas fermé
      if (!ticket || !currentUser) return false;
      
      const serviceCode = getServiceCodeFromName(ticket.service_intervenant_name);
      return hasPermission(`${serviceCode}Ticket`) && ticket.statut !== 'Fermé';
    };
    
    // Fonction pour déterminer si l'utilisateur peut catégoriser le ticket
    const canCategorizeTicket = () => {
      if (!ticket || !currentUser) return false;
      
      // // L'utilisateur peut catégoriser s'il est du service intervenant ou admin
      // if (hasPermission('AdminAccess')) return true;
      
      const serviceCode = getServiceCodeFromName(ticket.service_intervenant_name);
      return hasPermission(`${serviceCode}Ticket`);
    };

      const getServiceCodeFromName = (serviceName) => {
      if (!serviceName) return '';
      
      if (serviceName.includes('Informatique')) return 'Informatique';
      if (serviceName.includes('Technique')) return 'Technique';
      if (serviceName.includes('Économat') || serviceName.includes('Economat')) return 'Economat';
        return '';
    };
    // Définir fetchTicketDetails en dehors de l'useEffect pour pouvoir l'utiliser ailleurs
  const fetchTicketDetails = async () => {
    setLoading(true);
    try {
      const response = await apiRequest.get(`tickets/${ticketId}`, true);
      
      if (response.status === 'success') {
        setTicket(response.data.ticket);
        setHistory(response.data.history);
        // Charger les images du ticket
        await fetchTicketImages();
      } else {
        setError(response.message || 'Erreur lors du chargement du ticket');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Récupérer les images associées au ticket
  const fetchTicketImages = async () => {
    setLoadingImages(true);
    try {
      const response = await ticketImageService.getTicketImages(ticketId);
      
      if (response.status === 'success') {
        setTicketImages(response.data || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des images:', err);
    } finally {
      setLoadingImages(false);
    }
  };
  
  // Ouvrir la modal de galerie d'images
  const handleOpenImageGallery = () => {
    setIsImageGalleryModalOpen(true);
  };
  
  // Fermer la modal de galerie d'images
  const handleCloseImageGallery = () => {
    setIsImageGalleryModalOpen(false);
  };
  
  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);
  
  const handleStatusUpdated = (data) => {
    setTicket(data.ticket);
    setHistory(data.history);
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleOpenHistoryModal = () => {
    setIsHistoryModalOpen(true);
  };
  
  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };  

// Utiliser cette fonction dans useEffect pour charger les détails initiaux
useEffect(() => {
  fetchTicketDetails();
}, [ticketId]);
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 mb-4">
        <p><strong>Erreur:</strong> {error}</p>
        <button 
          onClick={handleBack}
          className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retour
        </button>
      </div>
    );
  }
  
  if (!ticket) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Le ticket demandé n'existe pas ou vous n'avez pas les droits pour y accéder.</p>
        <button 
          onClick={handleBack}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retour
        </button>
      </div>
    );
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Récupérer les couleurs du statut actuel pour styliser l'en-tête
  const statusColors = getStatusColors(ticket.statut);
  
   return (
    <>
      <div className="space-y-6">        {/* En-tête avec fond blanc */}
        <div className="px-4 py-4 sm:px-6 flex flex-wrap justify-between items-center gap-3 bg-white shadow rounded-lg">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Bon de travail #{ticket.id}
            </h1>
            <div className="flex flex-col sm:ml-4">
              <div className="text-sm text-gray-500 mb-0.5">Créé le</div>
              <div className="text-sm font-medium">{formatDate(ticket.date_creation)}</div>
            </div>
          </div>
          <button 
            onClick={handleBack}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </button>
        </div><div className="flex flex-col xl:flex-row gap-6">
          {/* Colonne principale - informations du ticket */}
                <div className="xl:w-2/3 w-full">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg"><div className={`p-4 sm:px-6 ${statusColors.light} border-b ${statusColors.border}`}>
                    {/* Section d'informations de statut */}
                    <div className="flex flex-col space-y-4">
                      {/* Première ligne: Statut et Catégorie */}
                      <div className="flex flex-wrap items-center gap-4 justify-between">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Statut</div>
                          <StatusBadge status={ticket.statut} />
                        </div>                        
                        <div>
                            {canCategorizeTicket() && (
                            <div className="mt-1">
                              <AutoCompleteInput
                                label="Catégorie"
                                value={ticket.category_name || ''}
                                onChange={(value, category) => {
                                  // On ne fait rien ici, car la sélection est gérée par handleSelectSuggestion
                                }}
                                onSearch={searchCategories}
                                onSelectSuggestion={(category) => handleCategorySelected(category)}
                                placeholder="Rechercher une catégorie..."
                                allowNew={false}
                                minChars={0}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Deuxième ligne: Boutons d'action */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">                      {/* Le bouton de modification de statut a été supprimé au profit de l'interface intégrée dans le chat */}
                        
                        {canTransferTicket() && (
                          <button
                            type="button"
                            onClick={handleOpenTransferModal}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <svg className="mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            Transférer
                          </button>
                        )}
                        
                       
                        
                        {/* Bouton pour voir les images */}
                        <button
                          type="button"
                          onClick={handleOpenImageGallery}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="mr-1.5 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {!loadingImages ? `Images (${ticketImages.length})` : 'Chargement...'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-5 sm:px-6">
                  <div className="space-y-6">                    <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Informations du bon</h3>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
                      <div className="sm:col-span-1 bg-gray-50 p-3 rounded-md">
                        <dt className="text-sm font-medium text-gray-500">Demandeur</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-medium">{ticket.username}</dd>
                      </div>
                      
                      <div className="sm:col-span-1 bg-gray-50 p-3 rounded-md">
                        <dt className="text-sm font-medium text-gray-500">Site</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-medium">{ticket.site}</dd>
                      </div>
                      
                      <div className="sm:col-span-1 bg-gray-50 p-3 rounded-md">
                        <dt className="text-sm font-medium text-gray-500">Service demandeur</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-medium">{ticket.service_nom || "-"}</dd>
                      </div>
                      
                      <div className="sm:col-span-1 bg-gray-50 p-3 rounded-md">
                        <dt className="text-sm font-medium text-gray-500">Service intervenant</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-medium">{ticket.service_intervenant_name}</dd>
                      </div>
                      
                      {ticket.intervenant_username && (
                        <div className="sm:col-span-1 bg-gray-50 p-3 rounded-md">
                          <dt className="text-sm font-medium text-gray-500">Intervenant</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-medium">{ticket.intervenant_username}</dd>
                        </div>
                      )}
                      
                      <div className="sm:col-span-1 bg-gray-50 p-3 rounded-md">
                        <dt className="text-sm font-medium text-gray-500">Lieu d'intervention</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-medium">{ticket.lieu_intervention}</dd>
                      </div>
                      
                      <div className="md:col-span-3 sm:col-span-2 flex items-center bg-gray-50 p-3 rounded-md">
                        <dt className="text-sm font-medium text-gray-500 mr-2">Voir avant intervention:</dt>
                        <dd className={`text-sm ${
                          ticket.voir_avant_intervention
                          ? 'bg-yellow-100 border-2 border-yellow-400 rounded-md px-3 py-1 font-bold text-yellow-800 shadow'
                          : 'text-gray-900 font-medium'
                        }`}>
                          {ticket.voir_avant_intervention ? 'Oui' : 'Non'}
                        </dd>
                      </div>
                        <div className="md:col-span-3 sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 mb-2">Détails de la demande</dt>
                        <dd className="text-sm text-gray-900 whitespace-pre-line bg-gray-50 p-4 rounded-md border border-gray-200 shadow-inner">
                          {ticket.details}
                        </dd>
                      </div>
                    </dl>
                    </div>                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
                    <h3 className="text-base font-semibold mb-4 text-gray-700 flex justify-between items-center border-b pb-2">
                      <span>Historique des statuts</span>
                      {history.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {history.length} {history.length > 1 ? 'changements' : 'changement'}
                      </span>
                      )}
                    </h3>
                    <StatusHistory 
                      history={history} 
                      onViewFullHistory={handleOpenHistoryModal} 
                    />
                    </div>
                  </div>
                  </div>
                </div>
                </div>                
                {/* Colonne de droite - chat */}
          <div className="xl:w-1/3 w-full">
            <div className="sticky top-4 z-10">              
              <div className="h-[calc(100vh-150px)] flex flex-col bg-white shadow overflow-hidden rounded-lg">                  
                <TicketChat 
                      ticketId={ticketId} 
                      currentStatus={ticket?.statut}
                      ticketServiceId={ticket?.service_intervenant_name?.replace(/\s+/g, '')}
                      onStatusUpdated={fetchTicketDetails}
                  />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modales */}
      <StatusHistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={handleCloseHistoryModal} 
        history={history} 
      />
        {/* La modal de mise à jour de statut a été supprimée */}
        <TransferTicketModal
        isOpen={isTransferModalOpen}
        onClose={handleCloseTransferModal}
        ticketId={ticketId}
        currentServiceId={ticket?.service_intervenant_id}
        onTicketTransferred={handleTicketTransferred}
      /> 
        <ImageGalleryModal
        isOpen={isImageGalleryModalOpen}
        onClose={handleCloseImageGallery}
        ticketId={ticketId}
      />
    </>
  );
}