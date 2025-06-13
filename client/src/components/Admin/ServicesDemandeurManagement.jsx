import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../../lib/api-request';
import { FormField } from '../Form/FormField';
import { Pagination } from '../ui/Pagination';
import { debounce } from '../../../lib/debounce';
import { Modal } from '../ui/Modal';

export function ServicesDemandeurManagement() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingService, setEditingService] = useState(null);
    const [newServiceName, setNewServiceName] = useState('');
    const [addingNewService, setAddingNewService] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    
    // État pour la recherche
    const [searchTerm, setSearchTerm] = useState('');
    const [displayedSearchTerm, setDisplayedSearchTerm] = useState('');

    // Fonction debounced pour la recherche
    const debouncedSearch = useCallback(
        debounce((term) => {
            setDisplayedSearchTerm(term);
            setCurrentPage(1); // Réinitialiser à la première page pour une nouvelle recherche
        }, 500),
        []
    );
    
    // Gérer le changement dans le champ de recherche
    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        debouncedSearch(term);
    };

    useEffect(() => {
        fetchServices();
    }, [currentPage, perPage, displayedSearchTerm]);

        const fetchServices = async () => {
    setLoading(true);
    setError('');
    
    try {
        const queryParams = new URLSearchParams({
            page: currentPage,
            perPage: perPage
        });
        
        if (displayedSearchTerm) {
            queryParams.append('search', displayedSearchTerm);
        }
                
        const response = await apiRequest.get(`services?${queryParams.toString()}`, true);   

        if (response.status === 'success') {
            // Vérifier que les données sont un tableau
            if (Array.isArray(response.data)) {
                setServices(response.data);
            } else {
                console.error('Les données reçues ne sont pas un tableau:', response.data);
                setServices([]);
            }
            
            // Mettre à jour les informations de pagination si elles existent
            if (response.pagination) {
                setTotalPages(response.pagination.totalPages || 0);
                setTotalItems(response.pagination.total || 0);
            }
        } else {
            console.error('Erreur dans la réponse:', response);
            setError(response.message || 'Erreur lors du chargement des services');
        }
    } catch (err) {
        console.error('Erreur de connexion au serveur:', err);
        setError('Erreur de connexion au serveur');
    } finally {
        setLoading(false);
    }
};

    const addService = async () => {
        if (!newServiceName.trim()) {
            setError('Le nom du service ne peut pas être vide');
            return;
        }
        
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const response = await apiRequest.post('services', { nom: newServiceName }, true);
            
            if (response.status === 'success') {
                setSuccess('Service ajouté avec succès');
                setNewServiceName('');
                setIsAddModalOpen(false);
                fetchServices();
            } else {
                setError(response.message || 'Erreur lors de l\'ajout du service');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (service) => {
        setEditingService({
            id: service.id,
            nom: service.nom
        });
    };


   const deleteService = async (serviceId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
            return;
        }
        
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const response = await apiRequest.delete(`services/${serviceId}`, true);
            
            if (response.status === 'success') {
                setSuccess('Service supprimé avec succès');
                fetchServices();
            } else {
                setError(response.message || 'Erreur lors de la suppression du service');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Affichage du spinner pendant le chargement initial
    if (loading && services.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Contenu du modal d'ajout
    const addModalContent = (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Ajouter un nouveau service</h3>
            
            {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                    {error}
                </div>
            )}
            
            <FormField
                label="Nom du service"
                name="newServiceName"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Entrez le nom du service..."
                required
            />
        </div>
    );

    // Boutons du modal d'ajout
    const addModalFooter = (
        <>
            <button
                type="button"
                onClick={() => {
                    setIsAddModalOpen(false);
                    setNewServiceName('');
                    setError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
                Annuler
            </button>
            <button
                type="button"
                onClick={addService}
                disabled={loading || !newServiceName.trim()}
                className={`ml-3 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${loading || !newServiceName.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
            >
                {loading ? 'Chargement...' : 'Ajouter'}
            </button>
        </>
    );


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Gestion des Services Demandeurs</h2>
                
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Ajouter un service
                </button>
            </div>
            
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
                    {success}
                </div>
            )}
            
            {/* Barre de recherche */}
            <div className="mb-6">
                <FormField
                    label="Rechercher un service"
                    name="searchService"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Nom du service..."
                    icon={
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    }
                />
            </div>
            
            {/* Formulaire d'ajout de service */}
            {addingNewService && (
                <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Ajouter un nouveau service</h3>
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <FormField
                                label="Nom du service"
                                name="newServiceName"
                                value={newServiceName}
                                onChange={(e) => setNewServiceName(e.target.value)}
                                placeholder="Entrez le nom du service..."
                                required
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={addService}
                                disabled={loading || !newServiceName.trim()}
                                className={`px-4 py-2 rounded-md text-white font-medium 
                                    ${loading || !newServiceName.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {loading ? 'Chargement...' : 'Ajouter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Liste des services */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nom du Service
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {services.length === 0 && !loading ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                    Aucun service demandeur trouvé
                                </td>
                            </tr>
                        ) : (
                            services.map(service => (
                                <tr key={service.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {service.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {service.nom}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => deleteService(service.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    className="mt-6"
                />
            )}

            {/* Modal d'ajout de service */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setNewServiceName('');
                    setError('');
                }}
                title="Ajouter un service demandeur"
                footer={addModalFooter}
            >
                {addModalContent}
            </Modal>
        </div>
    );
}