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

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface ContractTypeChartProps {
  data: ContractTypeDistribution[];
}

const ContractTypeChart: React.FC<ContractTypeChartProps> = ({ data }) => {
  // Define colors for different contract types
  const getContractTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Construction': '#3B82F6', // Blue
      'Supply': '#10B981', // Green
      'Service Agreement': '#F59E0B', // Amber
      'Service': '#8B5CF6', // Purple
      'Maintenance': '#EF4444', // Red
      'Consulting': '#06B6D4', // Cyan
    };
    return colors[type] || '#6366F1'; // Default indigo
  };

  const chartData = {
    labels: data.map(item => item.contract_type),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => getContractTypeColor(item.contract_type)),
        borderColor: data.map(item => getContractTypeColor(item.contract_type)),
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
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ContractTypeChart;
