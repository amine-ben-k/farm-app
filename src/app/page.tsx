// src/app/page.tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-green-800 mb-6">Welcome to Farm Management</h1>
        <p className="text-lg text-gray-700">
          Manage your farm efficiently. Navigate to the sections above to view and manage your animals, crops, workers, and profits.
        </p>
      </div>
    </div>
  );
}