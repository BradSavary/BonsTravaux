import React, { useState } from 'react';
import { NavBarItem } from "./NavBarItem";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function NavBar({ children }) {
    const { currentUser, logout, hasPermission, hasAnyPermission } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };
    
    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100">
            {/* Mobile Header */}
            <div className="md:hidden bg-white shadow-md p-4 flex justify-between items-center">
                <span className="text-xl font-bold text-blue-600">
                    Bons de Travaux
                </span>
                <button 
                    onClick={toggleMobileMenu}
                    className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
                >
                    {mobileMenuOpen ? (
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Sidebar (conditional rendering) */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 backdrop-blur-sm backdrop-brightness-50  z-40">
                    <div className="absolute right-0 h-full w-3/4 max-w-xs bg-white shadow-xl flex flex-col">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <span className="text-xl font-bold text-blue-600">
                                Menu
                            </span>
                            <button 
                                onClick={toggleMobileMenu}
                                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
                            >
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 flex-grow overflow-y-auto">
                            <div className="space-y-4">
                                <NavBarItem to="/" label="Accueil" icon="home" onClick={toggleMobileMenu} />
                                <NavBarItem to="/tickets" label="Mes Bons" icon="ticket" onClick={toggleMobileMenu} />
                                <NavBarItem to="/new-ticket" label="Nouveau Bon" icon="plus" onClick={toggleMobileMenu} />                                {hasAnyPermission(['InformatiqueTicket', 'TechniqueTicket', 'EconomatTicket']) && (
                                    <NavBarItem to="/tickets/manage" label="Gestion des Bons" icon="manage" onClick={toggleMobileMenu} />
                                )}
                                
                                {hasPermission('view_statistics') && (
                                    <NavBarItem to="/statistics" label="Statistiques" icon="chart" onClick={toggleMobileMenu} />
                                )}
                                
                                {hasPermission('AdminAccess') && (
                                    <NavBarItem to="/admin" label="Administration" icon="admin" onClick={toggleMobileMenu} />
                                )}
                                
                                <div className="pt-4 mt-4 border-t border-gray-200">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                        Paramètres
                                    </p>
                                    <NavBarItem to="/settings" label="Préférences" icon="preferences" onClick={toggleMobileMenu} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">{currentUser?.username}</p>
                                    <p className="text-xs text-gray-500">Connecté</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                    title="Déconnexion"
                                >
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:block md:w-64 bg-white shadow-md">
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-4 border-b border-gray-200">
                        <span className="text-xl font-bold text-blue-600">
                            Bons de Travaux
                        </span>
                    </div>
                    
                    {/* Navigation Links */}
                    <div className="p-4 flex-grow">
                        <div className="space-y-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Menu principal
                            </p>
                            <NavBarItem to="/" label="Accueil" icon="home" />
                            <NavBarItem to="/tickets" label="Mes Bons" icon="ticket" />
                            <NavBarItem to="/new-ticket" label="Nouveau Bon" icon="plus" />                            {/* Afficher le lien de gestion des tickets seulement si l'utilisateur a les permissions nécessaires */}
                            {hasAnyPermission(['InformatiqueTicket', 'TechniqueTicket', 'EconomatTicket']) && (
                                <NavBarItem to="/tickets/manage" label="Gestion des Bons" icon="manage" />
                            )}
                            
                            {/* Afficher le lien vers les statistiques seulement si l'utilisateur a la permission nécessaire */}
                            {hasPermission('view_statistics') && (
                                <NavBarItem to="/statistics" label="Statistiques" icon="chart" />
                            )}
                            
                            {/* Afficher le lien d'administration seulement si l'utilisateur a la permission AdminAccess */}
                            {hasPermission('AdminAccess') && (
                                <NavBarItem to="/admin" label="Administration" icon="admin" />
                            )}
                              <div className="pt-4 mt-4 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                    Paramètres
                                </p>
                                <NavBarItem to="/settings" label="Paramètres" icon="preferences" />
                            </div>
                        </div>
                    </div>
                    
                    {/* User Info & Logout */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">{currentUser?.username}</p>
                                <p className="text-xs text-gray-500">Connecté</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                title="Déconnexion"
                            >
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="py-4 px-4 md:py-6 md:px-8">
                    {children}
                </div>
            </div>
        </div>
    );
}