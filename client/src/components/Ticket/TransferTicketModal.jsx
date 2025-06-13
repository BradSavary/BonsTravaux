import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../../lib/api-request';
import { Modal } from '../ui/Modal';
import { FormSelect } from '../Form/FormSelect';
import { FormRadio } from '../Form/FormRadio';

export function TransferTicketModal({ isOpen, onClose, ticketId, currentServiceId, onTicketTransferred }) {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [transferType, setTransferType] = useState('transfer_only');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les services intervenants disponibles
  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest.get('service-intervenants', true);
      if (response.status === 'success') {
        // Filtrer le service actuel
        const filteredServices = response.data.filter(service => service.id);
        setServices(filteredServices);
      } else {
        setError('Erreur lors du chargement des services intervenants');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = (e) => {
    setSelectedServiceId(e.target.value);
  };

  const handleTransferTypeChange = (e) => {
    setTransferType(e.target.value);
  };

  const handleSubmit = async () => {
    if (!selectedServiceId) {
      setError('Veuillez sélectionner un service intervenant');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const response = await apiRequest.put(
        `tickets/${ticketId}?action=transferTicket`,
        { 
          targetServiceId: selectedServiceId,
          transferType: transferType
        },
        true
      );

      if (response.status === 'success') {
        setSuccess(true);
        
        // Notifier le composant parent après un court délai
        setTimeout(() => {
          if (onTicketTransferred) {
            onTicketTransferred(response.data);
          }
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Erreur lors du transfert du ticket');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedServiceId('');
    setTransferType('transfer_only');
    setError('');
    setSuccess(false);
    onClose();
  };

  const transferTypeOptions = [
    { 
      value: 'transfer_only', 
      label: 'Transférer uniquement', 
      description: 'Le ticket sera déplacé vers le service sélectionné et ne sera plus visible par ce service.' 
    },
    { 
      value: 'transfer_and_keep', 
      label: 'Dupliquer et transférer', 
      description: 'Une copie du ticket sera créée pour le service sélectionné, tout en conservant le ticket actuel.' 
    }
  ];

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={resetAndClose}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Annuler
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedServiceId || isSubmitting || success}
        className={`ml-3 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
        ${(!selectedServiceId || isSubmitting || success)
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
      >
        {isSubmitting ? 'Transfert en cours...' : success ? 'Succès !' : 'Transférer'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Transférer le bon vers un autre service"
      footer={footerButtons}
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
            {transferType === 'transfer_only'
              ? 'Bon transféré avec succès !'
              : 'Bon dupliqué et transféré avec succès !'}
          </div>
        )}

        <div>
          <FormSelect
            label="Service destinataire"
            name="targetService"
            value={selectedServiceId}
            onChange={handleServiceSelect}
            options={services.map(service => ({ 
              value: service.id, 
              label: service.name 
            }))}
            required={true}
            disabled={isLoading || isSubmitting || success}
            loading={isLoading}
            placeholder={isLoading ? "Chargement des services..." : "Sélectionnez un service"}
          />
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700 block mb-3">
            Type de transfert:
          </label>

          <div className="space-y-4">
            {transferTypeOptions.map(option => (
              <div key={option.value} className={`p-4 border rounded-md ${transferType === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-start">
                  <input
                    id={`transfer-type-${option.value}`}
                    name="transferType"
                    type="radio"
                    value={option.value}
                    checked={transferType === option.value}
                    onChange={handleTransferTypeChange}
                    disabled={isSubmitting || success}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
                  />
                  <div className="ml-3">
                    <label htmlFor={`transfer-type-${option.value}`} className="text-sm font-medium text-gray-700">
                      {option.label}
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}