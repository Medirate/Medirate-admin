"use client";

import { FaShieldAlt, FaChartLine, FaEnvelope, FaDatabase, FaUsers, FaCog } from 'react-icons/fa';
import Link from "next/link";
import AdminNavbar from "../components/AdminNavbar";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminNavbar />

      {/* Main Content */}
      <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <FaShieldAlt className="h-8 w-8 text-[#012C61] mr-3" />
          <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
            Admin Dashboard
          </h1>
        </div>

        {/* Rate Developments Card */}
        <div
          className="bg-blue-50 rounded-xl shadow-lg p-6 mb-8 max-w-xl cursor-pointer hover:bg-blue-100 transition"
          onClick={() => window.location.href = "/admin-dashboard/rate-developments"}
        >
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Rate Developments</h2>
          <p className="text-gray-700">Administer, update, and send alerts for rate developments.</p>
        </div>

        {/* Marketing Emails Card */}
        <div
          className="bg-pink-50 rounded-xl shadow-lg p-6 mb-8 max-w-xl cursor-pointer hover:bg-pink-100 transition"
          onClick={() => window.location.href = "/admin-dashboard/marketing-emails"}
        >
          <h2 className="text-xl font-semibold text-pink-900 mb-2">Marketing Emails</h2>
          <p className="text-gray-700">Create and manage marketing campaigns with AI-powered templates.</p>
        </div>
      </div>
    </div>
  );
} 