"use client";

import React, { useEffect, useState } from 'react';
import { dashboardApi, DashboardData, Contract } from '../../../services/api';
import DashboardStats from '../../dashboard/components/DashboardStats';
import ContractTypeChart from '../../dashboard/components/ContractTypeChart';
import ProjectValueChart from '../../dashboard/components/ProjectValueChart';
import ContractsTable from '../../dashboard/components/ContractsTable';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, contractsResponse] = await Promise.all([
          dashboardApi.getDashboardData(),
          dashboardApi.getContracts()
        ]);
        
        // Handle null/empty data gracefully
        setDashboardData(dashboardResponse.data || {
          status_counts: [],
          contract_type_distribution: [],
          project_value_distribution: []
        });
        setContracts(contractsResponse.data || []);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        // Provide default empty data instead of showing error
        setDashboardData({
          status_counts: [],
          contract_type_distribution: [],
          project_value_distribution: []
        });
        setContracts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Remove error and null data handling since we provide defaults

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your contract management system</p>
      </div>

      {/* Stats Cards */}
      <DashboardStats data={dashboardData} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Contract Type Distribution Chart */}
        <ContractTypeChart data={dashboardData.contract_type_distribution} />
        
        {/* Project Value Distribution Chart */}
        <ProjectValueChart data={dashboardData.project_value_distribution} />
      </div>

      {/* Contracts Table */}
      <ContractsTable contracts={contracts} />
    </div>
  );
};

export default DashboardPage;