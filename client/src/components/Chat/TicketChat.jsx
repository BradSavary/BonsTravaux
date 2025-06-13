import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../../lib/api-request';
import { ticketImageService } from '../../../lib/ticket-image-service';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../../lib/date-helpers';
import { InlineStatusUpdater } from '../Ticket/InlineStatusUpdater';

export function TicketChat({ ticketId, currentStatus, ticketServiceId, onStatusUpdated }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [pastedImage, setPastedImage] = useState(null);
  const [sendingImage, setSendingImage] = useState(false);
  const [messageRequired, setMessageRequired] = useState(false);
  const [statusMessageType, setStatusMessageType] = useState(null);
  const { currentUser, hasPermission } = useAuth();
  const messageEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Déterminer si le chat est verrouillé (ticket résolu ou fermé)
  const isChatLocked = currentStatus === 'Résolu' || currentStatus === 'Fermé';

  // Charger les messages au chargement et quand ticketId change
  useEffect(() => {
    if (ticketId) {
      fetchMessages();
    }
  }, [ticketId]);

  // Scroll vers le dernier message quand les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiRequest.get(`ticket-messages/${ticketId}`, true);
      
      if (response.status === 'success') {
        // Vérifier si nous avons des données
        if (response.data && response.data.length > 0) {
          setMessages(response.data);
        } else {
          setMessages([]);
        }
      } else {
        setError(response.message || 'Erreur lors du chargement des messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
  // Envoyer le message avec Shift+Enter
  if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault(); // Empêcher le saut de ligne par défaut
    sendMessage(e);
  }
};
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };
  
  // Gérer le collage d'image
  const handlePaste = async (e) => {
    const imageData = await ticketImageService.getImageFromClipboard(e);
    if (imageData) {
      setPastedImage(imageData);
    }
  };
  
  // Supprimer l'image collée
  const clearPastedImage = () => {
    setPastedImage(null);
  };  const sendMessage = async (e) => {
    e.preventDefault();
    
    // Si rien à envoyer (ni texte, ni image) ou en cours d'envoi
    if ((!newMessage.trim() && !pastedImage) || sending) return;
    
    setSending(true);
    
    try {
      // Préparer les données pour l'envoi du message
      const messageData = {
        ticket_id: ticketId,
        message: pastedImage 
          ? `${newMessage.trim() ? newMessage.trim() + ' ' : ''}[Une image a été jointe à ce message]`
          : newMessage
      };
        // Si le message est une résolution, ajouter les métadonnées
      if (statusMessageType === 'resolution') {
        messageData.is_status_change = true;
        messageData.status_type = 'resolution';
        console.log('Envoi d\'un message de résolution:', messageData);
      } else {
        console.log('Envoi du message avec les données:', messageData);
      }
      
      // Envoi du message texte
      const response = await apiRequest.post('ticket-messages', messageData, true);
      
      if (response.status === 'success') {
        // Envoi de l'image si présente
        if (pastedImage) {
          setSendingImage(true);
          try {
            await ticketImageService.uploadImage(
              pastedImage, 
              ticketId, 
              true, 
              response.data.message_id
            );
          } catch (imgErr) {
            console.error('Erreur lors de l\'envoi de l\'image:', imgErr);
          } finally {
            setSendingImage(false);
          }
        }
        
        setMessages(response.data.all_messages || []);
        setNewMessage('');
        setPastedImage(null);
      } else {
        setError(response.message || 'Erreur lors de l\'envoi du message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fonction pour déterminer si un message doit être affiché comme celui de l'utilisateur actuel
  const isCurrentUserMessage = (message) => {
    return message.user_id === currentUser?.id;
  };

  if (loading && messages.length === 0) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Suivi du Bon
        </h3>
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }  
  // Déterminer si l'utilisateur actuel peut mettre à jour le statut
  const canUpdateStatus = () => {
    if (!currentStatus || !currentUser) return false;
    
    // Vérifier si l'utilisateur fait partie du service intervenant du ticket
    const permissionRequired = ticketServiceId ? `${ticketServiceId}Ticket` : '';
    return permissionRequired && hasPermission(permissionRequired);
  };
    const handleMessageSent = () => {
    fetchMessages();
  };
  
  const handleRequireMessage = (required) => {
    setMessageRequired(required);
    if (required) {
      setStatusMessageType('resolution');
      textareaRef.current?.focus();
    } else {
      setStatusMessageType(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
      <div className="flex flex-col h-full">
        {/* En-tête */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Suivi du Bon
          </h3>
        </div>
        
        {/* Zone des messages */}
        <div 
          ref={chatContainerRef}
          className="flex-grow p-4 overflow-y-auto"
        >
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 mb-4">
              {error}
              <button 
                onClick={fetchMessages} 
                className="ml-2 text-red-800 underline"
              >
                Réessayer
              </button>
            </div>
          )}            



          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">Aucun message dans cette conversation.</p>
            </div>
          ) : (
            <div className="space-y-4">{messages.map((message) => {
                // Vérifier si le message est associé à un changement de statut
                const isStatusChange = message.is_status_change || false;
                const statusType = message.status_type || null;
                const isResolutionMessage = statusType === 'resolution';
                
                return (                <div 
                  key={message.id} 
                  className={`flex ${isCurrentUserMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`w-[100%] rounded-lg px-4 py-2 ${
                      isResolutionMessage
                        ? 'bg-green-50 border-2 border-green-200 text-green-800 shadow-sm'
                        : isStatusChange
                          ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                          : isCurrentUserMessage(message) 
                            ? 'bg-blue-100 text-blue-900 rounded-br-none' 
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                      <div className="flex justify-between items-center mb-1">
                        <p className={`text-xs font-medium ${
                          isResolutionMessage
                            ? 'text-green-700'
                            : isStatusChange
                              ? 'text-yellow-700'
                              : isCurrentUserMessage(message) 
                                ? 'text-blue-700' 
                                : 'text-gray-700'
                        }`}>
                          {message.username}
                        </p>
                        {isResolutionMessage && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium flex items-center">
                            <svg className="w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Résolution
                          </span>
                        )}
                      </div>
                    <p className={`text-sm whitespace-pre-wrap break-words ${isResolutionMessage ? 'font-medium' : ''}`}>
                      {message.message}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isStatusChange
                        ? 'text-green-600'
                        : isCurrentUserMessage(message) 
                          ? 'text-blue-700' 
                          : 'text-gray-500'
                    }`}>
                      {formatRelativeTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              );
              })}
              <div ref={messageEndRef} />
            </div>
          )}
        </div>
          {/* Zone de saisie du message */}        
          <div className="p-3 border-t border-gray-200">
          {isChatLocked ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-gray-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-700">Conversation verrouillée</span>
              </div>
              <p className="text-sm text-gray-600">
                {currentStatus === 'Résolu' 
                  ? "Le ticket a été résolu. Aucun nouveau message ne peut être envoyé."
                  : "Le ticket est fermé. Aucun nouveau message ne peut être envoyé."}
              </p>
            </div>
          ) : (
          <form onSubmit={sendMessage} className="flex flex-col">
            {/* Aperçu de l'image si elle existe */}
            {pastedImage && (
              <div className="mb-3 relative">
                <div className="border rounded-md p-2 bg-gray-50 flex items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-3 flex-shrink-0">
                    <img 
                      src={pastedImage} 
                      alt="Image à envoyer" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Image prête à envoyer</p>
                    <p className="text-xs text-gray-500">L'image sera envoyée avec votre message</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearPastedImage}
                    className="ml-auto p-1 rounded-full hover:bg-gray-200 text-gray-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}            
            
            <div className="flex items-end">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}                
                placeholder={messageRequired 
                  ? "Écrivez votre message de résolution..."
                  : "Écrivez votre message..."}
                className={`flex-grow border ${messageRequired ? 'border-2 border-green-500 bg-green-50' : 'border-gray-300'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 ${messageRequired ? 'focus:ring-green-500' : 'focus:ring-blue-500'} focus:border-transparent resize-none min-h-[80px]`}
                rows={3}
              />              <button
                type="submit"
                disabled={messageRequired || (!newMessage.trim() && !pastedImage) || sending || sendingImage}
                className={`ml-2 px-4 py-2 rounded-md text-white ${
                  messageRequired || (!newMessage.trim() && !pastedImage) || sending || sendingImage
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {sending || sendingImage ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Envoi...
                  </span>                ) : messageRequired ? (               
                  <span className="flex items-center">
                    Envoyer
                  </span>
                ) : (
                  'Envoyer'
                )}
              </button>
            </div>            
            <div className="flex mt-2 text-xs text-gray-500">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Shift + Entrée = Envoyer
              </div>
              <div className="ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Ctrl + V = Coller une image
              </div>
            </div>          </form>
          )}
            {/* Système de changement de statut intégré */}
          {!isChatLocked && canUpdateStatus() && currentStatus && (
            <InlineStatusUpdater 
              ticketId={ticketId}
              currentStatus={currentStatus}
              serviceId={ticketServiceId}
              onStatusUpdated={onStatusUpdated}
              onMessageSent={handleMessageSent}
              chatMessage={newMessage}
              onRequireMessage={handleRequireMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}