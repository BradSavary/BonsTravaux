import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { FormSelect } from '../Form/FormSelect';
import { AutoCompleteInput } from '../Form/AutoCompleteInput';
import { apiRequest } from '../../../lib/api-request';

export function CategorySelectorModal({ isOpen, onClose, ticketId, serviceId, currentCategoryId, onCategoryUpdated }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [mode, setMode] = useState('select'); // 'select' ou 'create'
  
  // Charger les données initiales quand la modale s'ouvre
  useEffect(() => {
    if (isOpen && serviceId) {
      setSelectedCategoryId(currentCategoryId || '');
      setNewCategory('');
      setMode('select');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, serviceId, currentCategoryId]);
  
  // Rechercher des catégories
  const searchCategories = async (query) => {
    try {
      setLoading(true);
      const response = await apiRequest.get(`ticket-categories?serviceId=${serviceId}&query=${encodeURIComponent(query)}`, true);
      if (response.status === 'success') {
        setSearchResults(response.data);
        return response.data;
      } else {
        setError(response.message || 'Erreur lors de la recherche');
        return [];
      }
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError('Erreur lors de la recherche');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Ajouter une nouvelle catégorie
  const handleAddNewCategory = async () => {
    if (!newCategory.trim()) {
      setError('Veuillez saisir un nom de catégorie');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await apiRequest.post('ticket-categories', {
        name: newCategory.trim(),
        service_id: serviceId
      }, true);
      
      if (response.status === 'success') {
        // Sélectionner automatiquement la nouvelle catégorie
        const newCategoryId = response.data.id;
        await updateTicketCategory(newCategoryId);
      } else {
        setError(response.message || 'Erreur lors de la création de la catégorie');
      }
    } catch (err) {
      console.error('Erreur lors de la création de la catégorie:', err);
      setError('Erreur lors de la création de la catégorie');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Mettre à jour la catégorie du ticket
  const updateTicketCategory = async (categoryId) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest.put(`tickets/${ticketId}`, {
        category_id: categoryId
      }, true);
      
      if (response.status === 'success') {
        setSuccess(true);
        setSelectedCategoryId(categoryId);
        onCategoryUpdated && onCategoryUpdated(categoryId);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Erreur lors de la mise à jour du ticket');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du ticket:', err);
      setError('Erreur lors de la mise à jour du ticket');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveCategory = () => {
    if (selectedCategoryId) {
      updateTicketCategory(selectedCategoryId);
    } else {
      setError('Veuillez sélectionner une catégorie');
    }
  };
  
  const handleSaveNewCategory = async () => {
    await handleAddNewCategory();
  };
  
  const handleAutoCompleteChange = (value, suggestion) => {
    setNewCategory(value);
    if (suggestion && suggestion.id) {
      setSelectedCategoryId(suggestion.id);
      setMode('select');
    }
  };
  
  const handleAddNewClicked = (inputValue) => {
    setNewCategory(inputValue);
    setMode('create');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catégoriser le ticket"
    >
      <div className="space-y-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
            Catégorie mise à jour avec succès !
          </div>
        )}
        
        {mode === 'select' ? (
          <>
            <p className="text-sm text-gray-600 mb-2">
              Sélectionnez une catégorie existante ou créez-en une nouvelle.
            </p>
            
            <AutoCompleteInput
              label="Rechercher ou créer une catégorie"
              value={newCategory}
              onChange={handleAutoCompleteChange}
              onSearch={searchCategories}
              onAddNewItem={handleAddNewClicked}
              loading={loading}
              disabled={isSubmitting || success}
              placeholder="Commencez à taper pour rechercher..."
              helpText="Si la catégorie n'existe pas, vous pourrez la créer."
              allowNew={true}
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={onClose}
                disabled={isSubmitting || success}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={!selectedCategoryId || isSubmitting || success}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !selectedCategoryId || isSubmitting || success
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'En cours...' : 'Appliquer'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-2">
              Créer une nouvelle catégorie pour ce service.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la nouvelle catégorie
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={isSubmitting || success}
                placeholder="Ex: Problème matériel"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMode('select')}
                disabled={isSubmitting || success}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retour
              </button>
              <button
                onClick={handleSaveNewCategory}
                disabled={!newCategory.trim() || isSubmitting || success}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  !newCategory.trim() || isSubmitting || success
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSubmitting ? 'En cours...' : 'Créer et appliquer'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
