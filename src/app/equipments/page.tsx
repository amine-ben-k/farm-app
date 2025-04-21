'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { PencilIcon, TrashIcon, PlusIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/Layout';

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

export default function EquipmentsPage() {
  const router = useRouter(); // Initialize useRouter for navigation
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [transactions, setTransactions] = useState<EquipmentTransaction[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const [newEquipment, setNewEquipment] = useState({
    type: '',
    acquisition_type: 'Rented',
    acquisition_date: today,
    transaction_amount: '',
    notes: '',
  });
  const [editEquipment, setEditEquipment] = useState<Equipment | null>(null);
  const [rentalEquipment, setRentalEquipment] = useState<Equipment | null>(null);
  const [rentalDetails, setRentalDetails] = useState({
    transaction_date: today,
    amount: 0,
    notes: '',
  });
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<Equipment | null>(null);
  const [maintenanceCost, setMaintenanceCost] = useState(0);
  const [editTransaction, setEditTransaction] = useState<EquipmentTransaction | null>(null);

  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(false);
  const [showRecordRentalModal, setShowRecordRentalModal] = useState(false);
  const [showRecordMaintenanceModal, setShowRecordMaintenanceModal] = useState(false);
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/equipments');
      if (!res.ok) throw new Error('Failed to fetch equipment');
      const data = await res.json();
      setEquipments(data.equipments || []);
      setTransactions(data.transactions || []);
    } catch (err) {
      setError('Failed to fetch equipment. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!newEquipment.type || !newEquipment.acquisition_type) {
      setError('Please provide all required fields');
      setLoading(false);
      return;
    }

    const transactionAmount = newEquipment.transaction_amount ? Number(newEquipment.transaction_amount) : undefined;

    if (transactionAmount !== undefined && transactionAmount < 0) {
      setError('Transaction amount cannot be negative');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/equipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_equipment',
          type: newEquipment.type,
          acquisition_type: newEquipment.acquisition_type,
          acquisition_date: newEquipment.acquisition_date,
          transaction_amount: transactionAmount,
          notes: newEquipment.notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add equipment');
      }

      await fetchData();
      setNewEquipment({
        type: '',
        acquisition_type: 'Rented',
        acquisition_date: today,
        transaction_amount: '',
        notes: '',
      });
      setShowAddEquipmentModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEquipment) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/equipments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_equipment',
          id: editEquipment.id,
          type: editEquipment.type,
          acquisition_type: editEquipment.acquisition_type,
          acquisition_date: editEquipment.acquisition_date,
          notes: editEquipment.notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update equipment');
      }

      await fetchData();
      setEditEquipment(null);
      setShowEditEquipmentModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEquipment = async (id: number) => {
    if (!confirm('Are you sure you want to remove this equipment?')) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/equipments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove equipment');
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRentalCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentalEquipment) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/equipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_rental_cost',
          equipment_id: rentalEquipment.id,
          amount: rentalDetails.amount,
          transaction_date: rentalDetails.transaction_date,
          notes: rentalDetails.notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record rental cost');
      }

      await fetchData();
      setRentalEquipment(null);
      setRentalDetails({ transaction_date: today, amount: 0, notes: '' });
      setShowRecordRentalModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to record rental cost');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaintenanceCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceEquipment) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/equipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_maintenance_cost',
          equipment_id: maintenanceEquipment.id,
          amount: maintenanceCost,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record maintenance cost');
      }

      await fetchData();
      setMaintenanceEquipment(null);
      setMaintenanceCost(0);
      setShowRecordMaintenanceModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to record maintenance cost');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTransaction) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/equipments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_transaction',
          id: editTransaction.id,
          amount: editTransaction.amount,
          transaction_date: editTransaction.transaction_date,
          notes: editTransaction.notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update transaction');
      }

      await fetchData();
      setEditTransaction(null);
      setShowEditTransactionModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Helper function to format date to YYYY-MM-DD
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Manage Equipment</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/equipments/dashboard')} // Navigate to the dashboard
              className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <ChartBarIcon className="h-5 w-5" aria-hidden="true" />
              <span>View Dashboard</span>
            </button>
            <button
              onClick={() => setShowAddEquipmentModal(true)}
              className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              <span>Add New Equipment</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            {error}
            <button
              onClick={fetchData}
              className="ml-2 text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Add Equipment Modal */}
        {showAddEquipmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Add New Equipment</h2>
                <button
                  onClick={() => setShowAddEquipmentModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddEquipment} className="space-y-4">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Type</label>
                  <input
                    type="text"
                    placeholder="e.g., Tractor"
                    value={newEquipment.type}
                    onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Acquisition Type</label>
                  <select
                    value={newEquipment.acquisition_type}
                    onChange={(e) => setNewEquipment({ ...newEquipment, acquisition_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="Purchased">Purchased</option>
                    <option value="Rented">Rented</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Acquisition Date (defaults to today)</label>
                  <input
                    type="date"
                    value={newEquipment.acquisition_date}
                    onChange={(e) => setNewEquipment({ ...newEquipment, acquisition_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    {newEquipment.acquisition_type === 'Purchased' ? 'Purchase Cost (TND, optional)' : 'Initial Rental Cost (TND, optional)'}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 25000.00"
                    value={newEquipment.transaction_amount}
                    onChange={(e) => setNewEquipment({ ...newEquipment, transaction_amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Purchased from local dealer"
                    value={newEquipment.notes}
                    onChange={(e) => setNewEquipment({ ...newEquipment, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    {loading ? 'Processing...' : 'Add Equipment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddEquipmentModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Equipment Modal */}
        {showEditEquipmentModal && editEquipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Edit Equipment</h2>
                <button
                  onClick={() => setShowEditEquipmentModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEditEquipment} className="space-y-4">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Type</label>
                  <input
                    type="text"
                    value={editEquipment.type}
                    onChange={(e) => setEditEquipment({ ...editEquipment, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Acquisition Type</label>
                  <select
                    value={editEquipment.acquisition_type}
                    onChange={(e) => setEditEquipment({ ...editEquipment, acquisition_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="Purchased">Purchased</option>
                    <option value="Rented">Rented</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Acquisition Date</label>
                  <input
                    type="date"
                    value={formatDateForInput(editEquipment.acquisition_date)}
                    onChange={(e) => setEditEquipment({ ...editEquipment, acquisition_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={editEquipment.notes || ''}
                    onChange={(e) => setEditEquipment({ ...editEquipment, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Processing...' : 'Update Equipment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditEquipmentModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Record Rental Cost Modal */}
        {showRecordRentalModal && rentalEquipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Record Rental Cost for {rentalEquipment.type}</h2>
                <button
                  onClick={() => setShowRecordRentalModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddRentalCost} className="space-y-4">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Rental Date (defaults to today)</label>
                  <input
                    type="date"
                    value={rentalDetails.transaction_date}
                    onChange={(e) => setRentalDetails({ ...rentalDetails, transaction_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Rental Cost (TND/day)</label>
                  <input
                    type="number"
                    placeholder="e.g., 200.00"
                    value={rentalDetails.amount}
                    onChange={(e) => setRentalDetails({ ...rentalDetails, amount: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Rented for plowing"
                    value={rentalDetails.notes}
                    onChange={(e) => setRentalDetails({ ...rentalDetails, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 bg-yellow-600 text-white font-medium py-2 rounded-md hover:bg-yellow-700 transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Processing...' : 'Record Rental Cost'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecordRentalModal(false);
                      setRentalDetails({ transaction_date: today, amount: 0, notes: '' });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Record Maintenance Cost Modal */}
        {showRecordMaintenanceModal && maintenanceEquipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Record Maintenance Cost for {maintenanceEquipment.type}</h2>
                <button
                  onClick={() => setShowRecordMaintenanceModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddMaintenanceCost} className="space-y-4">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Maintenance Cost (TND)</label>
                  <input
                    type="number"
                    placeholder="e.g., 150.00"
                    value={maintenanceCost}
                    onChange={(e) => setMaintenanceCost(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 bg-yellow-600 text-white font-medium py-2 rounded-md hover:bg-yellow-700 transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Processing...' : 'Record Maintenance Cost'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecordMaintenanceModal(false);
                      setMaintenanceCost(0);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {showEditTransactionModal && editTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Edit Transaction for {equipments.find((e) => e.id === editTransaction.equipment_id)?.type || 'Unknown'}
                </h2>
                <button
                  onClick={() => setShowEditTransactionModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEditTransaction} className="space-y-4">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={formatDateForInput(editTransaction.transaction_date)}
                    onChange={(e) => setEditTransaction({ ...editTransaction, transaction_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Amount (TND)</label>
                  <input
                    type="number"
                    value={editTransaction.amount}
                    onChange={(e) => setEditTransaction({ ...editTransaction, amount: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={editTransaction.notes || ''}
                    onChange={(e) => setEditTransaction({ ...editTransaction, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Processing...' : 'Update Transaction'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditTransactionModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Equipment List */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Equipment List</h2>
          {loading ? (
            <p className="text-gray-500">Loading equipment...</p>
          ) : equipments.length === 0 ? (
            <p className="text-gray-500">No equipment added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Acquisition Type</th>
                    <th className="px-4 py-2 text-left">Acquisition Date</th>
                    <th className="px-4 py-2 text-left">Transaction Cost (TND)</th>
                    <th className="px-4 py-2 text-left">Maintenance Cost (TND)</th>
                    <th className="px-4 py-2 text-left">Total Cost (TND)</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.map((equipment, index) => (
                    <tr key={equipment.id} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                      <td className="px-4 py-2">{equipment.id}</td>
                      <td className="px-4 py-2">{equipment.type}</td>
                      <td className="px-4 py-2">{equipment.acquisition_type}</td>
                      <td className="px-4 py-2">{new Date(equipment.acquisition_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{formatNumber(equipment.total_transaction_cost)}</td>
                      <td className="px-4 py-2">{equipment.acquisition_type === 'Purchased' ? formatNumber(equipment.maintenance_cost) : 'N/A'}</td>
                      <td className="px-4 py-2">{formatNumber(equipment.total_transaction_cost + (equipment.acquisition_type === 'Purchased' ? equipment.maintenance_cost : 0))}</td>
                      <td className="px-4 py-2">{equipment.notes || 'N/A'}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          onClick={() => {
                            setEditEquipment(equipment);
                            setShowEditEquipmentModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Equipment"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {equipment.acquisition_type === 'Rented' ? (
                          <button
                            onClick={() => {
                              setRentalEquipment(equipment);
                              setShowRecordRentalModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Record Rental Cost"
                          >
                            <CurrencyDollarIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setMaintenanceEquipment(equipment);
                              setShowRecordMaintenanceModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Record Maintenance Cost"
                          >
                            <CurrencyDollarIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveEquipment(equipment.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove Equipment"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Transaction History</h2>
          {loading ? (
            <p className="text-gray-500">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-yellow-600 text-white">
                    <th className="px-4 py-2 text-left">Transaction ID</th>
                    <th className="px-4 py-2 text-left">Equipment Type</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Amount (TND)</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => {
                    const equipment = equipments.find((e) => e.id === transaction.equipment_id);
                    return (
                      <tr key={transaction.id} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                        <td className="px-4 py-2">{transaction.id}</td>
                        <td className="px-4 py-2">{equipment?.type || 'Unknown'}</td>
                        <td className="px-4 py-2">{transaction.transaction_type}</td>
                        <td className="px-4 py-2">{formatNumber(transaction.amount)}</td>
                        <td className="px-4 py-2">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{transaction.notes || 'N/A'}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => {
                              setEditTransaction(transaction);
                              setShowEditTransactionModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Transaction"
                          >
                            <PencilIcon className="h-5 w-5" />
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

        {/* Cost Summary */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Cost Summary</h2>
          {loading ? (
            <p className="text-gray-500">Loading summary...</p>
          ) : equipments.length === 0 ? (
            <p className="text-gray-500">No equipment added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Total Cost (TND)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-gray-50 hover:bg-gray-100">
                    <td className="px-4 py-2 font-medium">Total Equipment Cost</td>
                    <td className="px-4 py-2">
                      {formatNumber(
                        equipments.reduce(
                          (sum, equipment) =>
                            sum + equipment.total_transaction_cost + (equipment.acquisition_type === 'Purchased' ? equipment.maintenance_cost : 0),
                          0
                        )
                      )}
                    </td>
                  </tr>
                  {[...new Set(equipments.map((e) => e.type))].map((type, index) => (
                    <tr key={type} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                      <td className="px-4 py-2">Type: {type}</td>
                      <td className="px-4 py-2">
                        {formatNumber(
                          equipments
                            .filter((e) => e.type === type)
                            .reduce(
                              (sum, e) => sum + e.total_transaction_cost + (e.acquisition_type === 'Purchased' ? e.maintenance_cost : 0),
                              0
                            )
                        )}
                      </td>
                    </tr>
                  ))}
                  {[...new Set(equipments.map((e) => e.acquisition_type))].map((acquisition_type, index) => (
                    <tr key={acquisition_type} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                      <td className="px-4 py-2">Acquisition Type: {acquisition_type}</td>
                      <td className="px-4 py-2">
                        {formatNumber(
                          equipments
                            .filter((e) => e.acquisition_type === acquisition_type)
                            .reduce(
                              (sum, e) => sum + e.total_transaction_cost + (e.acquisition_type === 'Purchased' ? e.maintenance_cost : 0),
                              0
                            )
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b bg-gray-50 hover:bg-gray-100">
                    <td className="px-4 py-2">Total Maintenance Cost (Purchased Equipment)</td>
                    <td className="px-4 py-2">
                      {formatNumber(
                        equipments
                          .filter((e) => e.acquisition_type === 'Purchased')
                          .reduce((sum, e) => sum + e.maintenance_cost, 0)
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}