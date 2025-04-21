'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HomeIcon, UserIcon, HeartIcon, ChevronLeftIcon, ChevronRightIcon, CogIcon, SunIcon, CalendarIcon, WrenchIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const router = useRouter();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (!isSidebarOpen) {
      setOpenDropdown(null); // Close all dropdowns when sidebar is collapsed
    }
  };

  const toggleDropdown = (section: string) => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true); // Expand sidebar if collapsed
      setOpenDropdown(section);
    } else {
      setOpenDropdown(openDropdown === section ? null : section);
    }
  };

  const navItems = [
    { name: 'Home', icon: HomeIcon, dashboardPath: '/', managePath: '/', isSingleLink: true }, 
    { name: 'Schedule', icon: CalendarIcon, dashboardPath: '/schedule', managePath: '/schedule', isSingleLink: true }, 
    { name: 'Workers', icon: UserIcon, dashboardPath: '/workers/dashboard', managePath: '/workers', isSingleLink: false },
    { name: 'Animals', icon: HeartIcon, dashboardPath: '/animals/dashboard', managePath: '/animals', isSingleLink: false },
    { name: 'Crops', icon: SunIcon, dashboardPath: '/crops/dashboard', managePath: '/crops', isSingleLink: false },
    { name: 'Equipments', icon: WrenchIcon, dashboardPath: '/equipments/dashboard', managePath: '/equipments', isSingleLink: false },
  ];

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
            <button
              onClick={toggleSidebar}
              className="text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
              aria-expanded={isSidebarOpen}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? <ChevronLeftIcon className="h-6 w-6" /> : <ChevronRightIcon className="h-6 w-6" />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="mt-4">
            {navItems.map((item) => (
              <div key={item.name}>
                {item.isSingleLink ? (
                  // Single link for sections like Home and Schedule
                  <Link href={item.dashboardPath}>
                    <div
                      className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-green-100 hover:text-green-800"
                    >
                      <item.icon className="h-6 w-6" aria-hidden="true" />
                      {isSidebarOpen && (
                        <span className="ml-3">{item.name}</span>
                      )}
                    </div>
                  </Link>
                ) : (
                  // Dropdown for other sections
                  <>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-green-100 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                      aria-expanded={openDropdown === item.name}
                      aria-controls={`${item.name.toLowerCase()}-menu`}
                    >
                      <item.icon className="h-6 w-6" aria-hidden="true" />
                      {isSidebarOpen && (
                        <>
                          <span className="ml-3">{item.name}</span>
                          <span className="ml-auto">
                            {openDropdown === item.name ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {isSidebarOpen && openDropdown === item.name && (
                      <div id={`${item.name.toLowerCase()}-menu`} className="pl-8 bg-gray-50">
                        <Link href={item.dashboardPath}>
                          <div className="block px-4 py-2 text-sm text-gray-600 hover:bg-green-100 hover:text-green-800">
                            Dashboard
                          </div>
                        </Link>
                        <Link href={item.managePath}>
                          <div className="block px-4 py-2 text-sm text-gray-600 hover:bg-green-100 hover:text-green-800">
                            Manage
                          </div>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer (Settings) */}
        <div className="p-4">
          <Link href="/settings">
            <div className="flex items-center px-4 py-2 text-gray-600 hover:bg-green-100 hover:text-green-800">
              <CogIcon className="h-6 w-6" aria-hidden="true" />
              {isSidebarOpen && <span className="ml-3">Settings</span>}
            </div>
          </Link>
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
              aria-label="Search"
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Abdulaziz Ben Khalifa</span>
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600">ABK</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}