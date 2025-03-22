// src/app/animals/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Animal {
  id: number;
  type: string;
  purchase_price: number;
  feed_cost: number;
  production: string | null;
  parent_id: number | null;
  parent_type: string | null;
  created_at: string;
}

interface AnimalTypeSummary {
  type: string;
  total_count: number;
  total_purchase_price: number;
  total_feed_cost: number;
  production: string | null;
}

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [summary, setSummary] = useState<AnimalTypeSummary[]>([]);
  const [newAnimal, setNewAnimal] = useState({
    type: '',
    purchase_price: 0,
    feed_cost: 0,
    production: '',
    parent_id: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch animals and summary on mount
  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/animals');
      if (!res.ok) throw new Error('Failed to fetch animals');
      const data = await res.json();
      setAnimals(data.animals || []);
      setSummary(data.summary || []);
    } catch {
      setError('Failed to fetch animals');
    } finally {
      setLoading(false);
    }
  };

  // Add a new animal
  const handleAddAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!newAnimal.type || newAnimal.purchase_price < 0 || newAnimal.feed_cost < 0) {
      setError('Please provide a valid animal type, purchase price, and feed cost');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newAnimal.type,
          purchase_price: newAnimal.purchase_price,
          feed_cost: newAnimal.feed_cost,
          production: newAnimal.production || null,
          parent_id: newAnimal.parent_id ? Number(newAnimal.parent_id) : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add animal');
      }

      const addedAnimal = await res.json();
      setAnimals([addedAnimal, ...animals]);

      // Refresh summary
      await fetchAnimals();

      setNewAnimal({ type: '', purchase_price: 0, feed_cost: 0, production: '', parent_id: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to add animal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-green-800 mb-6">Manage Animals</h1>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        {/* Add Animal Form */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add New Animal</h2>
          <form onSubmit={handleAddAnimal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Type</label>
              <input
                type="text"
                placeholder="e.g., Sheep"
                value={newAnimal.type}
                onChange={(e) => setNewAnimal({ ...newAnimal, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Purchase Price ($)</label>
              <input
                type="number"
                placeholder="e.g., 200.00"
                value={newAnimal.purchase_price}
                onChange={(e) =>
                  setNewAnimal({ ...newAnimal, purchase_price: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Feed Cost ($)</label>
              <input
                type="number"
                placeholder="e.g., 500.00"
                value={newAnimal.feed_cost}
                onChange={(e) =>
                  setNewAnimal({ ...newAnimal, feed_cost: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Production (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Wool"
                value={newAnimal.production}
                onChange={(e) => setNewAnimal({ ...newAnimal, production: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Parent (Optional)</label>
              <select
                value={newAnimal.parent_id}
                onChange={(e) => setNewAnimal({ ...newAnimal, parent_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">None</option>
                {animals.map((animal) => (
                  <option key={animal.id} value={animal.id}>
                    {animal.type} (ID: {animal.id})
                  </option>
                ))}
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
                {loading ? 'Processing...' : 'Add Animal'}
              </button>
            </div>
          </form>
        </div>

        {/* Summary per Type */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Summary by Type</h2>
          {loading ? (
            <p className="text-gray-600">Loading summary...</p>
          ) : summary.length === 0 ? (
            <p className="text-gray-600">No animal types added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Total Count</th>
                    <th className="px-4 py-2 text-left">Total Purchase Price ($)</th>
                    <th className="px-4 py-2 text-left">Total Feed Cost ($)</th>
                    <th className="px-4 py-2 text-left">Production</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((type, index) => (
                    <tr key={type.type} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                      <td className="px-4 py-2">{type.type}</td>
                      <td className="px-4 py-2">{type.total_count}</td>
                      <td className="px-4 py-2">{type.total_purchase_price.toFixed(2)}</td>
                      <td className="px-4 py-2">{type.total_feed_cost.toFixed(2)}</td>
                      <td className="px-4 py-2">{type.production || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Individual Animals List */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Individual Animals</h2>
          {loading ? (
            <p className="text-gray-600">Loading animals...</p>
          ) : animals.length === 0 ? (
            <p className="text-gray-600">No animals added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Purchase Price ($)</th>
                    <th className="px-4 py-2 text-left">Feed Cost ($)</th>
                    <th className="px-4 py-2 text-left">Production</th>
                    <th className="px-4 py-2 text-left">Parent</th>
                    <th className="px-4 py-2 text-left">Added On</th>
                  </tr>
                </thead>
                <tbody>
                  {animals.map((animal, index) => (
                    <tr key={animal.id} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                      <td className="px-4 py-2">{animal.id}</td>
                      <td className="px-4 py-2">{animal.type}</td>
                      <td className="px-4 py-2">{animal.purchase_price.toFixed(2)}</td>
                      <td className="px-4 py-2">{animal.feed_cost.toFixed(2)}</td>
                      <td className="px-4 py-2">{animal.production || 'N/A'}</td>
                      <td className="px-4 py-2">
                        {animal.parent_id ? `${animal.parent_type} (ID: ${animal.parent_id})` : 'None'}
                      </td>
                      <td className="px-4 py-2">{new Date(animal.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}