import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';

export function CategoryFilterModal({ isOpen, onClose, categoryOptions, initialSelected, onApplyFilters }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [includeUncategorized, setIncludeUncategorized] = useState(false);

  // Initialiser les catégories sélectionnées quand la modale s'ouvre
  useEffect(() => {
    if (isOpen && initialSelected) {
      setSelectedCategories(initialSelected.filter(id => id !== 'uncategorized'));
      setIncludeUncategorized(initialSelected.includes('uncategorized'));
    }
  }, [isOpen, initialSelected]);

  const handleToggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleToggleUncategorized = () => {
    setIncludeUncategorized(!includeUncategorized);
  };

  const handleSelectAll = () => {
    setSelectedCategories(categoryOptions.map(category => category.id));
    setIncludeUncategorized(true);
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setIncludeUncategorized(false);
  };

  const handleApply = () => {
    const allSelected = [
      ...selectedCategories,
      ...(includeUncategorized ? ['uncategorized'] : [])
    ];
    onApplyFilters(allSelected);
    onClose();
  };

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        Annuler
      </button>
      <button
        type="button"
        onClick={handleApply}
        className="ml-3 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
      >
        Appliquer ({selectedCategories.length + (includeUncategorized ? 1 : 0)})
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filtrer par catégorie"
      footer={footerButtons}
    >
      <div className="space-y-4">
        <div className="flex justify-between mb-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Tout sélectionner
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Tout désélectionner
          </button>
        </div>        
        <div className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
          {/* Option spéciale pour les tickets non-catégorisés */}
          <div className={`flex items-center justify-between py-2 ${includeUncategorized ? 'bg-blue-50' : ''}`}>
            <label 
              htmlFor="uncategorized"
              className="flex items-center cursor-pointer w-full"
            >
              <input
                type="checkbox"
                id="uncategorized"
                checked={includeUncategorized}
                onChange={handleToggleUncategorized}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
              />
              <span>Non catégorisé</span>
            </label>
          </div>
          
          {/* Liste des catégories disponibles */}
          {categoryOptions.length === 0 && (
            <div className="py-3 text-center text-gray-500 italic">
              Aucune catégorie disponible.
            </div>
          )}
          {categoryOptions.map(category => (
            <div 
              key={category.id}
              className={`flex items-center justify-between py-2 ${selectedCategories.includes(category.id) ? 'bg-blue-50' : ''}`}
            >
              <label 
                htmlFor={`category-${category.id}`}
                className="flex items-center cursor-pointer w-full"
              >
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleToggleCategory(category.id)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                />
                <span>{category.name}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}