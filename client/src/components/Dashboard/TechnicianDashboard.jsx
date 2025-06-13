import React from 'react';
import { DashboardCard } from './DashboardCard';
import { TicketList } from './TicketList';

export function TechnicianDashboard({ dashboardData }) {
  const { openTicketsCount, inProgressTicketsCount, resolvedTicketsCount, recentTickets, assignedTickets } = dashboardData;
  
  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bons à traiter */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-blue-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Bons à traiter
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {openTicketsCount || 0}
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Bons en cours */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-yellow-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Bons en cours
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {inProgressTicketsCount || 0}
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Bons résolus */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-green-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Bons résolus
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {resolvedTicketsCount || 0}
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listes de tickets côte à côte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bons récents */}
        <DashboardCard 
          title="Bons des dernières 24h"
          icon={
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          }
        >
          <TicketList 
            tickets={recentTickets} 
            emptyMessage="Aucun bon créé dans les dernières 24h"
            useBackgroundColors={true} 
          />
        </DashboardCard>
        
        {/* Interventions en cours */}
        <DashboardCard 
          title="Vos interventions en cours"
          icon={
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          }
        >
          <TicketList 
            tickets={assignedTickets} 
            emptyMessage="Aucune intervention en cours ne vous est assignée"
            useBackgroundColors={true}
          />
        </DashboardCard>
      </div>
    </div>
  );
}