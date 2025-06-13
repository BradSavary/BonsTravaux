import { apiRequest } from './api-request';

/**
 * Service pour gérer les images des tickets
 */
export const ticketImageService = {
  /**
   * Télécharge une image pour un ticket
   * @param {string} imageData - Image en base64
   * @param {number} ticketId - ID du ticket
   * @param {boolean} inMessage - Indique si l'image est liée à un message
   * @param {number|null} messageId - ID du message associé (si applicable)
   * @returns {Promise<Object>} Réponse de l'API
   */
  async uploadImage(imageData, ticketId, inMessage = false, messageId = null) {
    const payload = {
      image_data: imageData,
      ticket_id: ticketId,
      in_message: inMessage
    };

    if (messageId) {
      payload.message_id = messageId;
    }

    return apiRequest.post('ticket-images', payload, true);
  },

  /**
   * Récupère toutes les images d'un ticket
   * @param {number} ticketId - ID du ticket
   * @returns {Promise<Array>} Liste des images du ticket
   */
  async getTicketImages(ticketId) {
    return apiRequest.get(`ticket-images?ticketId=${ticketId}`, true);
  },

  /**
   * Récupère une image spécifique
   * @param {number} imageId - ID de l'image
   * @returns {Promise<Object>} Données de l'image
   */
  async getImage(imageId) {
    return apiRequest.get(`ticket-images/${imageId}`, true);
  },

  /**
   * Supprime une image
   * @param {number} imageId - ID de l'image à supprimer
   * @returns {Promise<Object>} Réponse de l'API
   */
  async deleteImage(imageId) {
    return apiRequest.delete(`ticket-images/${imageId}`, true);
  },

  /**
   * Génère l'URL pour afficher une image
   * @param {number} imageId - ID de l'image
   * @returns {string} URL de l'image
   */
  getImageUrl(imageId) {
    const baseUrl = apiRequest.getBaseUrl();
    return `${baseUrl}/ticketimage/serve?id=${imageId}`;
  },

  /**
   * Convertit une image du clipboard en base64
   * @param {ClipboardEvent} event - Événement de clipboard
   * @returns {Promise<string|null>} Données de l'image en base64 ou null si aucune image n'est trouvée
   */
  async getImageFromClipboard(event) {
    // Vérifier la présence d'items dans le clipboard
    if (!event.clipboardData || !event.clipboardData.items) {
      return null;
    }
    
    const items = event.clipboardData.items;
    let imageItem = null;
    
    // Chercher un item de type image
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageItem = items[i];
        break;
      }
    }
    
    if (!imageItem) {
      return null;
    }
    
    // Convertir le blob en base64
    const blob = imageItem.getAsFile();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(event) {
        resolve(event.target.result);
      };
      reader.readAsDataURL(blob);
    });
  },
  
  /**
   * Formate la taille du fichier en unité lisible
   * @param {number} bytes - Taille en octets
   * @returns {string} Taille formatée
   */
  formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  }
};
