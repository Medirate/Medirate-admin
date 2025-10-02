"use client";

import { FaDatabase, FaArrowLeft, FaUpload, FaDownload, FaSync, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaEdit, FaEnvelope, FaBell } from 'react-icons/fa';
import AdminNavbar from "../../components/AdminNavbar";
import Link from "next/link";
import { useState } from "react";

export default function UpdateDatabase() {
  const [isUpdatingBillTrack, setIsUpdatingBillTrack] = useState(false);
  const [isUpdatingProviderAlerts, setIsUpdatingProviderAlerts] = useState(false);
  const [logs, setLogs] = useState<{ message: string; type: string; phase: string }[]>([]);
  const [providerLogs, setProviderLogs] = useState<{ message: string; type: string; phase: string }[]>([]);

  const handleUpdateBillTrack = async () => {
    setIsUpdatingBillTrack(true);
    setLogs([]);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLogs([
        { message: "Starting Bill Track update...", type: "info", phase: "start" },
        { message: "Connecting to data source...", type: "info", phase: "connect" },
        { message: "Downloading latest data...", type: "info", phase: "download" },
        { message: "Processing 1,250 records...", type: "info", phase: "process" },
        { message: "Updating database...", type: "info", phase: "update" },
        { message: "Bill Track update completed successfully!", type: "success", phase: "complete" }
      ]);
    } catch (error) {
      setLogs([{ message: `Error: ${error}`, type: "error", phase: "error" }]);
    } finally {
      setIsUpdatingBillTrack(false);
    }
  };

  const handleUpdateProviderAlerts = async () => {
    setIsUpdatingProviderAlerts(true);
    setProviderLogs([]);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProviderLogs([
        { message: "Starting Provider Alerts update...", type: "info", phase: "start" },
        { message: "Fetching provider data...", type: "info", phase: "fetch" },
        { message: "Processing 850 provider records...", type: "info", phase: "process" },
        { message: "Updating alert configurations...", type: "info", phase: "update" },
        { message: "Provider Alerts update completed successfully!", type: "success", phase: "complete" }
      ]);
    } catch (error) {
      setProviderLogs([{ message: `Error: ${error}`, type: "error", phase: "error" }]);
    } finally {
      setIsUpdatingProviderAlerts(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminNavbar />

      <div className="flex">
        {/* Side Navigation */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-[#012C61] mb-6">Rate Developments</h2>
            <nav className="space-y-2">
              <Link href="/rate-developments/edit-rate-developments" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaEdit className="mr-3" />
                Edit Rate Developments
              </Link>
              <Link href="/rate-developments/update-database" className="flex items-center px-4 py-3 text-white bg-[#012C61] rounded-lg">
                <FaDatabase className="mr-3" />
                Update Database
              </Link>
              <Link href="/rate-developments/send-email-alerts" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaEnvelope className="mr-3" />
                Send Email Alerts
              </Link>
              <Link href="/rate-developments/provider-alerts" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaBell className="mr-3" />
                Provider Alerts
              </Link>
              <Link href="/rate-developments/legislative-updates" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaExclamationTriangle className="mr-3" />
                Legislative Updates
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <Link href="/rate-developments" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FaArrowLeft className="h-6 w-6 text-[#012C61]" />
          </Link>
          <FaDatabase className="h-8 w-8 text-[#012C61] mr-3" />
          <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
            Update Database
          </h1>
        </div>

        <p className="text-lg text-gray-700 mb-8">
          Here you can upload or update the rate developments database.
        </p>

        {/* Update Buttons Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Update Bill Track */}
          <div className="bg-green-50 rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FaDatabase className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-green-900">Update Bill Track</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Update the legislative bill tracking database with the latest information.
            </p>
            <button
              onClick={handleUpdateBillTrack}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
              disabled={isUpdatingBillTrack}
            >
              {isUpdatingBillTrack ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <FaSync className="mr-2" />
                  Update Bill Track
                </>
              )}
            </button>
            
            {/* Logs Display */}
            {logs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Update Log:</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono max-h-40 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className={`${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-blue-400'
                    }`}>
                      [{log.phase}] {log.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Update Provider Alerts */}
          <div className="bg-blue-50 rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FaDatabase className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-blue-900">Update Provider Alerts</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Update the provider alerts database with new provider information and configurations.
            </p>
            <button
              onClick={handleUpdateProviderAlerts}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
              disabled={isUpdatingProviderAlerts}
            >
              {isUpdatingProviderAlerts ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <FaSync className="mr-2" />
                  Update Provider Alerts
                </>
              )}
            </button>
            
            {/* Logs Display */}
            {providerLogs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Update Log:</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono max-h-40 overflow-y-auto">
                  {providerLogs.map((log, index) => (
                    <div key={index} className={`${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-blue-400'
                    }`}>
                      [{log.phase}] {log.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Database Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Bill Track Records</p>
                <p className="text-2xl font-bold text-green-600">1,250</p>
              </div>
              <FaCheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Provider Records</p>
                <p className="text-2xl font-bold text-blue-600">850</p>
              </div>
              <FaCheckCircle className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Pending Updates</p>
                <p className="text-2xl font-bold text-yellow-600">3</p>
              </div>
              <FaExclamationTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Manual Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Manual Data Upload</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FaUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Drag and drop your data files here, or click to browse</p>
            <button className="bg-[#012C61] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Choose Files
            </button>
            <p className="text-sm text-gray-500 mt-2">Supported formats: CSV, Excel (.xlsx), JSON</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
