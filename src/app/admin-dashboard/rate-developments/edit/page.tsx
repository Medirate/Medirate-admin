"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import AppLayout from "@/app/components/applayout";
import { Search, LayoutGrid, LayoutList, ChevronUp, ChevronDown, Pencil, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Select from "react-select";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define the type for the datasets
interface Alert {
  id: string;
  url?: string | null;
  subject: string;
  announcement_date: string;
  state?: string | null;
  links?: string | null;
  summary?: string | null;
  service_lines_impacted?: string | null;
  service_lines_impacted_1?: string | null;
  service_lines_impacted_2?: string | null;
  service_lines_impacted_3?: string | null;
  is_new?: string | null;
  date_extracted?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface Bill {
  id: string;
  url: string;
  state: string;
  bill_number: string;
  name: string;
  last_action: string | null;
  action_date: string | null;
  sponsor_list: string | null;
  bill_progress: string | null;
  ai_summary: string | null;
  service_lines_impacted?: string | null;
  service_lines_impacted_1?: string | null;
  service_lines_impacted_2?: string | null;
  service_lines_impacted_3?: string | null;
  is_new?: string | null;
  date_extracted?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  source_sheet?: string | null;
}

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
const reverseStateMap = Object.fromEntries(
  Object.entries(stateMap).map(([key, value]) => [value, key])
);
const serviceLines = [
  "ALL PROVIDER TYPES/SERVICE LINES",
  "AMBULANCE/MEDICAL TRANSPORTATION",
  "AMBULATORY SURGERY CENTER",
  "ANESTHESIA",
  "APPLIED BEHAVIORAL ANALYSIS/EARLY INTERVENTION",
  "BEHAVIORAL HEALTH AND/OR SUBSTANCE USE DISORDER TREATMENT",
  "BRAIN INJURY",
  "COMMUNITY HEALTH WORKERS",
  "DENTAL",
  "DIAGNOSTIC IMAGING",
  "DURABLE MEDICAL EQUIPMENT (DME)",
  "FAMILY PLANNING",
  "FQHC/RHC",
  "HOME AND COMMUNITY BASED SERVICES",
  "HOME HEALTH",
  "HOSPICE",
  "HOSPITAL",
  "INTELLECTUAL AND DEVELOPMENTAL DISABILITY (IDD) SERVICES",
  "LABORATORY",
  "MANAGED CARE",
  "MATERNAL HEALTH",
  "MEDICAL SUPPLIES",
  "NURSE",
  "NURSING FACILITY",
  "NUTRITION",
  "PHARMACY",
  "PHYSICIAN",
  "PHYSICIAN ADMINISTERED DRUGS",
  "PRESCRIBED PEDIATRIC EXTENDED CARE (PPEC)",
  "PRESCRIPTION DRUGS",
  "PRIVATE DUTY NURSING",
  "SOCIAL SERVICES",
  "TELEMEDICINE & REMOTE PATIENT MONITORING (RPM)",
  "THERAPY: OT, PT, ST",
  "VISION",
  "GENERAL MEDICAID",
  "340B",
];

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}
function CustomDropdown({ value, onChange, options, placeholder }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
const searchInFields = (searchText: string, fields: (string | null | undefined)[]): boolean => {
  const normalizedSearch = searchText.toLowerCase().trim();
  if (!normalizedSearch) return true;
  return fields.some(field => field?.toLowerCase().includes(normalizedSearch));
};
export default function EditRateDevelopments() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [providerSearch, setProviderSearch] = useState<string>("");
  const [legislativeSearch, setLegislativeSearch] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedServiceLine, setSelectedServiceLine] = useState<string>("");
  const [selectedBillProgress, setSelectedBillProgress] = useState<string>("");
  const [layout, setLayout] = useState<"vertical" | "horizontal">("horizontal");
  const [activeTable, setActiveTable] = useState<"provider" | "legislative">("provider");
  const [sortDirection, setSortDirection] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'announcement_date', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState("");
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [editedAlert, setEditedAlert] = useState<Partial<Alert>>({});
  const [editingBillUrl, setEditingBillUrl] = useState<string | null>(null);
  const [editedBill, setEditedBill] = useState<Partial<Bill>>({});
  const [serviceCategoryOptions, setServiceCategoryOptions] = useState<string[]>([]);
  const uniqueServiceLines = useMemo(() => Array.from(new Set(serviceCategoryOptions)), [serviceCategoryOptions]);
  const [newCategory, setNewCategory] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>([]);
  useEffect(() => {
    fetchData();
    fetchServiceCategories();
    fetchCategoryList();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: providerAlerts, error: providerError } = await supabase
      .from("provider_alerts")
      .select("*")
      .order("announcement_date", { ascending: false });
    if (providerError) {
      setAlerts([]);
    } else {
      setAlerts(providerAlerts || []);
    }
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
  const fetchServiceCategories = async () => {
    const { data, error } = await supabase.from("service_category_list").select("categories");
    if (!error && data) {
      setServiceCategoryOptions(data.map((row: any) => row.categories));
    }
  };
  const fetchCategoryList = async () => {
    const { data, error } = await supabase.from("service_category_list").select("categories");
    if (!error && data) {
      setCategoryList(Array.from(new Set(data.map((row: any) => row.categories))));
    }
  };
  const toggleSort = (field: string) => {
    setSortDirection(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  const sortedProviderAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      if (sortDirection.field === 'state') {
        if (a.state && b.state) {
          return sortDirection.direction === 'asc' ? a.state.localeCompare(b.state) : b.state.localeCompare(a.state);
        }
      } else if (sortDirection.field === 'announcement_date') {
        const dateA = a.announcement_date ? new Date(a.announcement_date).getTime() : 0;
        const dateB = b.announcement_date ? new Date(b.announcement_date).getTime() : 0;
        return sortDirection.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [alerts, sortDirection]);
  const sortedLegislativeUpdates = useMemo(() => {
    return [...bills].sort((a, b) => {
      if (sortDirection.field === 'state') {
        const stateA = a.state || "";
        const stateB = b.state || "";
        return sortDirection.direction === 'asc' ? stateA.localeCompare(stateB) : stateB.localeCompare(stateA);
      } else if (sortDirection.field === 'action_date') {
        const dateA = a.action_date ? new Date(a.action_date).getTime() : 0;
        const dateB = b.action_date ? new Date(b.action_date).getTime() : 0;
        return sortDirection.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [bills, sortDirection]);
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

  let providerAlertsToShow = filteredProviderAlerts;
  if (editingAlertId && !filteredProviderAlerts.some(a => a.id === editingAlertId)) {
    const editingAlert = alerts.find(a => a.id === editingAlertId);
    if (editingAlert) providerAlertsToShow = [...filteredProviderAlerts, editingAlert];
  }
  let legislativeUpdatesToShow = sortedLegislativeUpdates;
  if (editingBillUrl && !sortedLegislativeUpdates.some(b => b.url === editingBillUrl)) {
    const editingBill = bills.find(b => b.url === editingBillUrl);
    if (editingBill) legislativeUpdatesToShow = [...sortedLegislativeUpdates, editingBill];
  }

  const handleBillClick = (bill: Bill) => {
    setPopupContent(bill.ai_summary || "");
    setShowPopup(true);
  };
  // Add debug log for current edit state
  console.log('Currently editing bill:', editingBillUrl, 'Currently editing alert:', editingAlertId);
  
  // Inline edit handlers
  const startEditAlert = (id: string, alert: Alert) => {
    console.log('Pencil clicked for alert:', id);
    setEditingAlertId(id);
    setEditedAlert({ ...alert });
    console.log('Set editingAlertId:', id);
  };
  const cancelEditAlert = () => {
    setEditingAlertId(null);
    setEditedAlert({});
  };
  const saveEditAlert = async (id: string) => {
    if (!editedAlert) return;
    setLoading(true);
    const updateObj = {
      subject: editedAlert.subject,
      announcement_date: editedAlert.announcement_date,
      state: editedAlert.state,
      service_lines_impacted: editedAlert.service_lines_impacted,
      service_lines_impacted_1: editedAlert.service_lines_impacted_1,
      service_lines_impacted_2: editedAlert.service_lines_impacted_2
    };
    await supabase
      .from("provider_alerts")
      .update(updateObj)
      .eq("id", id);
    setLoading(false);
    setEditingAlertId(null);
    setEditedAlert({});
    fetchData();
  };

  // Bill edit handlers
  const startEditBill = (url: string, bill: Bill) => {
    console.log('Pencil clicked for bill:', url);
    setEditingBillUrl(url);
    setEditedBill({ ...bill });
    console.log('Set editingBillUrl:', url);
  };
  const cancelEditBill = () => {
    setEditingBillUrl(null);
    setEditedBill({});
  };
  const saveEditBill = async (url: string) => {
    if (!editedBill) return;
    setLoading(true);
    const updateObj = {
      name: editedBill.name,
      bill_number: editedBill.bill_number,
      state: editedBill.state,
      last_action: editedBill.last_action,
      action_date: editedBill.action_date,
      sponsor_list: editedBill.sponsor_list,
      bill_progress: editedBill.bill_progress,
      ai_summary: editedBill.ai_summary,
      service_lines_impacted: editedBill.service_lines_impacted,
      service_lines_impacted_1: editedBill.service_lines_impacted_1,
      service_lines_impacted_2: editedBill.service_lines_impacted_2,
      service_lines_impacted_3: editedBill.service_lines_impacted_3,
      is_new: editedBill.is_new
    };
    await supabase
      .from("bill_track_50")
      .update(updateObj)
      .eq("url", url);
    setLoading(false);
    setEditingBillUrl(null);
    setEditedBill({});
    fetchData();
  };
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    await supabase.from("service_category_list").insert({ categories: newCategory.trim() });
    setNewCategory("");
    fetchCategoryList();
    fetchServiceCategories();
  };
  const handleDeleteCategory = async (cat: string) => {
    await supabase.from("service_category_list").delete().eq("categories", cat);
    fetchCategoryList();
    fetchServiceCategories();
  };
  if (loading) {
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
    <AppLayout activeTab="adminDashboard">
      <h1 className="text-5xl md:text-6xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
        Edit Rate Developments
      </h1>
      
      {/* Debug Info */}
      <div className="bg-yellow-200 p-4 mb-4 border-2 border-red-500">
        <h3 className="font-bold text-red-600">DEBUG INFO:</h3>
        <p>Editing Alert ID: {editingAlertId || 'null'}</p>
        <p>Editing Bill URL: {editingBillUrl || 'null'}</p>
        <p>Active Table: {activeTable}</p>
        <p>Layout: {layout}</p>
      </div>
      
      {/* Test button */}
      <button 
        onClick={() => console.log('Test button clicked!')}
        className="bg-red-500 text-white px-4 py-2 rounded mb-4"
      >
        Test Button - Click Me
      </button>
      
      <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: "#004aad" }}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <SearchBar
                value={providerSearch}
                onChange={setProviderSearch}
                placeholder="Search Provider Alerts by subject"
              />
            </div>
            <div className="flex-1 min-w-0">
              <SearchBar
                value={legislativeSearch}
                onChange={setLegislativeSearch}
                placeholder="Search Legislative Updates by Bill Name or Bill Number"
              />
            </div>
          </div>
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
                  ...serviceLines.map(line => ({
                    value: line,
                    label: line
                  }))
                ]}
                placeholder="All Service Lines"
              />
            </div>
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
      <div className="mb-4 text-sm text-gray-600">
        <p>
          <strong>Note:</strong> Click on the column headings (State, Announcement Date, Action Date) to sort the data. 
          Also, clicking on a bill name in the Legislative Updates table will display an AI-generated summary, 
          while clicking on a subject in the Provider Alerts table will display a summary of the alert.
        </p>
      </div>
      {layout === "vertical" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-[#012C61] mb-2">
              Provider Alerts
            </h2>
            <div className="border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold text-xs text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('id')}>
                      ID
                      {sortDirection.field === 'id' && (sortDirection.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </th>
                    <th className="text-left p-2 font-semibold text-xs text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('state')}>
                      State
                      {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </th>
                    <th className="text-left p-2 font-semibold text-xs text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('announcement_date')}>
                      Announcement Date
                      {sortDirection.field === 'announcement_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </th>
                    <th className="text-left p-2 font-semibold text-xs text-[#012C61] border-b">
                      Subject
                    </th>
                    <th className="text-left p-2 font-semibold text-xs text-[#012C61] border-b">
                      URL
                    </th>
                    <th className="text-left p-2 font-semibold text-xs text-[#012C61] border-b">
                      Summary
                    </th>
                    <th className="text-left p-2 font-semibold text-xs text-[#012C61] border-b">
                      Service Lines
                    </th>
                    <th className="text-left p-2 font-semibold text-xs text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('is_new')}>
                      Is New
                      {sortDirection.field === 'is_new' && (sortDirection.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </th>
                    <th className="text-left p-2 font-semibold text-xs text-[#012C61] border-b">
                      Date Extracted
                    </th>
                    <th className="text-left p-2 font-semibold text-xs text-[#012C61] border-b">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {providerAlertsToShow.map((alert) => {
                    console.log('Comparing', editingAlertId, typeof editingAlertId, alert.id, typeof alert.id);
                    return (
                      <tr key={alert.id} className="border-b hover:bg-gray-100">
                        {String(editingAlertId) === String(alert.id) ? (
                          <td colSpan={10} style={{ background: 'yellow', color: 'red', fontWeight: 'bold', fontSize: '16px', padding: '20px', textAlign: 'center' }}>
                            🚨 EDIT MODE FOR ALERT {alert.id} - THIS SHOULD BE VISIBLE! 🚨
                          </td>
                        ) : (
                          <>
                            <td className="p-2 text-xs text-gray-700 border-b">{alert.id}</td>
                            <td className="p-2 text-xs text-gray-700 border-b">{alert.state || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b">{alert.announcement_date || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b">{alert.subject || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              {alert.url ? (
                                <a href={alert.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                  Link
                                </a>
                              ) : ""}
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b max-w-xs truncate" title={alert.summary || ""}>
                              {alert.summary || ""}
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">{getAlertServiceLines(alert)}</td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <span className={`px-2 py-1 rounded text-xs ${alert.is_new === 'yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {alert.is_new || "no"}
                              </span>
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">{alert.date_extracted || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b flex gap-1">
                              <button onClick={() => saveEditAlert(alert.id)} className="text-green-600"><Save size={14} /></button>
                              <button onClick={cancelEditAlert} className="text-red-600"><X size={14} /></button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#012C61] mb-2">
              Legislative Updates
            </h2>
            <div className="border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">State</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Action Date</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Bill Number</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Bill Name</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">URL</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Last Action</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Sponsors</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Progress</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">AI Summary</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Service Lines</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Is New</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Date Extracted</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Source Sheet</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {legislativeUpdatesToShow.map((bill) => {
                    return (
                      <tr key={bill.url} className="border-b hover:bg-gray-100">
                        {editingBillUrl === bill.url ? (
                          <>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <select
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.state ?? bill.state ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, state: e.target.value })}
                              >
                                <option value="">Select State</option>
                                {Object.entries(stateMap).map(([name, code]) => (
                                  <option key={code} value={code}>{name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                type="date"
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.action_date ?? bill.action_date ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, action_date: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.bill_number ?? bill.bill_number ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, bill_number: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.name ?? bill.name ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, name: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.url ?? bill.url ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, url: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.last_action ?? bill.last_action ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, last_action: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.sponsor_list ?? bill.sponsor_list ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, sponsor_list: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <select
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.bill_progress ?? bill.bill_progress ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, bill_progress: e.target.value })}
                              >
                                <option value="">Select Progress</option>
                                <option value="Introduced">Introduced</option>
                                <option value="In Committee">In Committee</option>
                                <option value="Passed">Passed</option>
                                <option value="Failed">Failed</option>
                                <option value="Vetoed">Vetoed</option>
                                <option value="Enacted">Enacted</option>
                              </select>
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <textarea
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.ai_summary ?? bill.ai_summary ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, ai_summary: e.target.value })}
                                rows={2}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <Select
                                isMulti
                                closeMenuOnSelect={false}
                                options={uniqueServiceLines.map(line => ({ value: line, label: line }))}
                                value={
                                  [
                                    editedBill.service_lines_impacted ?? bill.service_lines_impacted,
                                    editedBill.service_lines_impacted_1 ?? bill.service_lines_impacted_1,
                                    editedBill.service_lines_impacted_2 ?? bill.service_lines_impacted_2,
                                    editedBill.service_lines_impacted_3 ?? bill.service_lines_impacted_3
                                  ].filter(Boolean).map(line => ({ value: line, label: line }))
                                }
                                onChange={selected => {
                                  const values = selected.map(opt => opt.value).slice(0, 4);
                                  setEditedBill({
                                    ...editedBill,
                                    service_lines_impacted: values[0] || "",
                                    service_lines_impacted_1: values[1] || "",
                                    service_lines_impacted_2: values[2] || "",
                                    service_lines_impacted_3: values[3] || ""
                                  });
                                }}
                                placeholder="Select up to 4 Service Categories"
                                isClearable={false}
                                maxMenuHeight={150}
                                isOptionDisabled={(option, selectedOptions) => {
                                  if (!Array.isArray(selectedOptions)) return false;
                                  return (
                                    selectedOptions.length >= 4 &&
                                    !selectedOptions.some((selected) => selected.value === option.value)
                                  );
                                }}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <select
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.is_new ?? bill.is_new ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, is_new: e.target.value })}
                              >
                                <option value="">Select</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                              </select>
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">{bill.date_extracted || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b">{bill.source_sheet || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b flex gap-1">
                              <button onClick={() => saveEditBill(bill.url)} className="text-green-600"><Save size={14} /></button>
                              <button onClick={cancelEditBill} className="text-red-600"><X size={14} /></button>
                            </td>
                          </>
                        ) : (
                          <>
                      <td className="p-2 text-xs text-gray-700 border-b">{reverseStateMap[bill.state] || bill.state}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.action_date ? new Date(bill.action_date).toLocaleDateString() : ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.bill_number || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b"><span className="cursor-pointer hover:underline" onClick={() => handleBillClick(bill)}>{bill.name || ""}</span></td>
                      <td className="p-2 text-xs text-gray-700 border-b"><a href={bill.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Link</a></td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.last_action || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.sponsor_list || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.bill_progress || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b max-w-xs truncate" title={bill.ai_summary || ""}>{bill.ai_summary || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b">{getServiceLines(bill)}</td>
                      <td className="p-2 text-xs text-gray-700 border-b"><span className={`px-2 py-1 rounded text-xs ${bill.is_new === 'yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{bill.is_new || "no"}</span></td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.date_extracted || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.source_sheet || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <button 
                                onClick={() => {
                                  console.log('Pencil clicked for bill:', bill.url);
                                  startEditBill(bill.url, bill);
                                }} 
                                className="text-blue-600"
                              >
                                <Pencil size={14} />
                              </button>
                            </td>
                          </>
                        )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <h2 className="text-xl font-semibold text-[#012C61] mb-2">
            {activeTable === "provider" ? "Provider Alerts" : "Legislative Updates"}
          </h2>
          <div className="flex transition-transform duration-300 ease-in-out" style={{
            transform: `translateX(${activeTable === "provider" ? "0%" : "-100%"})`
          }}>
            <div className="min-w-full border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg relative">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">ID</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">State</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Announcement Date</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Subject</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">URL</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Summary</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Service Line 1</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Service Line 2</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Service Line 3</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Service Line 4</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Is New</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Date Extracted</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providerAlertsToShow.map((alert) => (
                    <tr key={alert.id} className="border-b hover:bg-gray-100">
                      <td className="p-2 text-xs text-gray-700 border-b">{alert.id}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{alert.state || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{alert.announcement_date || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{alert.subject || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{alert.url ? (<a href={alert.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Link</a>) : ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b max-w-xs truncate" title={alert.summary || ""}>{alert.summary || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{alert.service_lines_impacted || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{alert.service_lines_impacted_1 || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{alert.service_lines_impacted_2 || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{alert.service_lines_impacted_3 || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b"><span className={`px-2 py-1 rounded text-xs ${alert.is_new === 'yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{alert.is_new || "no"}</span></td>
                      <td className="p-2 text-xs text-gray-700 border-b">{alert.date_extracted || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b"><button 
                        onClick={() => {
                          console.log('Pencil clicked for alert:', alert.id);
                          startEditAlert(alert.id, alert);
                        }} 
                        className="text-blue-600"
                      ><Pencil size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="min-w-full border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg relative">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">State</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Action Date</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Bill Number</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Bill Name</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">URL</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Last Action</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Sponsors</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Progress</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">AI Summary</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Service Lines</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Is New</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Date Extracted</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Source Sheet</th>
                    <th className="text-left p-2 text-xs font-semibold text-[#012C61] border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {legislativeUpdatesToShow.map((bill) => {
                    return (
                      <tr key={bill.url} className="border-b hover:bg-gray-100">
                        {editingBillUrl === bill.url ? (
                          <>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <select
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.state ?? bill.state ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, state: e.target.value })}
                              >
                                <option value="">Select State</option>
                                {Object.entries(stateMap).map(([name, code]) => (
                                  <option key={code} value={code}>{name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                type="date"
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.action_date ?? bill.action_date ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, action_date: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.bill_number ?? bill.bill_number ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, bill_number: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.name ?? bill.name ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, name: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.url ?? bill.url ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, url: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.last_action ?? bill.last_action ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, last_action: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <input
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.sponsor_list ?? bill.sponsor_list ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, sponsor_list: e.target.value })}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <select
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.bill_progress ?? bill.bill_progress ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, bill_progress: e.target.value })}
                              >
                                <option value="">Select Progress</option>
                                <option value="Introduced">Introduced</option>
                                <option value="In Committee">In Committee</option>
                                <option value="Passed">Passed</option>
                                <option value="Failed">Failed</option>
                                <option value="Vetoed">Vetoed</option>
                                <option value="Enacted">Enacted</option>
                              </select>
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <textarea
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.ai_summary ?? bill.ai_summary ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, ai_summary: e.target.value })}
                                rows={2}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <Select
                                isMulti
                                closeMenuOnSelect={false}
                                options={uniqueServiceLines.map(line => ({ value: line, label: line }))}
                                value={
                                  [
                                    editedBill.service_lines_impacted ?? bill.service_lines_impacted,
                                    editedBill.service_lines_impacted_1 ?? bill.service_lines_impacted_1,
                                    editedBill.service_lines_impacted_2 ?? bill.service_lines_impacted_2,
                                    editedBill.service_lines_impacted_3 ?? bill.service_lines_impacted_3
                                  ].filter(Boolean).map(line => ({ value: line, label: line }))
                                }
                                onChange={selected => {
                                  const values = selected.map(opt => opt.value).slice(0, 4);
                                  setEditedBill({
                                    ...editedBill,
                                    service_lines_impacted: values[0] || "",
                                    service_lines_impacted_1: values[1] || "",
                                    service_lines_impacted_2: values[2] || "",
                                    service_lines_impacted_3: values[3] || ""
                                  });
                                }}
                                placeholder="Select up to 4 Service Categories"
                                isClearable={false}
                                maxMenuHeight={150}
                                isOptionDisabled={(option, selectedOptions) => {
                                  if (!Array.isArray(selectedOptions)) return false;
                                  return (
                                    selectedOptions.length >= 4 &&
                                    !selectedOptions.some((selected) => selected.value === option.value)
                                  );
                                }}
                              />
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <select
                                className="w-full border rounded px-1 py-1 text-xs"
                                value={editedBill.is_new ?? bill.is_new ?? ""}
                                onChange={e => setEditedBill({ ...editedBill, is_new: e.target.value })}
                              >
                                <option value="">Select</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                              </select>
                            </td>
                            <td className="p-2 text-xs text-gray-700 border-b">{bill.date_extracted || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b">{bill.source_sheet || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b flex gap-1">
                              <button onClick={() => saveEditBill(bill.url)} className="text-green-600"><Save size={14} /></button>
                              <button onClick={cancelEditBill} className="text-red-600"><X size={14} /></button>
                            </td>
                          </>
                        ) : (
                          <>
                      <td className="p-2 text-xs text-gray-700 border-b">{reverseStateMap[bill.state] || bill.state}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.action_date ? new Date(bill.action_date).toLocaleDateString() : ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.bill_number || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b"><span className="cursor-pointer hover:underline" onClick={() => handleBillClick(bill)}>{bill.name || ""}</span></td>
                      <td className="p-2 text-xs text-gray-700 border-b"><a href={bill.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Link</a></td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.last_action || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.sponsor_list || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.bill_progress || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b max-w-xs truncate" title={bill.ai_summary || ""}>{bill.ai_summary || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b">{getServiceLines(bill)}</td>
                      <td className="p-2 text-xs text-gray-700 border-b"><span className={`px-2 py-1 rounded text-xs ${bill.is_new === 'yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{bill.is_new || "no"}</span></td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.date_extracted || ""}</td>
                      <td className="p-2 text-xs text-gray-700 border-b">{bill.source_sheet || ""}</td>
                            <td className="p-2 text-xs text-gray-700 border-b">
                              <button 
                                onClick={() => {
                                  console.log('Pencil clicked for bill:', bill.url);
                                  startEditBill(bill.url, bill);
                                }} 
                                className="text-blue-600"
                              >
                                <Pencil size={14} />
                              </button>
                            </td>
                          </>
                        )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
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
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-[#012C61] mb-4">Service Category List</h2>
        <div className="flex gap-2 mb-4">
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder="Add new service category"
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
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th className="p-3 text-left font-semibold text-[#012C61]">Category</th>
              <th className="p-3 text-left font-semibold text-[#012C61]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categoryList.map((cat) => (
              <tr key={cat}>
                <td className="p-3 border-b">{cat}</td>
                <td className="p-3 border-b">
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDeleteCategory(cat)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
} 