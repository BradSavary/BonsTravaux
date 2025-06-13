import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../../lib/api-request';
import { FormField } from '../Form/FormField';

export function ServicesManagement() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingService, setEditingService] = useState(null);
    const [newServiceName, setNewServiceName] = useState('');

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await apiRequest.get('service-intervenants', true);
            if (response.status === 'success') {
                setServices(response.data || []);
            } else {
                setError(response.message || 'Erreur lors de la récupération des services');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addService = async () => {
        if (!newServiceName.trim()) {
            setError('Le nom du service ne peut pas être vide');
            return;
        }

        try {
            setLoading(true);
            const response = await apiRequest.post('service-intervenants', {
                name: newServiceName.trim()
            }, true);

            if (response.status === 'success') {
                setServices([...services, response.data]);
                setNewServiceName('');
                setSuccess('Service ajouté avec succès');
                setTimeout(() => setSuccess(''), 3000);
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
            ...service,
            name: service.name
        });
    };

    const cancelEditing = () => {
        setEditingService(null);
    };

    const updateService = async () => {
        if (!editingService || !editingService.name.trim()) {
            setError('Le nom du service ne peut pas être vide');
            return;
        }

        try {
            setLoading(true);
            const response = await apiRequest.put(`service-intervenants/${editingService.id}`, {
                name: editingService.name.trim()
            }, true);

            if (response.status === 'success') {
                setServices(services.map(s => (s.id === editingService.id ? response.data : s)));
                setEditingService(null);
                setSuccess('Service mis à jour avec succès');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.message || 'Erreur lors de la mise à jour du service');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const deleteService = async (serviceId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.')) {
            return;
        }

        try {
            setLoading(true);
            const response = await apiRequest.delete(`service-intervenants/${serviceId}`, true);

            if (response.status === 'success') {
                setServices(services.filter(s => s.id !== serviceId));
                setSuccess('Service supprimé avec succès');
                setTimeout(() => setSuccess(''), 3000);
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

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
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

            {success && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulaire pour ajouter un nouveau service */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Ajouter un service intervenant</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-end space-x-2">
                        <div className="flex-grow">
                            <FormField
                                label="Nom du service"
                                name="service-name"
                                value={newServiceName}
                                onChange={(e) => setNewServiceName(e.target.value)}
                                disabled={loading}
                                placeholder="Ex: Informatique, Technique, Économat"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addService}
                            disabled={!newServiceName.trim() || loading}
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                                !newServiceName.trim() || loading
                                    ? 'bg-blue-300 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }`}
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                            )}
                            Ajouter
                        </button>
                    </div>
                </div>
            </div>

            {/* Liste des services */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Services intervenants</h3>
                    <p className="mt-1 text-sm text-gray-500">Liste des services pouvant intervenir sur les tickets</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && !services.length ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center py-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : services.length > 0 ? (
                                services.map(service => (
                                    <tr key={service.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {editingService && editingService.id === service.id ? (
                                                <input
                                                    type="text"
                                                    value={editingService.name}
                                                    onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                                                    className="block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            ) : (
                                                service.name
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {editingService && editingService.id === service.id ? (
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={updateService}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Sauvegarder
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="text-gray-600 hover:text-gray-900"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end space-x-4">
                                                    <button
                                                        onClick={() => startEditing(service)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={() => deleteService(service.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                                        Aucun service trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}