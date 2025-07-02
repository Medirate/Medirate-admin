"use client";
import { useState } from "react";
import AppLayout from "@/app/components/applayout";

export default function SendEmailAlertsPage() {
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
      const response = await fetch("/api/admin/send-email-alerts", { 
        method: "POST" 
      });
      const data = await response.json();
      
      setLogs(data.logs || []);
      setSuccess(data.success);
      
      if (data.success) {
        setSummary({
          emailsSent: data.emailsSent || 0,
          usersWithAlerts: data.usersWithAlerts || 0,
          totalUsers: data.totalUsers || 0
        });
      }
    } catch (error: any) {
      setLogs([`❌ Error: ${error.message}`]);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout activeTab="adminDashboard">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
          Send Email Notifications
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <p className="text-gray-700 mb-4">
            This will send personalized email notifications to users based on their preferences 
            and the new alerts (is_new = 'yes') in the database.
          </p>
          
          <button
            onClick={handleSendEmails}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Email Notifications...
              </div>
            ) : (
              '📧 Send Email Notifications'
            )}
          </button>
        </div>

        {/* Summary Card */}
        {summary && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Email Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.totalUsers}</div>
                <div className="text-sm text-green-700">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.usersWithAlerts}</div>
                <div className="text-sm text-blue-700">Users with Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.emailsSent}</div>
                <div className="text-sm text-purple-700">Emails Sent</div>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {success === true && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-green-600 mr-2">✅</div>
              <span className="text-green-800 font-semibold">
                Email notifications sent successfully!
              </span>
            </div>
          </div>
        )}
        
        {success === false && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">❌</div>
              <span className="text-red-800 font-semibold">
                Error sending email notifications.
              </span>
            </div>
          </div>
        )}

        {/* Logs Section */}
        {logs.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#012C61] mb-4 flex items-center">
              📝 Processing Logs
              <span className="ml-2 text-sm text-gray-500">({logs.length} entries)</span>
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => {
                const isError = log.includes('❌');
                const isSuccess = log.includes('✅');
                const isWarning = log.includes('⚠️');
                const isInfo = log.includes('ℹ️');
                
                let textColor = 'text-gray-700';
                if (isError) textColor = 'text-red-600 font-semibold';
                else if (isSuccess) textColor = 'text-green-600 font-semibold';
                else if (isWarning) textColor = 'text-yellow-600 font-semibold';
                else if (isInfo) textColor = 'text-blue-600 font-semibold';
                
                return (
                  <div key={index} className={`${textColor} mb-1`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 