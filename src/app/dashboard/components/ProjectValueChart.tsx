"use client";

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ProjectValueDistribution } from '../../../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProjectValueChartProps {
  data: ProjectValueDistribution[];
}

const ProjectValueChart: React.FC<ProjectValueChartProps> = ({ data }) => {
  // Handle empty or null data
  const safeData = data || [];
  
  // Sort by value and take top 5
  const sortedData = [...safeData]
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 5);

  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const chartData = {
    labels: sortedData.map(item => {
      // Truncate long project names
      return item.project_name.length > 20 
        ? item.project_name.substring(0, 20) + '...' 
        : item.project_name;
    }),
    datasets: [
      {
        label: 'Total Value (IDR)',
        data: sortedData.map(item => item.total_value),
        backgroundColor: [
          '#3B82F6', // Blue
          '#10B981', // Green
          '#F59E0B', // Amber
          '#EF4444', // Red
          '#8B5CF6', // Purple
        ],
        borderColor: [
          '#2563EB', // Darker Blue
          '#059669', // Darker Green
          '#D97706', // Darker Amber
          '#DC2626', // Darker Red
          '#7C3AED', // Darker Purple
        ],
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
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
            const index = context[0].dataIndex;
            return sortedData[index].project_name;
          },
          label: function(context: any) {
            const value = context.parsed.y;
            return `Total Value: ${new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(value)}`;
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
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
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
          callback: function(value: any) {
            return formatValue(value);
          }
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Project Value Distribution</h3>
      <div className="h-80">
        {sortedData.length > 0 ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No project data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectValueChart;
