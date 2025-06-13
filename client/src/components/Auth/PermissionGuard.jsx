import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function PermissionGuard({ children, requiredPermission, requiredAnyPermission, redirectTo = "/" }) {
    const { hasPermission, hasAnyPermission, loading } = useAuth();

    // Pendant le chargement, ne rien afficher
    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Vérifier les permissions requises
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <Navigate to={redirectTo} replace />;
    }

    // Vérifier si l'utilisateur a au moins l'une des permissions requises
    if (requiredAnyPermission && !hasAnyPermission(requiredAnyPermission)) {
        return <Navigate to={redirectTo} replace />;
    }

    // Si les permissions sont validées, afficher le contenu protégé
    return children;
}