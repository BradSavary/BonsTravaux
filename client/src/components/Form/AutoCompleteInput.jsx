import React, { useState, useEffect, useRef } from 'react';

/**
 * AutoCompleteInput - Composant pour la saisie avec autocomplétion
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.label - Label du champ
 * @param {string} props.value - Valeur actuelle
 * @param {Function} props.onChange - Fonction appelée lors du changement de valeur
 * @param {Function} props.onSearch - Fonction appelée pour rechercher des suggestions (doit renvoyer une Promise)
 * @param {Function} props.onAddNewItem - Fonction appelée quand l'utilisateur veut ajouter un nouvel élément
 * @param {Function} props.onSelectSuggestion - Fonction appelée quand une suggestion est sélectionnée (reçoit l'objet suggestion complet)
 * @param {Array} props.suggestions - Liste des suggestions (si gérées en externe)
 * @param {boolean} props.loading - Indique si le chargement des suggestions est en cours
 * @param {boolean} props.disabled - Désactive le champ
 * @param {string} props.placeholder - Texte d'indication
 * @param {string} props.helpText - Texte d'aide
 * @param {boolean} props.allowNew - Autorise l'ajout de nouvelles valeurs
 * @param {number} props.minChars - Nombre de caractères minimum avant d'afficher des suggestions (0 pour afficher directement)
 */
export function AutoCompleteInput({
  label,
  value,
  onChange,
  onSearch,
  onAddNewItem,
  onSelectSuggestion,
  suggestions = [],
  loading = false,
  disabled = false,
  placeholder = 'Commencez à taper...',
  helpText,
  allowNew = true,
  minChars = 2
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localSuggestions, setLocalSuggestions] = useState([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const wrapperRef = useRef(null);

  // Synchroniser la valeur d'entrée avec la prop value
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  // Gérer les suggestions
  useEffect(() => {
    if (suggestions && suggestions.length) {
      setLocalSuggestions(suggestions);
      setNoResults(suggestions.length === 0);
    }
  }, [suggestions]);

  // Fermer les suggestions si on clique en dehors du composant
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);
  // Gérer la recherche
  const handleInputChange = async (e) => {
    const query = e.target.value;
    setInputValue(query);
    onChange && onChange(query);
    
    if (query.length >= minChars) {
      setShowSuggestions(true);
      
      if (onSearch) {
        setInternalLoading(true);
        try {
          const results = await onSearch(query);
          setLocalSuggestions(results || []);
          setNoResults(results && results.length === 0);
        } catch (error) {
          console.error('Erreur lors de la recherche:', error);
          setLocalSuggestions([]);
          setNoResults(true);
        } finally {
          setInternalLoading(false);
        }
      }
    } else if (minChars > 0) {
      setShowSuggestions(false);
      setLocalSuggestions([]);
    }
  };
  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion.name);
    onChange && onChange(suggestion.name, suggestion);
    onSelectSuggestion && onSelectSuggestion(suggestion);
    setShowSuggestions(false);
  };

  const handleAddNew = () => {
    onAddNewItem && onAddNewItem(inputValue);
    setShowSuggestions(false);
  };
  // Déterminer si on affiche l'option "Ajouter"
  const showAddOption = allowNew && inputValue.length >= minChars && 
    (!localSuggestions.some(s => s.name.toLowerCase() === inputValue.toLowerCase()));

  const isLoading = loading || internalLoading;

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`block w-full px-3 py-2 border ${
            disabled ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900'
          } border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
          onFocus={() => inputValue.length >= minChars && setShowSuggestions(true)}
        />
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {helpText && (
        <p className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
            {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md max-h-60 overflow-auto border border-gray-200">
          {noResults && !isLoading ? (
            <div>
              <div className="p-2 text-sm text-gray-500">
                Aucun résultat trouvé
              </div>
              
              {showAddOption && (
                <div 
                  className="cursor-pointer px-4 py-2 hover:bg-green-50 text-sm flex items-center text-green-600 border-t border-gray-200"
                  onClick={handleAddNew}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter "{inputValue}"
                </div>
              )}
            </div>
          ) : (
            <>
              {localSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id || index}
                  className="cursor-pointer px-4 py-2 hover:bg-blue-50 text-sm"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.name}
                </div>
              ))}
              
              {showAddOption && (
                <div 
                  className="cursor-pointer px-4 py-2 hover:bg-green-50 text-sm flex items-center text-green-600 border-t border-gray-200"
                  onClick={handleAddNew}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter "{inputValue}"
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
