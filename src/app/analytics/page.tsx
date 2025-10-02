"use client";

import { FaShieldAlt, FaChartLine, FaUsers, FaDatabase, FaEnvelope, FaArrowUp } from 'react-icons/fa';
import AdminNavbar from "../components/AdminNavbar";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminNavbar />

      {/* Main Content */}
      <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <FaChartLine className="h-8 w-8 text-[#012C61] mr-3" />
          <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
            Analytics Dashboard
          </h1>
        </div>

        {/* Analytics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-[#012C61]">1,234</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUsers className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">+12% from last month</p>
          </div>

          {/* Rate Updates */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rate Updates</p>
                <p className="text-3xl font-bold text-[#012C61]">456</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaDatabase className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">+8% from last month</p>
          </div>

          {/* Email Campaigns */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Email Campaigns</p>
                <p className="text-3xl font-bold text-[#012C61]">89</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-lg">
                <FaEnvelope className="h-6 w-6 text-pink-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">+15% from last month</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Usage Trends */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage Trends</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <FaArrowUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart placeholder</p>
                <p className="text-sm text-gray-400">Usage trends will be displayed here</p>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database Status</span>
                <span className="text-green-600 font-semibold">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Response Time</span>
                <span className="text-green-600 font-semibold">45ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email Service</span>
                <span className="text-green-600 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Storage Usage</span>
                <span className="text-yellow-600 font-semibold">78%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Database updated with new rate data</span>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Marketing email campaign sent</span>
              </div>
              <span className="text-sm text-gray-500">4 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Provider alerts generated</span>
              </div>
              <span className="text-sm text-gray-500">6 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-gray-700">System backup completed</span>
              </div>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
