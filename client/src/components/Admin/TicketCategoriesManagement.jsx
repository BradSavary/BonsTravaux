import React, { useState, useEffect, useCallback } from 'react';
import { FormField } from '../Form/FormField';
import { FormSelect } from '../Form/FormSelect';
import { Modal } from '../ui/Modal';
import { Pagination } from '../ui/Pagination';
import { apiRequest } from '../../../lib/api-request';
import { debounce } from '../../../lib/debounce';

export function TicketCategoriesManagement() {
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // États modaux
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // États formulaires
    const [formData, setFormData] = useState({
        name: '',
        service_id: ''
    });
    
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(null);
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [filteredCategories, setFilteredCategories] = useState([]);
    
    // État pour la recherche et le filtrage
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    
    // Fonction debounced pour la recherche
    const debouncedSearch = useCallback(
        debounce((term) => {
            setSearchTerm(term);
        }, 500),
        []
    );
    
    // Charger les catégories et services au chargement
    useEffect(() => {
        fetchServices();
        fetchCategories();
    }, []);
    
    // Filtrer les catégories lorsque les filtres changent
    useEffect(() => {
        filterCategories();
    }, [categories, searchTerm, serviceFilter, currentPage]);
    
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await apiRequest.get('ticket-categories', true);
            if (response.status === 'success') {
                setCategories(response.data);
            } else {
                setError(response.message || 'Erreur lors du chargement des catégories');
            }
        } catch (err) {
            setError('Erreur lors du chargement des catégories');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchServices = async () => {
        try {
            const response = await apiRequest.get('service-intervenants', true);
            if (response.status === 'success') {
                setServices(response.data);                // Par défaut, aucun filtre de service (Tous)
                setServiceFilter(''); // Définir le filtre à une chaîne vide pour montrer tous les services
            }
        } catch (err) {
            console.error('Erreur lors du chargement des services:', err);
        }
    };    const filterCategories = () => {
        let filtered = [...categories];
        
        // Filtrer par service
        if (serviceFilter) {
            console.log('Filtrage par service:', serviceFilter);
            console.log('Types:', typeof serviceFilter, categories.length > 0 ? typeof categories[0].service_id : 'N/A');
            filtered = filtered.filter(cat => {
                const match = String(cat.service_id) === String(serviceFilter);
                console.log(`Catégorie ${cat.name}, service_id=${cat.service_id}, match=${match}`);
                return match;
            });
        }
        
        // Filtrer par recherche
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(cat => cat.name.toLowerCase().includes(term));
        }
        
        // Pagination
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedCategories = filtered.slice(startIndex, endIndex);
        
        setTotalPages(Math.ceil(filtered.length / perPage));
        setFilteredCategories(paginatedCategories);
    };
    
    const handleSearchChange = (e) => {
        debouncedSearch(e.target.value);
    };
    
    const handleServiceFilterChange = (e) => {
        setServiceFilter(e.target.value);
        setCurrentPage(1);
    };
    
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
      const handleAddCategory = () => {
        // Si un service est sélectionné dans le filtre, utiliser ce service par défaut dans le formulaire
        // Sinon, laisser vide et l'utilisateur devra sélectionner un service
        const defaultServiceId = serviceFilter || (services.length > 0 ? services[0].id : '');
        console.log('Service par défaut pour nouvelle catégorie:', defaultServiceId);
        
        setFormData({
            name: '',
            service_id: defaultServiceId
        });
        setIsAddModalOpen(true);
    };
    
    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            service_id: category.service_id
        });
        setIsEditModalOpen(true);
    };
    
    const handleDeleteCategory = (category) => {
        setDeletingCategory(category);
        setIsDeleteModalOpen(true);
    };
    
    const handleSaveNewCategory = async () => {
        if (!formData.name || !formData.service_id) {
            setError('Veuillez remplir tous les champs');
            return;
        }
        
        try {
            const response = await apiRequest.post('ticket-categories', formData, true);
            if (response.status === 'success') {
                setSuccess('Catégorie ajoutée avec succès');
                setIsAddModalOpen(false);
                fetchCategories();
            } else {
                setError(response.message || 'Erreur lors de l\'ajout');
            }
        } catch (err) {
            setError('Erreur lors de l\'ajout de la catégorie');
            console.error(err);
        }
    };
    
    const handleUpdateCategory = async () => {
        if (!formData.name || !formData.service_id) {
            setError('Veuillez remplir tous les champs');
            return;
        }
        
        try {
            const response = await apiRequest.put(`ticket-categories/${editingCategory.id}`, formData, true);
            if (response.status === 'success') {
                setSuccess('Catégorie mise à jour avec succès');
                setIsEditModalOpen(false);
                fetchCategories();
            } else {
                setError(response.message || 'Erreur lors de la mise à jour');
            }
        } catch (err) {
            setError('Erreur lors de la mise à jour de la catégorie');
            console.error(err);
        }
    };
    
    const handleConfirmDelete = async () => {
        try {
            const response = await apiRequest.delete(`ticket-categories/${deletingCategory.id}`, true);
            if (response.status === 'success') {
                setSuccess('Catégorie supprimée avec succès');
                setIsDeleteModalOpen(false);
                fetchCategories();
            } else {
                setError(response.message || 'Erreur lors de la suppression');
            }
        } catch (err) {
            setError('Erreur lors de la suppression de la catégorie');
            console.error(err);
        }
    };
    
    const clearMessages = () => {
        setError('');
        setSuccess('');
    };
    
    // Trouver le nom du service pour une catégorie
    const getServiceName = (serviceId) => {
        const service = services.find(s => s.id === serviceId);
        return service ? service.name : 'Inconnu';
    };
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <h3 className="text-xl font-medium text-gray-900">Gestion des catégories de tickets</h3>
                <button
                    onClick={handleAddCategory}
                    className="ml-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
                >
                    Ajouter une catégorie
                </button>
            </div>
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    {success}
                </div>
            )}
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                <div className="sm:w-1/2">
                    <FormSelect
                        label="Filtrer par service"
                        name="serviceFilter"
                        value={serviceFilter}
                        onChange={handleServiceFilterChange}
                        options={[
                            { value: '', label: 'Tous les services' },
                            ...services.map(service => ({
                                value: service.id,
                                label: service.name
                            }))
                        ]}
                    />
                </div>
                
                <div className="sm:w-1/2">
                    <FormField
                        label="Rechercher une catégorie"
                        name="search"
                        placeholder="Nom de la catégorie..."
                        onChange={handleSearchChange}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        }
                    />
                </div>
            </div>
            
            {loading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-500">Chargement des catégories...</p>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-gray-500">Aucune catégorie trouvée.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-white shadow-sm rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nom de la catégorie
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Service intervenant
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCategories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {category.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getServiceName(category.service_id)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditCategory(category)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(category)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        className="mt-4"
                    />
                </>
            )}
            
            {/* Modal d'ajout */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    clearMessages();
                }}
                title="Ajouter une catégorie"
            >
                <div className="space-y-4">
                    <FormField
                        label="Nom de la catégorie"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="Ex: Problème matériel"
                        required
                    />
                    
                    <FormSelect
                        label="Service intervenant"
                        name="service_id"
                        value={formData.service_id}
                        onChange={handleFormChange}
                        options={services.map(service => ({
                            value: service.id,
                            label: service.name
                        }))}
                        required
                    />
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="flex justify-end space-x-3 pt-3">
                        <button
                            onClick={() => {
                                setIsAddModalOpen(false);
                                clearMessages();
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSaveNewCategory}
                            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Ajouter
                        </button>
                    </div>
                </div>
            </Modal>
            
            {/* Modal de modification */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    clearMessages();
                }}
                title="Modifier une catégorie"
            >
                <div className="space-y-4">
                    <FormField
                        label="Nom de la catégorie"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="Ex: Problème matériel"
                        required
                    />
                    
                    <FormSelect
                        label="Service intervenant"
                        name="service_id"
                        value={formData.service_id}
                        onChange={handleFormChange}
                        options={services.map(service => ({
                            value: service.id,
                            label: service.name
                        }))}
                        required
                    />
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="flex justify-end space-x-3 pt-3">
                        <button
                            onClick={() => {
                                setIsEditModalOpen(false);
                                clearMessages();
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleUpdateCategory}
                            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Mettre à jour
                        </button>
                    </div>
                </div>
            </Modal>
            
            {/* Modal de confirmation de suppression */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    clearMessages();
                }}
                title="Confirmer la suppression"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Êtes-vous sûr de vouloir supprimer la catégorie <span className="font-medium">{deletingCategory?.name}</span> ?
                    </p>
                    
                    <p className="text-sm text-gray-500">
                        Cette action est irréversible. Les tickets associés à cette catégorie ne seront plus catégorisés.
                    </p>
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="flex justify-end space-x-3 pt-3">
                        <button
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                clearMessages();
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
