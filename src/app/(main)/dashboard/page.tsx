"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '../../../components/Sidebar';
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
        setDashboardData(dashboardResponse.data);
        setContracts(contractsResponse.data);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '20px' }}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '20px' }}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '20px' }}>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800">No Data Available</h2>
            <p className="text-gray-600">No dashboard data found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
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
      </main>
    </div>
  );
};

export default DashboardPage;