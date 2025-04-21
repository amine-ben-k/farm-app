'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import Layout from '../../../components/Layout';
import { CurrencyDollarIcon, ArrowPathIcon, CogIcon } from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

interface CropType {
  id: number;
  type: string;
  quantity: number;
  growth_stage: string | null;
  total_cost_of_care: number;
}

interface CropCost {
  id: number;
  crop_id: number;
  type: string;
  cost_type: string;
  amount: number;
  cost_date: string;
  notes: string | null;
}

interface CropSale {
  id: number;
  crop_id: number;
  type: string;
  quantity: number;
  sale_price: number;
  sale_date: string;
  notes: string | null;
  cost_per_unit_at_sale: number;
}

// Define a type for the combined transactions
interface CostTransaction {
  type: 'Cost';
  id: number;
  crop_id: number;
  crop_type: string;
  amount: number;
  date: string;
  notes: string | null;
  cost_type: string;
}

interface SaleTransaction {
  type: 'Sale';
  id: number;
  crop_id: number;
  crop_type: string;
  amount: number;
  date: string;
  notes: string | null;
  quantity: number;
  cost_per_unit_at_sale: number;
}

type Transaction = CostTransaction | SaleTransaction;

export default function CropsDashboardPage() {
  const router = useRouter();
  const [crops, setCrops] = useState<CropType[]>([]);
  const [costs, setCosts] = useState<CropCost[]>([]);
  const [sales, setSales] = useState<CropSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'cost' | 'sale'>('all');
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
      const res = await fetch('/api/crops');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setCrops(data.crops || []);
      setCosts(data.costs || []);
      setSales(data.sales || []);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate Key Metrics
  const totalCrops = crops.length;
  const totalCostOfCare = crops.reduce((sum, crop) => sum + crop.total_cost_of_care, 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.sale_price, 0);

  // Recent Transactions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCosts = costs.filter((cost) => new Date(cost.cost_date) >= thirtyDaysAgo);
  const recentSales = sales.filter((sale) => new Date(sale.sale_date) >= thirtyDaysAgo);
  const recentTransactionCount = recentCosts.length + recentSales.length;

  // Costs: Pie Chart (Cost Breakdown by Crop Type)
  const cropTypes = [...new Set(crops.map((crop) => crop.type))];
  const costByCropType = cropTypes.map((type) => {
    const cropsOfType = crops.filter((crop) => crop.type === type);
    return cropsOfType.reduce((sum, crop) => sum + crop.total_cost_of_care, 0);
  });

  const costPieChartData = {
    labels: cropTypes,
    datasets: [
      {
        label: 'Cost by Crop Type ($)',
        data: costByCropType,
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

  // Sales: Pie Chart (Sales Breakdown by Crop Type)
  const salesByCropType = cropTypes.map((type) => {
    const salesOfType = sales.filter((sale) => sale.type === type);
    return salesOfType.reduce((sum, sale) => sum + sale.sale_price, 0);
  });

  const salesPieChartData = {
    labels: cropTypes,
    datasets: [
      {
        label: 'Sales by Crop Type ($)',
        data: salesByCropType,
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

  // Combined Costs and Sales Over Time: Line Chart
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  });

  const costByMonth = last12Months.map((monthYear) => {
    const [monthName, year] = monthYear.split(' ');
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    const yearNum = parseInt(year);

    return costs
      .filter((cost) => {
        const costDate = new Date(cost.cost_date);
        return costDate.getMonth() === monthIndex && costDate.getFullYear() === yearNum;
      })
      .reduce((sum, cost) => sum + cost.amount, 0);
  });

  const salesByMonth = last12Months.map((monthYear) => {
    const [monthName, year] = monthYear.split(' ');
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    const yearNum = parseInt(year);

    return sales
      .filter((sale) => {
        const saleDate = new Date(sale.sale_date);
        return saleDate.getMonth() === monthIndex && saleDate.getFullYear() === yearNum;
      })
      .reduce((sum, sale) => sum + sale.sale_price, 0);
  });

  const combinedLineChartData = {
    labels: last12Months,
    datasets: [
      {
        label: 'Costs ($)',
        data: costByMonth,
        fill: false,
        borderColor: '#3B82F6', // blue-500
        backgroundColor: '#3B82F6',
        tension: 0.1,
      },
      {
        label: 'Sales ($)',
        data: salesByMonth,
        fill: false,
        borderColor: '#FBBF24', // yellow-500
        backgroundColor: '#FBBF24',
        tension: 0.1,
      },
    ],
  };

  // Recent Transactions (combine costs and sales, sorted by date, top 5)
  const allTransactions: Transaction[] = [
    ...costs.map((cost) => ({
      type: 'Cost' as const,
      id: cost.id,
      crop_id: cost.crop_id,
      crop_type: cost.type,
      amount: cost.amount,
      date: cost.cost_date,
      notes: cost.notes,
      cost_type: cost.cost_type,
    })),
    ...sales.map((sale) => ({
      type: 'Sale' as const,
      id: sale.id,
      crop_id: sale.crop_id,
      crop_type: sale.type,
      amount: sale.sale_price,
      date: sale.sale_date,
      notes: sale.notes,
      quantity: sale.quantity,
      cost_per_unit_at_sale: sale.cost_per_unit_at_sale,
    })),
  ];

  const filteredTransactions = allTransactions.filter((tx) => {
    if (transactionFilter === 'all') return true;
    return tx.type.toLowerCase() === transactionFilter;
  });

  const recentTransactionsList = filteredTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatNumber = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Crops Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/crops')}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              <CogIcon className="h-5 w-5" aria-hidden="true" />
              <span>Manage Crops</span>
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
              <h2 className="text-lg font-semibold text-gray-700">Total Crops</h2>
              <p className="text-2xl font-bold text-gray-900">{totalCrops}</p>
            </div>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 flex items-center gap-4 transform hover:scale-105 transition-transform">
            <div className="bg-blue-100 p-3 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Total Cost of Care ($)</h2>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalCostOfCare)}</p>
            </div>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 flex items-center gap-4 transform hover:scale-105 transition-transform">
            <div className="bg-yellow-100 p-3 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Total Sales ($)</h2>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalSales)}</p>
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
            {/* Cost Breakdown by Crop Type */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Cost Breakdown by Crop Type</h2>
              {cropTypes.length > 0 ? (
                <div className="h-80">
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
                              `${context.label}: ${formatNumber(context.raw as number)} $`,
                          },
                        },
                      },
                    }}
                    aria-label="Pie chart showing cost breakdown by crop type"
                  />
                </div>
              ) : (
                <p className="text-gray-500 text-center">No crop cost data available for chart.</p>
              )}
            </div>

            {/* Sales Breakdown by Crop Type */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Sales Breakdown by Crop Type</h2>
              {cropTypes.length > 0 && salesByCropType.some((value) => value > 0) ? (
                <div className="h-80">
                  <Pie
                    data={salesPieChartData}
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
                              `${context.label}: ${formatNumber(context.raw as number)} $`,
                          },
                        },
                      },
                    }}
                    aria-label="Pie chart showing sales breakdown by crop type"
                  />
                </div>
              ) : (
                <p className="text-gray-500 text-center">No sales data available for chart.</p>
              )}
            </div>
          </div>

          {/* Row 2: Combined Costs and Sales Over Time (Full Width) */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Costs and Sales Over Time</h2>
            <div className="h-80">
              <Line
                data={combinedLineChartData}
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
                          `${context.dataset.label}: ${formatNumber(context.raw as number)} $`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Amount ($)',
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
                aria-label="Line chart showing costs and sales over the past 12 months"
              />
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Recent Transactions</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setTransactionFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  transactionFilter === 'all' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Transactions
              </button>
              <button
                onClick={() => setTransactionFilter('cost')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  transactionFilter === 'cost' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Costs
              </button>
              <button
                onClick={() => setTransactionFilter('sale')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  transactionFilter === 'sale' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Sales
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-gray-500 text-center">Loading transactions...</p>
          ) : recentTransactionsList.length === 0 ? (
            <p className="text-gray-500 text-center">No recent transactions.</p>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full table-auto border-collapse"
                aria-label="Recent crop transactions"
              >
                <thead>
                  <tr className="bg-yellow-600 text-white">
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Type</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Transaction ID</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Crop Type</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Details</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Amount ($)</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Date</th>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactionsList.map((transaction, index) => {
                    const details =
                      transaction.type === 'Cost'
                        ? `Cost Type: ${(transaction as CostTransaction).cost_type}`
                        : `Quantity: ${(transaction as SaleTransaction).quantity}, Cost/Unit: $${formatNumber(
                            (transaction as SaleTransaction).cost_per_unit_at_sale
                          )}`;
                    return (
                      <tr
                        key={`${transaction.type}-${transaction.id}`}
                        className={`border-b ${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <td className="px-4 py-2">{transaction.type}</td>
                        <td className="px-4 py-2">{transaction.id}</td>
                        <td className="px-4 py-2">{transaction.crop_type}</td>
                        <td className="px-4 py-2">{details}</td>
                        <td className="px-4 py-2">{formatNumber(transaction.amount)}</td>
                        <td className="px-4 py-2">{new Date(transaction.date).toLocaleDateString()}</td>
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