import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Administration() {
    const { hasPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('users');
      // Déterminer l'onglet actif en fonction de l'URL
    useEffect(() => {
        const path = location.pathname;
        
        if (path.includes('/admin/services-demandeurs')) {
            setActiveTab('services-demandeurs');
        } else if (path.includes('/admin/services')) {
            setActiveTab('services');
        } else if (path.includes('/admin/email-notifications')) {
            setActiveTab('email-notifications');
        } else if (path.includes('/admin/ticket-cleanup')) {
            setActiveTab('ticket-cleanup');
        } else if (path.includes('/admin/ticket-categories')) {
            setActiveTab('ticket-categories');
        } else {
            setActiveTab('users');
        }
        
    }, [location.pathname]);

    // Changer l'onglet actif et naviguer vers la sous-route correspondante
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`/admin/${tab}`);
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Administration
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Gestion des utilisateurs, permissions et paramètres du système
                </p>
            </div>

            {/* Onglets de navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex flex-wrap -mb-px">
                    <button
                        onClick={() => handleTabChange('users')}
                        className={`${
                            activeTab === 'users'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                    >
                        Utilisateurs
                    </button>
                    <button
                        onClick={() => handleTabChange('ticket-categories')}
                        className={`${
                            activeTab === 'ticket-categories'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                    >
                        Catégories de Bons
                    </button>
                    <button
                        onClick={() => handleTabChange('services')}
                        className={`${
                            activeTab === 'services'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                    >
                        Services Intervenants
                    </button>
                    <button
                        onClick={() => handleTabChange('services-demandeurs')}
                        className={`${
                            activeTab === 'services-demandeurs'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                    >
                        Services Demandeurs
                    </button>
                    <button
                        onClick={() => handleTabChange('email-notifications')}
                        className={`${
                            activeTab === 'email-notifications'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                    >
                        Notifications Email
                    </button>                    <button
                        onClick={() => handleTabChange('ticket-cleanup')}
                        className={`${
                            activeTab === 'ticket-cleanup'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                    >
                        Archivage des Bons
                    </button>
                    
                </nav>
            </div>

            {/* Contenu de l'onglet actif */}
            <div className="px-4 py-5 sm:p-6">
                <Outlet />
            </div>
        </div>
    );
}