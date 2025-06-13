import React, { useState } from 'react';
import { apiRequest } from '../../../lib/api-request';
import { FormRadio } from '../Form/FormRadio';
import { Modal } from '../ui/Modal';

export function TicketCleanupManagement() {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [affectedTickets, setAffectedTickets] = useState(0);
    const [isCheckingCount, setIsCheckingCount] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    // Options de période de suppression
    const cleanupPeriods = [
        { value: '1y', label: '1 an' },
        { value: '2y', label: '2 ans' },
        { value: '3y', label: '3 ans' },
        { value: '5y', label: '5 ans' }
    ];

    // Convertir la valeur de période en texte lisible
    const getPeriodText = (period) => {
        const periodMap = {
            '1y': '1 an',
            '2y': '2 ans',
            '3y': '3 ans',
            '5y': '5 ans'
        };
        return periodMap[period] || period;
    };

    // Gérer le changement de période sélectionnée
    const handlePeriodChange = (e) => {
        const period = e.target.value;
        setSelectedPeriod(period);
        setError('');
        setResult(null);
        
        // Vérifier combien de tickets seraient affectés
        checkAffectedTickets(period);
    };

    // Vérifier combien de tickets seraient affectés par la suppression
    const checkAffectedTickets = async (period) => {
        setIsCheckingCount(true);
        try {
            const response = await apiRequest.get(`tickets?action=count_older&period=${period}`, true);
            
            if (response.status === 'success') {
                setAffectedTickets(response.data.count);
            } else {
                setError(response.message || "Erreur lors de la vérification du nombre de tickets à supprimer");
                setAffectedTickets(0);
            }
        } catch (err) {
            console.error("Erreur lors de la vérification du nombre de tickets:", err);
            setError("Erreur de connexion au serveur");
            setAffectedTickets(0);
        } finally {
            setIsCheckingCount(false);
        }
    };

    // Ouvrir la modale de confirmation
    const handleOpenConfirmModal = () => {
        if (!selectedPeriod) {
            setError("Veuillez sélectionner une période pour le nettoyage");
            return;
        }
        setConfirmText('');
        setIsConfirmModalOpen(true);
    };

    // Fermer les modales
    const handleCloseConfirmModal = () => {
        setIsConfirmModalOpen(false);
    };

    // Exécuter la suppression après confirmation
    const handleConfirmCleanup = async () => {
        if (confirmText !== `SUPPRIMER`) {
            setError("Veuillez saisir exactement le texte demandé pour confirmer la suppression");
            return;
        }

        setIsProcessing(true);
        
        try {
            // Procéder à la suppression
            const response = await apiRequest.post('tickets?action=cleanup', { 
                period: selectedPeriod,
                confirmation: true
            }, true);
            
            if (response.status === 'success') {
                setResult({
                    success: true,
                    message: response.message,
                    deletedCount: response.data.deletedCount
                });
                setAffectedTickets(0); // Réinitialiser après suppression
            } else {
                setError(response.message || "Échec de la suppression");
                setResult({
                    success: false,
                    message: response.message
                });
            }
        } catch (err) {
            console.error("Erreur lors de la suppression:", err);
            setError("Erreur de connexion au serveur");
            setResult({
                success: false,
                message: "Erreur de connexion au serveur"
            });
        } finally {
            setIsProcessing(false);
            setIsConfirmModalOpen(false);
        }
    };

    // Contenu de la modale de confirmation
    const confirmModalFooter = (
        <>
            <button
                type="button"
                onClick={handleCloseConfirmModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
                Annuler
            </button>
            <button
                type="button"
                onClick={handleConfirmCleanup}
                disabled={confirmText !== `SUPPRIMER` || isProcessing}
                className={`ml-3 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${confirmText !== `SUPPRIMER` || isProcessing
                        ? 'bg-red-300 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'}`}
            >
                {isProcessing ? 'Traitement en cours...' : 'Confirmer la suppression'}
            </button>
        </>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Suppression des bons anciens
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Supprimer définitivement les bons antérieurs à la période sélectionnée. Cette action est irréversible.
                    </p>
                </div>
                
                <div className="px-4 py-5 sm:p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                            {error}
                        </div>
                    )}
                    
                    {result && (
                        <div className={`mb-4 p-3 text-sm rounded-md border ${
                            result.success 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {result.message}
                            {result.success && result.deletedCount !== undefined && (
                                <p className="mt-1 font-medium">
                                    {result.deletedCount} bon{result.deletedCount > 1 ? 's ont' : ' a'} été supprimé{result.deletedCount > 1 ? 's' : ''}.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="text-base font-medium text-gray-900">
                                Sélectionner la période de suppression
                            </label>
                            <p className="text-sm leading-5 text-gray-500">
                                Tous les bons plus anciens que la période sélectionnée seront définitivement supprimés.
                            </p>
                            
                            <fieldset className="mt-4">
                                <legend className="sr-only">Périodes de suppression</legend>
                                <div className="space-y-4">
                                    {cleanupPeriods.map(period => (
                                        <FormRadio
                                            key={period.value}
                                            label={period.label}
                                            name="cleanupPeriod"
                                            value={period.value}
                                            checkedValue={selectedPeriod}
                                            onChange={handlePeriodChange}
                                        />
                                    ))}
                                </div>
                            </fieldset>
                        </div>
                        
                        {selectedPeriod && (
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700">
                                    Impact de la suppression
                                </h4>
                                {isCheckingCount ? (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Calcul du nombre de bons concernés...
                                    </p>
                                ) : (
                                    <p className="mt-2 text-sm text-gray-500">
                                        {affectedTickets > 0 
                                            ? `${affectedTickets} bon${affectedTickets > 1 ? 's' : ''} plus ancien${affectedTickets > 1 ? 's' : ''} que ${getPeriodText(selectedPeriod)} ${affectedTickets > 1 ? 'seront supprimés' : 'sera supprimé'}.`
                                            : `Aucun bon plus ancien que ${getPeriodText(selectedPeriod)} n'a été trouvé.`
                                        }
                                    </p>
                                )}
                            </div>
                        )}
                        
                        <div>
                            <button
                                type="button"
                                onClick={handleOpenConfirmModal}
                                disabled={!selectedPeriod || affectedTickets === 0 || isCheckingCount}
                                className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium 
                                    ${(!selectedPeriod || affectedTickets === 0 || isCheckingCount)
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                        : 'bg-red-600 hover:bg-red-700 text-white border-transparent'
                                    }
                                `}
                            >
                                Procéder à la suppression
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Modale de confirmation */}
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                title="Confirmation de suppression"
                footer={confirmModalFooter}
            >
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium">Attention: Action irréversible</h3>
                                <div className="mt-2 text-sm">
                                    <p>
                                        Vous êtes sur le point de <span className="font-bold text-red-700">supprimer définitivement</span> <span className="font-bold">{affectedTickets}</span> bon{affectedTickets > 1 ? 's' : ''} datant de plus de <span className="font-bold">{getPeriodText(selectedPeriod)}</span>.
                                    </p>
                                    <p className="mt-2">
                                        Cette action est <span className="font-bold">irréversible</span> et les données supprimées ne pourront pas être récupérées.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 font-semibold">
                        Pour confirmer cette action, veuillez saisir exactement le texte suivant:
                    </p>

                    <div className="bg-gray-100 p-2 rounded border border-gray-300 text-center font-bold text-red-700">
                        SUPPRIMER
                    </div>

                    <div>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Saisir le texte ci-dessus"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                            disabled={isProcessing}
                        />
                        {confirmText && confirmText !== `SUPPRIMER` && (
                            <p className="mt-1 text-xs text-red-600">
                                Le texte saisi ne correspond pas exactement au texte demandé
                            </p>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}