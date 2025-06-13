import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { FormCheckbox } from '../Form/FormCheckbox';

export function FilterModal({ 
  isOpen, 
  onClose, 
  title,
  options, 
  initialSelected, 
  onApplyFilters,
  getItemColor = null, // Fonction optionnelle pour obtenir des couleurs spécifiques par option
  itemLabelKey = 'label',
  itemValueKey = 'value',
  displaySelectedCount = true
}) {
  const [selectedItems, setSelectedItems] = useState([]);

  // Initialiser les éléments sélectionnés quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSelectedItems(initialSelected || []);
    }
  }, [isOpen, initialSelected]);

  const handleToggleItem = (item) => {
    setSelectedItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(s => s !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedItems(options.map(option => option[itemValueKey]));
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  const handleApply = () => {
    onApplyFilters(selectedItems);
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
        disabled={selectedItems.length === 0}
        className={`ml-3 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
          ${selectedItems.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        Appliquer {displaySelectedCount && `(${selectedItems.length})`}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footerButtons}
    >
      <div className="space-y-4">
        <div className="flex justify-between mb-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Tout sélectionner
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Tout désélectionner
          </button>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {options.map((option) => {
            const value = option[itemValueKey];
            const label = option[itemLabelKey];
            
            // Utiliser getItemColor si fourni, sinon utiliser des styles par défaut
            const itemStyle = getItemColor ? 
              getItemColor(value, selectedItems.includes(value)) : 
              {
                container: selectedItems.includes(value) 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200',
                badge: 'bg-gray-100 text-gray-800'
              };
            
            return (
              <div 
                key={value}
                className={`p-3 border rounded-md transition-all ${itemStyle.container}`}
              >
                <FormCheckbox
                  label={
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${itemStyle.badge} mr-2`}>
                        {value}
                      </span>
                      <span className="text-gray-700">{label || value}</span>
                    </div>
                  }
                  name={`filter-${value}`}
                  checked={selectedItems.includes(value)}
                  onChange={() => handleToggleItem(value)}
                />
              </div>
            );
          })}
        </div>

        {selectedItems.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Éléments sélectionnés:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedItems.map(item => {
                const option = options.find(o => o[itemValueKey] === item);
                const label = option ? option[itemLabelKey] : item;
                
                const itemStyle = getItemColor ? 
                  getItemColor(item, true) : 
                  { badge: 'bg-gray-100 text-gray-800' };
                
                return (
                  <span 
                    key={item} 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${itemStyle.badge}`}
                  >
                    {label || item}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}