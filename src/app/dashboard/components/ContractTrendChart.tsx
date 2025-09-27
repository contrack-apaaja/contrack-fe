"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { MonthlyTrend } from '../../../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ContractTrendChartProps {
  data: MonthlyTrend[];
}

const ContractTrendChart: React.FC<ContractTrendChartProps> = ({ data }) => {
  // Sort data by month to ensure proper chronological order
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));

  const chartData = {
    labels: sortedData.map(item => {
      // Format month from YYYY-MM to readable format
      const [year, month] = item.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }),
    datasets: [
      {
        label: 'Contracts Created',
        data: sortedData.map(item => item.count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4, // Smooth curve
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend since we only have one dataset
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#3B82F6',
        borderWidth: 1,
        callbacks: {
          title: function(context: any) {
            return `Month: ${context[0].label}`;
          },
          label: function(context: any) {
            return `Contracts: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: '#3B82F6',
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Contract Creation Trend (12 Months)</h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ContractTrendChart;
