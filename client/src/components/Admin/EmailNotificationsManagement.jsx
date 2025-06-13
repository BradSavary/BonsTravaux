import { useState, useEffect } from 'react';
import { apiRequest } from '../../../lib/api-request';
import { FormField } from '../Form/FormField';
import { Modal } from '../ui/Modal';
import { FormSelect } from '../Form/FormSelect';
import { FormCheckbox } from '../Form/FormCheckbox';

export function EmailNotificationsManagement() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [serviceOptions, setServiceOptions] = useState([]);
    const [permissionOptions, setPermissionOptions] = useState([]);
    const [editingNotification, setEditingNotification] = useState(null);
    const [testEmail, setTestEmail] = useState('');
    
    // État du formulaire pour l'ajout/modification
    const [formData, setFormData] = useState({
        service_id: '',
        permission_type: '',
        email: '',
        enabled: true
    });

    // Charger les notifications au chargement du composant
    useEffect(() => {
        fetchNotifications();
        fetchOptionsData();
    }, []);

    // Récupérer les notifications email
    const fetchNotifications = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await apiRequest.get('notification-emails', true);
            
            if (response.status === 'success') {
                setNotifications(response.data || []);
            } else {
                setError(response.message || 'Erreur lors du chargement des notifications');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    // Récupérer les options pour les services et permissions
    const fetchOptionsData = async () => {
        try {
            const response = await apiRequest.get('notification-emails?service_options=true', true);
            
            if (response.status === 'success' && response.data) {
                // Formater les options de service pour le select
                const servicesOpts = response.data.services.map(service => ({
                    value: service.id,
                    label: service.name
                }));
                
                // Formater les options de permission pour le select
                const permissionsOpts = response.data.permissions.map(permission => ({
                    value: permission.id,
                    label: permission.name
                }));
                
                setServiceOptions(servicesOpts);
                setPermissionOptions(permissionsOpts);
            }
        } catch (err) {
            console.error('Error fetching options data:', err);
        }
    };

    // Gérer le changement dans les champs du formulaire
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Ouvrir la modal d'ajout
    const handleOpenAddModal = () => {
        setFormData({
            service_id: '',
            permission_type: '',
            email: '',
            enabled: true
        });
        setIsAddModalOpen(true);
    };

    // Ouvrir la modal d'édition
    const handleOpenEditModal = (notification) => {
        setEditingNotification(notification);
        setFormData({
            service_id: notification.service_id,
            permission_type: notification.permission_type,
            email: notification.email,
            enabled: notification.enabled
        });
        setIsEditModalOpen(true);
    };

    // Fermer les modals
    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingNotification(null);
    };

    // Ajouter une nouvelle notification
    const handleAddNotification = async () => {
        if (!formData.service_id || !formData.permission_type || !formData.email) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await apiRequest.post('notification-emails', formData, true);
            
            if (response.status === 'success') {
                setSuccess('Notification email ajoutée avec succès');
                fetchNotifications();
                handleCloseAddModal();
                
                setTimeout(() => {
                    setSuccess('');
                }, 3000);
            } else {
                setError(response.message || 'Erreur lors de l\'ajout de la notification');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error('Error adding notification:', err);
        } finally {
            setLoading(false);
        }
    };

    // Mettre à jour une notification
    const handleUpdateNotification = async () => {
        if (!formData.email) {
            setError('L\'adresse email est requise');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await apiRequest.put(`notification-emails/${editingNotification.id}`, formData, true);
            
            if (response.status === 'success') {
                setSuccess('Notification email mise à jour avec succès');
                fetchNotifications();
                handleCloseEditModal();
                
                setTimeout(() => {
                    setSuccess('');
                }, 3000);
            } else {
                setError(response.message || 'Erreur lors de la mise à jour de la notification');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error('Error updating notification:', err);
        } finally {
            setLoading(false);
        }
    };

    // Supprimer une notification
    const handleDeleteNotification = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await apiRequest.delete(`notification-emails/${id}`, true);
            
            if (response.status === 'success') {
                setSuccess('Notification email supprimée avec succès');
                setNotifications(notifications.filter(notification => notification.id !== id));
                
                setTimeout(() => {
                    setSuccess('');
                }, 3000);
            } else {
                setError(response.message || 'Erreur lors de la suppression de la notification');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error('Error deleting notification:', err);
        } finally {
            setLoading(false);
        }
    };    // Fonction pour envoyer un email de test
    const handleSendTestEmail = async () => {
        if (!testEmail) {
            setError('Veuillez entrer une adresse email valide');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await apiRequest.get(`notification-emails/test-email?email=${encodeURIComponent(testEmail)}`, true);
            
            if (response.status === 'success') {
                setSuccess(response.message || 'Email de test envoyé avec succès');
                setIsTestModalOpen(false);
                setTestEmail('');
                
                setTimeout(() => {
                    setSuccess('');
                }, 5000);
            } else {
                setError(response.message || 'Erreur lors de l\'envoi de l\'email de test');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
            console.error('Error sending test email:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleOpenTestModal = () => {
        setTestEmail('');
        setIsTestModalOpen(true);
    };

    const handleCloseTestModal = () => {
        setIsTestModalOpen(false);
    };

    // Rendre les composants de la page
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Notifications Email</h2>
                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={handleOpenTestModal}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        disabled={loading}
                    >
                        Tester l'envoi d'email
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        disabled={loading}
                    >
                        Ajouter une notification
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
                    {success}
                </div>
            )}

            {loading && !notifications.length ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Aucune notification email configurée.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Service
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type de permission
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Statut
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {notifications.map(notification => (
                                        <tr key={notification.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {notification.service_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {notification.permission_type === 'InformatiqueTicket' && 'Informatique'}
                                                {notification.permission_type === 'TechniqueTicket' && 'Technique'}
                                                {notification.permission_type === 'EconomatTicket' && 'Économat'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {notification.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {notification.enabled ? (
                                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                                        Activé
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                        Désactivé
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditModal(notification)}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteNotification(notification.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Modal pour ajouter une notification */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                title="Ajouter une notification email"
                footer={
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCloseAddModal}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleAddNotification}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            disabled={loading}
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <FormSelect
                        label="Service intervenant"
                        name="service_id"
                        value={formData.service_id}
                        onChange={handleChange}
                        options={serviceOptions}
                        required={true}
                        placeholder="Sélectionner un service"
                    />
                    <FormSelect
                        label="Type de permission"
                        name="permission_type"
                        value={formData.permission_type}
                        onChange={handleChange}
                        options={permissionOptions}
                        required={true}
                        placeholder="Sélectionner une permission"
                    />
                    <FormField
                        label="Adresse email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        required={true}
                        placeholder="exemple@domaine.com"
                    />
                    <FormCheckbox
                        label="Notification activée"
                        name="enabled"
                        checked={formData.enabled}
                        onChange={handleChange}
                    />
                </div>
            </Modal>

            {/* Modal pour modifier une notification */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                title="Modifier la notification email"
                footer={
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCloseEditModal}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleUpdateNotification}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            disabled={loading}
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <FormSelect
                        label="Service intervenant"
                        name="service_id"
                        value={formData.service_id}
                        onChange={handleChange}
                        options={serviceOptions}
                        required={true}
                        placeholder="Sélectionner un service"
                        disabled={true} // On ne permet pas de changer le service
                    />
                    <FormSelect
                        label="Type de permission"
                        name="permission_type"
                        value={formData.permission_type}
                        onChange={handleChange}
                        options={permissionOptions}
                        required={true}
                        placeholder="Sélectionner une permission"
                        disabled={true} // On ne permet pas de changer la permission
                    />
                    <FormField
                        label="Adresse email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        required={true}
                        placeholder="exemple@domaine.com"
                    />
                    <FormCheckbox
                        label="Notification activée"
                        name="enabled"
                        checked={formData.enabled}
                        onChange={handleChange}
                    />
                </div>            </Modal>
            
            {/* Modal pour tester l'envoi d'emails */}
            <Modal
                isOpen={isTestModalOpen}
                onClose={handleCloseTestModal}
                title="Tester l'envoi d'email"
                footer={
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCloseTestModal}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleSendTestEmail}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            disabled={loading}
                        >
                            {loading ? 'Envoi...' : 'Envoyer un email de test'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Cet outil vous permet de tester la configuration d'envoi d'emails de l'application.
                        Un email de test sera envoyé à l'adresse indiquée.
                    </p>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
                        <div className="font-medium text-yellow-800">Note importante</div>
                        <p className="text-yellow-700">
                            Si vous ne recevez pas l'email, vérifiez les logs du serveur pour diagnostiquer les problèmes potentiels.
                        </p>
                    </div>
                    <FormField
                        label="Adresse email de test"
                        name="testEmail"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        type="email"
                        required={true}
                        placeholder="exemple@domaine.com"
                    />
                </div>
            </Modal>
        </div>
    );
}
