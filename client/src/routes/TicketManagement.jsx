import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../../lib/api-request';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Pagination } from '../components/ui/Pagination';
import { FormSelect } from '../components/Form/FormSelect';
import { FormField } from '../components/Form/FormField';
import { debounce } from '../../lib/debounce';
import { useNavigate } from 'react-router-dom';
import { StatusFilterModal } from '../components/Ticket/StatusFilterModal';
import { getStatusColors } from '../../lib/TicketStatus';
import { FilterModal } from '../components/Ticket/FilterModal';
import { CategoryFilterModal } from '../components/Ticket/CategoryFilterModal';

export function TicketManagement() {
    const navigate = useNavigate();
    
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { currentUser, hasPermission, userPermissions } = useAuth();
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    
    // États pour la recherche et le filtrage    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilters, setStatusFilters] = useState(['Ouvert', 'En cours']); // Filtre par défaut: Ouvert + En cours
    const [serviceIntervenantFilter, setServiceIntervenantFilter] = useState('');
    const [displayedSearchTerm, setDisplayedSearchTerm] = useState('');
    const [intervenantFilters, setIntervenantFilters] = useState([]);
    const [categoryFilters, setCategoryFilters] = useState([]); // Filtre par catégorie

    
    // État pour les modales de filtres
    const [isStatusFilterModalOpen, setIsStatusFilterModalOpen] = useState(false);
    const [isIntervenantFilterModalOpen, setIsIntervenantFilterModalOpen] = useState(false);
    const [isCategoryFilterModalOpen, setIsCategoryFilterModalOpen] = useState(false);
    
    // Options pour les filtres
    const [statusOptions, setStatusOptions] = useState([]);
    const [serviceIntervenantOptions, setServiceIntervenantOptions] = useState([]);
    const [intervenantOptions, setIntervenantOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);

    
    // Vérifier si l'utilisateur a plusieurs permissions de ticket
    const hasMultipleTicketPermissions = () => {
        const ticketPermissions = userPermissions.filter(p => 
            p.includes('Ticket')
        );
        return ticketPermissions.length > 1;
    };

    // Fonction pour gérer le clic sur une ligne de ticket
    const handleTicketClick = (ticketId) => {
        navigate(`/ticket/${ticketId}`);
    };
    
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

    // Ouvrir la modale de filtre par intervenants
    const handleOpenIntervenantFilterModal = () => {
    setIsIntervenantFilterModalOpen(true);
    };
    
    // Ouvrir la modale de filtre par catégorie
    const handleOpenCategoryFilterModal = () => {
        setIsCategoryFilterModalOpen(true);
    };
    
    // Appliquer les filtres de statut sélectionnés
    const handleApplyStatusFilters = (selectedStatuses) => {
        setStatusFilters(selectedStatuses);
        setCurrentPage(1); // Revenir à la première page avec les nouveaux filtres
    };

    
    const handleApplyIntervenantFilters = (selectedIntervenants) => {
        setIntervenantFilters(selectedIntervenants);
        setCurrentPage(1); // Réinitialiser à la première page lors du filtre
    };
    
    // Appliquer les filtres de catégorie sélectionnés
    const handleApplyCategoryFilters = (selectedCategories) => {
        setCategoryFilters(selectedCategories);
        setCurrentPage(1); // Réinitialiser à la première page lors du filtre
    };
    
    // Gérer le changement de filtre de service intervenant
    const handleServiceIntervenantFilterChange = (e) => {
        const value = e.target.value;
        setServiceIntervenantFilter(value);
    };
      // Réinitialiser les filtres
    const handleResetFilters = () => {
        setSearchTerm('');
        setDisplayedSearchTerm('');
        setIntervenantFilters([]);
        setCategoryFilters([]); // Réinitialiser le filtre de catégories
        setStatusFilters(['Ouvert', 'En cours']); // Réinitialiser aux filtres par défaut
        setServiceIntervenantFilter('');
        setCurrentPage(1);
    };

    // Formater les options d'intervenants pour le modal de filtre
        const formatIntervenantOptions = (intervenants) => {
        return intervenants.map(intervenant => ({
            value: intervenant.id,
            label: intervenant.username
        }));
    };
    
    // Charger les options de filtres disponibles
    useEffect(() => {
            const fetchFilterOptions = async () => {
                try {
                    // Récupérer toutes les options de filtres en une seule requête
                    const response = await apiRequest.get('tickets/filters', true);
                    if (response.status === 'success') {
                        // Formater les statuts pour le modal de filtre
                        const statuses = response.data.statuses.map(status => ({
                            value: status,
                            label: status
                        }));
                        setStatusOptions(statuses);
                        
                        // Formater les services pour le menu déroulant
                        const services = response.data.services.map(service => ({
                            value: service.id,
                            label: service.name
                        }));
                        setServiceIntervenantOptions(services);
                          // Formater les intervenants pour le modal de filtre
                        setIntervenantOptions(formatIntervenantOptions(response.data.intervenants));
                        
                        // Formater les catégories pour le modal de filtre
                        if (response.data.categories) {
                            const categories = response.data.categories.map(category => ({
                                id: category.id,
                                name: category.name
                            }));
                            setCategoryOptions(categories);
                        }
                    }
                } catch (err) {
                    console.error('Erreur lors du chargement des options de filtres:', err);
                }
            };
            
            fetchFilterOptions();
        }, []);
    
    // Charger les tickets avec pagination et filtres
        useEffect(() => {
            const fetchTickets = async () => {
                setLoading(true);
                setError('');
                
                try {
                    // Construire les paramètres de requête
                    let endpoint = `tickets/manage?page=${currentPage}&perPage=${perPage}`;
                    
                    if (displayedSearchTerm) {
                        endpoint += `&search=${encodeURIComponent(displayedSearchTerm)}`;
                    }
                    
                    if (statusFilters && statusFilters.length > 0) {
                        // Encoder chaque valeur de statut individuellement avant de les joindre
                        const encodedStatuses = statusFilters.map(status => encodeURIComponent(status));
                        endpoint += `&statusFilters=${encodedStatuses.join(',')}`;
                    }
                    
                    if (serviceIntervenantFilter) {
                        endpoint += `&serviceId=${serviceIntervenantFilter}`;
                    }
                      if (intervenantFilters && intervenantFilters.length > 0) {
                        endpoint += `&intervenantIds=${intervenantFilters.join(',')}`;
                    }
                    
                    if (categoryFilters && categoryFilters.length > 0) {
                        endpoint += `&categoryFilters=${categoryFilters.join(',')}`;
                    }
                    
                    const response = await apiRequest.get(endpoint, true);
                    
                    if (response.status === 'success') {
                        setTickets(response.data.tickets || []);
                        setTotalPages(response.data.pagination?.totalPages || 0);
                        setTotalItems(response.data.pagination?.totalItems || 0);
                    } else {
                        setError(response.message || 'Erreur lors du chargement des tickets');
                    }
                } catch (err) {
                    console.error('Erreur:', err);
                    setError('Erreur de connexion au serveur');
                } finally {
                    setLoading(false);
                }
            };
              fetchTickets();
        }, [currentPage, perPage, displayedSearchTerm, statusFilters, serviceIntervenantFilter, intervenantFilters, categoryFilters]);

    // Gérer le changement de page
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };
    
    // Fonction pour formater la date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Gestion des demandes d'intervention
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Demandes assignées à votre service
                    </p>
                </div>
            </div>
            
            <div className="border-t border-gray-200">                <div className="px-4 py-5 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <FormField
                                label="Rechercher"
                                name="search"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Service, lieu, commentaire..."
                                icon={
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                }
                            />
                        </div>
                        <div>
                            {/* Remplacer le select par un bouton qui ouvre la modale */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Statut
                                </label>
                                <button
                                    type="button"
                                    onClick={handleOpenStatusFilterModal}
                                    className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm py-2.5 pl-3 pr-10 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                        Sélectionner un statut
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                </button>
                            </div>
                        </div>
                        {hasMultipleTicketPermissions() && (
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
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Intervenant
                            </label>
                            <button 
                                onClick={handleOpenIntervenantFilterModal}
                                className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm py-2.5 pl-3 pr-10 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                Intervenant
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                {intervenantFilters.length > 0 && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {intervenantFilters.length}
                                    </span>
                                )}
                            </button>
                        </div>
                        
                        {/* Bouton filtre par catégorie */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Catégorie
                            </label>
                            <button 
                                onClick={handleOpenCategoryFilterModal}
                                className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm py-2.5 pl-3 pr-10 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                Catégorie
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                {categoryFilters.length > 0 && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {categoryFilters.length}
                                    </span>
                                )}
                            </button>
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
                
                <div className="px-4 py-5 sm:p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                            <p>{error}</p>
                        </div>
                    )}
                    
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : tickets.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                               <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date / heure    
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Service
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Intervenant
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Lieu
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
                                                        <div>{formatDate(ticket.date_creation)}</div>
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                                                        <div>{ticket.service_nom || "-"}</div>
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                                                        {/* Afficher le nom de l'intervenant, en gras si c'est l'utilisateur actuel */}
                                                        <div>
                                                            {ticket.intervenant_username === currentUser?.username ? (
                                                                <span className="font-bold">{ticket.intervenant_username}</span>
                                                            ) : (
                                                                ticket.intervenant_username || "-"
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${textColor}`}>
                                                        <div>{ticket.lieu_intervention || "-"}</div>
                                                    </td>
                                                    <td className={`px-6 py-4 text-sm ${textColor}`}>
                                                        <div className="whitespace-pre-wrap break-words max-h-16 overflow-hidden">
                                                            {ticket.details}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="mt-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                                <div className="mt-2 text-sm text-gray-500 text-center">
                                    Affichage de {tickets.length} demandes sur {totalItems}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande à traiter</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {(searchTerm || statusFilters.length > 0 || serviceIntervenantFilter) 
                                    ? "Aucun résultat ne correspond à vos critères de recherche."
                                    : "Vous n'avez pas de demandes d'intervention à gérer actuellement."}
                            </p>
                            {(searchTerm || statusFilters.length > 0 || serviceIntervenantFilter) && (
                                <button
                                    onClick={handleResetFilters}
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Réinitialiser les filtres
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Modale de filtre par statut */}
            <StatusFilterModal
                isOpen={isStatusFilterModalOpen}
                onClose={() => setIsStatusFilterModalOpen(false)}
                statusOptions={statusOptions}
                initialSelected={statusFilters}
                onApplyFilters={handleApplyStatusFilters}
            />

            {/* Modal pour le filtre par intervenant */}
            <FilterModal
                isOpen={isIntervenantFilterModalOpen}
                onClose={() => setIsIntervenantFilterModalOpen(false)}
                title="Filtrer par intervenant"
                options={intervenantOptions}
                initialSelected={intervenantFilters}
                onApplyFilters={handleApplyIntervenantFilters}
                itemValueKey="value"
                itemLabelKey="label"
            />
            
            {/* Modal pour le filtre par catégorie */}
            <CategoryFilterModal
                isOpen={isCategoryFilterModalOpen}
                onClose={() => setIsCategoryFilterModalOpen(false)}
                categoryOptions={categoryOptions}
                initialSelected={categoryFilters}
                onApplyFilters={handleApplyCategoryFilters}
            />
        </div>
    );
}