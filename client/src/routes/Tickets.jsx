import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api-request';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Pagination } from '../components/ui/Pagination';
import { FormField } from '../components/Form/FormField';
import { FormSelect } from '../components/Form/FormSelect';
import { debounce } from '../../lib/debounce';
import { StatusFilterModal } from '../components/Ticket/StatusFilterModal';
import { getStatusColors } from '../../lib/TicketStatus';

export function Tickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    // États pour la recherche et le filtrage
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilters, setStatusFilters] = useState([]);
    const [serviceIntervenantFilter, setServiceIntervenantFilter] = useState('');
    const [displayedSearchTerm, setDisplayedSearchTerm] = useState('');
    
    // État pour la modale de filtres de statut
    const [isStatusFilterModalOpen, setIsStatusFilterModalOpen] = useState(false);
    
    // Options pour les filtres
    const [statusOptions, setStatusOptions] = useState([]);
    const [serviceIntervenantOptions, setServiceIntervenantOptions] = useState([]);

    const navigate = useNavigate();

    // Fonction debounced pour la recherche
    const debouncedSearch = useCallback(
        debounce((term) => {
            setDisplayedSearchTerm(term);
            setCurrentPage(1); // Retour à la première page lors d'une recherche
        }, 500),
        []
    );
    
    // Gérer le changement dans le champ de recherche
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };
    
    // Ouvrir la modale de filtre par statut
    const handleOpenStatusFilterModal = () => {
        setIsStatusFilterModalOpen(true);
    };
    
    // Appliquer les filtres de statut sélectionnés
    const handleApplyStatusFilters = (selectedStatuses) => {
        setStatusFilters(selectedStatuses);
        setCurrentPage(1); // Revenir à la première page avec les nouveaux filtres
    };
    
    // Gérer le changement de filtre de service intervenant
    const handleServiceIntervenantFilterChange = (e) => {
        setServiceIntervenantFilter(e.target.value);
        setCurrentPage(1); // Retour à la première page lors du changement de filtre
    };
    
    // Réinitialiser les filtres
    const handleResetFilters = () => {
        setSearchTerm('');
        setDisplayedSearchTerm('');
        setStatusFilters([]);
        setServiceIntervenantFilter('');
        setCurrentPage(1);
    };
    
    // Charger les options de filtres disponibles
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                // Récupérer les statuts disponibles
                const statusResponse = await apiRequest.get('tickets/statuses', true);
                if (statusResponse.status === 'success' && Array.isArray(statusResponse.data)) {
                    const statusOpts = statusResponse.data.map(status => ({
                        value: status,
                        label: status
                    }));
                    setStatusOptions(statusOpts);
                }
                
                // Récupérer les services intervenants disponibles
                const servicesResponse = await apiRequest.get('service-intervenants', true);
                if (servicesResponse.status === 'success' && Array.isArray(servicesResponse.data)) {
                    const serviceOpts = servicesResponse.data.map(service => ({
                        value: service.id.toString(),
                        label: service.name
                    }));
                    setServiceIntervenantOptions(serviceOpts);
                }
            } catch (err) {
                console.error("Erreur lors du chargement des options de filtre:", err);
            }
        };
        
        fetchFilterOptions();
    }, []);

    // Charger les tickets avec pagination et filtres
    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            try {
                // Construction des paramètres de requête
                const params = new URLSearchParams();
                params.append('page', currentPage);
                params.append('perPage', perPage);
                
                if (displayedSearchTerm) {
                    params.append('search', displayedSearchTerm);
                }
                
                // Ajouter tous les statuts sélectionnés
                if (statusFilters && statusFilters.length > 0) {
                    statusFilters.forEach(status => {
                        params.append('status[]', status);
                    });
                }
                
                if (serviceIntervenantFilter) {
                    params.append('serviceIntervenantId', serviceIntervenantFilter);
                }
                
                const response = await apiRequest.get(`tickets/my?${params.toString()}`, true);
                
                if (response.status === 'success') {
                    setTickets(response.data.tickets || []);
                    setTotalPages(response.data.totalPages || 1);
                    setTotalItems(response.data.totalItems || 0);
                    setError('');
                } else {
                    setError(response.message || 'Erreur lors du chargement des tickets');
                }
            } catch (err) {
                console.error('Error fetching tickets:', err);
                setError('Erreur de connexion au serveur');
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [currentPage, perPage, displayedSearchTerm, statusFilters, serviceIntervenantFilter]);

    // Gérer le changement de page
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Fonction pour gérer le clic sur une ligne de ticket
    const handleTicketClick = (ticketId) => {
        navigate(`/ticket/${ticketId}`);
    };

    // Fonction pour formater la date
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
    
    if (loading && tickets.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Mes Bons
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Liste de vos bons pour les services technique / informatique / économat.
                </p>
            </div>

            <div className="border-t border-gray-200">
                {/* Filtres */}
                <div className="px-4 py-5 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <FormField
                                label="Rechercher"
                                name="search"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Lieu ou commentaire..."
                                icon={
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                }
                            />
                        </div>
                        <div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Statut
                                </label>
                                <button
                                    type="button"
                                    onClick={handleOpenStatusFilterModal}
                                    className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm py-2.5 pl-3 pr-10 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <div className="flex items-center flex-wrap gap-1">
                                        {statusFilters.length === 0 ? (
                                            'Tous les statuts'
                                        ) : (
                                            <>
                                                {statusFilters.length > 2
                                                    ? `${statusFilters.length} statuts sélectionnés`
                                                    : statusFilters.map(status => (
                                                        <span key={status} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColors(status).light} ${getStatusColors(status).text}`}>
                                                            {status}
                                                        </span>
                                                    ))}
                                            </>
                                        )}
                                    </div>
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div>
                            <FormSelect
                                label="Service intervenant"
                                name="serviceIntervenant"
                                value={serviceIntervenantFilter}
                                onChange={handleServiceIntervenantFilterChange}
                                options={serviceIntervenantOptions}
                                placeholder="Tous les services intervenants"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleResetFilters}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    </div>
                    
                    {/* Affichage des filtres actifs */}
                    {statusFilters.length > 0 && (
                        <div className="mt-3 flex items-center flex-wrap gap-2">
                            <span className="text-sm text-gray-500">Filtres actifs:</span>
                            {statusFilters.map(status => {
                                const colors = getStatusColors(status);
                                return (
                                    <span key={status} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.light} ${colors.text}`}>
                                        {status}
                                        <button 
                                            onClick={() => setStatusFilters(prev => prev.filter(s => s !== status))}
                                            className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-gray-300"
                                        >
                                            <span className="sr-only">Supprimer</span>
                                            <svg className="h-2 w-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {tickets.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="mx-auto h-12 w-12 text-gray-400">
                            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande trouvée</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {(searchTerm || statusFilters.length > 0 || serviceIntervenantFilter) 
                                ? "Aucun résultat ne correspond à vos critères de recherche."
                                : "Vous n'avez pas encore créé de demandes d'intervention."}
                        </p>
                        <div className="mt-6">
                            {(searchTerm || statusFilters.length > 0 || serviceIntervenantFilter) ? (
                                <button
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Réinitialiser les filtres
                                </button>
                            ) : (
                                <Link to="/new-ticket" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Créer une nouvelle demande
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date / heure
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Service Intervenant
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lieu d'Intervention
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Commentaire
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tickets.map((ticket) => {
                                    // Déterminer la couleur de fond et texte selon le statut du ticket
                                    let bgColor = "";
                                    let hoverColor = "";
                                    let textColor = "";
                                    
                                    switch(ticket.statut.toLowerCase()) {
                                        case "en cours":
                                            bgColor = "bg-yellow-50";
                                            hoverColor = "hover:bg-yellow-100";
                                            textColor = "text-yellow-800";
                                            break;
                                        case "résolu":
                                            bgColor = "bg-green-50";
                                            hoverColor = "hover:bg-green-100";
                                            textColor = "text-green-800";
                                            break;
                                        case "fermé":
                                            bgColor = "bg-red-50";
                                            hoverColor = "hover:bg-red-100";
                                            textColor = "text-red-800";
                                            break;
                                        default: // Ouvert ou autre, fond blanc
                                            bgColor = "bg-white";
                                            hoverColor = "hover:bg-gray-100";
                                            textColor = "text-gray-900";
                                    }
                                    
                                    return (
                                        <tr 
                                            key={ticket.id}
                                            onClick={() => handleTicketClick(ticket.id)}
                                            className={`cursor-pointer ${bgColor} ${hoverColor}`}
                                        >
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                                                {formatDate(ticket.date_creation)}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                                                {ticket.service_intervenant_name}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                                                {ticket.lieu_intervention}
                                            </td>
                                            <td className={`px-6 py-4 text-sm ${textColor}`}>
                                                <div className="max-w-xs whitespace-pre-wrap break-words max-h-16 overflow-hidden">
                                                    {ticket.details}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        {/* Pagination */}
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                className="px-6 py-3"
                            />
                            
                            <div className="px-6 py-3 text-sm text-gray-700">
                                Affichage de {Math.min(perPage, tickets.length)} sur {totalItems} bons
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Modale de filtre par statut */}
            <StatusFilterModal
                isOpen={isStatusFilterModalOpen}
                onClose={() => setIsStatusFilterModalOpen(false)}
                statusOptions={statusOptions}
                initialSelected={statusFilters}
                onApplyFilters={handleApplyStatusFilters}
            />
        </div>
    );
}