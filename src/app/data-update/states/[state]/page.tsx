"use client";

import { FaArrowLeft, FaDatabase, FaEdit, FaSave, FaUpload, FaDownload, FaSync, FaChartLine } from 'react-icons/fa';
import AdminNavbar from "../../../components/AdminNavbar";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function StateDataUpdate() {
  const params = useParams();
  const stateName = params.state as string;
  const formattedStateName = stateName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

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
            <nav className="space-y-2">
              <Link href="/data-update" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Home
              </Link>
              <Link href="/data-update/states" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
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
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center">
              <Link href="/data-update/states" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FaArrowLeft className="h-6 w-6 text-[#012C61]" />
              </Link>
              <FaDatabase className="h-8 w-8 text-[#012C61] mr-3" />
              <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
                {formattedStateName} Data Update
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

          <p className="text-lg text-gray-600 mb-8">Manage and update data for {formattedStateName}.</p>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaUpload className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Upload Data</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Upload new data files for {formattedStateName}.
              </p>
              <button className="text-blue-600 font-medium hover:text-blue-800">
                Upload Files →
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaDownload className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Export Data</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Download current data for {formattedStateName}.
              </p>
              <button className="text-green-600 font-medium hover:text-green-800">
                Export Data →
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FaSync className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Sync Status</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Check synchronization status for {formattedStateName}.
              </p>
              <button className="text-purple-600 font-medium hover:text-purple-800">
                View Status →
              </button>
            </div>
          </div>

          {/* Data Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-3xl font-bold text-[#012C61]">15,432</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaDatabase className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-3xl font-bold text-[#012C61]">2h ago</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaSync className="h-6 w-6 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Updates</p>
                <p className="text-3xl font-bold text-[#012C61]">23</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaEdit className="h-6 w-6 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Data Quality</p>
                <p className="text-3xl font-bold text-[#012C61]">98%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaChartLine className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">{formattedStateName} Data Records</h3>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#001</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Provider A</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$125.50</td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#002</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Provider B</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$98.75</td>
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
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#003</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Provider C</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$156.25</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-07-23</td>
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
