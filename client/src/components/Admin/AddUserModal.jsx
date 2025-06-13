import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { FormField } from '../Form/FormField';

export function AddUserModal({ isOpen, onClose, onAddUser }) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        site: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Effacer les erreurs spécifiques au champ lors de la modification
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };
    
    const validateForm = () => {
        const errors = {};
        
        if (!formData.username.trim()) {
            errors.username = "Le nom d'utilisateur est requis";
        }
        
        if (!formData.password) {
            errors.password = "Le mot de passe est requis";
        } else if (formData.password.length < 6) {
            errors.password = "Le mot de passe doit contenir au moins 6 caractères";
        }
        
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Les mots de passe ne correspondent pas";
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const userData = {
                username: formData.username,
                password: formData.password,
                site: formData.site || undefined
            };
            
            const success = await onAddUser(userData);
            
            if (success) {
                // Réinitialiser le formulaire
                setFormData({
                    username: '',
                    password: '',
                    confirmPassword: '',
                    site: ''
                });
            }
        } catch (err) {
            setError("Une erreur est survenue lors de la création de l'utilisateur.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const resetAndClose = () => {
        setFormData({
            username: '',
            password: '',
            confirmPassword: '',
            site: ''
        });
        setError('');
        setFieldErrors({});
        onClose();
    };
    
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
                disabled={loading}
                className={`ml-3 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
            >
                {loading ? 'Création en cours...' : 'Créer l\'utilisateur'}
            </button>
        </>
    );
    
    return (
        <Modal
            isOpen={isOpen}
            onClose={resetAndClose}
            title="Créer un nouvel utilisateur"
            footer={footerButtons}
        >
            <div className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                        {error}
                    </div>
                )}
                
                <FormField
                    label="Nom d'utilisateur"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Entrez le nom d'utilisateur"
                    required={true}
                    icon={
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    }
                />
                {fieldErrors.username && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
                )}
                
                <FormField
                    label="Mot de passe"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Entrez le mot de passe"
                    required={true}
                    icon={
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    }
                />
                {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
                
                <FormField
                    label="Confirmer le mot de passe"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirmez le mot de passe"
                    required={true}
                    icon={
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    }
                />
                {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                )}
                
                {/* <FormField
                    label="Site (optionnel)"
                    name="site"
                    value={formData.site}
                    onChange={handleChange}
                    placeholder="Site de l'utilisateur"
                    icon={
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                    }
                    helpText="Si non spécifié, le site sera déterminé automatiquement lors de la première connexion"
                /> */}
            </div>
        </Modal>
    );
}