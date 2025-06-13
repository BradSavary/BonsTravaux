import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../../lib/api-request";
import { TechnicianDashboard } from "../components/Dashboard/TechnicianDashboard";
import { UserDashboard } from "../components/Dashboard/UserDashboard";
import { Link } from "react-router-dom"; // Ajout de l'import Link

export function Home() {
  const { currentUser, hasAnyPermission, userPermissions } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Déterminer si l'utilisateur a des droits de gestion de tickets
  const hasTechnicianRights = hasAnyPermission([
    "InformatiqueTicket",
    "TechniqueTicket",
    "EconomatTicket",
  ]);

  // Charger les données du tableau de bord
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await apiRequest.get("tickets/dashboard", true);
        if (response.status === "success") {
          setDashboardData(response.data);
          setError("");
        } else {
          setError(response.message || "Erreur lors du chargement des données");
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError("Erreur de connexion au serveur");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Bienvenue sur le site des Bons de Travaux
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Vous êtes connecté en tant que{" "}
            <span className="font-medium">{currentUser?.username}</span>
          </p>
        </div>
        <Link
          to="/new-ticket"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Créer un nouveau bon
        </Link>
      </div>

      <div className="border-t border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Tableau de bord
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              <p>{error}</p>
            </div>
          ) : dashboardData ? (
            hasTechnicianRights ? (
              <TechnicianDashboard dashboardData={dashboardData} />
            ) : (
              <UserDashboard dashboardData={dashboardData} />
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
