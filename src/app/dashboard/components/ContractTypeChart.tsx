"use client";

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { ContractTypeDistribution } from '../../../services/api';
import { getContractTypeColor } from '../../../lib/contractTypeColors';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface ContractTypeChartProps {
  data: ContractTypeDistribution[];
}

const ContractTypeChart: React.FC<ContractTypeChartProps> = ({ data }) => {
  // Handle empty or null data
  const safeData = data || [];

  const chartData = {
    labels: safeData.map(item => item.contract_type),
    datasets: [
      {
        data: safeData.map(item => item.count),
        backgroundColor: safeData.map(item => getContractTypeColor(item.contract_type, true)),
        borderColor: safeData.map(item => getContractTypeColor(item.contract_type, true)),
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Contract Type Distribution</h3>
      <div className="h-80">
        {safeData.length > 0 ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No contract data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractTypeChart;
