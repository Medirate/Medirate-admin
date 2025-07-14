"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import AppLayout from "@/app/components/applayout";
import { Search, LayoutGrid, LayoutList, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaSpinner, FaExclamationCircle, FaSearch, FaSort, FaSortUp, FaSortDown, FaFilter, FaChartLine } from 'react-icons/fa';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { supabase } from "@/lib/supabase";
import { createPortal } from "react-dom";

// Define the type for the datasets
interface Alert {
  subject: string;
  announcement_date: string;
  state?: string | null;
  link?: string | null;
  service_lines_impacted?: string | null;
  service_lines_impacted_1?: string | null;
  service_lines_impacted_2?: string | null;
  service_lines_impacted_3?: string | null;
  summary?: string;
}

interface Bill {
  id: number;
  state: string;
  bill_number: string;
  name: string;
  last_action: string | null;
  action_date: string | null;
  sponsor_list: string[] | null;
  bill_progress: string | null;
  url: string;
  service_lines_impacted?: string | null;
  service_lines_impacted_1?: string | null;
  service_lines_impacted_2?: string | null;
  service_lines_impacted_3?: string | null;
  ai_summary: string;
}

// Map state names to codes
const stateMap: { [key: string]: string } = {
  ALABAMA: "AL",
  ALASKA: "AK",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  FLORIDA: "FL",
  GEORGIA: "GA",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PENNSYLVANIA: "PA",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  VIRGINIA: "VA",
  WASHINGTON: "WA",
  "WEST VIRGINIA": "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
};

// Include reverse mapping for easier access
const reverseStateMap = Object.fromEntries(
  Object.entries(stateMap).map(([key, value]) => [value, key])
);

// Add these new interfaces after your existing interfaces
interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}

