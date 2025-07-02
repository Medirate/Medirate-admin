"use client";
import { useRouter } from "next/navigation";
import AppLayout from "@/app/components/applayout";

export default function AdminRateDevelopments() {
  const router = useRouter();
  return (
    <AppLayout activeTab="adminDashboard">
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <h1 className="text-3xl sm:text-5xl md:text-6xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
          Rate Developments Admin
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:bg-blue-100 transition" onClick={() => router.push("/admin-dashboard/rate-developments/edit")}> 
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Edit Rate Developments</h2>
            <p className="text-gray-700">Edit and manage rate development entries.</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:bg-blue-100 transition" onClick={() => router.push("/admin-dashboard/rate-developments/update-database")}> 
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Update Database</h2>
            <p className="text-gray-700">Upload or update the rate developments database.</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:bg-blue-100 transition" onClick={() => router.push("/admin-dashboard/rate-developments/send-email-alerts")}> 
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Send Out Email Alerts</h2>
            <p className="text-gray-700">Send email alerts to users about rate developments.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 