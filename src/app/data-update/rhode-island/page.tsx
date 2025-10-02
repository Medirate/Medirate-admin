"use client";

import { FaArrowLeft, FaDatabase } from 'react-icons/fa';
import AdminNavbar from "../../components/AdminNavbar";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StateDataUpdatePage() {
  const router = useRouter();
  const stateName = "Rhode Island"; 

  const states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminNavbar />

      <div className="flex">
        {/* Side Navigation */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-[#012C61] mb-6">Data Update</h2>
            <nav className="space-y-1 max-h-96 overflow-y-auto">
              <Link href="/data-update" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Home
              </Link>
              {states.map((state) => (
                <Link
                  key={state}
                  href={`/data-update/${state.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    stateName === state
                      ? "text-white bg-[#012C61]"
                      : "text-gray-700 hover:bg-blue-50 hover:text-[#012C61]"
                  }`}
                >
                  <FaDatabase className="mr-3" />
                  {state}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <Link href="/data-update" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FaArrowLeft className="h-6 w-6 text-[#012C61]" />
            </Link>
            <FaDatabase className="h-8 w-8 text-[#012C61] mr-3" />
            <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
              {stateName} Data Update
            </h1>
          </div>

          <p className="text-lg text-gray-600 mb-8">
            This page is under construction. Data update functionalities for {stateName} will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}

