"use client";

import { FaArrowLeft, FaDatabase, FaEdit, FaSave, FaUpload, FaDownload, FaSync, FaChartLine } from 'react-icons/fa';
import AdminNavbar from "../../components/AdminNavbar";
import Link from "next/link";
import { useState } from "react";

export default function TexasDataUpdate() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSaving(false);
    setIsEditing(false);
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
              <Link href="/data-update" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Home
              </Link>
              <Link href="/data-update/alabama" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Alabama
              </Link>
              <Link href="/data-update/alaska" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Alaska
              </Link>
              <Link href="/data-update/arizona" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Arizona
              </Link>
              <Link href="/data-update/arkansas" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Arkansas
              </Link>
              <Link href="/data-update/california" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                California
              </Link>
              <Link href="/data-update/colorado" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Colorado
              </Link>
              <Link href="/data-update/connecticut" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Connecticut
              </Link>
              <Link href="/data-update/delaware" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Delaware
              </Link>
              <Link href="/data-update/florida" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Florida
              </Link>
              <Link href="/data-update/georgia" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Georgia
              </Link>
              <Link href="/data-update/hawaii" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Hawaii
              </Link>
              <Link href="/data-update/idaho" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Idaho
              </Link>
              <Link href="/data-update/illinois" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Illinois
              </Link>
              <Link href="/data-update/indiana" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Indiana
              </Link>
              <Link href="/data-update/iowa" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Iowa
              </Link>
              <Link href="/data-update/kansas" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Kansas
              </Link>
              <Link href="/data-update/kentucky" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Kentucky
              </Link>
              <Link href="/data-update/louisiana" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Louisiana
              </Link>
              <Link href="/data-update/maine" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Maine
              </Link>
              <Link href="/data-update/maryland" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Maryland
              </Link>
              <Link href="/data-update/massachusetts" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Massachusetts
              </Link>
              <Link href="/data-update/michigan" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Michigan
              </Link>
              <Link href="/data-update/minnesota" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Minnesota
              </Link>
              <Link href="/data-update/mississippi" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Mississippi
              </Link>
              <Link href="/data-update/missouri" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Missouri
              </Link>
              <Link href="/data-update/montana" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Montana
              </Link>
              <Link href="/data-update/nebraska" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Nebraska
              </Link>
              <Link href="/data-update/nevada" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Nevada
              </Link>
              <Link href="/data-update/new-hampshire" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                New Hampshire
              </Link>
              <Link href="/data-update/new-jersey" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                New Jersey
              </Link>
              <Link href="/data-update/new-mexico" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                New Mexico
              </Link>
              <Link href="/data-update/new-york" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                New York
              </Link>
              <Link href="/data-update/north-carolina" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                North Carolina
              </Link>
              <Link href="/data-update/north-dakota" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                North Dakota
              </Link>
              <Link href="/data-update/ohio" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Ohio
              </Link>
              <Link href="/data-update/oklahoma" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Oklahoma
              </Link>
              <Link href="/data-update/oregon" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Oregon
              </Link>
              <Link href="/data-update/pennsylvania" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Pennsylvania
              </Link>
              <Link href="/data-update/rhode-island" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Rhode Island
              </Link>
              <Link href="/data-update/south-carolina" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                South Carolina
              </Link>
              <Link href="/data-update/south-dakota" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                South Dakota
              </Link>
              <Link href="/data-update/tennessee" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Tennessee
              </Link>
              <Link href="/data-update/texas" className="flex items-center px-4 py-3 text-white bg-[#012C61] rounded-lg">
                <FaDatabase className="mr-3" />
                Texas
              </Link>
              <Link href="/data-update/utah" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Utah
              </Link>
              <Link href="/data-update/vermont" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Vermont
              </Link>
              <Link href="/data-update/virginia" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Virginia
              </Link>
              <Link href="/data-update/washington" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Washington
              </Link>
              <Link href="/data-update/west-virginia" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                West Virginia
              </Link>
              <Link href="/data-update/wisconsin" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Wisconsin
              </Link>
              <Link href="/data-update/wyoming" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Wyoming
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center">
              <Link href="/data-update" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FaArrowLeft className="h-6 w-6 text-[#012C61]" />
              </Link>
              <FaDatabase className="h-8 w-8 text-[#012C61] mr-3" />
              <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
                Texas Data Update
              </h1>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#012C61] hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <FaEdit className="mr-2" />
                  Edit Data
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <FaSync className="mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-lg text-gray-600 mb-8">Manage and update data for Texas.</p>

          {/* Data Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-3xl font-bold text-[#012C61]">18,765</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaDatabase className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-3xl font-bold text-[#012C61]">3h ago</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaSync className="h-6 w-6 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Updates</p>
                <p className="text-3xl font-bold text-[#012C61]">8</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaEdit className="h-6 w-6 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Data Quality</p>
                <p className="text-3xl font-bold text-[#012C61]">97%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaChartLine className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Texas Data Records</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    {isEditing && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#TX001</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Blue Cross Blue Shield TX</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$165.25</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-07-25</td>
                    {isEditing && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#TX002</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aetna Better Health</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$128.90</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-07-24</td>
                    {isEditing && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
