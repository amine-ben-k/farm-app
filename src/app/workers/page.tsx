'use client';

import { useEffect, useState } from 'react';
import { CurrencyDollarIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/Layout';

interface Worker {
  id: number;
  name: string;
  role_id: number;
  role_name: string;
  payment_type: string;
  payment_rate: number;
  responsibility_area: string | null;
  notes: string | null;
  total_payments: number;
}

interface SalaryPayment {
  id: number;
  worker_id: number;
  worker_name: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  task_description: string | null;
  notes: string | null;
}

interface ResponsibilityArea {
  name: string;
  description: string | null;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [responsibilityAreas, setResponsibilityAreas] = useState<ResponsibilityArea[]>([]);
  const [roles, setRoles] = useState<Role[]>([]); // New state for roles
  const [newWorker, setNewWorker] = useState({
    name: '',
    role_id: 0,
    payment_type: 'Monthly',
    payment_rate: 0,
    responsibility_area: '',
    notes: '',
  });
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [payWorker, setPayWorker] = useState<Worker | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 0,
    payment_date: '',
    task_description: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true); // New state for loading roles
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [isNewRole, setIsNewRole] = useState(false); // New state for adding a new role
  const [newRoleName, setNewRoleName] = useState(''); // New state for new role name

  useEffect(() => {
    fetchData();
    fetchResponsibilityAreas();
    fetchRoles();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/workers');
      if (!res.ok) throw new Error('Failed to fetch workers');
      const data = await res.json();
      setWorkers(data.workers || []);
      setPayments(data.payments || []);
    } catch (err) {
      setError('Failed to fetch workers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResponsibilityAreas = async () => {
    setLoadingAreas(true);
    setError(null);
    try {
      const res = await fetch('/api/responsibility-areas');
      if (!res.ok) throw new Error('Failed to fetch responsibility areas');
      const data = await res.json();
      setResponsibilityAreas(data.areas || []);
    } catch (err) {
      console.error('Failed to fetch responsibility areas:', err);
      setError('Failed to load responsibility areas.');
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    setError(null);
    try {
      const res = await fetch('/api/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setError('Failed to load roles.');
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName) {
      setError('Role name is required');
      return;
    }

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName, description: null }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add role');
      }

      const data = await res.json();
      const newRole = data.role;
      setRoles([...roles, newRole]);
      setNewWorker({ ...newWorker, role_id: newRole.id });
      setIsNewRole(false);
      setNewRoleName('');
    } catch (err: any) {
      setError(err.message || 'Failed to add role');
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!newWorker.name || !newWorker.role_id || newWorker.payment_rate < 0) {
      setError('Please provide a valid name, role, and payment rate (non-negative)');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorker),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add worker');
      }

      await fetchData();
      setNewWorker({ name: '', role_id: 0, payment_type: 'Monthly', payment_rate: 0, responsibility_area: '', notes: '' });
      setShowAddWorkerModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add worker');
    } finally {
      setLoading(false);
    }
  };

  const handleEditWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWorker) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editWorker.id,
          name: editWorker.name,
          role_id: editWorker.role_id,
          payment_type: editWorker.payment_type,
          payment_rate: editWorker.payment_rate,
          responsibility_area: editWorker.responsibility_area,
          notes: editWorker.notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update worker');
      }

      await fetchData();
      setEditWorker(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update worker');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWorker = async (id: number) => {
    if (!confirm('Are you sure you want to remove this worker?')) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/workers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove worker');
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove worker');
    } finally {
      setLoading(false);
    }
  };

  const handlePayWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payWorker) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/salary-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: payWorker.id,
          amount: paymentDetails.amount,
          payment_date: paymentDetails.payment_date || new Date().toISOString(),
          payment_type: payWorker.payment_type,
          task_description: payWorker.payment_type === 'Per Task' ? paymentDetails.task_description : null,
          notes: paymentDetails.notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record payment');
      }

      await fetchData();
      setPayWorker(null);
      setPaymentDetails({ amount: 0, payment_date: '', task_description: '', notes: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, isEdit: boolean = false) => {
    const selectedRole = e.target.value;
    if (selectedRole === 'new') {
      setIsNewRole(true);
      if (isEdit && editWorker) {
        setEditWorker({ ...editWorker, role_id: 0 });
      } else {
        setNewWorker({ ...newWorker, role_id: 0 });
      }
    } else {
      const roleId = Number(selectedRole);
      if (isEdit && editWorker) {
        setEditWorker({ ...editWorker, role_id: roleId });
      } else {
        setNewWorker({ ...newWorker, role_id: roleId });
      }
      setIsNewRole(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Manage Workers</h1>
          <button
            onClick={() => setShowAddWorkerModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add New Worker
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            {error}
            {error.includes('responsibility areas') && (
              <button
                onClick={fetchResponsibilityAreas}
                className="ml-2 text-blue-600 hover:underline"
              >
                Retry
              </button>
            )}
            {error.includes('roles') && (
              <button
                onClick={fetchRoles}
                className="ml-2 text-blue-600 hover:underline"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Add Worker Modal */}
        {showAddWorkerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Add New Worker</h2>
                <button
                  onClick={() => setShowAddWorkerModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddWorker} className="space-y-4">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Ahmed"
                    value={newWorker.name}
                    onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Role</label>
                  {loadingRoles ? (
                    <p className="text-gray-500">Loading roles...</p>
                  ) : roles.length === 0 ? (
                    <p className="text-red-600">No roles available.</p>
                  ) : (
                    <>
                      <select
                        value={isNewRole ? 'new' : newWorker.role_id || ''}
                        onChange={(e) => handleRoleSelectChange(e)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                        <option value="new">Add New Role</option>
                      </select>
                      {isNewRole && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Enter new role (e.g., Shepherd)"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={handleAddRole}
                            className="mt-2 w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Add Role
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Payment Type</label>
                  <select
                    value={newWorker.payment_type}
                    onChange={(e) => setNewWorker({ ...newWorker, payment_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Daily">Daily</option>
                    <option value="Per Task">Per Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    Payment Rate (TND/{newWorker.payment_type === 'Monthly' ? 'month' : newWorker.payment_type === 'Daily' ? 'day' : 'task'})
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 500.00"
                    value={newWorker.payment_rate}
                    onChange={(e) => setNewWorker({ ...newWorker, payment_rate: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Responsibility Area (Optional)</label>
                  {loadingAreas ? (
                    <p className="text-gray-500">Loading responsibility areas...</p>
                  ) : responsibilityAreas.length === 0 ? (
                    <p className="text-red-600">No responsibility areas available.</p>
                  ) : (
                    <select
                      value={newWorker.responsibility_area}
                      onChange={(e) => setNewWorker({ ...newWorker, responsibility_area: e.target.value || "" })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">None</option>
                      {responsibilityAreas.map((area) => (
                        <option key={area.name} value={area.name}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Works part-time"
                    value={newWorker.notes}
                    onChange={(e) => setNewWorker({ ...newWorker, notes: e.target.value })}
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
                    {loading ? 'Processing...' : 'Add Worker'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddWorkerModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Worker Form */}
        {editWorker && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Edit Worker</h2>
            <form onSubmit={handleEditWorker} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editWorker.name}
                  onChange={(e) => setEditWorker({ ...editWorker, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Role</label>
                {loadingRoles ? (
                  <p className="text-gray-500">Loading roles...</p>
                ) : roles.length === 0 ? (
                  <p className="text-red-600">No roles available.</p>
                ) : (
                  <>
                    <select
                      value={isNewRole ? 'new' : editWorker.role_id || ''}
                      onChange={(e) => handleRoleSelectChange(e, true)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                      <option value="new">Add New Role</option>
                    </select>
                    {isNewRole && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Enter new role (e.g., Shepherd)"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleAddRole}
                          className="mt-2 w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add Role
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Payment Type</label>
                <select
                  value={editWorker.payment_type}
                  onChange={(e) => setEditWorker({ ...editWorker, payment_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Daily">Daily</option>
                  <option value="Per Task">Per Task</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Payment Rate (TND/{editWorker.payment_type === 'Monthly' ? 'month' : editWorker.payment_type === 'Daily' ? 'day' : 'task'})
                </label>
                <input
                  type="number"
                  value={editWorker.payment_rate}
                  onChange={(e) => setEditWorker({ ...editWorker, payment_rate: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Responsibility Area (Optional)</label>
                {loadingAreas ? (
                  <p className="text-gray-500">Loading responsibility areas...</p>
                ) : responsibilityAreas.length === 0 ? (
                  <p className="text-red-600">No responsibility areas available.</p>
                ) : (
                  <select
                    value={editWorker.responsibility_area || ''}
                    onChange={(e) => setEditWorker({ ...editWorker, responsibility_area: e.target.value || null })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">None</option>
                    {responsibilityAreas.map((area) => (
                      <option key={area.name} value={area.name}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={editWorker.notes || ''}
                  onChange={(e) => setEditWorker({ ...editWorker, notes: e.target.value })}
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
                  {loading ? 'Processing...' : 'Update Worker'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditWorker(null)}
                  className="w-full bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Pay Worker Form */}
        {payWorker && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Record Payment for {payWorker.name}</h2>
            <form onSubmit={handlePayWorker} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Amount (TND)</label>
                <input
                  type="number"
                  placeholder="e.g., 500.00"
                  value={paymentDetails.amount}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, amount: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Payment Date (Optional)</label>
                <input
                  type="date"
                  value={paymentDetails.payment_date}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {payWorker.payment_type === 'Per Task' && (
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Task Description</label>
                  <input
                    type="text"
                    placeholder="e.g., Harvest Wheat"
                    value={paymentDetails.task_description}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, task_description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-gray-600 font-medium mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder={`e.g., Payment for ${payWorker.payment_type === 'Monthly' ? 'March' : payWorker.payment_type === 'Daily' ? 'work on 2025-03-22' : 'task'}`}
                  value={paymentDetails.notes}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
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
                  {loading ? 'Processing...' : 'Record Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayWorker(null);
                    setPaymentDetails({ amount: 0, payment_date: '', task_description: '', notes: '' });
                  }}
                  className="w-full bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Workers List */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Workers List</h2>
          {loading ? (
            <p className="text-gray-500">Loading workers...</p>
          ) : workers.length === 0 ? (
            <p className="text-gray-500">No workers added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Payment Type</th>
                    <th className="px-4 py-2 text-left">Payment Rate (TND)</th>
                    <th className="px-4 py-2 text-left">Responsibility Area</th>
                    <th className="px-4 py-2 text-left">Total Payments (TND)</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker, index) => (
                    <tr key={worker.id} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                      <td className="px-4 py-2">{worker.id}</td>
                      <td className="px-4 py-2">{worker.name}</td>
                      <td className="px-4 py-2">{worker.role_name}</td>
                      <td className="px-4 py-2">{worker.payment_type}</td>
                      <td className="px-4 py-2">{worker.payment_rate.toFixed(2)}/{worker.payment_type === 'Monthly' ? 'month' : worker.payment_type === 'Daily' ? 'day' : 'task'}</td>
                      <td className="px-4 py-2">{worker.responsibility_area || 'N/A'}</td>
                      <td className="px-4 py-2">{worker.total_payments.toFixed(2)}</td>
                      <td className="px-4 py-2">{worker.notes || 'N/A'}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          onClick={() => setEditWorker(worker)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Worker"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setPayWorker(worker)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Record Payment"
                        >
                          <CurrencyDollarIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveWorker(worker.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove Worker"
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

        {/* Payment History */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Payment History</h2>
          {loading ? (
            <p className="text-gray-500">Loading payments...</p>
          ) : payments.length === 0 ? (
            <p className="text-gray-500">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-yellow-600 text-white">
                    <th className="px-4 py-2 text-left">Payment ID</th>
                    <th className="px-4 py-2 text-left">Worker Name</th>
                    <th className="px-4 py-2 text-left">Amount (TND)</th>
                    <th className="px-4 py-2 text-left">Payment Type</th>
                    <th className="px-4 py-2 text-left">Task Description</th>
                    <th className="px-4 py-2 text-left">Payment Date</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr key={payment.id} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                      <td className="px-4 py-2">{payment.id}</td>
                      <td className="px-4 py-2">{payment.worker_name}</td>
                      <td className="px-4 py-2">{payment.amount.toFixed(2)}</td>
                      <td className="px-4 py-2">{payment.payment_type}</td>
                      <td className="px-4 py-2">{payment.task_description || 'N/A'}</td>
                      <td className="px-4 py-2">{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{payment.notes || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Labor Cost Summary */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Labor Cost Summary</h2>
          {loading ? (
            <p className="text-gray-500">Loading summary...</p>
          ) : workers.length === 0 ? (
            <p className="text-gray-500">No workers added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Total Labor Cost (TND)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-gray-50 hover:bg-gray-100">
                    <td className="px-4 py-2 font-medium">Total Labor Cost</td>
                    <td className="px-4 py-2">
                      {workers.reduce((sum, worker) => sum + worker.total_payments, 0).toFixed(2)}
                    </td>
                  </tr>
                  {[...new Set(workers.map((w) => w.role_name))].map((role, index) => (
                    <tr key={role} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                      <td className="px-4 py-2">Role: {role}</td>
                      <td className="px-4 py-2">
                        {workers
                          .filter((w) => w.role_name === role)
                          .reduce((sum, w) => sum + w.total_payments, 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {[...new Set(workers.map((w) => w.responsibility_area).filter((t) => t))].map((area, index) => (
                    <tr key={area} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                      <td className="px-4 py-2">Responsibility: {area}</td>
                      <td className="px-4 py-2">
                        {workers
                          .filter((w) => w.responsibility_area === area)
                          .reduce((sum, w) => sum + w.total_payments, 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {[...new Set(workers.map((w) => w.payment_type))].map((type, index) => (
                    <tr key={type} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                      <td className="px-4 py-2">Payment Type: {type}</td>
                      <td className="px-4 py-2">
                        {workers
                          .filter((w) => w.payment_type === type)
                          .reduce((sum, w) => sum + w.total_payments, 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}