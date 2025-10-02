"use client";

import { FaEnvelope, FaPlus, FaEdit, FaPaperPlane, FaUsers } from 'react-icons/fa';
import AdminNavbar from "../components/AdminNavbar";

export default function EmailMarketing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminNavbar />

      {/* Main Content */}
      <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <FaEnvelope className="h-8 w-8 text-[#012C61] mr-3" />
          <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
            Email - Marketing
          </h1>
        </div>

        {/* Marketing Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Campaigns */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-3xl font-bold text-[#012C61]">24</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaEnvelope className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">+3 this month</p>
          </div>

          {/* Active Campaigns */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <p className="text-3xl font-bold text-[#012C61]">8</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaPaperPlane className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">Currently running</p>
          </div>

          {/* Subscribers */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Subscribers</p>
                <p className="text-3xl font-bold text-[#012C61]">1,234</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaUsers className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">+45 this week</p>
          </div>

          {/* Open Rate */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Open Rate</p>
                <p className="text-3xl font-bold text-[#012C61]">24.5%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaEdit className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">+2.1% from last month</p>
          </div>
        </div>

        {/* Campaign Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Create New Campaign */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Campaign</h3>
            <p className="text-gray-600 mb-6">Start a new email marketing campaign with AI-powered templates.</p>
            <button className="bg-[#012C61] text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors flex items-center">
              <FaPlus className="h-5 w-5 mr-2" />
              Create Campaign
            </button>
          </div>

          {/* Recent Campaigns */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Campaigns</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Rate Update Alert</p>
                  <p className="text-sm text-gray-600">Sent to 1,234 subscribers</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Monthly Newsletter</p>
                  <p className="text-sm text-gray-600">Sent to 1,189 subscribers</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">Legislative Update</p>
                  <p className="text-sm text-gray-600">Sent to 987 subscribers</p>
                </div>
                <span className="text-sm text-gray-500">3 days ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Templates */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Email Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <h4 className="font-medium text-gray-900 mb-2">Rate Update Alert</h4>
              <p className="text-sm text-gray-600 mb-3">Template for notifying about rate changes</p>
              <div className="flex space-x-2">
                <button className="text-blue-600 text-sm hover:text-blue-800">Edit</button>
                <button className="text-green-600 text-sm hover:text-green-800">Use</button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <h4 className="font-medium text-gray-900 mb-2">Newsletter</h4>
              <p className="text-sm text-gray-600 mb-3">Monthly newsletter template</p>
              <div className="flex space-x-2">
                <button className="text-blue-600 text-sm hover:text-blue-800">Edit</button>
                <button className="text-green-600 text-sm hover:text-green-800">Use</button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <h4 className="font-medium text-gray-900 mb-2">Legislative Update</h4>
              <p className="text-sm text-gray-600 mb-3">Template for legislative changes</p>
              <div className="flex space-x-2">
                <button className="text-blue-600 text-sm hover:text-blue-800">Edit</button>
                <button className="text-green-600 text-sm hover:text-green-800">Use</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
