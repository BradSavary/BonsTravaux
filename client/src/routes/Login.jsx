import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, currentUser, loginError } = useAuth();

    // Rediriger si déjà connecté
    useEffect(() => {
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    // Afficher les erreurs de login provenant du contexte
    useEffect(() => {
        if (loginError) {
            setError(loginError);
        }
    }, [loginError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!username || !password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const success = await login(username, password);
            
            if (success) {
                navigate('/');
            }
        } catch (error) {
            setError('Une erreur est survenue lors de la connexion');
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Image de fond / Information */}
            <div className="hidden md:flex md:w-1/2 bg-blue-600 flex-col justify-center items-center p-12 text-white">
                <div className="max-w-md">
                    <svg className="h-16 w-16 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <h1 className="text-4xl font-bold mb-4">Système de demande d'intervention</h1>
                    <p className="text-blue-100 text-lg mb-6">
                        Plateforme centralisée pour signaler des problèmes et suivre l'avancement de leur résolution.
                    </p>
                    <div className="bg-blue-700 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Comment ça marche</h3>
                        <ol className="list-decimal list-inside text-blue-100 space-y-2">
                            <li>Connectez-vous avec vos identifiants</li>
                            <li>Créez une nouvelle demande d'intervention</li>
                            <li>Suivez l'avancement de votre demande</li>
                            <li>Recevez des notifications sur le traitement</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Formulaire de connexion */}
            <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-8">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Demande d'intervention
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Veuillez vous connecter pour accéder à votre espace
                        </p>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Nom d'utilisateur
                            </label>
                            <div className="mt-1">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Entrez votre nom d'utilisateur"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Mot de passe
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Entrez votre mot de passe"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connexion en cours...
                                    </>
                                ) : 'Se connecter'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-50 text-gray-500">
                                    Information
                                </span>
                            </div>
                        </div>
                        <p className="mt-4 text-center text-sm text-gray-600">
                            Veuillez utiliser vos identifiants de connexions Windows
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}