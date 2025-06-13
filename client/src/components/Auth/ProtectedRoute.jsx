import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute({ children }) {
    const { currentUser, loading } = useAuth();

    // Afficher un écran de chargement pendant la vérification du token
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }

    // Rediriger vers la page de login si l'utilisateur n'est pas connecté
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Si l'utilisateur est connecté, afficher le contenu protégé
    return children;
}