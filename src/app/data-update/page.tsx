"use client";

import { FaDatabase, FaUpload, FaDownload, FaSync, FaEdit, FaMap, FaChartLine, FaArrowLeft } from 'react-icons/fa';
import AdminNavbar from "../components/AdminNavbar";
import Link from "next/link";
import { useState } from "react";
import USMap from "../components/us-map";

export default function DataUpdate() {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const handleStateSelect = (stateName: string | null) => {
    setSelectedState(stateName);
    // Navigate to the specific state page when a state is selected
    if (stateName) {
      const stateSlug = stateName.toLowerCase().replace(/\s+/g, '-');
      window.location.href = `/data-update/${stateSlug}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminNavbar />

      <div className="flex">
        {/* Side Navigation */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-[#012C61] mb-6">Data Update</h2>
            <nav className="space-y-1 max-h-96 overflow-y-auto">
              <Link href="/data-update" className="flex items-center px-4 py-3 text-white bg-[#012C61] rounded-lg">
                <FaDatabase className="mr-3" />
                Home
              </Link>
              <Link href="/data-update/alabama" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Alabama
              </Link>
              <Link href="/data-update/alaska" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Alaska
              </Link>
              <Link href="/data-update/arizona" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Arizona
              </Link>
              <Link href="/data-update/arkansas" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Arkansas
              </Link>
              <Link href="/data-update/california" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                California
              </Link>
              <Link href="/data-update/colorado" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Colorado
              </Link>
              <Link href="/data-update/connecticut" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Connecticut
              </Link>
              <Link href="/data-update/delaware" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Delaware
              </Link>
              <Link href="/data-update/florida" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Florida
              </Link>
              <Link href="/data-update/georgia" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Georgia
              </Link>
              <Link href="/data-update/hawaii" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Hawaii
              </Link>
              <Link href="/data-update/idaho" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Idaho
              </Link>
              <Link href="/data-update/illinois" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Illinois
              </Link>
              <Link href="/data-update/indiana" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Indiana
              </Link>
              <Link href="/data-update/iowa" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Iowa
              </Link>
              <Link href="/data-update/kansas" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Kansas
              </Link>
              <Link href="/data-update/kentucky" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Kentucky
              </Link>
              <Link href="/data-update/louisiana" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Louisiana
              </Link>
              <Link href="/data-update/maine" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Maine
              </Link>
              <Link href="/data-update/maryland" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Maryland
              </Link>
              <Link href="/data-update/massachusetts" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Massachusetts
              </Link>
              <Link href="/data-update/michigan" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Michigan
              </Link>
              <Link href="/data-update/minnesota" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Minnesota
              </Link>
              <Link href="/data-update/mississippi" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Mississippi
              </Link>
              <Link href="/data-update/missouri" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Missouri
              </Link>
              <Link href="/data-update/montana" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Montana
              </Link>
              <Link href="/data-update/nebraska" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Nebraska
              </Link>
              <Link href="/data-update/nevada" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Nevada
              </Link>
              <Link href="/data-update/new-hampshire" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                New Hampshire
              </Link>
              <Link href="/data-update/new-jersey" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                New Jersey
              </Link>
              <Link href="/data-update/new-mexico" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                New Mexico
              </Link>
              <Link href="/data-update/new-york" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                New York
              </Link>
              <Link href="/data-update/north-carolina" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                North Carolina
              </Link>
              <Link href="/data-update/north-dakota" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                North Dakota
              </Link>
              <Link href="/data-update/ohio" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Ohio
              </Link>
              <Link href="/data-update/oklahoma" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Oklahoma
              </Link>
              <Link href="/data-update/oregon" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Oregon
              </Link>
              <Link href="/data-update/pennsylvania" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Pennsylvania
              </Link>
              <Link href="/data-update/rhode-island" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Rhode Island
              </Link>
              <Link href="/data-update/south-carolina" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                South Carolina
              </Link>
              <Link href="/data-update/south-dakota" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                South Dakota
              </Link>
              <Link href="/data-update/tennessee" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Tennessee
              </Link>
              <Link href="/data-update/texas" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Texas
              </Link>
              <Link href="/data-update/utah" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Utah
              </Link>
              <Link href="/data-update/vermont" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Vermont
              </Link>
              <Link href="/data-update/virginia" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Virginia
              </Link>
              <Link href="/data-update/washington" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Washington
              </Link>
              <Link href="/data-update/west-virginia" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                West Virginia
              </Link>
              <Link href="/data-update/wisconsin" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Wisconsin
              </Link>
              <Link href="/data-update/wyoming" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaMap className="mr-3" />
                Wyoming
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
          {/* Header */}
          <div className="flex items-center mb-6 sm:mb-8">
            <FaDatabase className="h-8 w-8 text-[#012C61] mr-3" />
            <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
              Data Update
            </h1>
          </div>

          <p className="text-lg text-gray-600 mb-8">Click on any state to view and update its data.</p>

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
                Click on any state to navigate to its data update page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}