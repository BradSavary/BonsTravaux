import React from 'react';

/**
 * Composant qui affiche le statut de verrouillage d'un utilisateur technicien
 */
export function LockStatus({ isLocked, size = "normal" }) {
    const sizeClasses = size === "small" 
        ? "px-1.5 py-0.5 text-xs" 
        : "px-2 py-0.5 text-sm";
        
    if (isLocked) {
        return (
            <span className={`inline-flex items-center rounded-full font-medium bg-red-100 text-red-800 ${sizeClasses}`}>
                <svg className="mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                </svg>
                Bloqué
            </span>
        );
    }
    
    return (
        <span className={`inline-flex items-center rounded-full font-medium bg-green-100 text-green-800 ${sizeClasses}`}>
            <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
            </svg>
            Actif
        </span>
    );
}
