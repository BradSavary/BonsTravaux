import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../../lib/api-request';
import { Modal } from '../ui/Modal';
import { PermissionSelector } from './PermissionSelector';
import { Pagination } from '../ui/Pagination';
import { getServiceColor } from '../../../lib/ServiceColors';
import { FormField } from '../Form/FormField';
import { FormSelect } from '../Form/FormSelect';
import { debounce } from '../../../lib/debounce';
import { AddUserModal } from './AddUserModal';
import { LockStatus } from './LockStatus';


// Créer une version debounced de la fonction de recherche
const debouncedSearchFunction = debounce((term, callback) => {
    callback(term);
}, 400); // Ajouter un délai de 400ms

export function UsersManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [availablePermissions, setAvailablePermissions] = useState([
        { value: 'AdminAccess', label: 'Accès Administration' },
        { value: 'InformatiqueTicket', label: 'Tickets Informatiques' },
        { value: 'TechniqueTicket', label: 'Tickets Techniques' },
        { value: 'EconomatTicket', label: 'Tickets Économat' }
    ]);
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    
    // États pour la recherche et le filtrage
    const [searchTerm, setSearchTerm] = useState('');
    const [permissionFilter, setPermissionFilter] = useState('');
    const [displayedSearchTerm, setDisplayedSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('username');
    const [sortDir, setSortDir] = useState('asc');
    
    // États pour la modal
    const [isModalOpen, setIsModalOpen] = useState(false);


    // Fonction debounced pour appliquer le délai UNIQUEMENT sur les requêtes API
    const debouncedSearch = useCallback((term) => {
        debouncedSearchFunction(term, (debouncedTerm) => {
            setCurrentPage(1); // Reset to page 1 when searching
            setSearchTerm(debouncedTerm);
        });
    }, []);
    
    // Gérer le changement dans le champ de recherche
    const handleSearchChange = (e) => {
        const value = e.target.value;
        // Mettre à jour immédiatement la valeur affichée pour une saisie fluide
        setDisplayedSearchTerm(value);
        // Appliquer le debounce uniquement pour l'envoi de la requête API
        debouncedSearch(value);
    };

    // Fonction pour ouvrir le modal de création d'utilisateur
    const handleOpenAddUserModal = () => {
        setIsAddUserModalOpen(true);
    };

    // Fonction pour fermer le modal de création d'utilisateur
    const handleCloseAddUserModal = () => {
        setIsAddUserModalOpen(false);
    };

    // Gérer le changement de filtre de permission
    const handlePermissionFilterChange = (e) => {
        setPermissionFilter(e.target.value);
        setCurrentPage(1); // Reset to page 1 when changing filter
    };

    // Fonction pour gérer la création d'un nouvel utilisateur
    const handleAddUser = async (userData) => {
        try {
            const response = await apiRequest.post('user/create', userData, true);
            if (response.status === 'success') {
                setError('');
                // Rafraîchir la liste des utilisateurs
                fetchUsers();
                handleCloseAddUserModal();
                return true;
            } else {
                setError(response.message || "Erreur lors de la création de l'utilisateur");
                return false;
            }
        } catch (e) {
            console.error("Erreur lors de la création de l'utilisateur:", e);
            setError("Erreur de connexion au serveur");
            return false;
        }
    };

    // Gérer le tri des colonnes
    const handleSort = (column) => {
        // Si on clique sur la même colonne, inverser la direction du tri
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            // Sinon, trier par la nouvelle colonne en ordre ascendant
            setSortBy(column);
            setSortDir('asc');
        }
    };

    // Générer l'icône de tri pour les en-têtes de colonnes
    const getSortIcon = (column) => {
        if (sortBy !== column) {
            return null;
        }

        return sortDir === 'asc' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
        );
    };

    // Réinitialiser les filtres
    const handleResetFilters = () => {
        setSearchTerm('');
        setDisplayedSearchTerm('');
        setPermissionFilter('');
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchUsers();
    }, [currentPage, perPage, searchTerm, sortBy, sortDir, permissionFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Appel API avec paramètres de pagination, recherche, tri et filtre
            const response = await apiRequest.get(
                `user/all?page=${currentPage}&perPage=${perPage}&search=${searchTerm}&sortBy=${sortBy}&sortDir=${sortDir}&permission=${permissionFilter}`, 
                true
            );
            
            if (response.status === 'success' && response.data) {
                setUsers(response.data.users);
                setTotalPages(response.data.pagination.totalPages);
                setTotalItems(response.data.pagination.totalItems);
                
                // Mettre à jour la liste des permissions disponibles si fournie par l'API
                if (response.data.filters?.availablePermissions) {
                    setAvailablePermissions(response.data.filters.availablePermissions);
                }
            } else {
                setError(response.message || 'Erreur lors du chargement des utilisateurs');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };    const selectUser = async (userId) => {
        try {
            setSelectedUser(null);
            
            // Récupérer les informations utilisateur actualisées directement depuis l'API
            const userDetailResponse = await apiRequest.get(`user/${userId}`, true);
            
            if (userDetailResponse.status === 'success' && userDetailResponse.data) {
                const userDetails = userDetailResponse.data;
                
                // Récupérer les permissions de l'utilisateur
                const permissionsResponse = await apiRequest.get(`permissions/${userId}`, true);
                
                if (permissionsResponse.status === 'success') {
                    // Extraire juste les noms des permissions
                    const userPermissions = permissionsResponse.data.map(p => p.permission);
                    
                    // Mettre à jour l'utilisateur sélectionné avec ses permissions et informations actualisées
                    setSelectedUser({
                        ...userDetails,
                        permissions: userPermissions || []
                    });
                    
                    // Mettre également à jour l'utilisateur dans la liste
                    setUsers(users.map(user => user.id === userId ? {...user, is_lock: userDetails.is_lock} : user));
                }
            } else {
                // Si l'API ne renvoie pas les détails, utiliser les données de la liste
                const userInList = users.find(u => u.id === userId);
                if (userInList) {
                    const permissionsResponse = await apiRequest.get(`permissions/${userId}`, true);
                    
                    if (permissionsResponse.status === 'success') {
                        const userPermissions = permissionsResponse.data.map(p => p.permission);
                        setSelectedUser({
                            ...userInList,
                            permissions: userPermissions || []
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Erreur lors de la sélection de l\'utilisateur:', err);
        }
    };

    const addPermission = async (permissions) => {
        if (!selectedUser) return;
        
        try {
            // Pour chaque permission sélectionnée, faire un appel API
            for (const permission of permissions) {
                const response = await apiRequest.post('permissions', {
                    user_id: selectedUser.id,
                    permission: permission
                }, true);
                
                if (response.status !== 'success') {
                    setError(`Erreur lors de l'ajout de la permission ${permission}`);
                    return;
                }
            }
            
            // Mettre à jour l'utilisateur avec ses nouvelles permissions
            await selectUser(selectedUser.id);
            setIsModalOpen(false);
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error(err);
        }
    };

    const removePermission = async (permission) => {
        if (!selectedUser) return;
        
        try {
            const response = await apiRequest.delete(`permissions?userId=${selectedUser.id}&permission=${permission}`, true);
            
            if (response.status === 'success') {
                // Mettre à jour l'utilisateur avec ses permissions restantes
                await selectUser(selectedUser.id);
            } else {
                setError(response.message || 'Erreur lors de la suppression de la permission');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error(err);
        }
    };

    // Obtenir les permissions disponibles qui ne sont pas déjà attribuées à l'utilisateur
    const getAvailablePermissions = () => {
        if (!selectedUser || !selectedUser.permissions) return availablePermissions;
        
        return availablePermissions.filter(
            permission => !selectedUser.permissions.includes(permission.value)
        );
    };    // Gérer le changement de page
    const handlePageChange = (page) => {
        setCurrentPage(page);
        // Forcer un rafraîchissement des données à chaque changement de page
        setSelectedUser(null); // Désélectionner l'utilisateur actuel
    };

    // Retourner une couleur de badge basée sur le nom de la permission
    const getPermissionBadgeColor = (permission) => {
        if (permission.includes('Admin')) {
            return 'bg-purple-100 text-purple-800 border-purple-200';
        } else if (permission.includes('Informatique')) {
            return 'bg-blue-100 text-blue-800 border-blue-200';
        } else if (permission.includes('Technique')) {
            return 'bg-green-100 text-green-800 border-green-200';
        } else if (permission.includes('Economat') || permission.includes('Économat')) {
            return 'bg-amber-100 text-amber-800 border-amber-200';
        }
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };    
        // Fonction pour basculer le statut de verrouillage d'un utilisateur
    const toggleUserLock = async (userId, currentLockStatus) => {
        if (!userId) return;

        // Afficher un message pour informer l'utilisateur de l'action en cours
        setError('');
        
        try {
            console.log(`Tentative de mise à jour du statut de verrouillage: de ${currentLockStatus} à ${!currentLockStatus}`);
              const response = await apiRequest.put(`user/${userId}?action=toggleLock`, {
                is_lock: currentLockStatus === true ? false : true
            }, true);

            console.log('Réponse API:', response);

            if (response.status === 'success' && response.data) {
                // Utiliser l'état renvoyé par l'API pour garantir la synchronisation
                const updatedLockStatus = response.data.is_lock;
                console.log('Nouveau statut reçu de l\'API:', updatedLockStatus);
                
                // Mettre à jour la liste des utilisateurs avec le nouveau statut
                setUsers(users.map(user => {
                    if (user.id === userId) {
                        return {...user, is_lock: updatedLockStatus};
                    }
                    return user;
                }));

                // Si l'utilisateur actuellement sélectionné est celui modifié, mettre à jour son état
                if (selectedUser && selectedUser.id === userId) {
                    setSelectedUser({
                        ...selectedUser,
                        is_lock: updatedLockStatus
                    });
                }

                // Forcer une actualisation des données
                fetchUsers();
                
                // Afficher un message de succès
                setError('');
            } else {
                setError(response.message || 'Erreur lors de la modification du statut de l\'utilisateur');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error(err);
        }
    };

    if (loading && !selectedUser && users.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="flex flex-row w-full justify-between items-center pr-4">
            <div className="flex flex-col border-b border-gray-200 px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Gestion des Utilisateurs</h3>
                <p className="mt-1 text-sm text-gray-500">
                    {totalItems} utilisateurs au total - Page {currentPage} sur {totalPages}
                </p>
                </div>
                <div className="flex items-end justify-end col-span-full sm:col-span-1">
                        <button
                            onClick={handleOpenAddUserModal}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Créer un utilisateur
                        </button>
                    </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Barre de recherche et filtres */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-6">
                    <div>
                        <FormField
                            label="Rechercher un utilisateur"
                            name="search"
                            value={displayedSearchTerm}
                            onChange={handleSearchChange}
                            placeholder="Nom d'utilisateur, site..."
                            icon={
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            }
                        />
                    </div>
                    <div>
                        <FormSelect
                            label="Filtrer par permission"
                            name="permission-filter"
                            value={permissionFilter}
                            onChange={handlePermissionFilterChange}
                            options={[
                                
                                ...availablePermissions
                            ]}
                            icon={
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                </svg>
                            }
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleResetFilters}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            Réinitialiser les filtres
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex px-4 py-3 sm:px-6">
                {/* Contrôle du nombre d'éléments par page */}
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Afficher</span>
                    <select 
                        value={perPage} 
                        onChange={(e) => {
                            setPerPage(Number(e.target.value));
                            setCurrentPage(1); // Reset to first page when changing items per page
                        }}
                        className="rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-700">utilisateurs par page</span>
                </div>
            </div>

            <div className="flex">
                {/* Liste des utilisateurs */}
                <div className="w-1/3 border-r border-gray-200">
                    {users.length > 0 ? (
                        <ul className="overflow-y-auto">
                            {users.map((user) => (
                                <li key={user.id} className="border-b border-gray-200 last:border-b-0">
                                    <button
                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                                            selectedUser?.id === user.id ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => selectUser(user.id)}
                                    >
                                        <div className="flex items-center">
                                            <div className="flex-1">
                                                <p className="font-medium">{user.username}</p>
                                                <p className="text-sm text-gray-500">{user.site || 'Site non spécifié'}</p>
                                            </div>
                                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex items-center justify-center h-60 text-gray-500">
                            {loading ? (
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                                    <p className="mt-2">Chargement...</p>
                                </div>
                            ) : (
                                <div className="text-center p-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="mt-2">Aucun utilisateur trouvé.</p>
                                    <button 
                                        onClick={handleResetFilters}
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Réinitialiser les filtres
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
                
                {/* Détails de l'utilisateur */}
                <div className="w-2/3 p-4 pt-0">
                    {selectedUser ? (
                        <div>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
                                <div className="flex items-start">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-semibold border border-blue-200">
                                        {selectedUser.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-xl font-semibold text-gray-900">{selectedUser.username}</h2>
                                                <p className="text-sm text-gray-600">
                                                    {selectedUser.site ? `Site: ${selectedUser.site}` : 'Site non spécifié'}
                                                </p>
                                            </div>                                            <div className="text-right">
                                                <LockStatus isLocked={selectedUser.is_lock || false} />
                                                <button 
                                                    onClick={() => toggleUserLock(selectedUser.id, selectedUser.is_lock)} 
                                                    className="ml-2 mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    {selectedUser.is_lock ? 'Débloquer' : 'Bloquer'}
                                                </button>
                                            </div>
                                        </div>
                                        {selectedUser.last_ip && (
                                            <div className="mt-2 flex items-center text-xs text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                                                </svg>
                                                Dernière connexion: {selectedUser.last_ip}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
                                    <button
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Ajouter
                                    </button>
                                </div>

                                {selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUser.permissions.map((permission) => {
                                            // Déterminer couleur en fonction du type de permission
                                            let bgColor = 'bg-gray-100';
                                            let textColor = 'text-gray-700';
                                            let borderColor = 'border-gray-200';
                                            
                                            if (permission === 'AdminAccess') {
                                                bgColor = 'bg-purple-100';
                                                textColor = 'text-purple-700';
                                                borderColor = 'border-purple-200';
                                            } else if (permission.includes('Informatique')) {
                                                bgColor = 'bg-blue-100';
                                                textColor = 'text-blue-700';
                                                borderColor = 'border-blue-200';
                                            } else if (permission.includes('Technique')) {
                                                bgColor = 'bg-green-100';
                                                textColor = 'text-green-700';
                                                borderColor = 'border-green-200';
                                            } else if (permission.includes('Economat') || permission.includes('Économat')) {
                                                bgColor = 'bg-amber-100';
                                                textColor = 'text-amber-700';
                                                borderColor = 'border-amber-200';
                                            }
                                            
                                            return (
                                                <div 
                                                    key={permission} 
                                                    className={`inline-flex items-center px-3 py-1.5 rounded-full border ${borderColor} ${bgColor} ${textColor}`}
                                                >
                                                    <span className="font-medium mr-1.5">{permission}</span>
                                                    <button
                                                        onClick={() => removePermission(permission)}
                                                        className="ml-1 h-5 w-5 rounded-full inline-flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                                                        title="Supprimer cette permission"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center text-center py-6 border border-dashed rounded-lg">
                                        <span className="text-gray-500">Aucune permission attribuée</span>
                                        <button
                                            className="ml-3 inline-flex items-center px-2 py-1 border border-transparent text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            onClick={() => setIsModalOpen(true)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Ajouter
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <p className="text-lg font-medium text-center">Sélectionnez un utilisateur pour afficher ses détails</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal pour ajouter des permissions */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Ajouter des permissions"
            >
                <PermissionSelector
                    availablePermissions={getAvailablePermissions()}
                    onSelectPermission={addPermission}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>


            {/* Modal pour ajouter un nouvel utilisateur */}
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={handleCloseAddUserModal}
                onAddUser={handleAddUser}
            />
        </div>
    );
}