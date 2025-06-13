import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../../lib/api-request';
import { FormSelect } from '../components/Form/FormSelect';

export function Settings() {
    const { currentUser, updateDefaultService } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [services, setServices] = useState([]);
    const [defaultServiceId, setDefaultServiceId] = useState(currentUser?.default_service_id || '');

    // Charger les services au chargement du composant
    useEffect(() => {
        fetchServices();
    }, []);    const fetchServices = async () => {
        try {
            setLoading(true);
            // Ajouter le paramètre forTicketCreation=true pour récupérer tous les services sans pagination
            const response = await apiRequest.get('services?forTicketCreation=true', true);
            
            if (response && response.status === 'success' && Array.isArray(response.data)) {
                setServices(response.data.map(service => ({
                    value: service.id,
                    label: service.nom
                })));
            } else {
                console.error('Erreur format données services: ', response);
                setError('Impossible de charger les services demandeurs');
            }
        } catch (err) {
            console.error('Erreur lors du chargement des services:', err);
            setError('Erreur lors du chargement des services');
        } finally {
            setLoading(false);
        }
    };

    const handleServiceChange = (e) => {
        setDefaultServiceId(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        
        try {
            const result = await updateDefaultService(defaultServiceId);
            
            if (result) {
                setSuccess('Service demandeur par défaut mis à jour avec succès');
                
                // Afficher le message de succès pendant quelques secondes
                setTimeout(() => {
                    setSuccess('');
                }, 3000);
            } else {
                setError('Erreur lors de la mise à jour du service par défaut');
            }
        } catch (err) {
            console.error('Erreur lors de la mise à jour du service par défaut:', err);
            setError('Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Paramètres</h2>
                </div>
                
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-300 text-red-800">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-4 p-4 rounded-md bg-green-50 border border-green-300 text-green-800">
                            {success}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                            <h3 className="text-md font-medium text-gray-900 mb-4">Préférences de service</h3>
                            
                            <FormSelect
                                label="Service demandeur par défaut"
                                name="default_service_id"
                                value={defaultServiceId}
                                onChange={handleServiceChange}
                                options={services}
                                loading={loading}
                                helpText="Ce service sera automatiquement présélectionné lorsque vous créerez un nouveau bon."
                            />
                        </div>
                        
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving || loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
