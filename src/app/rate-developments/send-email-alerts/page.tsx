"use client";

import { FaEnvelope, FaArrowLeft, FaPaperPlane, FaUsers, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaClock, FaEdit, FaDatabase, FaBell } from 'react-icons/fa';
import AdminNavbar from "../../components/AdminNavbar";
import Link from "next/link";
import { useState } from "react";

export default function SendEmailAlerts() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<{
    emailsSent: number;
    usersWithAlerts: number;
    totalUsers: number;
  } | null>(null);

  const handleSendEmails = async () => {
    setLoading(true);
    setLogs([]);
    setSuccess(null);
    setSummary(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockLogs = [
        "Starting email alert process...",
        "Fetching user list...",
        "Found 1,250 active users",
        "Generating personalized alerts...",
        "Sending emails to users with relevant alerts...",
        "Email delivery in progress...",
        "✅ Email alerts sent successfully!"
      ];
      
      setLogs(mockLogs);
      setSuccess(true);
      setSummary({
        emailsSent: 1250,
        usersWithAlerts: 850,
        totalUsers: 1250
      });
    } catch (error: any) {
      setLogs([`❌ Error: ${error.message}`]);
      setSuccess(false);
    } finally {
      setLoading(false);
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
              <Link href="/rate-developments/update-database" className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-[#012C61] transition-colors">
                <FaDatabase className="mr-3" />
                Update Database
              </Link>
              <Link href="/rate-developments/send-email-alerts" className="flex items-center px-4 py-3 text-white bg-[#012C61] rounded-lg">
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
          <FaEnvelope className="h-8 w-8 text-[#012C61] mr-3" />
          <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
            Send Email Alerts
          </h1>
        </div>

        <p className="text-lg text-gray-700 mb-8">
          Send email notifications to users about rate developments and legislative updates.
        </p>

        {/* Email Campaign Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-[#012C61]">1,250</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUsers className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Users with Alerts</p>
                <p className="text-3xl font-bold text-[#012C61]">850</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaEnvelope className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Sent</p>
                <p className="text-3xl font-bold text-[#012C61]">2h ago</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaClock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Send Email Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <FaPaperPlane className="h-16 w-16 text-[#012C61] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Send Email Notifications</h2>
            <p className="text-gray-600 mb-6">
              This will send personalized email alerts to all users who have relevant rate developments or legislative updates.
            </p>
            
            <button
              onClick={handleSendEmails}
              disabled={loading}
              className="bg-[#012C61] hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center mx-auto"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-3" />
                  Sending Emails...
                </>
              ) : (
                <>
                  <FaPaperPlane className="mr-3" />
                  Send Email Alerts
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Logs */}
        {logs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              {success ? (
                <FaCheckCircle className="h-6 w-6 text-green-500 mr-2" />
              ) : (
                <FaExclamationTriangle className="h-6 w-6 text-red-500 mr-2" />
              )}
              Email Process Log
            </h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono max-h-60 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Results */}
        {summary && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Email Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <FaCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{summary.emailsSent.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Emails Sent</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FaUsers className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{summary.usersWithAlerts.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Users with Alerts</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <FaEnvelope className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{summary.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
        )}

        {/* Email Templates */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Email Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Rate Development Alert</h4>
              <p className="text-sm text-gray-600 mb-3">Template for rate change notifications</p>
              <button className="text-[#012C61] hover:text-blue-700 text-sm font-medium">
                Preview Template →
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Legislative Update</h4>
              <p className="text-sm text-gray-600 mb-3">Template for legislative change notifications</p>
              <button className="text-[#012C61] hover:text-blue-700 text-sm font-medium">
                Preview Template →
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
