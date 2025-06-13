/**
 * Définitions des statuts de tickets et leurs styles associés
 */
export const TICKET_STATUS = {
  OUVERT: 'Ouvert',
  EN_COURS: 'En cours',
  RESOLU: 'Résolu',
  FERME: 'Fermé'
};

export const STATUS_COLORS = {
  [TICKET_STATUS.OUVERT]: {
    light: 'bg-white',
    medium: 'bg-white',
    dark: 'bg-white',
    text: 'text-gray-900',
    border: 'border-gray-300',
    hover: 'hover:bg-gray-100'
  },
  [TICKET_STATUS.EN_COURS]: {
    light: 'bg-yellow-50',
    medium: 'bg-yellow-50',
    dark: 'bg-yellow-600',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    hover: 'hover:bg-yellow-100'
  },
  [TICKET_STATUS.RESOLU]: {
    light: 'bg-green-50',
    medium: 'bg-green-50',
    dark: 'bg-green-600',
    text: 'text-green-800',
    border: 'border-green-300',
    hover: 'hover:bg-green-100'
  },
  [TICKET_STATUS.FERME]: {
    light: 'bg-red-50',
    medium: 'bg-red-50',
    dark: 'bg-red-600',
    text: 'text-red-800',
    border: 'border-red-300',
    hover: 'hover:bg-red-100'
  }
};

/**
 * Récupère les couleurs associées à un statut
 * @param {string} status - Le statut du ticket
 * @returns {Object} Un objet contenant les classes CSS pour ce statut
 */
export function getStatusColors(status) {
  const normalizedStatus = status?.toLowerCase() || '';
  
  if (normalizedStatus === TICKET_STATUS.OUVERT.toLowerCase()) {
    return STATUS_COLORS[TICKET_STATUS.OUVERT];
  }
  if (normalizedStatus === TICKET_STATUS.EN_COURS.toLowerCase()) {
    return STATUS_COLORS[TICKET_STATUS.EN_COURS];
  }
  if (normalizedStatus === TICKET_STATUS.RESOLU.toLowerCase()) {
    return STATUS_COLORS[TICKET_STATUS.RESOLU];
  }
  if (normalizedStatus === TICKET_STATUS.FERME.toLowerCase()) {
    return STATUS_COLORS[TICKET_STATUS.FERME];
  }
  
  // Valeur par défaut
  return STATUS_COLORS[TICKET_STATUS.OUVERT];
}