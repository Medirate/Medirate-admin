"use client";

import { FaMap, FaArrowLeft, FaDatabase, FaEdit, FaSync, FaChartLine } from 'react-icons/fa';
import AdminNavbar from "../../components/AdminNavbar";
import Link from "next/link";
import { useState } from "react";
import USMap from "../../components/us-map";

export default function StatesDataUpdate() {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const handleStateSelect = (stateName: string | null) => {
    setSelectedState(stateName);
  };

  const handleStateClick = (stateName: string) => {
    // Navigate to the specific state page
    window.location.href = `/data-update/states/${stateName.toLowerCase().replace(/\s+/g, '-')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminNavbar />

      <div className="flex">
        {/* Side Navigation */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-[#012C61] mb-6">Data Update</h2>
            <nav className="space-y-2">
              <Link href="/data-update" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Home
              </Link>
              <Link href="/data-update/states" className="flex items-center px-4 py-3 text-white bg-[#012C61] rounded-lg">
                <FaMap className="mr-3" />
                US States
              </Link>
              <Link href="/data-update/upload" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Upload Data
              </Link>
              <Link href="/data-update/sync" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaSync className="mr-3" />
                Sync Status
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
          {/* Header */}
          <div className="flex items-center mb-6 sm:mb-8">
            <Link href="/data-update" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FaArrowLeft className="h-6 w-6 text-[#012C61]" />
            </Link>
            <FaMap className="h-8 w-8 text-[#012C61] mr-3" />
            <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
              US States Data Update
            </h1>
          </div>

          <p className="text-lg text-gray-600 mb-8">Click on any state to view and update its data.</p>

          {/* Selected State Info */}
          {selectedState && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Selected: {selectedState}</h3>
                  <p className="text-gray-600 mb-4">Click the button below to view and update data for {selectedState}.</p>
                </div>
                <button
                  onClick={() => handleStateClick(selectedState)}
                  className="bg-[#012C61] hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                >
                  <FaEdit className="mr-2" />
                  Update {selectedState} Data
                </button>
              </div>
            </div>
          )}

          {/* US Map */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Interactive US Map</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Unselected</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-300 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Hover</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">Selected</span>
                </div>
              </div>
            </div>
            
            <div className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
              <USMap 
                onStateSelect={handleStateSelect}
                selectedState={selectedState}
              />
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Click on any state to select it, then click "Update [State] Data" to proceed.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-4">
                <FaMap className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">50 States</h4>
              <p className="text-gray-600">All US states available for data updates</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-4">
                <FaDatabase className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Real-time Updates</h4>
              <p className="text-gray-600">Live data synchronization across all states</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-4">
                <FaChartLine className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h4>
              <p className="text-gray-600">Comprehensive data insights per state</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
