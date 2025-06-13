/**
 * Formate une date complète avec heure
 * @param {string} dateString - Date au format ISO
 * @returns {string} Date formatée
 */
export function formatDate(dateString) {
  if (!dateString) return 'Date inconnue';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formate une date sans l'heure
 * @param {string} dateString - Date au format ISO
 * @returns {string} Date formatée
 */
export function formatDateOnly(dateString) {
  if (!dateString) return 'Date inconnue';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formate une date en temps relatif (il y a X minutes, etc.)
 * @param {string} dateString - La date à formater au format ISO
 * @returns {string} Le temps écoulé sous forme de texte
 */
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Aujourd'hui
  if (diffDays < 1) {
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  }
  
  // Hier
  if (diffDays === 1) return 'Hier à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  // Moins d'une semaine
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  
  // Plus d'une semaine, afficher la date complète
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}