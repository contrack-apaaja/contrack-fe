"use client";

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { StatusCount } from '../../../services/api';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusDistributionChartProps {
  data: StatusCount[];
}

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data }) => {
  // Define colors for different statuses
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'DRAFT': '#3B82F6', // Blue
      'PENDING_LEGAL_REVIEW': '#F59E0B', // Amber
      'APPROVED': '#10B981', // Green
      'REJECTED': '#EF4444', // Red
      'SIGNED': '#8B5CF6', // Purple
      'EXPIRED': '#6B7280', // Gray
    };
    return colors[status] || '#6366F1'; // Default indigo
  };

  const chartData = {
    labels: data.map(item => item.status_display),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => getStatusColor(item.status)),
        borderColor: data.map(item => getStatusColor(item.status)),
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
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h3>
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default StatusDistributionChart;
