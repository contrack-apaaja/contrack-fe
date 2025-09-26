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

  const chartData = {
    labels: data.map(item => item.contract_type),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => getContractTypeColor(item.contract_type, true)),
        borderColor: data.map(item => getContractTypeColor(item.contract_type, true)),
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
