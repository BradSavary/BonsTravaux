import React from 'react';

export function DashboardCard({ title, children, icon = null }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-800">{title}</h2>
          {icon && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}
        </div>
      </div>
      <div className="p-4 max-h-[40rem] overflow-y-scroll">
        {children}
      </div>
    </div>
  );
}