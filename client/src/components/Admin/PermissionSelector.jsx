import React, { useState, useEffect } from 'react';
import { FormCheckbox } from '../Form/FormCheckbox';

export function PermissionSelector({ availablePermissions, onSelectPermission, onCancel }) {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  // Regrouper les permissions par catégorie
  const permissionCategories = {
    'Administration': availablePermissions.filter(p => p.value.includes('Admin')),
    'Gestion des tickets': availablePermissions.filter(p => p.value.includes('Ticket') && !p.value.includes('view_statistics')),
    'Statistiques': availablePermissions.filter(p => p.value.includes('view_statistics'))
  };

  const handleTogglePermission = (permission) => {
    setSelectedPermissions(prevSelected => {
      if (prevSelected.includes(permission)) {
        return prevSelected.filter(p => p !== permission);
      } else {
        return [...prevSelected, permission];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedPermissions.length > 0) {
      // Envoyer toutes les permissions sélectionnées, pas juste la première
      onSelectPermission(selectedPermissions);
    } else {
      onCancel();
    }
  };

  // Fonction pour déterminer la couleur de badge pour chaque permission
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

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Sélectionnez les permissions à ajouter à l'utilisateur
      </p>
      
      {/* Liste des permissions par catégorie */}
      {Object.entries(permissionCategories).map(([category, permissions]) => (
        permissions.length > 0 && (
          <div key={category} className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{category}</h4>
            <div className="space-y-3">
              {permissions.map((permission) => (
                <div 
                  key={permission.value}
                  className={`flex items-center p-2 border rounded-md ${
                    selectedPermissions.includes(permission.value) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <FormCheckbox
                    name={`permission-${permission.value}`}
                    checked={selectedPermissions.includes(permission.value)}
                    onChange={() => handleTogglePermission(permission.value)}
                    label={
                      <div className="flex items-center">
                        <span className="mr-2">{permission.label}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPermissionBadgeColor(permission.value)}`}>
                          {permission.value}
                        </span>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )
      ))}
      
      {/* Aucune permission disponible */}
      {Object.values(permissionCategories).every(group => group.length === 0) && (
        <div className="text-center py-4 text-gray-500">
          Aucune permission disponible.
        </div>
      )}
      
      {/* Boutons d'action */}
      <div className="flex justify-end mt-6 space-x-3">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onCancel}
        >
          Annuler
        </button>
        <button
          type="button"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          onClick={handleSubmit}
          disabled={selectedPermissions.length === 0}
        >
          Ajouter {selectedPermissions.length > 0 ? `(${selectedPermissions.length})` : ''}
        </button>
      </div>
    </div>
  );
}