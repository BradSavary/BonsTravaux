import React, { useState, useEffect, onChange } from 'react';
import { Modal } from '../ui/Modal';
import { AutoCompleteInput } from '../Form/AutoCompleteInput';
import { apiRequest } from '../../../lib/api-request';

/**
 * Component for selecting ticket categories
 */
export function CategorySelectionModal({ 
  isOpen, 
  onClose, 
  ticketId, 
  serviceId,
  currentCategoryId = null, 
  currentCategoryName = null,
  onCategorySelected 
}) {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Rechercher les catégories lorsque le service change
  useEffect(() => {
    if (isOpen && serviceId) {
      fetchCategories();
    }
  }, [isOpen, serviceId]);

  // Définir la catégorie actuelle lorsque la modale s'ouvre
  useEffect(() => {
    if (isOpen && currentCategoryId && currentCategoryName) {
      setSelectedCategory({
        id: currentCategoryId,
        name: currentCategoryName
      });
      setSearchTerm(currentCategoryName);
    } else {
      setSelectedCategory(null);
      setSearchTerm('');
    }
    setError('');
    setSuccess('');
  }, [isOpen, currentCategoryId, currentCategoryName]);

  // Récupérer toutes les catégories pour le service
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await apiRequest.get(`ticket-categories?serviceId=${serviceId}`, true);
      if (response.status === 'success') {
        setCategories(response.data);
      } else {
        setError('Erreur lors de la récupération des catégories');
      }
    } catch (err) {
      setError('Erreur lors de la récupération des catégories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Rechercher des catégories correspondant au terme de recherche
  const handleSearch = async (query) => {
    if (!query || query.length < 2) return [];

    try {
      const response = await apiRequest.get(`ticket-categories?serviceId=${serviceId}&query=${encodeURIComponent(query)}`, true);
      if (response.status === 'success') {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('Erreur lors de la recherche de catégories:', err);
      return [];
    }
  };
  // Gérer la sélection d'une catégorie
  const handleSelect = (value, item) => {
    setSelectedCategory(item);
    setSearchTerm(value);
  };

  // Ajouter une nouvelle catégorie
  const handleAddCategory = async (name) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest.post('ticket-categories', {
        name: name.trim(),
        service_id: serviceId
      }, true);
      
      if (response.status === 'success') {
        setSelectedCategory(response.data);
        setSuccess('Catégorie ajoutée avec succès');
        setCategories(prev => [...prev, response.data]);
        return response.data;
      } else {
        setError(response.message || 'Erreur lors de l\'ajout de la catégorie');
        return null;
      }
    } catch (err) {
      setError('Erreur lors de l\'ajout de la catégorie');
      console.error(err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mettre à jour la catégorie du ticket
  const handleSubmit = async () => {
    if (!ticketId) {
      setError('ID de ticket manquant');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const categoryId = selectedCategory ? selectedCategory.id : 'null';
      
      const response = await apiRequest.post(`tickets/${ticketId}?action=update-category`, {
        categoryId
      }, true);
      
      if (response.status === 'success') {
        setSuccess('Catégorie mise à jour avec succès');
        onCategorySelected && onCategorySelected({
          id: selectedCategory ? selectedCategory.id : null,
          name: selectedCategory ? selectedCategory.name : null
        });
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Erreur lors de la mise à jour de la catégorie');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour de la catégorie');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCategory = () => {
    setSelectedCategory(null);
    setSearchTerm('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catégoriser le ticket"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {success}
          </div>
        )}

        <div>
          <p className="text-sm text-gray-500 mb-2">
            Vous pouvez assigner une catégorie à ce ticket pour faciliter son tri et son organisation.
          </p>
        </div>

        <div>
          <AutoCompleteInput
            label="Rechercher ou créer une catégorie"
            value={searchTerm}
            onSearch={handleSearch}
            onAddNewItem={handleAddCategory}
            disabled={isSubmitting}
            loading={loading}
            placeholder="Tapez pour rechercher..."
            helpText="Recherchez une catégorie existante ou ajoutez-en une nouvelle si elle n'existe pas"
            allowNew={true}
            onChange={(value, item) => {
              setSearchTerm(value);
              if (item) handleSelect(value, item);
            }}
          />
        </div>

        {selectedCategory && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-gray-700">Catégorie sélectionnée :</div>
                <div className="text-lg text-blue-700">{selectedCategory.name}</div>
              </div>
              <button
                onClick={handleRemoveCategory}
                className="text-blue-600 hover:text-blue-800 text-sm"
                disabled={isSubmitting}
              >
                Modifier
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Annuler
          </button>          <button
            onClick={handleSubmit}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {selectedCategory ? 'Valider' : 'Valider sans catégorie'}
            {isSubmitting && (
              <span className="ml-2 inline-block w-4 h-4">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
