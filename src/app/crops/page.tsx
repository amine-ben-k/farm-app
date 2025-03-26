'use client';

import { useEffect, useState } from 'react';
import { CurrencyDollarIcon, PencilIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/Layout';

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

export default function CropsPage() {
  const [crops, setCrops] = useState<CropType[]>([]);
  const [costs, setCosts] = useState<CropCost[]>([]);
  const [sales, setSales] = useState<CropSale[]>([]);
  const [newCrop, setNewCrop] = useState({
    type: '',
    quantity: 0,
    growth_stage: '',
  });
  const [editCrop, setEditCrop] = useState<CropType | null>(null);
  const [addCost, setAddCost] = useState<CropType | null>(null);
  const [costDetails, setCostDetails] = useState({
    cost_type: 'Water',
    amount: 0,
    notes: '',
  });
  const [sellCrop, setSellCrop] = useState<CropType | null>(null);
  const [saleDetails, setSaleDetails] = useState({ quantity: 0, sale_price: 0, notes: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNewCrop, setIsNewCrop] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!newCrop.type || newCrop.quantity < 0) {
      setError('Please provide a valid crop type and quantity (non-negative)');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCrop),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add crop');
      }

      await fetchData();
      setNewCrop({ type: '', quantity: 0, growth_stage: '' });
      setIsNewCrop(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add crop');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCrop) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/crops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editCrop.type,
          total_cost_of_care: editCrop.total_cost_of_care,
          growth_stage: editCrop.growth_stage,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update crop');
      }

      await fetchData();
      setEditCrop(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update crop');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCost) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/crop-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_id: addCost.id,
          cost_type: costDetails.cost_type,
          amount: costDetails.amount,
          notes: costDetails.notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record cost');
      }

      await fetchData();
      setAddCost(null);
      setCostDetails({ cost_type: 'Water', amount: 0, notes: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to record cost');
    } finally {
      setLoading(false);
    }
  };

  const handleSellCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellCrop) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/crop-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_id: sellCrop.id,
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
      setSellCrop(null);
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
      const res = await fetch('/api/crop-sales', {
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

  const handleCropSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCrop = e.target.value;
    if (selectedCrop === 'new') {
      setNewCrop({ ...newCrop, type: '' });
      setIsNewCrop(true);
    } else {
      setNewCrop({ ...newCrop, type: selectedCrop });
      setIsNewCrop(false);
    }
  };

  // Calculate total sales for each crop
  const getTotalSales = (cropId: number) => {
    return sales
      .filter((sale) => sale.crop_id === cropId)
      .reduce((sum, sale) => sum + sale.sale_price, 0);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800">Manage Crops</h1>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            {error}
          </div>
        )}

        {/* Add Crop Form */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Crops</h2>
          <form onSubmit={handleAddCrop} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 font-medium mb-1">Type</label>
              <select
                value={isNewCrop ? 'new' : newCrop.type}
                onChange={handleCropSelectChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Type</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.type}>
                    {c.type}
                  </option>
                ))}
                <option value="new">Add New Type</option>
              </select>
              {isNewCrop && (
                <input
                  type="text"
                  placeholder="Enter new type (e.g., Wheat)"
                  value={newCrop.type}
                  onChange={(e) => setNewCrop({ ...newCrop, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-gray-600 font-medium mb-1">Quantity</label>
              <input
                type="number"
                placeholder="e.g., 100"
                value={newCrop.quantity}
                onChange={(e) => setNewCrop({ ...newCrop, quantity: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 font-medium mb-1">Growth Stage (Optional)</label>
              <select
                value={newCrop.growth_stage}
                onChange={(e) => setNewCrop({ ...newCrop, growth_stage: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Growth Stage</option>
                <option value="Seedling">Seedling</option>
                <option value="Vegetative">Vegetative</option>
                <option value="Flowering">Flowering</option>
                <option value="Harvesting">Harvesting</option>
                <option value="Dormant">Dormant</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Add Crops'}
              </button>
            </div>
          </form>
        </div>

        {/* Edit Growth Stage Form */}
        {editCrop && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Edit Growth Stage for {editCrop.type}</h2>
            <form onSubmit={handleEditCrop} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Growth Stage</label>
                <select
                  value={editCrop.growth_stage || ''}
                  onChange={(e) => setEditCrop({ ...editCrop, growth_stage: e.target.value || null })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Growth Stage</option>
                  <option value="Seedling">Seedling</option>
                  <option value="Vegetative">Vegetative</option>
                  <option value="Flowering">Flowering</option>
                  <option value="Harvesting">Harvesting</option>
                  <option value="Dormant">Dormant</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Processing...' : 'Update Growth Stage'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditCrop(null)}
                  className="w-full bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Cost Form */}
        {addCost && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Record Cost for {addCost.type}</h2>
            <form onSubmit={handleAddCost} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Cost Type</label>
                <select
                  value={costDetails.cost_type}
                  onChange={(e) => setCostDetails({ ...costDetails, cost_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="Water">Water</option>
                  <option value="Medicines">Medicines</option>
                  <option value="Fertilizers">Fertilizers</option>
                  <option value="Labor">Labor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Amount ($)</label>
                <input
                  type="number"
                  placeholder="e.g., 100.00"
                  value={costDetails.amount}
                  onChange={(e) => setCostDetails({ ...costDetails, amount: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Watering for March"
                  value={costDetails.notes}
                  onChange={(e) => setCostDetails({ ...costDetails, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  {loading ? 'Processing...' : 'Record Cost'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddCost(null);
                    setCostDetails({ cost_type: 'Water', amount: 0, notes: '' });
                  }}
                  className="w-full bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sell Crops Form */}
        {sellCrop && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Sell Crops ({sellCrop.type})</h2>
            <form onSubmit={handleSellCrop} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Quantity to Sell</label>
                <input
                  type="number"
                  placeholder="e.g., 50"
                  value={saleDetails.quantity}
                  onChange={(e) => setSaleDetails({ ...saleDetails, quantity: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Total Sale Price ($)</label>
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
                  placeholder="e.g., Sold to Market A"
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
                    setSellCrop(null);
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

        {/* Summary by Crop Type */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Summary by Crop Type</h2>
          {loading ? (
            <p className="text-gray-500">Loading summary...</p>
          ) : crops.length === 0 ? (
            <p className="text-gray-500">No crops added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Quantity</th>
                    <th className="px-4 py-2 text-left">Growth Stage</th>
                    <th className="px-4 py-2 text-left">Total Cost of Care ($)</th>
                    <th className="px-4 py-2 text-left">Total Sales ($)</th>
                    <th className="px-4 py-2 text-left">Profit ($)</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {crops.map((crop, index) => {
                    const totalSales = getTotalSales(crop.id);
                    const profit = totalSales - crop.total_cost_of_care;
                    return (
                      <tr key={crop.id} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                        <td className="px-4 py-2">{crop.type}</td>
                        <td className="px-4 py-2">{crop.quantity}</td>
                        <td className="px-4 py-2">{crop.growth_stage || 'N/A'}</td>
                        <td className="px-4 py-2">{crop.total_cost_of_care.toFixed(2)}</td>
                        <td className="px-4 py-2">{totalSales.toFixed(2)}</td>
                        <td className="px-4 py-2" style={{ color: profit >= 0 ? 'green' : 'red' }}>
                          {profit.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => setEditCrop(crop)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Growth Stage"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setAddCost(crop)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Add Cost"
                          >
                            <CurrencyDollarIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setSellCrop(crop)}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Sell Crops"
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

        {/* Cost History */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Cost History</h2>
          {loading ? (
            <p className="text-gray-500">Loading costs...</p>
          ) : costs.length === 0 ? (
            <p className="text-gray-500">No costs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-4 py-2 text-left">Cost ID</th>
                    <th className="px-4 py-2 text-left">Crop Type</th>
                    <th className="px-4 py-2 text-left">Cost Type</th>
                    <th className="px-4 py-2 text-left">Amount ($)</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map((cost, index) => (
                    <tr key={cost.id} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                      <td className="px-4 py-2">{cost.id}</td>
                      <td className="px-4 py-2">{cost.type}</td>
                      <td className="px-4 py-2">{cost.cost_type}</td>
                      <td className="px-4 py-2">{cost.amount.toFixed(2)}</td>
                      <td className="px-4 py-2">{new Date(cost.cost_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{cost.notes || 'N/A'}</td>
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
                    <th className="px-4 py-2 text-left">Crop Type</th>
                    <th className="px-4 py-2 text-left">Quantity Sold</th>
                    <th className="px-4 py-2 text-left">Sale Price ($)</th>
                    <th className="px-4 py-2 text-left">Cost per Unit ($)</th>
                    <th className="px-4 py-2 text-left">Profit ($)</th>
                    <th className="px-4 py-2 text-left">Sale Date</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, index) => {
                    const totalCostForSale = sale.cost_per_unit_at_sale * sale.quantity;
                    const profit = sale.sale_price - totalCostForSale;
                    return (
                      <tr key={sale.id} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                        <td className="px-4 py-2">{sale.id}</td>
                        <td className="px-4 py-2">{sale.type}</td>
                        <td className="px-4 py-2">{sale.quantity}</td>
                        <td className="px-4 py-2">{sale.sale_price.toFixed(2)}</td>
                        <td className="px-4 py-2">{sale.cost_per_unit_at_sale.toFixed(2)}</td>
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