"use client";

import React from 'react';
import { DashboardData } from '../../../services/api';

interface DashboardStatsProps {
  data: DashboardData;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Define all possible statuses with their display names and colors
  // Order: Draft, Pending Legal Review, Pending Signature, Active, Expired, Terminated
  const statusConfig = [
    { status: 'DRAFT', display: 'Draft', color: 'yellow', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { status: 'PENDING_LEGAL_REVIEW', display: 'Pending Legal Review', color: 'orange', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { status: 'PENDING_SIGNATURE', display: 'Pending Signature', color: 'blue', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { status: 'ACTIVE', display: 'Active', color: 'green', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { status: 'EXPIRED', display: 'Expired', color: 'red', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' },
    { status: 'TERMINATED', display: 'Terminated', color: 'gray', icon: 'M6 18L18 6M6 6l12 12' },
  ];

  const getStatusCount = (status: string) => {
    if (!data.status_counts || !Array.isArray(data.status_counts)) {
      return 0;
    }
    return data.status_counts.find(item => item.status === status)?.count || 0;
  };

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; text: string } } = {
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
    };
    return colorMap[color] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  return (
    <div className="mb-8">
      {/* Status Cards */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Contract Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statusConfig.map((status) => {
            const count = getStatusCount(status.status);
            const colorClasses = getColorClasses(status.color);
            
            return (
              <div key={status.status} className="text-center p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className={`inline-flex p-3 rounded-full ${colorClasses.bg} ${colorClasses.text} mb-3`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={status.icon} />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{count}</p>
                <p className="text-sm text-gray-600">{status.display}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
