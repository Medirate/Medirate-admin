"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import AppLayout from "@/app/components/applayout";
import { Search, LayoutGrid, LayoutList, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { FaSpinner, FaExclamationCircle, FaSearch, FaSort, FaSortUp, FaSortDown, FaFilter, FaChartLine } from 'react-icons/fa';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define the type for the datasets
interface Alert {
  id: string;
  subject: string;
  announcement_date: string;
  state?: string | null;
  link?: string | null;
  service_lines_impacted?: string | null;
  service_lines_impacted_1?: string | null;
  service_lines_impacted_2?: string | null;
  service_lines_impacted_3?: string | null;
  summary?: string;
  is_new: string;
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
  is_new: string;
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

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="w-full px-4 py-2 bg-[#4682d1] rounded-md text-white focus:outline-none cursor-pointer flex justify-between items-center"
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
      {isOpen && (
        <div className="absolute w-full mt-1 bg-[#4682d1] border border-[#4682d1] rounded-md shadow-lg z-50">
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className="px-4 py-2 cursor-pointer hover:bg-[#004aad] text-white"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
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
      <div className="flex items-center w-full px-4 py-2 bg-[#4682d1] rounded-md">
        <Search size={20} className="text-white mr-2" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none placeholder-white text-white focus:outline-none"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-white hover:text-gray-200 focus:outline-none"
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

// Add this new component after the CustomDropdown component
function ServiceLinesDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: { label: string; value: string }[]; 
  placeholder: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none cursor-pointer flex justify-between items-center"
           onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption?.label || placeholder}</span>
        <div className="flex items-center">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="mr-2 hover:text-gray-500 focus:outline-none cursor-pointer"
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
      {isOpen && (
        <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-700"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add this new component for multi-select service lines
function MultiServiceLinesDropdown({ 
  values, 
  onChange, 
  options, 
  placeholder 
}: { 
  values: string[]; 
  onChange: (values: string[]) => void; 
  options: { label: string; value: string }[]; 
  placeholder: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selectedOptions = options.filter(opt => values.includes(opt.value));

  const handleSelect = (value: string) => {
    if (values.includes(value)) {
      // Remove if already selected
      onChange(values.filter(v => v !== value));
    } else if (values.length < 3) {
      // Add if less than 3 selected
      onChange([...values, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(values.filter(v => v !== value));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none cursor-pointer flex justify-between items-center"
           onClick={() => setIsOpen(!isOpen)}>
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option, index) => (
              <span
                key={`${option.value}-${index}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                {option.label}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(option.value);
                  }}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <span>▼</span>
      </div>
      {isOpen && (
        <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-700 ${
                  values.includes(option.value) ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
                {values.includes(option.value) && (
                  <span className="ml-2 text-blue-600">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function for is_new text logic
const isNew = (val: any) => {
  if (!val) return false;
  const v = String(val).trim().toLowerCase();
  return v === "yes" || v === "true" || v === "1" || v === "y" || v === "new";
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
  const [serviceCategories, setServiceCategories] = useState<{ id: string; categories: string }[]>([]);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState<string>("");

  const [newCategory, setNewCategory] = useState("");

  // Update the edit state to handle multiple service lines
  const [editingProviderServiceLines, setEditingProviderServiceLines] = useState<string[]>([]);
  const [editingBillServiceLines, setEditingBillServiceLines] = useState<string[]>([]);

  // 1. Add a state to track highlighted cells
  const [highlightedCells, setHighlightedCells] = useState<{ [rowKey: string]: string[] }>({});

  useEffect(() => {
    const fetchServiceCategories = async () => {
      const { data, error } = await supabase.from("service_category_list").select("id, categories");
      if (!error && data) {
        setServiceCategories(data);
      }
    };
    fetchServiceCategories();
  }, []);

  const uniqueServiceLines = useMemo(() => Array.from(new Set(serviceLines)), [serviceLines]);

  // Deduplicate and normalize serviceCategories for dropdown options
  const normalizedServiceLineOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    for (const cat of serviceCategories) {
      const norm = cat.categories.trim().toLowerCase();
      if (!seen.has(norm)) {
        seen.add(norm);
        options.push({ label: cat.categories.trim(), value: cat.categories.trim() });
      }
    }
    return options;
  }, [serviceCategories]);

  // Add subscription check function
  const checkSubscriptionAndSubUser = async () => {
    const userEmail = user?.email ?? "";
    const kindeUserId = user?.id ?? "";
    console.log('🔍 Checking subscription for:', { userEmail, kindeUserId });
    
    if (!userEmail || !kindeUserId) {
      console.log('❌ Missing user email or ID');
      return;
    }

    try {
      // Check if the user is a sub-user
      console.log('🔍 Checking if user is a sub-user...');
      const { data: subUserData, error: subUserError } = await supabase
        .from("subscription_users")
        .select("sub_users")
        .contains("sub_users", JSON.stringify([userEmail]));

      if (subUserError) {
        console.error("❌ Error checking sub-user:", subUserError);
        console.error("Full error object:", JSON.stringify(subUserError, null, 2));
        return;
      }

      console.log('📊 Sub-user check result:', { subUserData });

      if (subUserData && subUserData.length > 0) {
        console.log('✅ User is a sub-user, checking User table...');
        // Check if the user already exists in the User table
        const { data: existingUser, error: fetchError } = await supabase
          .from("User")
          .select("Email")
          .eq("Email", userEmail)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") { // Ignore "no rows found" error
          console.error("❌ Error fetching user:", fetchError);
          return;
        }

        console.log('📊 Existing user check result:', { existingUser });

        if (existingUser) {
          console.log('🔄 Updating existing user role to sub-user...');
          // User exists, update their role to "sub-user"
          const { error: updateError } = await supabase
            .from("User")
            .update({ Role: "sub-user", UpdatedAt: new Date().toISOString() })
            .eq("Email", userEmail);

          if (updateError) {
            console.error("❌ Error updating user role:", updateError);
          } else {
            console.log("✅ User role updated to sub-user:", userEmail);
          }
        } else {
          console.log('➕ Inserting new sub-user...');
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
            console.error("❌ Error inserting sub-user:", insertError);
          } else {
            console.log("✅ Sub-user inserted successfully:", userEmail);
          }
        }

        // Allow sub-user to access the dashboard
        console.log('✅ Sub-user access granted');
        setIsSubscriptionCheckComplete(true);
        fetchData(); // Fetch data after successful check
        return;
      }

      // If not a sub-user, check for an active subscription
      console.log('🔍 Checking for active subscription...');
      const response = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      console.log('📊 Subscription check result:', data);

      if (data.error || data.status === 'no_customer' || data.status === 'no_subscription' || data.status === 'no_items') {
        console.log('❌ No active subscription, redirecting to subscribe page');
        router.push("/subscribe");
      } else {
        console.log('✅ Active subscription found');
        setIsSubscriptionCheckComplete(true);
        fetchData(); // Fetch data after successful check
      }
    } catch (error) {
      console.error("❌ Error in subscription check:", error);
      console.log('❌ Redirecting to subscribe page due to error');
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
      console.error("Error fetching provider alerts from Supabase:", providerError);
      setAlerts([]);
    } else {
      setAlerts(providerAlerts || []);
    }

    // Fetch Legislative Updates from Supabase
    const { data: billsData, error: billsError } = await supabase
      .from("bill_track_50")
      .select("*");
    if (billsError) {
      console.error("Error fetching legislative updates from Supabase:", billsError);
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
      alert.subject
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

  // Add edit state at the top of the component
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [editingProviderValues, setEditingProviderValues] = useState<Partial<Alert>>({});
  const [editingBillUrl, setEditingBillUrl] = useState<string | null>(null);
  const [editingBillValues, setEditingBillValues] = useState<Partial<Bill>>({});
  const [sponsorListEdit, setSponsorListEdit] = useState<string>("");

  // Update the save functions to handle multiple service lines
  const handleSaveProviderEdit = async () => {
    const serviceLinesData = {
      service_lines_impacted: editingProviderServiceLines[0] || null,
      service_lines_impacted_1: editingProviderServiceLines[1] || null,
      service_lines_impacted_2: editingProviderServiceLines[2] || null,
    };
    const prevAlert = alerts.find(a => a.id === editingProviderId);
    setAlerts(alerts =>
      alerts.map(alert =>
        alert.id === editingProviderId
          ? { ...alert, ...editingProviderValues, ...serviceLinesData }
          : alert
      )
    );
    if (editingProviderId) {
      await supabase
        .from("provider_alerts")
        .update({ ...editingProviderValues, ...serviceLinesData })
        .eq("id", editingProviderId);
    }
    // Highlight changed cells
    if (prevAlert) {
      const changed: string[] = [];
      Object.keys({ ...editingProviderValues, ...serviceLinesData }).forEach(key => {
        if ((prevAlert as any)[key] !== (editingProviderValues as any)[key]) {
          changed.push(key);
        }
      });
      if (changed.length > 0) {
        setHighlightedCells(cells => ({ ...cells, [editingProviderId!]: changed }));
      }
    }
    setEditingProviderId(null);
    setEditingProviderValues({});
    setEditingProviderServiceLines([]);
  };

  const handleSaveBillEdit = async () => {
    const sponsorListArray = sponsorListEdit.split(",").map(s => s.trim()).filter(Boolean);
    const serviceLinesData = {
      service_lines_impacted: editingBillServiceLines[0] || null,
      service_lines_impacted_1: editingBillServiceLines[1] || null,
      service_lines_impacted_2: editingBillServiceLines[2] || null,
    };
    const prevBill = bills.find(b => b.url === editingBillUrl);
    setBills(bills =>
      bills.map(bill =>
        bill.url === editingBillUrl
          ? { ...bill, ...editingBillValues, sponsor_list: sponsorListArray, ...serviceLinesData }
          : bill
      )
    );
    if (editingBillUrl) {
      await supabase
        .from("bill_track_50")
        .update({ ...editingBillValues, sponsor_list: sponsorListArray, ...serviceLinesData })
        .eq("url", editingBillUrl);
    }
    // Highlight changed cells
    if (prevBill) {
      const changed: string[] = [];
      Object.keys({ ...editingBillValues, ...serviceLinesData }).forEach(key => {
        if ((prevBill as any)[key] !== (editingBillValues as any)[key]) {
          changed.push(key);
        }
      });
      if (changed.length > 0) {
        setHighlightedCells(cells => ({ ...cells, [editingBillUrl!]: changed }));
      }
    }
    setEditingBillUrl(null);
    setEditingBillValues({});
    setSponsorListEdit("");
    setEditingBillServiceLines([]);
  };

  const handleSaveCategoryEdit = async () => {
    if (!editingCategoryId) return;
    await supabase
      .from("service_category_list")
      .update({ categories: editingCategoryValue })
      .eq("id", editingCategoryId);
    setServiceCategories(cats =>
      cats.map(cat =>
        cat.id === editingCategoryId ? { ...cat, categories: editingCategoryValue } : cat
      )
    );
    setEditingCategoryId(null);
    setEditingCategoryValue("");
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const { data, error } = await supabase
      .from("service_category_list")
      .insert({ categories: newCategory.trim() })
      .select();
    if (!error && data && data.length > 0) {
      setServiceCategories(cats => [...cats, data[0]]);
    setNewCategory("");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await supabase.from("service_category_list").delete().eq("id", id);
    setServiceCategories(cats => cats.filter(cat => cat.id !== id));
  };

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
      <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: "#004aad" }}>
        <div className="flex flex-col gap-4">
          {/* Search Bars Row - Make it responsive */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Provider Search */}
            <div className="flex-1 min-w-0">
              <SearchBar
                value={providerSearch}
                onChange={setProviderSearch}
                placeholder="Search Provider Alerts by subject"
              />
            </div>

            {/* Legislative Search */}
            <div className="flex-1 min-w-0">
              <SearchBar
                value={legislativeSearch}
                onChange={setLegislativeSearch}
                placeholder="Search Legislative Updates by Bill Name or Bill Number"
              />
            </div>
          </div>

          {/* Filters Row - Make it responsive */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 min-w-0">
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

            <div className="flex-1 min-w-0">
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

            {/* Add this new dropdown for bill progress */}
            {activeTable === "legislative" && (
              <div className="flex-1 min-w-0">
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
            )}
          </div>
        </div>
      </div>

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
        <div className={`flex items-center space-x-2 ${
          layout === "horizontal" ? "visible" : "invisible"
        }`}>
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
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('state')}>State {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('announcement_date')}>Announcement Date {sortDirection.field === 'announcement_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Subject</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Service Lines</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Is New</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviderAlerts.map((alert: any, idx: number) =>
                    editingProviderId === alert.id ? (
                      <tr key={alert.id} className={`${isNew(editingProviderValues.is_new ?? alert.is_new) ? 'bg-green-100' : 'bg-yellow-100'} border-b`}>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.state ?? alert.state ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, state: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.announcement_date ?? alert.announcement_date ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, announcement_date: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.subject ?? alert.subject ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, subject: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle">
                          <MultiServiceLinesDropdown
                            values={editingProviderServiceLines}
                            onChange={setEditingProviderServiceLines}
                            options={normalizedServiceLineOptions}
                            placeholder="Select service lines (max 3)"
                            />
                          </td>
                        <td className="p-3 align-middle text-center">
                            <input
                            type="text"
                            value={editingProviderValues.is_new ?? alert.is_new ?? ''}
                            onChange={e => setEditingProviderValues({ ...editingProviderValues, is_new: e.target.value })}
                            className="border rounded px-2 py-1 w-full text-center"
                            />
                          </td>
                        <td className="p-3 align-middle flex gap-2">
                          <button onClick={handleSaveProviderEdit} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>Save</button>
                          <button onClick={() => { setEditingProviderId(null); setEditingProviderServiceLines([]); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>Cancel</button>
                          </td>
                      </tr>
                    ) : (
                      <tr key={alert.id} className={`${isNew(alert.is_new) ? 'bg-green-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} border-b hover:bg-blue-50 transition-colors`}>
                        <td className="p-3 align-middle">{alert.state}</td>
                        <td className="p-3 align-middle">{formatExcelOrStringDate(alert.announcement_date)}</td>
                        <td className="p-3 align-middle">{alert.subject}</td>
                        <td className="p-3 align-middle">{getAlertServiceLines(alert)}</td>
                        <td className="p-3 align-middle text-center">{String(alert.is_new).trim()}</td>
                        <td className="p-3 align-middle">
                          <button onClick={() => { 
                            setEditingProviderId(alert.id); 
                            setEditingProviderValues({ ...alert }); 
                            // Robust deduplication for service lines
                            const lines = [
                              alert.service_lines_impacted,
                              alert.service_lines_impacted_1,
                              alert.service_lines_impacted_2,
                              alert.service_lines_impacted_3
                            ].filter(line => line && line.toUpperCase().trim() !== 'NULL');
                            const seen = new Set();
                            const uniqueLines = [];
                            for (const line of lines) {
                              const norm = line.trim().toLowerCase();
                              if (!seen.has(norm)) {
                                seen.add(norm);
                                uniqueLines.push(line.trim());
                              }
                            }
                            setEditingProviderServiceLines(uniqueLines);
                          }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                          </button>
                          </td>
                    </tr>
                    )
                  )}
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
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">Is New</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLegislativeUpdates.map((bill: any, idx: number) =>
                    editingBillUrl === bill.url ? (
                      <tr key={bill.url} className={`${isNew(editingBillValues.is_new ?? bill.is_new) ? 'bg-green-100' : 'bg-yellow-100'} border-b`}>
                        <td><input type="text" value={editingBillValues.state ?? bill.state ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, state: e.target.value })} /></td>
                        <td><input type="text" value={editingBillValues.action_date ?? bill.action_date ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, action_date: e.target.value })} /></td>
                        <td><input type="text" value={editingBillValues.bill_number ?? bill.bill_number ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, bill_number: e.target.value })} /></td>
                        <td><input type="text" value={editingBillValues.name ?? bill.name ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, name: e.target.value })} /></td>
                        <td><input type="text" value={editingBillValues.last_action ?? bill.last_action ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, last_action: e.target.value })} /></td>
                        <td>
                          <input
                            type="text"
                            value={sponsorListEdit}
                            onChange={e => setSponsorListEdit(e.target.value)}
                          />
                        </td>
                        <td><input type="text" value={editingBillValues.bill_progress ?? bill.bill_progress ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, bill_progress: e.target.value })} /></td>
                        <td>
                          <MultiServiceLinesDropdown
                            values={editingBillServiceLines}
                            onChange={setEditingBillServiceLines}
                            options={normalizedServiceLineOptions}
                            placeholder="Select service lines (max 3)"
                          />
                        </td>
                        <td className="p-3 align-middle text-center">
                          <input
                            type="text"
                            value={editingBillValues.is_new ?? bill.is_new ?? ''}
                            onChange={e => setEditingBillValues({ ...editingBillValues, is_new: e.target.value })}
                            className="border rounded px-2 py-1 w-full text-center"
                          />
                        </td>
                        <td>
                          <button onClick={handleSaveBillEdit}>Save</button>
                          <button onClick={() => { setEditingBillUrl(null); setEditingBillServiceLines([]); }}>Cancel</button>
                        </td>
                    </tr>
                    ) : (
                      <tr key={bill.url} className={`${isNew(bill.is_new) ? 'bg-green-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} border-b hover:bg-blue-50 transition-colors`}>
                        <td>{reverseStateMap[bill.state] || bill.state}</td>
                        <td>{formatExcelOrStringDate(bill.action_date)}</td>
                        <td>{bill.bill_number}</td>
                        <td>{bill.name}</td>
                        <td>{bill.last_action}</td>
                        <td>{bill.sponsor_list}</td>
                        <td>{bill.bill_progress}</td>
                        <td>{getServiceLines(bill)}</td>
                        <td className="p-3 align-middle text-center">{String(bill.is_new).trim()}</td>
                        <td>
                          <button onClick={() => { 
                            setEditingBillUrl(bill.url); 
                            setEditingBillValues({ ...bill }); 
                            setSponsorListEdit(Array.isArray(bill.sponsor_list) ? bill.sponsor_list.join(", ") : bill.sponsor_list ?? ""); 
                            // Robust deduplication for service lines
                            const lines = [
                              bill.service_lines_impacted,
                              bill.service_lines_impacted_1,
                              bill.service_lines_impacted_2,
                              bill.service_lines_impacted_3
                            ].filter(line => line && line.toUpperCase().trim() !== 'NULL');
                            const seen = new Set();
                            const uniqueLines = [];
                            for (const line of lines) {
                              const norm = line.trim().toLowerCase();
                              if (!seen.has(norm)) {
                                seen.add(norm);
                                uniqueLines.push(line.trim());
                              }
                            }
                            setEditingBillServiceLines(uniqueLines);
                          }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                          </button>
                        </td>
                      </tr>
                    )
                  )}
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
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('state')}>State {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('announcement_date')}>Announcement Date {sortDirection.field === 'announcement_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Subject</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Service Lines</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Is New</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviderAlerts.map((alert: any, idx: number) =>
                    editingProviderId === alert.id ? (
                      <tr key={alert.id} className={`${isNew(editingProviderValues.is_new ?? alert.is_new) ? 'bg-green-100' : 'bg-yellow-100'} border-b`}>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.state ?? alert.state ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, state: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.announcement_date ?? alert.announcement_date ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, announcement_date: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.subject ?? alert.subject ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, subject: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle">
                          <MultiServiceLinesDropdown
                            values={editingProviderServiceLines}
                            onChange={setEditingProviderServiceLines}
                            options={normalizedServiceLineOptions}
                            placeholder="Select service lines (max 3)"
                          />
                        </td>
                        <td className="p-3 align-middle text-center">
                          <input
                            type="text"
                            value={editingProviderValues.is_new ?? alert.is_new ?? ''}
                            onChange={e => setEditingProviderValues({ ...editingProviderValues, is_new: e.target.value })}
                            className="border rounded px-2 py-1 w-full text-center"
                          />
                        </td>
                        <td className="p-3 align-middle flex gap-2">
                          <button onClick={handleSaveProviderEdit} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>Save</button>
                          <button onClick={() => { setEditingProviderId(null); setEditingProviderServiceLines([]); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>Cancel</button>
                        </td>
                    </tr>
                    ) : (
                      <tr key={alert.id} className={`${isNew(alert.is_new) ? 'bg-green-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} border-b hover:bg-blue-50 transition-colors`}>
                        <td className="p-3 align-middle">{alert.state}</td>
                        <td className="p-3 align-middle">{formatExcelOrStringDate(alert.announcement_date)}</td>
                        <td className="p-3 align-middle">{alert.subject}</td>
                        <td className="p-3 align-middle">{getAlertServiceLines(alert)}</td>
                        <td className="p-3 align-middle text-center">{String(alert.is_new).trim()}</td>
                        <td className="p-3 align-middle">
                          <button onClick={() => { 
                            setEditingProviderId(alert.id); 
                            setEditingProviderValues({ ...alert }); 
                            // Robust deduplication for service lines
                            const lines = [
                              alert.service_lines_impacted,
                              alert.service_lines_impacted_1,
                              alert.service_lines_impacted_2,
                              alert.service_lines_impacted_3
                            ].filter(line => line && line.toUpperCase().trim() !== 'NULL');
                            const seen = new Set();
                            const uniqueLines = [];
                            for (const line of lines) {
                              const norm = line.trim().toLowerCase();
                              if (!seen.has(norm)) {
                                seen.add(norm);
                                uniqueLines.push(line.trim());
                              }
                            }
                            setEditingProviderServiceLines(uniqueLines);
                          }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Legislative Updates Table */}
            <div className="min-w-full border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg relative">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">State</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Action Date</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Bill Number</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Bill Name</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Last Action</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Sponsors</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Progress</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Service Lines</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Is New</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLegislativeUpdates.map((bill: any, idx: number) =>
                    editingBillUrl === bill.url ? (
                      <tr key={bill.url} className={`${isNew(editingBillValues.is_new ?? bill.is_new) ? 'bg-green-100' : 'bg-yellow-100'} border-b`}>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.state ?? bill.state ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, state: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.action_date ?? bill.action_date ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, action_date: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.bill_number ?? bill.bill_number ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, bill_number: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.name ?? bill.name ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, name: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.last_action ?? bill.last_action ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, last_action: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={sponsorListEdit} onChange={e => setSponsorListEdit(e.target.value)} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.bill_progress ?? bill.bill_progress ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, bill_progress: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle">
                          <MultiServiceLinesDropdown
                            values={editingBillServiceLines}
                            onChange={setEditingBillServiceLines}
                            options={normalizedServiceLineOptions}
                            placeholder="Select service lines (max 3)"
                          />
                        </td>
                        <td className="p-3 align-middle text-center">
                          <input
                            type="text"
                            value={editingBillValues.is_new ?? bill.is_new ?? ''}
                            onChange={e => setEditingBillValues({ ...editingBillValues, is_new: e.target.value })}
                            className="border rounded px-2 py-1 w-full text-center"
                          />
                        </td>
                        <td className="p-3 align-middle flex gap-2">
                          <button onClick={handleSaveBillEdit} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>Save</button>
                          <button onClick={() => { setEditingBillUrl(null); setEditingBillServiceLines([]); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>Cancel</button>
                        </td>
                    </tr>
                    ) : (
                      <tr key={bill.url} className={`${isNew(bill.is_new) ? 'bg-green-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} border-b hover:bg-blue-50 transition-colors`}>
                        <td className="p-3 align-middle">{reverseStateMap[bill.state] || bill.state}</td>
                        <td className="p-3 align-middle">{formatExcelOrStringDate(bill.action_date)}</td>
                        <td className="p-3 align-middle">{bill.bill_number}</td>
                        <td className="p-3 align-middle">{bill.name}</td>
                        <td className="p-3 align-middle">{bill.last_action}</td>
                        <td className="p-3 align-middle">{Array.isArray(bill.sponsor_list) ? bill.sponsor_list.join(", ") : bill.sponsor_list}</td>
                        <td className="p-3 align-middle">{bill.bill_progress}</td>
                        <td className="p-3 align-middle">{getServiceLines(bill)}</td>
                        <td className="p-3 align-middle text-center">{String(bill.is_new).trim()}</td>
                        <td className="p-3 align-middle">
                          <button onClick={() => { 
                            setEditingBillUrl(bill.url); 
                            setEditingBillValues({ ...bill }); 
                            setSponsorListEdit(Array.isArray(bill.sponsor_list) ? bill.sponsor_list.join(", ") : bill.sponsor_list ?? ""); 
                            // Robust deduplication for service lines
                            const lines = [
                              bill.service_lines_impacted,
                              bill.service_lines_impacted_1,
                              bill.service_lines_impacted_2,
                              bill.service_lines_impacted_3
                            ].filter(line => line && line.toUpperCase().trim() !== 'NULL');
                            const seen = new Set();
                            const uniqueLines = [];
                            for (const line of lines) {
                              const norm = line.trim().toLowerCase();
                              if (!seen.has(norm)) {
                                seen.add(norm);
                                uniqueLines.push(line.trim());
                              }
                            }
                            setEditingBillServiceLines(uniqueLines);
                          }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                          </button>
                        </td>
                      </tr>
                    )
                  )}
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

      {/* Service Category List Table */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-[#012C61] mb-4">Service Category List</h2>
        <div className="flex gap-2 mb-4">
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder="Add new category"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-4 py-1 rounded"
            onClick={handleAddCategory}
          >
            Add
          </button>
        </div>
        <table className="min-w-full bg-white border rounded shadow text-sm">
          <thead>
            <tr>
              <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">ID</th>
              <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Category</th>
              <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {serviceCategories.map((cat, idx) => (
              <tr key={cat.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b`}>
                <td className="p-3 align-middle">{cat.id}</td>
                <td className="p-3 align-middle">
                  {editingCategoryId === cat.id ? (
                    <input
                      type="text"
                      value={editingCategoryValue}
                      onChange={e => setEditingCategoryValue(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    cat.categories
                  )}
                </td>
                <td className="p-3 align-middle">
                  {editingCategoryId === cat.id ? (
                    <div className="flex gap-2">
                      <button onClick={handleSaveCategoryEdit} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1">
                        <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>Save
                  </button>
                      <button onClick={() => { setEditingCategoryId(null); setEditingCategoryValue(""); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded flex items-center gap-1">
                        <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryValue(cat.categories); }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                        <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                      </button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:bg-red-100 p-2 rounded transition" title="Delete">
                        <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z' /></svg>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
} 