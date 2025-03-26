import Layout from '../components/Layout';

export default function HomePage() {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-700">Fields</h2>
            <p className="text-3xl font-bold text-green-600">14</p>
            <p className="text-gray-500">54,232 Hectares</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-700">Jobs Active</h2>
            <p className="text-3xl font-bold text-green-600">98</p>
            <p className="text-gray-500">Total Jobs</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-700">Jobs Due</h2>
            <p className="text-3xl font-bold text-red-600">58</p>
            <p className="text-gray-500">In Progress</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-700">Jobs Completed</h2>
            <p className="text-3xl font-bold text-green-600">32</p>
            <p className="text-gray-500">32/98</p>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Farm Map</h2>
          <div className="h-64 bg-gray-200 flex items-center justify-center rounded-lg">
            <p className="text-gray-500">Map Placeholder (To be implemented)</p>
          </div>
        </div>

        {/* Cost Analysis Placeholder */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Cost Analysis</h2>
          <div className="h-40 bg-gray-200 flex items-center justify-center rounded-lg">
            <p className="text-gray-500">Chart Placeholder (To be implemented)</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}