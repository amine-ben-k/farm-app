'use client';

import { useEffect, useState } from 'react';
import { CurrencyDollarIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import Layout from '../../../components/Layout';

interface AnimalType {
  type: string;
  quantity: number;
  initial_quantity: number;
  total_cost_of_living: number;
  total_sales: number;
}

interface AnimalSale {
  id: number;
  type: string;
  quantity: number;
  sale_price: number;
  sale_date: string;
  notes: string | null;
  cost_per_unit: number;
}

interface CostOfLivingEntry {
  id: number;
  type: string;
  cost: number;
  month: string;
  recorded_at: string;
}

export default function AnimalsPage() {
  const [types, setTypes] = useState<AnimalType[]>([]);
  const [sales, setSales] = useState<AnimalSale[]>([]);
  const [costHistory, setCostHistory] = useState<CostOfLivingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<
    'addType' | 'addMore' | 'recordSale' | 'recordLoss' | 'addCost' | 'resetCost' | ''
  >('');
  const [formData, setFormData] = useState({
    type: '',
    quantity: 0,
    sale_price: 0,
    notes: '',
    cost: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/animal-types');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setTypes(data.types || []);
      setSales(data.sales || []);
      setCostHistory(data.costHistory || []);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (action === 'addType') {
        if (!formData.type || formData.quantity <= 0) {
          throw new Error('Please provide a valid animal type and a positive quantity');
        }

        const res = await fetch('/api/animal-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            quantity: formData.quantity,
            initial_quantity: formData.quantity,
            total_cost_of_living: 0,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to add animal type');
        }
      } else if (action === 'addMore') {
        if (!formData.type || formData.quantity <= 0) {
          throw new Error('Please select an animal type and provide a positive quantity');
        }

        const selectedType = types.find((t) => t.type === formData.type);
        if (!selectedType) throw new Error('Selected animal type not found');

        const newQuantity = selectedType.quantity + formData.quantity;
        const newInitialQuantity = selectedType.initial_quantity + formData.quantity;

        const res = await fetch('/api/animal-types', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            quantity: newQuantity,
            initial_quantity: newInitialQuantity,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to add more animals');
        }
      } else if (action === 'recordSale') {
        if (!formData.type || formData.quantity <= 0 || formData.sale_price <= 0) {
          throw new Error('Please select an animal type, provide a positive quantity, and a positive sale price');
        }

        const selectedType = types.find((t) => t.type === formData.type);
        if (!selectedType) throw new Error('Selected animal type not found');

        const costPerUnit =
          selectedType.initial_quantity > 0
            ? selectedType.total_cost_of_living / selectedType.initial_quantity
            : 0;

        const res = await fetch('/api/animal-sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            quantity: formData.quantity,
            sale_price: formData.sale_price,
            notes: formData.notes,
            cost_per_unit: costPerUnit,
            isLoss: false,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to record sale');
        }
      } else if (action === 'recordLoss') {
        if (!formData.type || formData.quantity <= 0) {
          throw new Error('Please select an animal type and provide a positive quantity');
        }

        const res = await fetch('/api/animal-sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            quantity: formData.quantity,
            notes: formData.notes,
            isLoss: true,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to record loss');
        }
      } else if (action === 'addCost') {
        if (!formData.type || formData.cost <= 0) {
          throw new Error('Please select an animal type and provide a positive cost');
        }

        const selectedType = types.find((t) => t.type === formData.type);
        if (!selectedType) throw new Error('Selected animal type not found');

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const newTotalCostOfLiving = selectedType.total_cost_of_living + formData.cost;

        const res = await fetch('/api/animal-types', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            total_cost_of_living: newTotalCostOfLiving,
            cost_of_living_entry: {
              cost: formData.cost,
              month: currentMonth,
            },
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to add cost of living');
        }
      } else if (action === 'resetCost') {
        if (!formData.type) {
          throw new Error('Please select an animal type');
        }

        const res = await fetch('/api/animal-types', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: formData.type,
            total_cost_of_living: 0,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to reset cost of living');
        }
      }

      await fetchData();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async (type: string) => {
    if (!confirm(`Are you sure you want to delete the animal type "${type}"? This will also delete all associated sales and cost history.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/animal-types?type=${encodeURIComponent(type)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete animal type');
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete animal type');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSales = async () => {
    if (!confirm('Are you sure you want to reset all sales? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/animal-sales', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to reset sales');
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to reset sales');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAction('');
    setFormData({
      type: '',
      quantity: 0,
      sale_price: 0,
      notes: '',
      cost: 0,
    });
  };

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Manage Animals</h1>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            {error}
          </div>
        )}

        {/* Unified Action Form */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Perform an Action</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-600 font-medium mb-1">Action</label>
              <select
                value={action}
                onChange={(e) =>
                  setAction(e.target.value as 'addType' | 'addMore' | 'recordSale' | 'recordLoss' | 'addCost' | 'resetCost' | '')
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select an Action</option>
                <option value="addType">Add New Animal Type</option>
                <option value="addMore">Add More Animals</option>
                <option value="recordSale">Record a Sale</option>
                <option value="recordLoss">Record a Loss (Dead/Lost)</option>
                <option value="addCost">Add Cost of Living (Current Month)</option>
                <option value="resetCost">Reset Cost of Living</option>
              </select>
            </div>

            {(action === 'addMore' || action === 'recordSale' || action === 'recordLoss' || action === 'addCost' || action === 'resetCost') && (
              <div>
                <label className="block text-gray-600 font-medium mb-1">Animal Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Type</option>
                  {types.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {action === 'addType' && (
              <div>
                <label className="block text-gray-600 font-medium mb-1">New Animal Type</label>
                <input
                  type="text"
                  placeholder="e.g., Sheep"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            )}

            {(action === 'addType' || action === 'addMore' || action === 'recordSale' || action === 'recordLoss') && (
              <div>
                <label className="block text-gray-600 font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="e.g., 10"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="1"
                  required
                />
              </div>
            )}

            {action === 'recordSale' && (
              <>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Total Sale Price (TND)</label>
                  <input
                    type="number"
                    placeholder="e.g., 1000.00"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Sold to Ahmed"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </>
            )}

            {(action === 'recordLoss') && (
              <div>
                <label className="block text-gray-600 font-medium mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Died due to illness"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {action === 'addCost' && (
              <div>
                <label className="block text-gray-600 font-medium mb-1">Cost of Living (TND) for {currentMonth}</label>
                <input
                  type="number"
                  placeholder="e.g., 500.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            )}

            {action && (
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 bg-green-600 text-white font-medium py-2 rounded-md hover:bg-green-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Processing...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Summary by Type */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Summary by Type</h2>
          {loading ? (
            <p className="text-gray-500">Loading summary...</p>
          ) : types.length === 0 ? (
            <p className="text-gray-500">No animal types added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Quantity</th>
                    <th className="px-4 py-2 text-left">Total Cost of Living (TND)</th>
                    <th className="px-4 py-2 text-left">Cost per Unit (TND)</th>
                    <th className="px-4 py-2 text-left">Total Sales (TND)</th>
                    <th className="px-4 py-2 text-left">Profit (TND)</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((type, index) => {
                    const totalCost = type.total_cost_of_living;
                    const costPerUnit =
                      type.initial_quantity > 0 ? totalCost / type.initial_quantity : 0;
                    const profit = type.total_sales - totalCost;
                    return (
                      <tr
                        key={type.type}
                        className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}
                      >
                        <td className="px-4 py-2">{type.type}</td>
                        <td className="px-4 py-2">{type.quantity}</td>
                        <td className="px-4 py-2">{totalCost.toFixed(2)}</td>
                        <td className="px-4 py-2">{costPerUnit.toFixed(2)}</td>
                        <td className="px-4 py-2">{type.total_sales.toFixed(2)}</td>
                        <td className="px-4 py-2" style={{ color: profit >= 0 ? 'green' : 'red' }}>
                          {profit.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => handleDeleteType(type.type)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Type"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cost of Living History */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Cost of Living History</h2>
          {loading ? (
            <p className="text-gray-500">Loading cost history...</p>
          ) : costHistory.length === 0 ? (
            <p className="text-gray-500">No cost of living history recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Cost (TND)</th>
                    <th className="px-4 py-2 text-left">Month</th>
                    <th className="px-4 py-2 text-left">Recorded At</th>
                  </tr>
                </thead>
                <tbody>
                  {costHistory.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}
                    >
                      <td className="px-4 py-2">{entry.type}</td>
                      <td className="px-4 py-2">{entry.cost.toFixed(2)}</td>
                      <td className="px-4 py-2">{entry.month}</td>
                      <td className="px-4 py-2">{new Date(entry.recorded_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sales History */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Sales History</h2>
            {sales.length > 0 && (
              <button
                onClick={handleResetSales}
                disabled={loading}
                className={`bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Reset All Sales'}
              </button>
            )}
          </div>
          {loading ? (
            <p className="text-gray-500">Loading sales...</p>
          ) : sales.length === 0 ? (
            <p className="text-gray-500">No sales recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-yellow-600 text-white">
                    <th className="px-4 py-2 text-left">Sale ID</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Quantity Sold</th>
                    <th className="px-4 py-2 text-left">Sale Price (TND)</th>
                    <th className="px-4 py-2 text-left">Cost per Unit (TND)</th>
                    <th className="px-4 py-2 text-left">Profit (TND)</th>
                    <th className="px-4 py-2 text-left">Sale Date</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, index) => {
                    const totalCostForSale = sale.cost_per_unit * sale.quantity;
                    const profit = sale.sale_price - totalCostForSale;
                    return (
                      <tr
                        key={sale.id}
                        className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}
                      >
                        <td className="px-4 py-2">{sale.id}</td>
                        <td className="px-4 py-2">{sale.type}</td>
                        <td className="px-4 py-2">{sale.quantity}</td>
                        <td className="px-4 py-2">{sale.sale_price.toFixed(2)}</td>
                        <td className="px-4 py-2">{sale.cost_per_unit.toFixed(2)}</td>
                        <td className="px-4 py-2" style={{ color: profit >= 0 ? 'green' : 'red' }}>
                          {profit.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">{new Date(sale.sale_date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{sale.notes || 'N/A'}</td>
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