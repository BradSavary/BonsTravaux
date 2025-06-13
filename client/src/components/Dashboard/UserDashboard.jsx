import React, { useState, useEffect } from 'react';
import { DashboardCard } from './DashboardCard';
import { TicketList } from './TicketList';
import { FormSelect } from '../Form/FormSelect';
import { apiRequest } from '../../../lib/api-request';

export function UserDashboard({ dashboardData }) {
  const { userRecentTickets, userTickets, defaultServiceId, serviceTickets } = dashboardData;
  const [selectedServiceId, setSelectedServiceId] = useState(defaultServiceId || '');
  const [serviceOptions, setServiceOptions] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState(serviceTickets || []);
  const [loading, setLoading] = useState(false);
  
  // Afficher les tickets de service par défaut immédiatement
  useEffect(() => {
    if (serviceTickets && serviceTickets.length > 0) {
      setFilteredTickets(serviceTickets);
    }
  }, [serviceTickets]);
  
  // Charger les options de service
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await apiRequest.get('services?forTicketCreation=true', true);
        if (response.status === 'success') {
          const options = response.data.map(service => ({
            value: service.id,
            label: service.nom
          }));
          setServiceOptions(options);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des services:', err);
      }
    };
    
    fetchServices();
  }, []);
  
  // Gérer le changement de service
  const handleServiceChange = async (e) => {
    const serviceId = e.target.value;
    setSelectedServiceId(serviceId);
    
    if (!serviceId) {
      setFilteredTickets([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiRequest.get(`tickets?serviceId=${serviceId}&limit=10`, true);
      if (response.status === 'success') {
        setFilteredTickets(response.data || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des tickets par service:', err);
      setFilteredTickets([]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Afficher les deux cartes côte à côte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tickets récents */}
        <DashboardCard 
          title="Vos bons récents"
          icon={
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          }
        >
          <TicketList 
            tickets={userRecentTickets || []} 
            emptyMessage="Vous n'avez pas créé de bon récemment" 
            useBackgroundColors={true}
          />
        </DashboardCard>
        
        {/* Tickets par service */}
        <DashboardCard 
          title="Bons par service"
          icon={
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
          }
        >
          <div className="mb-4">
            <FormSelect
              label="Filtrer par service demandeur"
              name="serviceFilter"
              value={selectedServiceId}
              onChange={handleServiceChange}
              options={serviceOptions}
              placeholder="Sélectionnez un service"
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <TicketList 
              tickets={filteredTickets} 
              emptyMessage={
                selectedServiceId 
                  ? "Aucun bon trouvé pour ce service" 
                  : "Veuillez sélectionner un service"
              } 
              useBackgroundColors={true}
            />
          )}
        </DashboardCard>
      </div>
    </div>
  );
}