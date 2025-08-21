"use client";

import { useState } from "react";
import AppLayout from "@/app/components/applayout";
import EmailPreferences from "@/app/email-preferences/page";
import Profile from "@/app/profile/page";
import Subscription from "@/app/subscription/page";
import { useRequireSubscription } from "@/hooks/useRequireAuth";

export default function Settings() {
  const auth = useRequireSubscription();

  const [activeTab, setActiveTab] = useState("profile");

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <Profile />;
      case "email-preferences":
        return <EmailPreferences />;
      case "subscription":
        return <Subscription />;
      default:
        return <Profile />;
    }
  };

  if (auth.isLoading || auth.shouldRedirect) {
    return null; // or a loading spinner
  }

  return (
    <AppLayout activeTab="settings">
              <h1 className="text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-8 text-center">
        Settings
      </h1>

      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "profile"
                ? "border-b-2 border-[#012C61] text-[#012C61]"
                : "text-gray-500 hover:text-[#012C61]"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("email-preferences")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "email-preferences"
                ? "border-b-2 border-[#012C61] text-[#012C61]"
                : "text-gray-500 hover:text-[#012C61]"
            }`}
          >
            Email Alerts
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "subscription"
                ? "border-b-2 border-[#012C61] text-[#012C61]"
                : "text-gray-500 hover:text-[#012C61]"
            }`}
          >
            Subscription
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {renderTabContent()}
        </div>
      </div>
    </AppLayout>
  );
}
