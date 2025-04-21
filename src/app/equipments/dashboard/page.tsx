'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import Layout from '../../../components/Layout';
import { CurrencyDollarIcon, ArrowPathIcon, CogIcon } from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

interface Equipment {
  id: number;
  type: string;
  acquisition_type: string;
  acquisition_date: string;
  maintenance_cost: number;
  notes: string | null;
  total_transaction_cost: number;
}

interface EquipmentTransaction {
  id: number;
  equipment_id: number;
  transaction_type: string;
  amount: number;
  transaction_date: string;
  notes: string | null;
}

export default function EquipmentDashboardPage() {
  const router = useRouter();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [transactions, setTransactions] = useState<EquipmentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const res = await fetch('/api/equipments');
      if (!res.ok) throw new Error('Failed to fetch equipment data');
      const data = await res.json();
      setEquipments(data.equipments || []);
      setTransactions(data.transactions || []);
    } catch (err) {
      setError('Failed to fetch equipment data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate Key Metrics
  const totalEquipment = equipments.length;
  const totalPurchaseCost = equipments
    .filter((eq) => eq.acquisition_type === 'Purchased')
    .reduce((sum, eq) => sum + eq.total_transaction_cost + eq.maintenance_cost, 0);
  const totalRentalCost = equipments
    .filter((eq) => eq.acquisition_type === 'Rented')
    .reduce((sum, eq) => sum + eq.total_transaction_cost, 0);

  // Recent Transactions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTransactions = transactions.filter(
    (tx) => new Date(tx.transaction_date) >= thirtyDaysAgo
  );
  const recentTransactionCount = recentTransactions.length;

  // Rental Costs: Pie Chart (Cost Breakdown by Type)
  const rentalEquipmentTypes = [...new Set(
    equipments
      .filter((eq) => eq.acquisition_type === 'Rented')
      .map((eq) => eq.type)
  )];
  const rentalCostByType = rentalEquipmentTypes.map((type) => {
    const equipmentOfType = equipments.filter(
      (eq) => eq.type === type && eq.acquisition_type === 'Rented'
    );
    return equipmentOfType.reduce((sum, eq) => sum + eq.total_transaction_cost, 0);
  });

  const rentalPieChartData = {
    labels: rentalEquipmentTypes,
    datasets: [
      {
        label: 'Rental Cost by Type (TND)',
        data: rentalCostByType,
        backgroundColor: [
          '#FBBF24', // yellow-500
          '#FDE68A', // yellow-200
          '#FEF3C7', // yellow-100
          '#FEF9C3', // yellow-50
        ],
        borderColor: [
          '#FBBF24',
          '#FDE68A',
          '#FEF3C7',
          '#FEF9C3',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Purchase Costs: Pie Chart (Cost Breakdown by Type)
  const purchaseEquipmentTypes = [...new Set(
    equipments
      .filter((eq) => eq.acquisition_type === 'Purchased')
      .map((eq) => eq.type)
  )];
  const purchaseCostByType = purchaseEquipmentTypes.map((type) => {
    const equipmentOfType = equipments.filter(
      (eq) => eq.type === type && eq.acquisition_type === 'Purchased'
    );
    return equipmentOfType.reduce(
      (sum, eq) => sum + eq.total_transaction_cost + eq.maintenance_cost,
      0
    );
  });

  const purchasePieChartData = {
    labels: purchaseEquipmentTypes,
    datasets: [
      {
        label: 'Purchase Cost by Type (TND)',
        data: purchaseCostByType,
        backgroundColor: [
          '#3B82F6', // blue-500
          '#93C5FD', // blue-300
          '#BFDBFE', // blue-200
          '#DBEAFE', // blue-100
        ],
        borderColor: [
          '#3B82F6',
          '#93C5FD',
          '#BFDBFE',
          '#DBEAFE',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Rental Costs: Line Chart (Cost Over Time)
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  });

  const rentalCostByMonth = last12Months.map((monthYear) => {
    const [monthName, year] = monthYear.split(' ');
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    const yearNum = parseInt(year);

    return transactions
      .filter((tx) => {
        const txDate = new Date(tx.transaction_date);
        const equipment = equipments.find((eq) => eq.id === tx.equipment_id);
        return (
          txDate.getMonth() === monthIndex &&
          txDate.getFullYear() === yearNum &&
          equipment?.acquisition_type === 'Rented'
        );
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  });

  const rentalLineChartData = {
    labels: last12Months,
    datasets: [
      {
        label: 'Rental Cost (TND)',
        data: rentalCostByMonth,
        fill: false,
        borderColor: '#FBBF24', // yellow-500
        backgroundColor: '#FBBF24',
        tension: 0.1,
      },
    ],
  };

  // Recent Transactions (top 5)
  const recentTransactionsList = transactions
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 5);

  const formatNumber = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Equipment Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/equipments')}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              <CogIcon className="h-5 w-5" aria-hidden="true" />
              <span>Manage Equipment</span>
            </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-6 flex items-center gap-4 transform hover:scale-105 transition-transform">
            <div className="bg-green-100 p-3 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Total Equipment</h2>
              <p className="text-2xl font-bold text-gray-900">{totalEquipment}</p>
            </div>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 flex items-center gap-4 transform hover:scale-105 transition-transform">
            <div className="bg-blue-100 p-3 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Total Purchase Cost (TND)</h2>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalPurchaseCost)}</p>
            </div>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 flex items-center gap-4 transform hover:scale-105 transition-transform">
            <div className="bg-yellow-100 p-3 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Total Rental Cost (TND)</h2>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalRentalCost)}</p>
            </div>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 flex items-center gap-4 transform hover:scale-105 transition-transform">
            <div className="bg-red-100 p-3 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Recent Transactions (30 Days)</h2>
              <p className="text-2xl font-bold text-gray-900">{recentTransactionCount}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-8">
          {/* Row 1: Two Pie Charts Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rental Cost Breakdown by Type */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Rental Cost Breakdown by Type</h2>
              {rentalEquipmentTypes.length > 0 ? (
                <div className="h-80">
                  <Pie
                    data={rentalPieChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                              size: 14,
                              family: "'Inter', sans-serif",
                            },
                          },
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleFont: { size: 14, family: "'Inter', sans-serif" },
                          bodyFont: { size: 12, family: "'Inter', sans-serif" },
                          callbacks: {
                            label: (context) =>
                              `${context.label}: ${formatNumber(context.raw as number)} TND`,
                          },
                        },
                      },
                    }}
                    aria-label="Pie chart showing rental cost breakdown by equipment type"
                  />
                </div>
              ) : (
                <p className="text-gray-500 text-center">No rental equipment data available for chart.</p>
              )}
            </div>

            {/* Purchase Cost Breakdown by Type */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Purchase Cost Breakdown by Type</h2>
              {purchaseEquipmentTypes.length > 0 ? (
                <div className="h-80">
                  <Pie
                    data={purchasePieChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                              size: 14,
                              family: "'Inter', sans-serif",
                            },
                          },
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleFont: { size: 14, family: "'Inter', sans-serif" },
                          bodyFont: { size: 12, family: "'Inter', sans-serif" },
                          callbacks: {
                            label: (context) =>
                              `${context.label}: ${formatNumber(context.raw as number)} TND`,
                          },
                        },
                      },
                    }}
                    aria-label="Pie chart showing purchase cost breakdown by equipment type"
                  />
                </div>
              ) : (
                <p className="text-gray-500 text-center">No purchased equipment data available for chart.</p>
              )}
            </div>
          </div>

          {/* Row 2: Rental Cost Over Time (Full Width) */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Rental Cost Over Time</h2>
            <div className="h-80">
              <Line
                data={rentalLineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                          size: 14,
                          family: "'Inter', sans-serif",
                        },
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleFont: { size: 14, family: "'Inter', sans-serif" },
                      bodyFont: { size: 12, family: "'Inter', sans-serif" },
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
                        text: 'Cost (TND)',
                        font: {
                          size: 14,
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
                          size: 14,
                          family: "'Inter', sans-serif",
                        },
                      },
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
                aria-label="Line chart showing rental equipment cost over the past 12 months"
              />
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Transactions</h2>
          {loading ? (
            <p className="text-gray-500 text-center">Loading transactions...</p>
          ) : recentTransactionsList.length === 0 ? (
            <p className="text-gray-500 text-center">No recent transactions.</p>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full table-auto border-collapse"
                aria-label="Recent equipment transactions"
              >
                <thead>
                  <tr className="bg-yellow-600 text-white">
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Transaction ID</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Equipment Type</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Acquisition Type</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Transaction Type</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Amount (TND)</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Date</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactionsList.map((transaction, index) => {
                    const equipment = equipments.find((e) => e.id === transaction.equipment_id);
                    return (
                      <tr
                        key={transaction.id}
                        className={`border-b ${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <td className="px-4 py-2">{transaction.id}</td>
                        <td className="px-4 py-2">{equipment?.type || 'Unknown'}</td>
                        <td className="px-4 py-2">{equipment?.acquisition_type || 'Unknown'}</td>
                        <td className="px-4 py-2">{transaction.transaction_type}</td>
                        <td className="px-4 py-2">{formatNumber(transaction.amount)}</td>
                        <td className="px-4 py-2">
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">{transaction.notes || 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}