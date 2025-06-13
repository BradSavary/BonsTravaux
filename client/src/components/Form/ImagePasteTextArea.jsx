import React, { useRef } from 'react';
import { ticketImageService } from '../../../lib/ticket-image-service';

/**
 * TextArea qui permet de coller des images et de les prévisualiser
 */
export function ImagePasteTextArea({
  label,
  name,
  value,
  onChange,
  onImagePaste,
  rows = 5,
  disabled = false,
  required = false,
  placeholder = '',
  icon = null,
  helpText = null,
  imagesPasted = []
}) {
  const textareaRef = useRef(null);

  // Gérer le collage d'images
  const handlePaste = async (e) => {
    const imageData = await ticketImageService.getImageFromClipboard(e);
    
    if (imageData) {
      // Notifier le composant parent qu'une image a été collée
      if (onImagePaste && typeof onImagePaste === 'function') {
        onImagePaste(imageData);
      }
    }
  };

  // Supprimer une image collée
  const handleRemoveImage = (index) => {
    const newImages = [...imagesPasted];
    newImages.splice(index, 1);
    
    // Mettre à jour le composant parent
    if (onImagePaste && typeof onImagePaste === 'function') {
      onImagePaste(null, newImages);
    }
  };

  // Rendu des aperçus d'images
  const renderImagePreviews = () => {
    if (!imagesPasted || imagesPasted.length === 0) return null;
    
    return (
      <div className="mt-2">
        <p className="text-sm text-gray-700 mb-2">Images attachées ({imagesPasted.length}):</p>
        <div className="flex flex-wrap gap-2">
          {imagesPasted.map((image, index) => (
            <div 
              key={index} 
              className="relative border rounded-md overflow-hidden group w-24 h-24 bg-gray-100"
            >
              <img 
                src={image} 
                alt={`Preview ${index + 1}`} 
                className="w-full h-full object-contain"
              />
              <div 
                className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="bg-red-600 text-white p-1 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative rounded-md shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-start pointer-events-none pt-2">
            <span className="text-gray-500 sm:text-sm">{icon}</span>
          </div>
        )}

        <textarea
          ref={textareaRef}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onPaste={handlePaste}
          rows={rows}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`pt-2 block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md bg-white
            ${icon ? 'pl-10' : ''}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          `}
        />
      </div>

      {renderImagePreviews()}

      {helpText && (
        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
      )}
      
      <p className="mt-1 text-xs text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Vous pouvez coller des captures d'écran directement dans ce champ (Ctrl+V)
      </p>
    </div>
  );
}
