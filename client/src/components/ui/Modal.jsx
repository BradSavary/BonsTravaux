import React, { useEffect } from 'react';

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  // Empêcher le défilement du body quand la modal est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fermer la modale avec la touche Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop avec flou et assombrissement */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm backdrop-brightness-50"
        onClick={onClose}
      ></div>
        {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className={`relative bg-white rounded-lg shadow-xl w-full mx-auto z-10 ${
            size === 'sm' ? 'max-w-sm' :
            size === 'md' ? 'max-w-md' :
            size === 'lg' ? 'max-w-lg' :
            size === 'xl' ? 'max-w-xl' :
            size === '2xl' ? 'max-w-2xl' :
            size === '3xl' ? 'max-w-3xl' :
            size === '4xl' ? 'max-w-4xl' :
            size === '5xl' ? 'max-w-5xl' :
            size === 'full' ? 'max-w-full' :
            'max-w-md'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
            <button 
              type="button" 
              className="text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-500 rounded-lg p-1.5" 
              onClick={onClose}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
          </div>
          
          {/* Body */}
          <div className="p-4">
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div className="flex justify-end p-4 border-t">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}