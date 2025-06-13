import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../../lib/api-request';
import { ticketImageService } from '../../lib/ticket-image-service';
import { FormField } from '../components/Form/FormField';
import { FormSelect } from '../components/Form/FormSelect';
import { FormTextArea } from '../components/Form/FormTextArea';
import { ImagePasteTextArea } from '../components/Form/ImagePasteTextArea';
import { FormCheckbox } from '../components/Form/FormCheckbox';
import { StatusBadge } from '../components/ui/StatusBadge';

export function NewTicket() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    // État du formulaire    
    const [formData, setFormData] = useState({
        service_id: currentUser?.default_service_id || '',
        service_intervenant_id: '',
        details: '',
        lieu_intervention: '',        
        voir_avant_intervention: false,
        site: currentUser?.site || ''
    });
    
    // État pour les images collées
    const [pastedImages, setPastedImages] = useState([]);
    
    // Options pour les menus déroulants
    const [services, setServices] = useState([]);
    const [serviceIntervenants, setServiceIntervenants] = useState([]);
    
    // Charger les services et services intervenants
    useEffect(() => {
  const fetchServices = async () => {
    try {
      // Ajouter le paramètre forTicketCreation=true pour contourner la vérification d'admin
      const servicesResponse = await apiRequest.get('services?forTicketCreation=true', true);
      
      if (servicesResponse.status === 'success' && Array.isArray(servicesResponse.data)) {
        setServices(servicesResponse.data.map(service => ({
          value: service.id,
          label: service.nom
        })));
      } else {
        console.error('Erreur format données services: ', servicesResponse);
      }
      
      const serviceIntervenantsResponse = await apiRequest.get('service-intervenants', true);
      
      if (serviceIntervenantsResponse.status === 'success') {
        setServiceIntervenants(serviceIntervenantsResponse.data.map(service => ({
          value: service.id,
          label: service.name
        })));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données: ', err);
    }
  };
  
  fetchServices();
}, []);

const updateDefaultService = async (serviceId) => {
    try {
        console.log('Mise à jour du service par défaut:', serviceId);
        
        // Utiliser POST au lieu de PUT
        const response = await apiRequest.put(
            'user/default-service', 
            { serviceId }, 
            true
        );
        
        console.log('Réponse mise à jour service par défaut:', response);
        return response;
    } catch (error) {
        console.error('Error updating default service:', error);
    }
};
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
    };
      // Gérer l'ajout d'une image collée
    const handleImagePaste = (imageData, newImages) => {
        // Si on reçoit des images déjà traitées (suppression d'une image)
        if (newImages !== undefined) {
            setPastedImages(newImages);
            return;
        }
        
        // Sinon, ajouter la nouvelle image à la liste
        if (imageData) {
            setPastedImages(prev => [...prev, imageData]);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await apiRequest.post('tickets', formData, true);
            
            if (response.status === 'success') {
                // Si le ticket est créé avec succès, mettre à jour le service par défaut
                if (formData.service_id) {
                    await updateDefaultService(formData.service_id);
                }
                
                // Si des images ont été collées, les télécharger
                if (pastedImages.length > 0) {
                    const ticketId = response.data.id;
                    
                    // Télécharger chaque image collée
                    for (const imageData of pastedImages) {
                        try {
                            await ticketImageService.uploadImage(imageData, ticketId, false);
                        } catch (imgErr) {
                            console.error('Erreur lors du téléchargement d\'une image:', imgErr);
                            // Continuer même si une image échoue
                        }
                    }
                }
                
                setSuccess(true);
                setTimeout(() => {
                    navigate('/tickets');
                }, 1500);
            } else {
                setError(response.message || "Une erreur est survenue");
            }
        } catch (err) {
            setError("Erreur lors de la création du bon");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Entête de la page */}
            <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Nouvelle demande d'intervention
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Remplissez ce formulaire pour soumettre une nouvelle demande
                        </p>
                    </div>
                    <StatusBadge status="Nouveau" customBgColor="bg-blue-100" customTextColor="text-blue-800" />
                </div>
            </div>
            
            {/* Contenu du formulaire */}
            <div className="px-6 py-5">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p>{error}</p>
                        </div>
                    </div>
                )}
                
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p>Demande créée avec succès ! Redirection en cours...</p>
                        </div>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section demandeur */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <span className="bg-blue-100 text-blue-600 p-1 rounded-full mr-2">
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </span>
                            Informations du demandeur
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Champ du nom de l'utilisateur, automatique avec le authContext */}
                            <FormField
                                label="Nom d'utilisateur"
                                name="username"
                                value={currentUser?.username || ''}
                                disabled={true}
                                required={true}
                                icon={
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                }
                            />

                            {/* Champ du site (Saint Léonard ou Bujaleuf) */}
                            <FormSelect
                                label="Site"
                                name="site"
                                value={formData.site}
                                onChange={handleChange}
                                required={true}
                                options={[
                                    { value: "Saint Leonard", label: "Saint Léonard" },
                                    { value: "Bujaleuf", label: "Bujaleuf" }
                                ]}
                                icon={
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                }
                            />
                            
                            {/* Sélecteur de service demandeur, récupéré automatiquement si déjà défini en bdd */}
                            <FormSelect
                                    label="Service demandeur"
                                    name="service_id"
                                    value={formData.service_id}
                                    onChange={handleChange}
                                    required={true}
                                    options={services}
                                    placeholder="Sélectionnez un service"
                                    helpText={"Votre service sera enregistré pour les prochaines demandes."}
                                    loading={loading && services.length === 0}
                                    icon={
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    }
                                />
                        </div>
                    </div>
                    
                    {/* Section détails de la demande */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <span className="bg-green-100 text-green-600 p-1 rounded-full mr-2">
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </span>
                            Détails de la demande
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Champ du lieu d'intervention */}
                                <FormField
                                    label="Lieu d'intervention"
                                    name="lieu_intervention"
                                    value={formData.lieu_intervention}
                                    onChange={handleChange}
                                    required={true}
                                    placeholder="Ex: Chambre 401, Accueil, Bureau RH..."
                                    helpText="Précisez le lieu exact où l'intervention doit être effectuée"
                                    icon={
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    }
                                />

                                {/* Sélecteur de service intervenant */}
                                 <FormSelect
                                    label="Service Demandé"
                                    name="service_intervenant_id"
                                    value={formData.service_intervenant_id}
                                    onChange={handleChange}
                                    required={true}
                                    options={serviceIntervenants}
                                    placeholder="Sélectionnez le service"
                                    loading={loading && serviceIntervenants.length === 0}
                                    icon={
                                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    }
                                />
                            </div>
                                  {/* Champ de détails de la demande - avec support d'images */}
                            <ImagePasteTextArea
                                label="Détails de la demande"
                                name="details"
                                value={formData.details}
                                onChange={handleChange}
                                onImagePaste={handleImagePaste}
                                imagesPasted={pastedImages}
                                required={true}
                                placeholder="Décrivez votre demande en détail..."
                                helpText="Veuillez fournir autant de détails que possible pour faciliter la prise en charge."
                                rows={5}
                                icon={
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                }
                            />
                            
                            {/* Case à cocher pour voir avec le personnel avant l'intervention */}
                            <FormCheckbox
                                label="Voir avec le personnel avant intervention"
                                name="voir_avant_intervention"
                                checked={formData.voir_avant_intervention}
                                onChange={handleChange}
                                helpText="Cochez cette case si vous souhaitez être contacté avant l'intervention."
                            />
                        </div>
                    </div>
                    
                    {/* Boutons d'action */}
                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="py-2.5 px-5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center transition-colors duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Soumettre la demande
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}