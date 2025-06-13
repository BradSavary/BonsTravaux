import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../../lib/api-request';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { formatDateOnly } from '../../lib/date-helpers';
import { StatCard } from '../components/Statistics/StatCard';

// Enregistrement des composants ChartJS nécessaires
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export function Statistics() {
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('global');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statsData, setStatsData] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  
  // Couleurs pour les graphiques
  const chartColors = [
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(199, 199, 199, 0.8)',
    'rgba(83, 102, 255, 0.8)',
    'rgba(255, 99, 71, 0.8)',
    'rgba(50, 205, 50, 0.8)'
  ];
  // Les services pour lesquels nous voulons des statistiques spécifiques
  const specificServices = {
    'informatique': { id: null, name: 'Informatique' },
    'economat': { id: null, name: 'Economat' }, 
    'technique': { id: null, name: 'Technique' }
  };
    // État pour stocker les références aux services spécifiques
  const [specificServicesState, setSpecificServicesState] = useState(specificServices);
  
  // Chargement des services au montage du composant
  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Correction du pluriel -> singulier dans l'URL
        const response = await apiRequest.get('service-intervenants', true); 
        
        if (response.status === 'success') {
          console.log("Services intervenants récupérés:", response.data);
          
          const servicesList = response.data.map(service => ({
            id: service.id,
            name: service.name,
            type: 'intervenant'
          }));
          
          setServices(servicesList);
          
          // Associer les IDs aux services spécifiques
          const updatedSpecificServices = { ...specificServices };
          
          servicesList.forEach(service => {
            const normalizedName = service.name.toLowerCase();
            
            if (normalizedName.includes('informatique')) {
              updatedSpecificServices['informatique'].id = service.id;
            } else if (normalizedName.includes('economat') || normalizedName.includes('économat')) {
              updatedSpecificServices['economat'].id = service.id;
            } else if (normalizedName.includes('technique')) {
              updatedSpecificServices['technique'].id = service.id;
            }
          });

          console.log("Services spécifiques mis à jour:", updatedSpecificServices);
          
          // Mettre à jour l'état avec les services spécifiques
          setSpecificServicesState(updatedSpecificServices);
          
          // Si on est sur un tab de service, sélectionner le bon serviceId
          if (activeTab !== 'global') {
            const serviceId = updatedSpecificServices[activeTab]?.id;
            if (serviceId) {
              console.log(`Sélection du service ID ${serviceId} pour l'onglet ${activeTab}`);
              setSelectedServiceId(serviceId);
            }
          }
        }
      } catch (error) {
        console.error('Error loading services:', error);
        setError('Erreur lors du chargement des services');
      }
    };

    fetchServices();
  }, [activeTab]);
  // Récupération des statistiques lorsque les paramètres changent
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError('');
        try {
        // Déterminer le serviceId en fonction de l'onglet actif
        let serviceIdToUse = null;
        
        if (activeTab !== 'global') {
          serviceIdToUse = specificServicesState[activeTab]?.id;
          console.log(`Utilisation du service ID ${serviceIdToUse} pour ${activeTab}`);
          
          // Si on n'a pas trouvé l'ID du service pour cet onglet
          if (!serviceIdToUse) {
            setError(`Service ${specificServicesState[activeTab]?.name} non trouvé dans le système`);
            setLoading(false);
            return;
          }
        }
          const params = new URLSearchParams({
          user_id: currentUser.id,
          startDate,
          endDate,
          statsType: activeTab === 'global' ? 'global' : 'service',
          serviceId: serviceIdToUse || ''
        }).toString();
        
        console.log(`Fetching stats with params: ${params}`);
        
        const response = await apiRequest.get(`statistics?${params}`, true);
        
        if (response.status === 'success') {
          setStatsData(response.data);
        } else {
          setError(response.message || 'Erreur lors du chargement des statistiques');
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    // Charger les données seulement si l'utilisateur est connecté
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser, activeTab, startDate, endDate]);  // Gestion du changement d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Si nous passons à un onglet de service spécifique
    if (tab !== 'global') {
      const serviceId = specificServicesState[tab]?.id;
      if (serviceId) {
        console.log(`Changement d'onglet: sélection du service ID ${serviceId} pour ${tab}`);
        setSelectedServiceId(serviceId);
      } else {
        console.log(`Pas d'ID de service trouvé pour l'onglet ${tab}`);
      }
    } else {
      console.log("Changement pour l'onglet global");
    }
  };

  // Préparation des données pour le graphique de répartition par service demandeur
  const prepareRequestingServiceData = () => {
    if (!statsData || !statsData.ticketsByRequestingService) return null;
    
    const labels = statsData.ticketsByRequestingService.map(item => item.service_name);
    const data = statsData.ticketsByRequestingService.map(item => item.ticket_count);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: chartColors.slice(0, data.length),
          borderWidth: 1,
        },
      ],
    };
  };

  // Préparation des données pour le graphique de répartition par statut
  const prepareStatusData = (statusData) => {
    if (!statusData) return null;
    
    const labels = statusData.map(item => item.statut);
    const data = statusData.map(item => item.count);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: chartColors.slice(0, data.length),
          borderWidth: 1,
        },
      ],
    };
  };
  // Préparation des données pour le graphique de répartition par catégorie
  const prepareCategoryData = () => {
    if (!statsData || !statsData.ticketsByCategory) return null;
    
    // Extraction des données pour les labels et les valeurs
    const labels = statsData.ticketsByCategory.map(item => item.category_name);
    const data = statsData.ticketsByCategory.map(item => item.ticket_count);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: chartColors.slice(0, data.length),
          borderWidth: 1,
        },
      ],
    };
  };

  // Préparation des données pour le graphique de répartition par technicien
  const prepareTechnicianData = () => {
    if (!statsData || !statsData.ticketsByTechnician) return null;
    
    const labels = statsData.ticketsByTechnician.map(item => item.username);
    const data = statsData.ticketsByTechnician.map(item => item.ticket_count);
    
    return {
      labels,
      datasets: [
        {
          label: 'Nombre de tickets',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Options génériques pour les graphiques
  const pieOptions = {
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value * 100) / total);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    maintainAspectRatio: false
  };
  
  const barOptions = {
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    maintainAspectRatio: false
  };  // Rendu du contenu global
  const renderGlobalContent = () => {
    if (loading) return <div className="py-8 text-center">Chargement des statistiques...</div>;
    if (error) return <div className="py-8 text-center text-red-500">{error}</div>;
    if (!statsData) return <div className="py-8 text-center">Aucune donnée disponible</div>;

    const requestingServiceData = prepareRequestingServiceData();
    const statusData = prepareStatusData(statsData.ticketsByStatus);
    
    // Calculer le nombre de tickets par statut pour les cartes statistiques
    const ticketCounts = {
      total: statsData.totalTickets || 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0
    };
    
    // Remplir les compteurs par statut
    if (statsData.ticketsByStatus) {
      statsData.ticketsByStatus.forEach(stat => {
        if (stat.statut === 'Ouvert') ticketCounts.open = stat.count;
        else if (stat.statut === 'En cours') ticketCounts.inProgress = stat.count;
        else if (stat.statut === 'Résolu') ticketCounts.resolved = stat.count;
        else if (stat.statut === 'Fermé') ticketCounts.closed = stat.count;
      });
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Statistiques générales</h2>
          <p className="mb-2">
            <span className="font-medium">Période:</span> {formatDateOnly(statsData.startDate)} - {formatDateOnly(statsData.endDate)}
          </p>
        </div>
        
        {/* Cartes avec les compteurs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
            title="Total des tickets" 
            value={ticketCounts.total}
            icon={
              <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            }
            className="sm:col-span-2 lg:col-span-1"
          />
          <StatCard 
            title="Tickets ouverts" 
            value={ticketCounts.open}
            icon={
              <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard 
            title="En cours" 
            value={ticketCounts.inProgress}
            icon={
              <svg className="h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard 
            title="Résolus" 
            value={ticketCounts.resolved}
            icon={
              <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard 
            title="Fermés" 
            value={ticketCounts.closed}
            icon={
              <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-md font-medium mb-4">Répartition par service demandeur</h3>
            <div className="h-80">
              {requestingServiceData ? (
                <Pie data={requestingServiceData} options={pieOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-md font-medium mb-4">Répartition par statut</h3>
            <div className="h-80">
              {statusData ? (
                <Pie data={statusData} options={pieOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };  // Rendu du contenu pour un service spécifique
  const renderServiceContent = () => {
    if (loading) return <div className="py-8 text-center">Chargement des statistiques...</div>;
    if (error) return <div className="py-8 text-center text-red-500">{error}</div>;
    if (!statsData) return <div className="py-8 text-center">Aucune donnée disponible</div>;

    const categoryData = prepareCategoryData();
    const statusData = prepareStatusData(statsData.ticketsByStatus);
    const technicianData = prepareTechnicianData();
      // Déterminer le nom du service à afficher
    const serviceName = specificServicesState[activeTab]?.name || 'Service sélectionné';
    
    // Calculer les totaux par statut pour les cartes
    const ticketCounts = {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      total: 0
    };
    
    // Remplir les compteurs par statut
    if (statsData.ticketsByStatus) {
      statsData.ticketsByStatus.forEach(stat => {
        if (stat.statut === 'Ouvert') ticketCounts.open = stat.count;
        else if (stat.statut === 'En cours') ticketCounts.inProgress = stat.count;
        else if (stat.statut === 'Résolu') ticketCounts.resolved = stat.count;
        else if (stat.statut === 'Fermé') ticketCounts.closed = stat.count;
        
        ticketCounts.total += Number(stat.count);
      });
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">
            Statistiques: {serviceName}
          </h2>
          <p>
            <span className="font-medium">Période:</span> {formatDateOnly(statsData.startDate)} - {formatDateOnly(statsData.endDate)}
          </p>
        </div>
          {/* Cartes pour les statuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
            title="Total des tickets" 
            value={ticketCounts.total}
            icon={
              <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            }
          />
          <StatCard 
            title="Tickets ouverts" 
            value={ticketCounts.open}
            icon={
              <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard 
            title="En cours" 
            value={ticketCounts.inProgress}
            icon={
              <svg className="h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard 
            title="Résolus" 
            value={ticketCounts.resolved}
            icon={
              <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard 
            title="Fermés" 
            value={ticketCounts.closed}
            icon={
              <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-md font-medium mb-4">Répartition par catégorie</h3>
            <div className="h-80">
              {categoryData ? (
                <Pie data={categoryData} options={pieOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-md font-medium mb-4">Répartition par statut</h3>
            <div className="h-80">
              {statusData ? (
                <Pie data={statusData} options={pieOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
            <h3 className="text-md font-medium mb-4">Répartition par technicien</h3>
            <div className="h-80">
              {technicianData ? (
                <Bar data={technicianData} options={barOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className='flex flex-col'>
          <h1 className="text-2xl font-semibold text-gray-900">Statistiques</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Visualisez les statistiques de l'application par période et par service.
            </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Du</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full sm:w-40 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Au</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full sm:w-40 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
        {/* Onglets de navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-wrap -mb-px">
          <button
            onClick={() => handleTabChange('global')}
            className={`py-4 px-1 border-b-2 font-medium text-sm mr-8 
              ${activeTab === 'global' 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Global
          </button>
            {Object.keys(specificServicesState).map(serviceKey => (
            <button
              key={serviceKey}
              onClick={() => handleTabChange(serviceKey)}
              className={`py-4 px-1 border-b-2 font-medium text-sm mr-8 
                ${activeTab === serviceKey
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {specificServicesState[serviceKey].name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Contenu de l'onglet actif */}
      {activeTab === 'global' ? renderGlobalContent() : renderServiceContent()}
    </div>
  );
}
