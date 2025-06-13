import { createContext, useState, useContext, useEffect } from 'react';
import { apiRequest } from '../../lib/api-request';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loginError, setLoginError] = useState(null);

    // Vérifie si l'utilisateur est déjà authentifié au chargement
    useEffect(() => {
    const verifyToken = async () => {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await apiRequest.post('user/verify', { token });
              if (response.status === 'success') {
                setCurrentUser({
                    id: response.user.id,
                    username: response.user.username,
                    last_ip: response.user.last_ip,
                    site: response.user.site,
                    default_service_id: response.user.default_service_id,
                    is_lock: response.user.is_lock || false
                });
                setUserPermissions(response.user.permissions || []);
            } else {
                // Token invalide ou expiré
                localStorage.removeItem('authToken');
                setLoginError("Session expirée. Veuillez vous reconnecter.");
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            localStorage.removeItem('authToken');
        } finally {
            setLoading(false);
        }
    };

    verifyToken();
}, []);

const login = async (username, password) => {
    try {
        setLoginError(null);
        
        const response = await apiRequest.post('user/login', { username, password });
        
        if (response.status === 'success') {            localStorage.setItem('authToken', response.token);
            setCurrentUser({
                id: response.id,
                username: response.username,
                last_ip: response.last_ip,
                site: response.site,
                default_service_id: response.default_service_id,
                is_lock: response.is_lock || false
            });
            setUserPermissions(response.permissions || []);
            return true;
        }
        
        setLoginError(response.message || "Échec de la connexion");
        return false;
    } catch (error) {
        console.error('Login error:', error);
        setLoginError("Une erreur est survenue lors de la connexion");
        return false;
    }
};

    // Fonction de déconnexion
    const logout = () => {
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        setUserPermissions([]);
    };

    // Vérifier si l'utilisateur a une permission spécifique
    const hasPermission = (permission) => {
        return userPermissions.includes(permission);
    };

    // Vérifier si l'utilisateur a une des permissions parmi plusieurs
    const hasAnyPermission = (permissions) => {
        if (!Array.isArray(permissions)) permissions = [permissions];
        return permissions.some(p => userPermissions.includes(p));
    };

    // Vérifier si l'utilisateur a accès à la gestion des tickets
    const hasTicketManagementAccess = () => {
        return userPermissions.some(p => 
            p === 'InformatiqueTicket' || 
            p === 'TechniqueTicket' || 
            p === 'EconomatTicket'
        );
    };

    // Vérifier si l'utilisateur a accès à l'administration
    const hasAdminAccess = () => {
        return userPermissions.includes('AdminAccess');
    };

    // Mettre à jour le service demandeur par défaut de l'utilisateur
    const updateDefaultService = async (serviceId) => {
        try {
            const response = await apiRequest.put(
                'user/default-service',
                { serviceId },
                true
            );
            
            if (response.status === 'success') {
                // Mettre à jour l'objet utilisateur courant
                setCurrentUser(prevUser => ({
                    ...prevUser,
                    default_service_id: serviceId
                }));
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error updating default service:', error);
            return false;
        }
    };

    const value = {
        currentUser,
        userPermissions,
        login,
        logout,
        loading,
        loginError,
        hasPermission,
        hasAnyPermission,
        hasTicketManagementAccess,
        hasAdminAccess,
        updateDefaultService
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}