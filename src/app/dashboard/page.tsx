'use client';

import { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface Summary {
  totalEarnings: number;
  totalCosts: number;
  totalProfit: number;
  totalAnimals: number;
  totalCrops: number;
}

interface CostDistribution {
  Animals: number;
  Crops: number;
  Equipment: number;
  Labor: number;
}

interface EarningsByMonth {
  animals: number;
  crops: number;
}

interface DashboardData {
  summary: Summary;
  costDistribution: CostDistribution;
  earningsOverTime: { [month: string]: EarningsByMonth };
  profitOverTime: { [month: string]: number };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const errorRetryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (error && errorRetryButtonRef.current) {
      errorRetryButtonRef.current.focus();
    }
  }, [error]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const dashboardData = await res.json();
      setData(dashboardData);
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <p className="text-gray-500 text-lg">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  // Prepare data for cost distribution pie chart
  const costDistributionLabels = Object.keys(data.costDistribution);
  const costDistributionValues = Object.values(data.costDistribution);
  const costPieChartData = {
    labels: costDistributionLabels,
    datasets: [
      {
        label: 'Cost Distribution (TND)',
        data: costDistributionValues,
        backgroundColor: [
          '#3B82F6', // blue-500 (Animals)
          '#10B981', // green-500 (Crops)
          '#F59E0B', // yellow-500 (Equipment)
          '#EF4444', // red-500 (Labor)
        ],
        borderColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for earnings bar chart
  const earningsMonths = Object.keys(data.earningsOverTime);
  const earningsAnimals = earningsMonths.map((month) => data.earningsOverTime[month].animals);
  const earningsCrops = earningsMonths.map((month) => data.earningsOverTime[month].crops);
  const earningsBarChartData = {
    labels: earningsMonths,
    datasets: [
      {
        label: 'Animals (TND)',
        data: earningsAnimals,
        backgroundColor: '#3B82F6', // blue-500
        borderColor: '#3B82F6',
        borderWidth: 1,
      },
      {
        label: 'Crops (TND)',
        data: earningsCrops,
        backgroundColor: '#10B981', // green-500
        borderColor: '#10B981',
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for profit bar chart
  const profitMonths = Object.keys(data.profitOverTime);
  const profitValues = profitMonths.map((month) => data.profitOverTime[month]);
  const profitBarChartData = {
    labels: profitMonths,
    datasets: [
      {
        label: 'Profit (TND)',
        data: profitValues,
        backgroundColor: profitValues.map((value) =>
          value >= 0 ? '#10B981' : '#EF4444'
        ), // green for positive, red for negative
        borderColor: profitValues.map((value) =>
          value >= 0 ? '#10B981' : '#EF4444'
        ),
        borderWidth: 1,
      },
    ],
  };

  const formatNumber = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Farm Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className={`flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded"
          >
            <p>{error}</p>
            <button
              ref={errorRetryButtonRef}
              onClick={fetchData}
              className="ml-2 text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center gap-3 transform Hover:scale-105 transition-transform">
            <div className="bg-green-100 p-2 rounded-full">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 8c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-600">Total Earnings</h2>
              <p className="text-lg font-bold text-green-600">{formatNumber(data.summary.totalEarnings)} TND</p>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center gap-3 transform Hover:scale-105 transition-transform">
            <div className="bg-red-100 p-2 rounded-full">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 8c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-600">Total Costs</h2>
              <p className="text-lg font-bold text-red-600">{formatNumber(data.summary.totalCosts)} TND</p>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center gap-3 transform Hover:scale-105 transition-transform">
            <div className="bg-purple-100 p-2 rounded-full">
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 8c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-600">Total Profit</h2>
              <p
                className="text-lg font-bold"
                style={{ color: data.summary.totalProfit >= 0 ? '#10B981' : '#EF4444' }}
              >
                {formatNumber(data.summary.totalProfit)} TND
              </p>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center gap-3 transform Hover:scale-105 transition-transform">
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 8c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-600">Total Animals</h2>
              <p className="text-lg font-bold text-blue-600">{data.summary.totalAnimals}</p>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 flex items-center gap-3 transform Hover:scale-105 transition-transform">
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 8c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-600">Total Crops</h2>
              <p className="text-lg font-bold text-blue-600">{data.summary.totalCrops}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Row 1: Cost Distribution and Earnings Breakdown Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Distribution Pie Chart */}
            <div className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Cost Distribution</h2>
              <div className="h-64">
                <Pie
                  data={costPieChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: {
                            size: 12,
                            family: "'Inter', sans-serif",
                          },
                        },
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 12, family: "'Inter', sans-serif" },
                        bodyFont: { size: 10, family: "'Inter', sans-serif" },
                        callbacks: {
                          label: (context) =>
                            `${context.label}: ${formatNumber(context.raw as number)} TND`,
                        },
                      },
                    },
                  }}
                  aria-label="Pie chart showing cost distribution"
                />
              </div>
            </div>

            {/* Earnings Breakdown Bar Chart */}
            <div className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Earnings Breakdown</h2>
              <div className="h-64">
                <Bar
                  data={earningsBarChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: {
                            size: 12,
                            family: "'Inter', sans-serif",
                          },
                        },
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 12, family: "'Inter', sans-serif" },
                        bodyFont: { size: 10, family: "'Inter', sans-serif" },
                        callbacks: {
                          label: (context) =>
                            `${context.dataset.label}: ${formatNumber(context.raw as number)} TND`,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Earnings (TND)',
                          font: {
                            size: 12,
                            family: "'Inter', sans-serif",
                          },
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Month',
                          font: {
                            size: 12,
                            family: "'Inter', sans-serif",
                          },
                        },
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                  aria-label="Bar chart showing earnings breakdown by month"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Profit Overview (Full Width) */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Profit Overview</h2>
            <div className="h-64">
              <Bar
                data={profitBarChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                          size: 12,
                          family: "'Inter', sans-serif",
                        },
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleFont: { size: 12, family: "'Inter', sans-serif" },
                      bodyFont: { size: 10, family: "'Inter', sans-serif" },
                      callbacks: {
                        label: (context) =>
                          `${context.dataset.label}: ${formatNumber(context.raw as number)} TND`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Profit (TND)',
                        font: {
                          size: 12,
                          family: "'Inter', sans-serif",
                        },
                      },
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Month',
                        font: {
                          size: 12,
                          family: "'Inter', sans-serif",
                        },
                      },
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
                aria-label="Bar chart showing profit over time"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}