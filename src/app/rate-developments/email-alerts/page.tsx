"use client";

import AppLayout from "@/app/components/applayout";

export default function RateDevelopmentsEmailAlerts() {
  return (
    <AppLayout activeTab="adminDashboard">
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
          Rate Developments Email Alerts
        </h1>
        <p className="text-lg text-gray-700 mb-4">
          This page will allow you to manage and configure email alerts for rate developments. (Coming soon)
        </p>
      </div>
    </AppLayout>
  );
} 