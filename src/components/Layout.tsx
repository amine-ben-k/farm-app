'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HomeIcon, UserIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, CogIcon, SunIcon, CalendarIcon, WrenchIcon } from '@heroicons/react/24/outline';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-16'
        } flex flex-col justify-between`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between">
            {isSidebarOpen && (
              <h1 className="text-2xl font-bold text-green-600">FarmApp</h1>
            )}
            <button onClick={toggleSidebar} className="text-gray-600 hover:text-gray-800">
              {isSidebarOpen ? <ChevronLeftIcon className="h-6 w-6" /> : <ChevronRightIcon className="h-6 w-6" />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="mt-4">
            <Link href="/">
              <div className="flex items-center px-4 py-2 text-gray-600 hover:bg-green-100 hover:text-green-800">
                <HomeIcon className="h-6 w-6" />
                {isSidebarOpen && <span className="ml-3">Home</span>}
              </div>
            </Link>
            <Link href="/workers">
              <div className="flex items-center px-4 py-2 text-gray-600 hover:bg-green-100 hover:text-green-800">
                <UserIcon className="h-6 w-6" />
                {isSidebarOpen && <span className="ml-3">Workers</span>}
              </div>
            </Link>
            <Link href="/animals">
              <div className="flex items-center px-4 py-2 text-gray-600 hover:bg-green-100 hover:text-green-800">
                <HeartIcon className="h-6 w-6" />
                {isSidebarOpen && <span className="ml-3">Animals</span>}
              </div>
            </Link>
            <Link href="/crops">
              <div className="flex items-center px-4 py-2 text-gray-600 hover:bg-green-100 hover:text-green-800">
                <SunIcon className="h-6 w-6" />
                {isSidebarOpen && <span className="ml-3">Crops</span>}
              </div>
            </Link>
            <Link href="/equipments">
              <div className="flex items-center px-4 py-2 text-gray-600 hover:bg-green-100 hover:text-green-800">
                <WrenchIcon className="h-6 w-6" />
                {isSidebarOpen && <span className="ml-3">Equipments</span>}
              </div>
            </Link>
            <Link href="/schedule">
              <div className="flex items-center px-4 py-2 text-gray-600 hover:bg-green-100 hover:text-green-800">
                <CalendarIcon className="h-6 w-6" />
                {isSidebarOpen && <span className="ml-3">Schedule</span>}
              </div>
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer (Settings) */}
        <div className="p-4">
          <div className="flex items-center px-4 py-2 text-gray-600 hover:bg-green-100 hover:text-green-800">
            <CogIcon className="h-6 w-6" />
            {isSidebarOpen && <span className="ml-3">Settings</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-md p-4 flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search..."
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Fletch Skinner</span>
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600">FS</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}