'use client';

import { useEffect, useState } from 'react';
import { CurrencyDollarIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/Layout';

interface AnimalType {
  type: string;
  quantity: number;
  total_purchase_cost: number;
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

export default function AnimalsPage() {
  const [types, setTypes] = useState<AnimalType[]>([]);
  const [sales, setSales] = useState<AnimalSale[]>([]);
  const [newType, setNewType] = useState({
    type: '',
    quantity: 0,
    total_purchase_cost: 0,
    total_cost_of_living: 0,
  });
  const [editType, setEditType] = useState<AnimalType | null>(null);
  const [sellType, setSellType] = useState<AnimalType | null>(null);
  const [saleDetails, setSaleDetails] = useState({ quantity: 0, sale_price: 0, notes: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNewType, setIsNewType] = useState(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false); // New state for modal

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
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!newType.type || newType.quantity < 0) {
      setError('Please provide a valid animal type and quantity (non-negative)');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/animal-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add animal type');
      }

      await fetchData();
      setNewType({ type: '', quantity: 0, total_purchase_cost: 0, total_cost_of_living: 0 });
      setIsNewType(false);
      setShowAddTypeModal(false); // Close the modal
    } catch (err: any) {
      setError(err.message || 'Failed to add animal type');
    } finally {
      setLoading(false);
    }
  };

  const handleEditType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editType) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/animal-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editType.type,
          total_purchase_cost: editType.total_purchase_cost,
          total_cost_of_living: editType.total_cost_of_living,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update animal type');
      }

      await fetchData();
      setEditType(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update animal type');
    } finally {
      setLoading(false);
    }
  };

  const handleSellType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellType) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/animal-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: sellType.type,
          quantity: saleDetails.quantity,
          sale_price: saleDetails.sale_price,
          notes: saleDetails.notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record sale');
      }

      await fetchData();
      setSellType(null);
      setSaleDetails({ quantity: 0, sale_price: 0, notes: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to record sale');
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

  const handleTypeSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value;
    if (selectedType === 'new') {
      setNewType({ ...newType, type: '' });
      setIsNewType(true);
    } else {
      setNewType({ ...newType, type: selectedType });
      setIsNewType(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Manage Animals</h1>
          <button
            onClick={() => setShowAddTypeModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add New Animal Type
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            {error}
          </div>
        )}

        {/* Add Animal Type Modal */}
        {showAddTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Add New Animal Type</h2>
                <button
                  onClick={() => setShowAddTypeModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddType} className="space-y-4">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Type</label>
                  <select
                    value={isNewType ? 'new' : newType.type}
                    onChange={handleTypeSelectChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Type</option>
                    {types.map((t) => (
                      <option key={t.type} value={t.type}>
                        {t.type}
                      </option>
                    ))}
                    <option value="new">Add New Type</option>
                  </select>
                  {isNewType && (
                    <input
                      type="text"
                      placeholder="Enter new type (e.g., Sheep)"
                      value={newType.type}
                      onChange={(e) => setNewType({ ...newType, type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    placeholder="e.g., 10"
                    value={newType.quantity}
                    onChange={(e) => setNewType({ ...newType, quantity: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Total Purchase Cost (TND) (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g., 2000.00"
                    value={newType.total_purchase_cost}
                    onChange={(e) => setNewType({ ...newType, total_purchase_cost: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Total Cost of Living (TND) (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g., 500.00"
                    value={newType.total_cost_of_living}
                    onChange={(e) => setNewType({ ...newType, total_cost_of_living: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 bg-green-600 text-white font-medium py-2 rounded-md hover:bg-green-700 transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Processing...' : 'Add Animal Type'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTypeModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Costs Form */}
        {editType && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Edit Costs for {editType.type}</h2>
            <form onSubmit={handleEditType} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Total Purchase Cost (TND)</label>
                <input
                  type="number"
                  value={editType.total_purchase_cost}
                  onChange={(e) =>
                    setEditType({ ...editType, total_purchase_cost: Number(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Total Cost of Living (TND)</label>
                <input
                  type="number"
                  value={editType.total_cost_of_living}
                  onChange={(e) =>
                    setEditType({ ...editType, total_cost_of_living: Number(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  step="0.01"
                />
              </div>
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Processing...' : 'Update Costs'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditType(null)}
                  className="w-full bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sell Animals Form */}
        {sellType && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Sell Animals ({sellType.type})</h2>
            <form onSubmit={handleSellType} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Quantity to Sell</label>
                <input
                  type="number"
                  placeholder="e.g., 5"
                  value={saleDetails.quantity}
                  onChange={(e) => setSaleDetails({ ...saleDetails, quantity: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Total Sale Price (TND)</label>
                <input
                  type="number"
                  placeholder="e.g., 1000.00"
                  value={saleDetails.sale_price}
                  onChange={(e) => setSaleDetails({ ...saleDetails, sale_price: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Sold to Ahmed"
                  value={saleDetails.notes}
                  onChange={(e) => setSaleDetails({ ...saleDetails, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-yellow-600 text-white font-semibold py-2 rounded-lg hover:bg-yellow-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Processing...' : 'Record Sale'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSellType(null);
                    setSaleDetails({ quantity: 0, sale_price: 0, notes: '' });
                  }}
                  className="w-full bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

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
                    <th className="px-4 py-2 text-left">Total Purchase Cost (TND)</th>
                    <th className="px-4 py-2 text-left">Total Cost of Living (TND)</th>
                    <th className="px-4 py-2 text-left">Total Cost (TND)</th>
                    <th className="px-4 py-2 text-left">Total Sales (TND)</th>
                    <th className="px-4 py-2 text-left">Profit (TND)</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((type, index) => {
                    const totalCost = type.total_purchase_cost + type.total_cost_of_living;
                    const profit = type.total_sales - totalCost;
                    return (
                      <tr key={type.type} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                        <td className="px-4 py-2">{type.type}</td>
                        <td className="px-4 py-2">{type.quantity}</td>
                        <td className="px-4 py-2">{type.total_purchase_cost.toFixed(2)}</td>
                        <td className="px-4 py-2">{type.total_cost_of_living.toFixed(2)}</td>
                        <td className="px-4 py-2">{totalCost.toFixed(2)}</td>
                        <td className="px-4 py-2">{type.total_sales.toFixed(2)}</td>
                        <td className="px-4 py-2" style={{ color: profit >= 0 ? 'green' : 'red' }}>
                          {profit.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => setEditType(type)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Costs"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setSellType(type)}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Sell Animals"
                          >
                            <CurrencyDollarIcon className="h-5 w-5" />
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
                      <tr key={sale.id} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
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