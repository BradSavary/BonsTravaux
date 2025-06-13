import React from 'react';

/**
 * Carte de statistiques simple affichant un titre, une valeur et optionnellement une icône
 */
export function StatCard({ title, value, icon, className = "" }) {
  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className="p-2 bg-indigo-100 rounded-full">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
