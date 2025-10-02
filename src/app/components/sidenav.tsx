"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
// Removed Kinde authentication - admin-only site
import {
  Menu,
  X,
  User,
  Settings,
  ChartNoAxesCombined,
  Megaphone,
  ChartColumnStacked,
  ChartLine,
  Table2,
  Shield,
  ChevronDown,
  ChevronRight,
  Pencil,
  Database,
  Mail,
  Home,
  Users,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Admin Rate Developments submenu links
const adminRateDevLinks: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/admin-dashboard/rate-developments/edit", label: "Edit Rate Developments", icon: <Pencil size={16} className="mr-2" /> },
  { href: "/admin-dashboard/rate-developments/update-database", label: "Update Database", icon: <Database size={16} className="mr-2" /> },
  { href: "/admin-dashboard/rate-developments/send-email-alerts", label: "Send Email Alerts", icon: <Mail size={16} className="mr-2" /> },
];

interface SideNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const SideNav = ({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  toggleSidebar,
}: SideNavProps) => {
  const pathname = usePathname();
  const [isClientSide, setIsClientSide] = useState(false);
  // Admin-only site - no authentication needed
  const user = { email: "admin@medirate.com", id: "admin" };
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [rateDevMenuOpen, setRateDevMenuOpen] = useState(false);
  const [rateComparisonMenuOpen, setRateComparisonMenuOpen] = useState(false);

  // Check admin access
  const checkAdminAccess = async () => {
    const userEmail = user?.email ?? "";
    console.log("🔍 Checking admin access for:", userEmail);
    
    if (!userEmail) {
      console.log("❌ No user email found");
      return;
    }

    try {
      console.log("🔍 Using API endpoint to check admin status...");
      
      // Use the existing API endpoint to check admin status
      const response = await fetch("/api/admin-users");
      const result = await response.json();
      
      console.log("🔍 API response:", result);
      
      if (result.isAdmin) {
        console.log("✅ User is admin");
        setIsAdmin(true);
        setAdminCheckComplete(true);
      } else {
        console.log("❌ User is not admin");
        setIsAdmin(false);
        setAdminCheckComplete(true);
      }
    } catch (error) {
      console.log("❌ Unexpected error:", error);
      setIsAdmin(false);
      setAdminCheckComplete(true);
    }
  };

  // Check admin access when user changes
  useEffect(() => {
    if (user?.email) {
      checkAdminAccess();
    }
  }, [user]);

  // Update the tab mapping
  useEffect(() => {
    const tabMapping: { [key: string]: string } = {
      "/home": "home",
      "/recent-rate-changes": "home",
      "/dashboard": "dashboard",
      "/rate-developments": "rateDevelopments",
      "/community-board": "communityBoard",
      "/state-rate-comparison": "stateRateComparison",
      "/settings": "settings",
      "/historical-rates": "historicalRates",
      "/admin-dashboard": "adminDashboard",
    };

    // Match the exact path or paths that start with the base path
    const activeTab = Object.keys(tabMapping).find(key => 
      pathname === key || pathname.startsWith(`${key}/`)
    );

    if (activeTab && tabMapping[activeTab]) {
      setActiveTab(tabMapping[activeTab]);
    }
  }, [pathname, setActiveTab]);

  // Set isClientSide to true after the component mounts
  useEffect(() => {
    setIsClientSide(true);
  }, []);

  // Auto-expand admin submenu if on an admin page
  useEffect(() => {
    if (pathname.startsWith("/admin-dashboard")) {
      setAdminMenuOpen(true);
    }
    if (pathname.startsWith("/admin-dashboard/rate-developments")) {
      setRateDevMenuOpen(true);
    }
  }, [pathname]);

  // Auto-expand submenu if on a subpage
  useEffect(() => {
    if (pathname.startsWith("/state-rate-comparison/all") || pathname.startsWith("/state-rate-comparison/individual")) {
      setRateComparisonMenuOpen(true);
    }
  }, [pathname]);

  return (
    <>
      {/* Only render sidebar on client to avoid hydration mismatch */}
      {isClientSide ? (
        <aside
          className={`transition-all duration-500 ease-in-out shadow-lg ${
            isSidebarCollapsed ? "w-16" : "w-80"
          }`}
          style={{
            backgroundColor: "rgb(1, 44, 97)",
            color: "white",
            position: "fixed", // Keeps it fixed
            top: "5.5rem", // Height of the Navbar
            bottom: "0", // Extend to the bottom of the viewport
            left: 0, // Aligns to the left of the viewport
            height: "calc(100vh - 5.5rem)", // Full height minus navbar
            zIndex: 50, // Ensures it stays above the content
            overflowY: "auto", // Allow scrolling when content overflows
            overflowX: "hidden", // Hide horizontal scroll
          }}
        >
          {/* Sidebar Toggle Button */}
          <div className="flex justify-end p-4">
            <button
              onClick={toggleSidebar}
              className="p-2 text-white hover:bg-gray-800 rounded-md"
            >
              {isClientSide ? (isSidebarCollapsed ? <Menu size={20} /> : <X size={20} />) : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 pb-20">
            <ul className="space-y-2">
              {/* Home */}
              <li className="group">
                <Link
                  href="/home"
                  onClick={() => setActiveTab("home")}
                  className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                    activeTab === "home" ? "bg-gray-200/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <Home size={20} />
                  </div>
                  <span
                    className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                      isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                    }`}
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    Home
                  </span>
                </Link>
              </li>
              <li className="group">
                <Link
                  href="/dashboard"
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                    activeTab === "dashboard" ? "bg-gray-200/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <Table2 size={20} />
                  </div>
                  <span
                    className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                      isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                    }`}
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    Dashboard
                  </span>
                </Link>
              </li>
              {/* State Rate Comparison with submenu */}
              <li className="group">
                <Link
                  href="/state-rate-comparison"
                  onClick={() => setRateComparisonMenuOpen(open => !open)}
                  className={`flex items-center w-full p-4 hover:bg-gray-200/20 transition-colors cursor-pointer focus:outline-none ${
                    pathname.startsWith("/state-rate-comparison") ? "bg-gray-200/20" : ""
                  }`}
                  aria-expanded={rateComparisonMenuOpen}
                  aria-controls="state-rate-comparison-submenu"
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <ChartColumnStacked size={20} />
                  </div>
                  <span
                    className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                      isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                    }`}
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    State Rate Comparison
                  </span>
                  <span className="ml-auto">
                    {rateComparisonMenuOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </span>
                </Link>
                {rateComparisonMenuOpen && !isSidebarCollapsed && (
                  <ul id="state-rate-comparison-submenu" className="ml-8 mt-1 space-y-1 bg-blue-900/80 rounded-lg py-2 shadow-lg">
                    <li>
                      <Link
                        href="/state-rate-comparison/all"
                        onClick={() => setActiveTab("stateRateComparison")}
                        className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 text-sm ${
                          pathname === "/state-rate-comparison/all"
                            ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold shadow"
                            : "text-blue-100 hover:bg-blue-800/80 hover:text-white"
                        }`}
                      >
                        Compare All States
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/state-rate-comparison/individual"
                        onClick={() => setActiveTab("stateRateComparison")}
                        className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 text-sm ${
                          pathname === "/state-rate-comparison/individual"
                            ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold shadow"
                            : "text-blue-100 hover:bg-blue-800/80 hover:text-white"
                        }`}
                      >
                        Compare Individual States
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              <li className="group">
                <Link
                  href="/historical-rates"
                  onClick={() => setActiveTab("historicalRates")}
                  className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                    activeTab === "historicalRates" ? "bg-gray-200/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <ChartLine size={20} />
                  </div>
                  <span
                    className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                      isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                    }`}
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    Rate History
                  </span>
                </Link>
              </li>
              {[
                {
                  tab: "rateDevelopments",
                  icon: <Megaphone size={20} />,
                  label: "Rate Developments",
                  href: "/rate-developments",
                },
                {
                  tab: "communityBoard",
                  icon: <Users size={20} />,
                  label: "Community Board",
                  href: "/community-board",
                },
                {
                  tab: "settings",
                  icon: <Settings size={20} />,
                  label: "Settings",
                  href: "/settings",
                },
              ].map(({ tab, icon, label, href }) => (
                <li key={tab} className="group">
                  <Link
                    href={href}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                      activeTab === tab ? "bg-gray-200/20" : ""
                    }`}
                  >
                    {/* Icon Section */}
                    <div className="flex items-center justify-center w-6 h-6">{icon}</div>
                    {/* Label Section */}
                    <span
                      className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                        isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                      }`}
                      style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {label}
                    </span>
                  </Link>
                </li>
              ))}
              
              {/* Admin Dashboard - Only show if user is admin */}
              {(() => {
                return adminCheckComplete && isAdmin;
              })() && (
                <li className="group">
                  <div className="flex items-center w-full p-4 hover:bg-gray-200/20 transition-colors cursor-pointer">
                    {/* Shield icon and label as a link */}
                    <Link
                      href="/admin-dashboard"
                      onClick={() => setActiveTab("adminDashboard")}
                      className={`flex items-center flex-grow min-w-0 ${
                        pathname === "/admin-dashboard" ? "font-bold text-white" : ""
                      }`}
                      style={{ textDecoration: "none" }}
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <Shield size={20} />
                      </div>
                      <span
                        className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                          isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                        }`}
                        style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        Admin Dashboard
                      </span>
                    </Link>
                    {/* Chevron toggles submenu */}
                    <button
                      type="button"
                      onClick={() => setAdminMenuOpen((open) => !open)}
                      className="ml-2 p-1 focus:outline-none bg-transparent text-white hover:text-blue-200"
                      tabIndex={0}
                      aria-label="Toggle Admin Dashboard submenu"
                    >
                      {adminMenuOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>
                  {/* Rate Developments Submenu */}
                  {adminMenuOpen && !isSidebarCollapsed && (
                    <ul className="ml-8 mt-1 space-y-1 bg-blue-900/80 rounded-lg py-2 shadow-lg">
                      <li>
                        <button
                          type="button"
                          onClick={() => setRateDevMenuOpen((open) => !open)}
                          className={`flex items-center w-full px-4 py-2 rounded-md transition-all duration-200 focus:outline-none mb-1 ${
                            pathname.startsWith("/admin-dashboard/rate-developments")
                              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow"
                              : "text-blue-100 hover:bg-blue-800/80 hover:text-white"
                          }`}
                        >
                          <Megaphone size={18} className="mr-2" />
                          <span className="ml-1">Rate Developments</span>
                          <span className="ml-auto">
                            {rateDevMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                        </button>
                        {/* Third-level submenu */}
                        {rateDevMenuOpen && (
                          <ul className="ml-4 mt-1 space-y-1">
                            {adminRateDevLinks.map((link) => (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  onClick={() => setActiveTab("adminDashboard")}
                                  className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ml-2 text-sm ${
                                    pathname === link.href
                                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold shadow"
                                      : "text-blue-100 hover:bg-blue-800/80 hover:text-white"
                                  }`}
                                >
                                  {link.icon}
                                  <span className="ml-2">{link.label}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                      <li>
                        <Link
                          href="/admin-dashboard/marketing-emails"
                          onClick={() => setActiveTab("adminDashboard")}
                          className={`flex items-center w-full px-4 py-2 rounded-md transition-all duration-200 focus:outline-none ${
                            pathname.startsWith("/admin-dashboard/marketing-emails")
                              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold shadow"
                              : "text-blue-100 hover:bg-blue-800/80 hover:text-white"
                          }`}
                        >
                          <Mail size={18} className="mr-2" />
                          <span className="ml-1">Marketing Emails</span>
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              )}

              <li className="group">
                <Link
                  href="/support"
                  onClick={() => setActiveTab("support")}
                  className={`flex items-center p-4 hover:bg-gray-200/20 transition-colors cursor-pointer ${
                    activeTab === "support" ? "bg-gray-200/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <Mail size={20} />
                  </div>
                  <span
                    className={`ml-4 font-semibold transition-opacity duration-300 ease-in-out flex-grow pr-2 ${
                      isSidebarCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
                    }`}
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    Support
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
      ) : (
        // Server-side placeholder to prevent layout shift
        <aside
          className="transition-all duration-500 ease-in-out shadow-lg w-80"
          style={{
            backgroundColor: "rgb(1, 44, 97)",
            color: "white",
            position: "fixed",
            top: "5.5rem",
            bottom: "0",
            left: 0,
            height: "calc(100vh - 5.5rem)",
            zIndex: 50,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        />
      )}
    </>
  );
};

export default SideNav;