// Add this new component before your main component
function CustomDropdown({ value, onChange, options, placeholder }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update menu position when opening
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="w-full px-4 py-2 bg-white border border-blue-300 rounded-md text-gray-800 focus:outline-none cursor-pointer flex justify-between items-center"
           onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption?.label || placeholder}</span>
        <div className="flex items-center">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="mr-2 hover:text-gray-200 focus:outline-none cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </span>
          )}
          <span>▼</span>
        </div>
      </div>
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-white border border-blue-300 rounded-md shadow-lg z-[99999]" 
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            backgroundColor: '#fff'
          }}
        >
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className="px-4 py-2 cursor-pointer hover:bg-blue-100 text-gray-800 bg-white"
                style={{backgroundColor: '#fff'}}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string; 
}) {
  return (
    <div className="flex items-center w-full">
      <div className="flex items-center w-full px-4 py-2 bg-white border border-blue-300 rounded-md">
        <Search size={20} className="text-gray-800 mr-2" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none placeholder-gray-600 text-gray-800 focus:outline-none"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-gray-800 hover:text-gray-200 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Add these helper functions before the RateDevelopments component
const searchInFields = (searchText: string, fields: (string | null | undefined)[]): boolean => {
  const normalizedSearch = searchText.toLowerCase().trim();
  if (!normalizedSearch) return true;
  
  return fields.some(field => 
    field?.toLowerCase().includes(normalizedSearch)
  );
};

// Add a helper function to get service lines for alerts
const getAlertServiceLines = (alert: Alert) => {
  return [
    alert.service_lines_impacted,
    alert.service_lines_impacted_1,
    alert.service_lines_impacted_2,
    alert.service_lines_impacted_3
  ]
    .filter(line => line && line.toUpperCase() !== 'NULL')
    .join(", ");
};

// Utility: Convert Excel serial date or string to MM/DD/YYYY
function formatExcelOrStringDate(val: any): string {
  if (val == null || val === "") return "";
  // If it's a number or a string that looks like a number (Excel serial)
  const serial = typeof val === "number" ? val : (typeof val === "string" && /^\d{5,6}$/.test(val.trim()) ? parseInt(val, 10) : null);
  if (serial && serial > 20000 && serial < 90000) { // Excel serial range
    // Excel's epoch starts at 1899-12-31, but there is a bug for 1900 leap year, so add 1
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + serial * 86400000);
    // If the date is within 2 years of today, it's probably correct
    const now = new Date();
    if (Math.abs(date.getTime() - now.getTime()) < 2 * 365 * 86400000) {
      return date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    }
  }
  // Try parsing as a date string (prefer US format)
  let d = new Date(val);
  if (!isNaN(d.getTime())) {
    // If the date is within 2 years of today, it's probably correct
    const now = new Date();
    if (Math.abs(d.getTime() - now.getTime()) < 2 * 365 * 86400000) {
      return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    }
  }
  // Fallback: just return as string
  return String(val);
}

export default function RateDevelopments() {
  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();
  const router = useRouter();

  // Add authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/api/auth/login");
    } else if (isAuthenticated) {
      checkSubscriptionAndSubUser();
    }
  }, [isAuthenticated, isLoading, router]);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const [providerSearch, setProviderSearch] = useState<string>("");
  const [legislativeSearch, setLegislativeSearch] = useState<string>("");

  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedServiceLine, setSelectedServiceLine] = useState<string>("");

  const [selectedBillProgress, setSelectedBillProgress] = useState<string>("");

  const [layout, setLayout] = useState<"vertical" | "horizontal">("horizontal");
  const [activeTable, setActiveTable] = useState<"provider" | "legislative">("provider");

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null); // For the pop-up modal
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState("");

  const [sortDirection, setSortDirection] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'announcement_date', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("providerBulletins");
  const [isSubscriptionCheckComplete, setIsSubscriptionCheckComplete] = useState(false);

  const [serviceLines, setServiceLines] = useState<string[]>([]);
  useEffect(() => {
    const fetchServiceCategories = async () => {
      const { data, error } = await supabase.from("service_category_list").select("categories");
      if (!error && data) {
        setServiceLines(data.map((row: any) => row.categories));
      }
    };
    fetchServiceCategories();
  }, []);

  const uniqueServiceLines = useMemo(() => Array.from(new Set(serviceLines)), [serviceLines]);

  // Add subscription check function
  const checkSubscriptionAndSubUser = async () => {
    const userEmail = user?.email ?? "";
    const kindeUserId = user?.id ?? "";
    
    if (!userEmail || !kindeUserId) {
      return;
    }

    try {
      // Check if the user is a sub-user
      const { data: subUserData, error: subUserError } = await supabase
        .from("subscription_users")
        .select("sub_users")
        .contains("sub_users", JSON.stringify([userEmail]));

      if (subUserError) {
        return;
      }

      if (subUserData && subUserData.length > 0) {
        // Check if the user already exists in the User table
        const { data: existingUser, error: fetchError } = await supabase
          .from("User")
          .select("Email")
          .eq("Email", userEmail)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") { // Ignore "no rows found" error
          return;
        }

        if (existingUser) {
          // User exists, update their role to "sub-user"
          const { error: updateError } = await supabase
            .from("User")
            .update({ Role: "sub-user", UpdatedAt: new Date().toISOString() })
            .eq("Email", userEmail);

          if (updateError) {
          } else {
          }
        } else {
          // User does not exist, insert them as a sub-user
          const { error: insertError } = await supabase
            .from("User")
            .insert({
              KindeUserID: kindeUserId,
              Email: userEmail,
              Role: "sub-user",
              UpdatedAt: new Date().toISOString(),
            });

          if (insertError) {
          } else {
          }
        }

        // Allow sub-user to access the dashboard
        setIsSubscriptionCheckComplete(true);
        fetchData(); // Fetch data after successful check
        return;
      }

      // If not a sub-user, check for an active subscription
      const response = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (data.error || data.status === 'no_customer' || data.status === 'no_subscription' || data.status === 'no_items') {
        router.push("/subscribe");
      } else {
        setIsSubscriptionCheckComplete(true);
        fetchData(); // Fetch data after successful check
      }
    } catch (error) {
      router.push("/subscribe");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    // Fetch Provider Alerts from Supabase
    const { data: providerAlerts, error: providerError } = await supabase
      .from("provider_alerts")
      .select("*")
      .order("announcement_date", { ascending: false });
    if (providerError) {
      setAlerts([]);
    } else {
      setAlerts(providerAlerts || []);
    }

    // Fetch Legislative Updates from Supabase
    const { data: billsData, error: billsError } = await supabase
      .from("bill_track_50")
      .select("*");
    if (billsError) {
      setBills([]);
    } else {
      setBills(billsData || []);
    }
    setLoading(false);
  };

  // Function to toggle sort direction
  const toggleSort = (field: string) => {
    setSortDirection(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sorting logic for provider alerts with date validation and proper arithmetic operation
  const sortedProviderAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      if (sortDirection.field === 'state') {
        if (a.state && b.state) {
          return sortDirection.direction === 'asc' ? a.state.localeCompare(b.state) : b.state.localeCompare(a.state);
        }
      } else if (sortDirection.field === 'announcement_date') {
        const dateA = a.announcement_date ? new Date(a.announcement_date).getTime() : 0; // Convert to timestamp or use 0 if invalid
        const dateB = b.announcement_date ? new Date(b.announcement_date).getTime() : 0; // Convert to timestamp or use 0 if invalid
        return sortDirection.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [alerts, sortDirection]);

  // Sorting logic for legislative updates with date validation and proper arithmetic operation
  const sortedLegislativeUpdates = useMemo(() => {
    return [...bills].sort((a, b) => {
      if (sortDirection.field === 'state') {
        // Ensure both a.state and b.state are not null or undefined before comparing
        const stateA = a.state || ""; // Fallback to empty string if null or undefined
        const stateB = b.state || ""; // Fallback to empty string if null or undefined
        return sortDirection.direction === 'asc' ? stateA.localeCompare(stateB) : stateB.localeCompare(stateA);
      } else if (sortDirection.field === 'action_date') {
        const dateA = a.action_date ? new Date(a.action_date).getTime() : 0;
        const dateB = b.action_date ? new Date(b.action_date).getTime() : 0;
        return sortDirection.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [bills, sortDirection]);

  // Update the filtered data logic to use sorted arrays
  const filteredProviderAlerts = sortedProviderAlerts.filter((alert) => {
    const matchesSearch = !providerSearch || searchInFields(providerSearch, [
      alert.subject,
      alert.summary
    ]);

    const matchesState = !selectedState || 
      alert.state === reverseStateMap[selectedState];

    const matchesServiceLine = !selectedServiceLine || 
      [
        alert.service_lines_impacted,
        alert.service_lines_impacted_1,
        alert.service_lines_impacted_2,
        alert.service_lines_impacted_3,
      ].some(line => line?.includes(selectedServiceLine));

    return matchesSearch && matchesState && matchesServiceLine;
  });

  // Update the filteredLegislativeUpdates logic to include bill progress filter
  const filteredLegislativeUpdates = sortedLegislativeUpdates.filter((bill) => {
    const matchesSearch = !legislativeSearch || searchInFields(legislativeSearch, [
      bill.name,
      bill.bill_number,
      bill.last_action,
      ...(bill.sponsor_list || [])
    ]);

    const matchesState = !selectedState || 
      bill.state === selectedState;

    const matchesServiceLine = !selectedServiceLine || 
      [
        bill.service_lines_impacted,
        bill.service_lines_impacted_1,
        bill.service_lines_impacted_2
      ].some(line => line?.includes(selectedServiceLine));

    const matchesBillProgress = !selectedBillProgress || 
      bill.bill_progress?.includes(selectedBillProgress);

    return matchesSearch && matchesState && matchesServiceLine && matchesBillProgress;
  });

  const getServiceLines = (bill: Bill) => {
    return [
      bill.service_lines_impacted,
      bill.service_lines_impacted_1,
      bill.service_lines_impacted_2,
      bill.service_lines_impacted_3
    ]
      .filter(line => line && line.toUpperCase() !== 'NULL')
      .join(", ");
  };

  // Function to handle click on bill name
  const handleBillClick = (bill: Bill) => {
    setPopupContent(bill.ai_summary);
    setShowPopup(true);
  };

  // 1. Add a state to track previous data and changed cells
  const [prevAlerts, setPrevAlerts] = useState<Alert[]>([]);
  const [prevBills, setPrevBills] = useState<Bill[]>([]);
  const [highlightedCells, setHighlightedCells] = useState<{ [rowKey: string]: string[] }>({});

  // 2. When new data is fetched, compare to previous and highlight changed cells
  useEffect(() => {
    if (!loading) {
      const newHighlights: { [rowKey: string]: string[] } = {};
      // Provider Alerts
      alerts.forEach((alert, idx) => {
        const prev = prevAlerts[idx];
        if (!prev) return;
        Object.keys(alert).forEach(key => {
          if ((alert as any)[key] !== (prev as any)[key]) {
            if (!newHighlights[`alert-${idx}`]) newHighlights[`alert-${idx}`] = [];
            newHighlights[`alert-${idx}`].push(key);
          }
        });
      });
      // Bills
      bills.forEach((bill, idx) => {
        const prev = prevBills[idx];
        if (!prev) return;
        Object.keys(bill).forEach(key => {
          if ((bill as any)[key] !== (prev as any)[key]) {
            if (!newHighlights[`bill-${idx}`]) newHighlights[`bill-${idx}`] = [];
            newHighlights[`bill-${idx}`].push(key);
          }
        });
      });
      setHighlightedCells(newHighlights);
      setPrevAlerts(alerts);
      setPrevBills(bills);
    }
  }, [alerts, bills, loading]);

  if (isLoading || !isSubscriptionCheckComplete) {
    return (
      <div className="loader-overlay">
        <div className="cssloader">
          <div className="sh1"></div>
          <div className="sh2"></div>
          <h4 className="lt">loading</h4>
        </div>
      </div>
    );
  }

  return (
    <AppLayout activeTab="rateDevelopments">
      <h1 className="text-5xl md:text-6xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
        Rate Developments
      </h1>

      {/* Search Bars and Filters Container */}
      <div className="mb-10 p-6 sm:p-10 bg-white rounded-3xl shadow-2xl border border-blue-200 transition-transform duration-200 hover:scale-[1.015] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Left Column: Provider Alerts Filters */}
          <div className="flex-1 flex flex-col gap-5">
            <span className="text-xs uppercase tracking-wider text-[#012C61] font-lemonMilkRegular mb-1 ml-1">Provider Alerts Filters</span>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
              <input
                type="text"
                value={providerSearch}
                onChange={e => setProviderSearch(e.target.value)}
                placeholder="Search Provider Alerts by subject or summary"
                className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all placeholder-gray-500 text-base shadow-sm"
              />
            </div>
            <div className="relative pl-10">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
              <CustomDropdown
                value={selectedState}
                onChange={setSelectedState}
                options={[
                  { value: "", label: "All States" },
                  ...Object.entries(stateMap).map(([name, code]) => ({
                    value: code,
                    label: `${name} [${code}]`
                  }))
                ]}
                placeholder="All States"
              />
            </div>
          </div>

          {/* Divider for md+ screens */}
          <div className="hidden md:block w-px bg-blue-100 mx-4 my-2 rounded-full" />

          {/* Right Column: Legislative Updates Filters */}
          <div className="flex-1 flex flex-col gap-5">
            <span className="text-xs uppercase tracking-wider text-[#012C61] font-lemonMilkRegular mb-1 ml-1">Legislative Updates Filters</span>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
              <input
                type="text"
                value={legislativeSearch}
                onChange={e => setLegislativeSearch(e.target.value)}
                placeholder="Search Legislative Updates by Bill Name or Bill Number"
                className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all placeholder-gray-500 text-base shadow-sm"
              />
            </div>
            <div className="relative pl-10">
              <FaChartLine className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
              <CustomDropdown
                value={selectedServiceLine}
                onChange={setSelectedServiceLine}
                options={[
                  { value: "", label: "All Service Lines" },
                  ...uniqueServiceLines.map(line => ({ value: line, label: line }))
                ]}
                placeholder="All Service Lines"
              />
            </div>
            <div className="relative pl-10">
              <LayoutList className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
              <CustomDropdown
                value={selectedBillProgress}
                onChange={setSelectedBillProgress}
                options={[
                  { value: "", label: "All Bill Progress" },
                  { value: "Introduced", label: "Introduced" },
                  { value: "In Committee", label: "In Committee" },
                  { value: "Passed", label: "Passed" },
                  { value: "Failed", label: "Failed" },
                  { value: "Vetoed", label: "Vetoed" },
                  { value: "Enacted", label: "Enacted" }
                ]}
                placeholder="All Bill Progress"
              />
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .search-bar-input, .custom-dropdown {
          font-size: 1.1rem;
          padding: 0.75rem 1rem;
        }
        @media (max-width: 768px) {
          .rounded-3xl { border-radius: 1.25rem !important; }
        }
      `}</style>

      {/* Layout Toggle Buttons, Filters, and Table Switch */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setLayout("vertical")}
            className={`p-2 rounded-md flex items-center ${
              layout === "vertical" ? "bg-[#004aad] text-white" : "bg-gray-200"
            }`}
            style={{ height: "40px" }}
          >
            <LayoutGrid size={20} className="mr-2" />
            <span>Vertical Layout</span>
          </button>
          <button
            onClick={() => setLayout("horizontal")}
            className={`p-2 rounded-md flex items-center ${
              layout === "horizontal" ? "bg-[#004aad] text-white" : "bg-gray-200"
            }`}
            style={{ height: "40px" }}
          >
            <LayoutList size={20} className="mr-2" />
            <span>Horizontal Layout</span>
          </button>
        </div>

        {/* Table Switch */}
        <div className={`flex items-center space-x-2 z-10 relative`}
          style={{ zIndex: 10 }}
        >
          <span className="text-sm text-gray-700">Provider Alerts</span>
          <button
            onClick={() =>
              setActiveTable(activeTable === "provider" ? "legislative" : "provider")
            }
            className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none"
            style={{ backgroundColor: "#004aad" }}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                activeTable === "provider" ? "translate-x-1" : "translate-x-6"
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">Legislative Updates</span>
        </div>
      </div>

      {/* Update the note about sorting and summaries */}
      <div className="mb-4 text-sm text-gray-600">
        <p>
          <strong>Note:</strong> Click on the column headings (State, Announcement Date, Action Date) to sort the data. 
          Also, clicking on a bill name in the Legislative Updates table will display an AI-generated summary, 
          while clicking on a subject in the Provider Alerts table will display a summary of the alert.
        </p>
      </div>

      {/* Tables */}
      {layout === "vertical" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Provider Alerts Table */}
          <div>
            <h2 className="text-xl font-semibold text-[#012C61] mb-2">
              Provider Alerts
            </h2>
            <div className="border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('state')}>
                      State
                      {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('announcement_date')}>
                      Announcement Date
                      {sortDirection.field === 'announcement_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Subject
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Service Lines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviderAlerts.map((alert, index) => (
                    <tr key={index} className="border-b hover:bg-gray-100">
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {alert.state || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(alert.announcement_date)}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        <div className="flex items-center">
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={() => {
                              if (alert.summary) {
                                setPopupContent(alert.summary);
                                setShowPopup(true);
                              }
                            }}
                          >
                            {alert.subject || ""}
                          </span>
                          {alert.link && (
                            <a
                              href={alert.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:underline"
                            >
                              [Read More]
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {getAlertServiceLines(alert)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legislative Updates Table */}
          <div>
            <h2 className="text-xl font-semibold text-[#012C61] mb-2">
              Legislative Updates
            </h2>
            <div className="border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('state')}>
                      State
                      {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('action_date')}>
                      Action Date
                      {sortDirection.field === 'action_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      State Bill ID
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Bill Name
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Last Action
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Sponsors
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Progress
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Service Lines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLegislativeUpdates.map((bill, index) => (
                    <tr key={index} className="border-b hover:bg-gray-100">
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {reverseStateMap[bill.state] || bill.state}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(bill.action_date)}
                      </td>
                      <td className="p-4 text-sm text-blue-500 border-b">
                        <a
                          href={bill.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {bill.bill_number || ""}
                        </a>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() => handleBillClick(bill)}
                        >
                          {bill.name || ""}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.last_action || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.sponsor_list && Array.isArray(bill.sponsor_list) 
                          ? bill.sponsor_list.join(", ") 
                          : bill.sponsor_list || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.bill_progress || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {getServiceLines(bill)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden">
          {/* Table Heading */}
          <h2 className="text-xl font-semibold text-[#012C61] mb-2">
            {activeTable === "provider" ? "Provider Alerts" : "Legislative Updates"}
          </h2>

          {/* Tables Container with Animation */}
          <div className="flex transition-transform duration-300 ease-in-out" style={{
            transform: `translateX(${activeTable === "provider" ? "0%" : "-100%"})`
          }}>
            {/* Provider Alerts Table */}
            <div className="min-w-full border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg relative">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('state')}>
                      State
                      {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('announcement_date')}>
                      Announcement Date
                      {sortDirection.field === 'announcement_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Subject
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Service Lines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviderAlerts.map((alert, index) => (
                    <tr key={index} className="border-b hover:bg-gray-100">
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {alert.state || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(alert.announcement_date)}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        <div className="flex items-center">
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={() => {
                              if (alert.summary) {
                                setPopupContent(alert.summary);
                                setShowPopup(true);
                              }
                            }}
                          >
                            {alert.subject || ""}
                          </span>
                          {alert.link && (
                            <a
                              href={alert.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:underline"
                            >
                              [Read More]
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {getAlertServiceLines(alert)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legislative Updates Table */}
            <div className="min-w-full border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg relative">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('state')}>
                      State
                      {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('action_date')}>
                      Action Date
                      {sortDirection.field === 'action_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      State Bill ID
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Bill Name
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Last Action
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Sponsors
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Progress
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Service Lines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLegislativeUpdates.map((bill, index) => (
                    <tr key={index} className="border-b hover:bg-gray-100">
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {reverseStateMap[bill.state] || bill.state}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(bill.action_date)}
                      </td>
                      <td className="p-4 text-sm text-blue-500 border-b">
                        <a
                          href={bill.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {bill.bill_number || ""}
                        </a>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() => handleBillClick(bill)}
                        >
                          {bill.name || ""}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.last_action || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.sponsor_list && Array.isArray(bill.sponsor_list) 
                          ? bill.sponsor_list.join(", ") 
                          : bill.sponsor_list || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.bill_progress || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {getServiceLines(bill)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Popup for AI Summary */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded-lg max-w-lg w-full">
            <h3 className="text-lg font-bold">
              {popupContent === alerts.find(a => a.summary === popupContent)?.summary 
                ? "Summary" 
                : "AI Summary"}
            </h3>
            <p>{popupContent}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}