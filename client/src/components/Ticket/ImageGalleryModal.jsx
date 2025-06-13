import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { ticketImageService } from '../../../lib/ticket-image-service';
import { formatDate } from '../../../lib/date-helpers';

/**
 * Modal pour afficher toutes les images liées à un ticket
 */
export function ImageGalleryModal({ isOpen, onClose, ticketId }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger les images quand la modal s'ouvre
  useEffect(() => {
    if (!isOpen || !ticketId) return;
    
    const fetchImages = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await ticketImageService.getTicketImages(ticketId);
        
        if (response.status === 'success' && response.data) {
          setImages(response.data);
        } else {
          setError(response.message || 'Erreur lors du chargement des images');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des images:', err);
        setError('Impossible de charger les images. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchImages();
  }, [isOpen, ticketId]);
  // Télécharger l'image
  const downloadImage = (image, e) => {
    e.stopPropagation();
    const imageUrl = ticketImageService.getImageUrl(image.id);
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = image.original_name || `ticket-image-${image.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Ouvrir l'image dans un nouvel onglet
  const openImageInNewTab = (image, e) => {
    e.stopPropagation();
    const imageUrl = ticketImageService.getImageUrl(image.id);
    window.open(imageUrl, '_blank');
  };
  // Rendu de la galerie d'images
  const renderGallery = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 py-4">
          <p>{error}</p>
        </div>
      );
    }

    if (images.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p>Aucune image associée à ce ticket</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto p-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="border rounded-lg overflow-hidden bg-white shadow-lg hover:shadow-xl transition-shadow relative group"
          >
            <div className="absolute top-2 right-2 space-x-2 flex opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {/* <button 
                onClick={(e) => downloadImage(image, e)}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow"
                title="Télécharger l'image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button> */}
              
              <button 
                onClick={(e) => openImageInNewTab(image, e)}
                className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 shadow"
                title="Ouvrir dans un nouvel onglet"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
            
            <div className="h-72 bg-gray-100 overflow-hidden flex items-center justify-center">
              <img 
                src={ticketImageService.getImageUrl(image.id)}
                alt={`Image ${image.id}`}
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="p-4 border-t">
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-800">
                  {image.username || 'Utilisateur'}
                </div>
                <div className="text-xs mt-1">
                  {formatDate(image.created_at)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {ticketImageService.formatFileSize(image.file_size)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };  
  // Modal pour la galerie
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Images du ticket #${ticketId}`}
      size="4xl"
    >
      {renderGallery()}
    </Modal>
  );
}
