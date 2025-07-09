"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import AppLayout from "@/app/components/applayout";
import { FaExclamationCircle, FaFilter } from 'react-icons/fa';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";
import clsx from 'clsx';
import { gunzipSync, strFromU8 } from "fflate";
import { supabase } from "@/lib/supabase";

// --- NEW: Types for client-side filtering ---
interface FilterOptionsData {
  filters: {
    [key: string]: string[];
  };
  combinations: Combination[];
}

interface Combination {
  [key: string]: string;
}

type Selections = {
  [key: string]: string | null;
};
// --- END NEW ---

// Removed unused useClickOutside hook - React-select handles dropdown behavior

const FilterNote = ({ step }: { step: number }) => {
  const messages = [
    "Please select a Service Line to begin filtering",
    "Now select a State to continue",
    "Select a Service Code, Service Description, or Fee Schedule Date to complete filtering"
  ];

  // Don't show message if we're past step 3
  if (step > 3) return null;

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm text-blue-700">
        {messages[step - 1]}
      </p>
    </div>
  );
};

// Add this interface near the top of the file with other interfaces
interface RefreshDataResponse {
  data: ServiceData[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  filterOptions: {
    serviceCodes: string[];
    serviceDescriptions: string[];
    programs: string[];
    locationRegions: string[];
    providerTypes: string[];
    modifiers: string[];
  };
}

interface ServiceData {
  state_name: string;
  service_category: string;
  service_code: string;
  service_description?: string;
  modifier_1?: string;
  modifier_1_details?: string;
  modifier_2?: string;
  modifier_2_details?: string;
  modifier_3?: string;
  modifier_3_details?: string;
  modifier_4?: string;
  modifier_4_details?: string;
  rate: string;
  rate_effective_date?: string;
  program: string;
  location_region: string;
  rate_per_hour?: string;
  duration_unit?: string;
  [key: string]: string | undefined;
}

// Add these mappings near the top, after imports and before the Dashboard component
const SERVICE_CATEGORY_ABBREVIATIONS: Record<string, string> = {
  "APPLIED BEHAVIOR ANALYSIS": "ABA",
  "APPLIED BEHAVIORAL ANALYSIS (ABA)": "ABA",
  "BEHAVIORAL HEALTH": "BH",
  "BEHAVIORAL HEALTH AND/OR SUBSTANCE USE DISORDER SERVICES": "BH/SUD",
  "HOME AND COMMUNITY BASED SERVICES": "HCBS",
  // Add more as needed
};

const STATE_ABBREVIATIONS: Record<string, string> = {
  "ALABAMA": "AL",
  "ALASKA": "AK",
  "ARIZONA": "AZ",
  "ARKANSAS": "AR",
  "CALIFORNIA": "CA",
  "COLORADO": "CO",
  "CONNECTICUT": "CT",
  "DELAWARE": "DE",
  "FLORIDA": "FL",
  "GEORGIA": "GA",
  "HAWAII": "HI",
  "IDAHO": "ID",
  "ILLINOIS": "IL",
  "INDIANA": "IN",
  "IOWA": "IA",
  "KANSAS": "KS",
  "KENTUCKY": "KY",
  "LOUISIANA": "LA",
  "MAINE": "ME",
  "MARYLAND": "MD",
  "MASSACHUSETTS": "MA",
  "MICHIGAN": "MI",
  "MINNESOTA": "MN",
  "MISSISSIPPI": "MS",
  "MISSOURI": "MO",
  "MONTANA": "MT",
  "NEBRASKA": "NE",
  "NEVADA": "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  "OHIO": "OH",
  "OKLAHOMA": "OK",
  "OREGON": "OR",
  "PENNSYLVANIA": "PA",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  "TENNESSEE": "TN",
  "TEXAS": "TX",
  "UTAH": "UT",
  "VERMONT": "VT",
  "VIRGINIA": "VA",
  "WASHINGTON": "WA",
  "WEST VIRGINIA": "WV",
  "WISCONSIN": "WI",
  "WYOMING": "WY",
  // Add more if needed
};

// Insert a type alias (Option) near the top (e.g. after imports)
type Option = { value: string; label: string };

// Add this custom filter function before the Dashboard component
const customFilterOption = (option: any, inputValue: string) => {
  const label = option.label.toLowerCase();
  const searchTerm = inputValue.toLowerCase();
  
  // First check if the label starts with the search term
  if (label.startsWith(searchTerm)) {
    return true;
  }
  
  // If no match at start, check if the label contains the search term
  return label.includes(searchTerm);
};

// Helper function to format date to YYYY-MM-DD without timezone conversion
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to parse date string to Date object safely (avoiding timezone issues)
const parseDateSafely = (dateString: string): Date => {
  // If the date is in YYYY-MM-DD format, parse it safely
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }
  // If the date is in MM/DD/YYYY format, parse it safely  
  if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [month, day, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }
  // Fallback to regular Date constructor
  return new Date(dateString);
};

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();
  const router = useRouter();

  // Add local state for data, loading, and error
  const [data, setData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All useState hooks
  const [isSubscriptionCheckComplete, setIsSubscriptionCheckComplete] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [authError, setAuthError] = useState<string | null>(null);
  const [filterOptionsData, setFilterOptionsData] = useState<FilterOptionsData | null>(null);
  const [selections, setSelections] = useState<Selections>({
    state_name: null,
    service_category: null,
    service_code: null,
    service_description: null,
    program: null,
    location_region: null,
    provider_type: null,
    duration_unit: null,
    fee_schedule_date: null,
    modifier_1: null,
  });
  const [startDate, setStartDate] = useState<Date | null>(parseDateSafely('2017-01-01'));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [localError, setLocalError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [isUpdatingFilters, setIsUpdatingFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }[]>([]);
  const [pendingFilters, setPendingFilters] = useState<Set<keyof Selections>>(new Set());
  const [displayedItems, setDisplayedItems] = useState(50); // Adjust this number based on your needs
  
  const itemsPerPage = 50; // Adjust this number based on your needs

  const refreshData = async (filters: Record<string, string> = {}): Promise<RefreshDataResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const url = `/api/state-payment-comparison?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result && Array.isArray(result.data)) {
        setData(result.data);
        return result;
      } else {
        setError('Invalid data format received');
        return null;
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // All useCallback hooks
  const loadFilterOptions = useCallback(async () => {
    if (!filterOptionsData) return;
    
    setIsUpdatingFilters(true);
    try {
      // Build filter conditions based on current selections
      const conditions: ((combo: Combination) => boolean)[] = [];
      
      if (selections.service_category) {
        conditions.push(combo => combo.service_category === selections.service_category);
      }
      
      if (selections.state_name) {
        conditions.push(combo => combo.state_name === selections.state_name);
      }
      
      if (selections.service_code) {
        conditions.push(combo => combo.service_code === selections.service_code);
      }
      
      if (selections.service_description) {
        conditions.push(combo => combo.service_description === selections.service_description);
      }
      
      if (selections.program) {
        conditions.push(combo => combo.program === selections.program);
      }
      
      if (selections.location_region) {
        conditions.push(combo => combo.location_region === selections.location_region);
      }
      
      if (selections.provider_type) {
        conditions.push(combo => combo.provider_type === selections.provider_type);
      }
      
      if (selections.duration_unit) {
        conditions.push(combo => combo.duration_unit === selections.duration_unit);
      }
      
      if (selections.modifier_1) {
        conditions.push(combo => combo.modifier_1 === selections.modifier_1);
      }
      
      // Special handling for fee_schedule_date to check if selected date is in the array
      if (selections.fee_schedule_date) {
        conditions.push(combo => {
          if (Array.isArray(combo.rate_effective_date)) {
            return combo.rate_effective_date.includes(selections.fee_schedule_date!);
          }
          return combo.rate_effective_date === selections.fee_schedule_date;
        });
      }
      
      // Filter combinations based on all current selections
      const filteredCombinations = filterOptionsData.combinations.filter(combo => 
        conditions.every(condition => condition(combo))
      );
      
      // Extract unique values for each filter, excluding already selected values
      const states = Array.from(new Set(
        filteredCombinations
          .map(c => c.state_name)
          .filter(Boolean)
          .filter(state => !selections.state_name || state === selections.state_name)
      )).sort();
      
      const serviceCodes = Array.from(new Set(
        filteredCombinations
          .map(c => c.service_code)
          .filter(Boolean)
          .filter(code => !selections.service_code || code === selections.service_code)
      )).sort();
      
      const serviceDescriptions = Array.from(new Set(
        filteredCombinations
          .map(c => c.service_description)
          .filter(Boolean)
          .filter(desc => !selections.service_description || desc === selections.service_description)
      )).sort();
      
      const programs = Array.from(new Set(
        filteredCombinations
          .map(c => c.program)
          .filter(Boolean)
          .filter(program => !selections.program || program === selections.program)
      )).sort();
      
      const locationRegions = Array.from(new Set(
        filteredCombinations
          .map(c => c.location_region)
          .filter(Boolean)
          .filter(region => !selections.location_region || region === selections.location_region)
      )).sort();
      
      const providerTypes = Array.from(new Set(
        filteredCombinations
          .map(c => c.provider_type)
          .filter(Boolean)
          .filter(type => !selections.provider_type || type === selections.provider_type)
      )).sort();
      
      // Special handling for fee schedule dates
      const feeScheduleDates = Array.from(new Set(
        filteredCombinations
          .flatMap(c => {
            if (Array.isArray(c.rate_effective_date)) {
              return c.rate_effective_date.filter(Boolean);
            }
            return c.rate_effective_date ? [c.rate_effective_date] : [];
          })
          .filter(date => !selections.fee_schedule_date || date === selections.fee_schedule_date)
      )).sort();
      
      const modifiers = Array.from(new Set(
        filteredCombinations
          .map(c => c.modifier_1)
          .filter(Boolean)
          .filter(modifier => !selections.modifier_1 || modifier === selections.modifier_1)
      )).sort();
      
      // Update available options
    } catch (error) {
      // Error handling
    } finally {
      setIsUpdatingFilters(false);
    }
  }, [filterOptionsData, selections]);

  const loadStatesForServiceCategory = useCallback(async (serviceCategory: string) => {
    if (!filterOptionsData) return;
    
    setIsUpdatingFilters(true);
    try {
      const states = filterOptionsData.combinations
        .filter(combo => combo.service_category === serviceCategory)
        .map(combo => combo.state_name)
        .filter(Boolean);
      
      const uniqueStates = Array.from(new Set(states)).sort();
    } catch (error) {
      // Error handling
    } finally {
      setIsUpdatingFilters(false);
    }
  }, [filterOptionsData]);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setHasSearched(true);
    setPendingFilters(new Set());
    try {
      const filters: any = {};
      for (const [key, value] of Object.entries(selections)) {
        if (value) filters[key] = value;
      }
      // Fix timezone issue: use local date components instead of UTC conversion
      if (startDate) filters.start_date = formatDateForAPI(startDate);
      if (endDate) filters.end_date = formatDateForAPI(endDate);
      filters.page = String(currentPage);
      filters.itemsPerPage = String(itemsPerPage);
      if (selections.modifier_1) filters.modifier_1 = selections.modifier_1;
      // Remove sort config from API call since we're doing client-side sorting
      const result = await refreshData(filters) as RefreshDataResponse | null;
      if (result?.data) {
        setTotalCount(result.totalCount);
        setAuthError(null);
      } else {
        setLocalError('Received invalid data format from server');
      }
    } catch (err) {
      setLocalError('Failed to fetch data. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [selections, startDate, endDate, currentPage, itemsPerPage, refreshData]);

  // All useEffect hooks
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/api/auth/login");
    } else if (isAuthenticated) {
      checkSubscriptionAndSubUser();
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth-check');
        if (response.status === 401) {
          router.push("/api/auth/login");
        }
      } catch (error) {
        // Error handling
      }
    };

    const authCheckInterval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        checkAuthStatus();
        
        if (hasSearched && !authError && getAreFiltersApplied()) {
          handleSearch();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(authCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, router, hasSearched, authError, handleSearch]);

  useEffect(() => {
    async function loadUltraFilterOptions() {
      try {
        setIsLoadingFilters(true);
        setLocalError(null);
        const res = await fetch("/filter_options.json.gz");
        if (!res.ok) throw new Error(`Failed to fetch filter options: ${res.status} ${res.statusText}`);
        const gzipped = new Uint8Array(await res.arrayBuffer());
        const decompressed = gunzipSync(gzipped);
        const jsonStr = strFromU8(decompressed);
        const data = JSON.parse(jsonStr);
        // Handle new columnar format with mappings
        if (data.m && data.v && data.c) {
          const { m: mappings, v: values, c: columns } = data;
          const numRows: number = values[0].length;
          const combinations: any[] = [];
          for (let i = 0; i < numRows; i++) {
            const combo: Record<string, any> = {};
            columns.forEach((col: string, colIndex: number) => {
              const intValue = values[colIndex][i];
              if (col === 'rate_effective_date') {
                // Handle rate_effective_date as array of integers
                if (Array.isArray(intValue)) {
                  // Convert array of integers to array of date strings
                  combo[col] = intValue.map(dateInt => 
                    dateInt === -1 ? '' : mappings[col][String(dateInt)]
                  ).filter(date => date !== '');
                } else {
                  // Fallback for single integer
                  combo[col] = intValue === -1 ? '' : mappings[col][String(intValue)];
                }
              } else {
                // Handle other fields as single integers
                combo[col] = intValue === -1 ? '' : mappings[col][String(intValue)];
              }
            });
            combinations.push(combo);
          }
          // Extract unique values for each filter
          const filters: Record<string, string[]> = {};
          columns.forEach((col: string) => {
            if (col === 'rate_effective_date') {
              // For dates, flatten arrays and get unique values
              const allDates = combinations
                .map((c: any) => c[col])
                .flat()
                .filter((v: any) => v && v !== '');
              filters[col as string] = [...new Set(allDates)].sort();
            } else {
              // For other fields, get unique single values
              const uniqueValues = [...new Set(combinations.map((c: any) => c[col]).filter((v: any) => v && v !== ''))];
              filters[col as string] = uniqueValues.sort();
            }
          });
          setFilterOptionsData({ filters, combinations });
          

        } else {
          setFilterOptionsData(data);
        }
      } catch (err) {
        setLocalError(`Could not load filter options: ${err instanceof Error ? err.message : 'Unknown error'}. Please try refreshing the page.`);
      } finally {
        setIsLoadingFilters(false);
      }
    }
    loadUltraFilterOptions();
  }, []);

  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
    // Only run when currentPage changes, not when hasSearched changes due to filter/sort
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

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
            // Error handling
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
            // Error handling
          }
        }

        setIsSubscriptionCheckComplete(true);
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
      }
    } catch (error) {
      router.push("/subscribe");
    }
  };

  // Generic handler to update selections state
  const handleSelectionChange = (field: keyof Selections, value: string | null) => {
    // Only reset dependent filters if the new selection makes previous selections impossible
    const newSelections: Selections = { ...selections, [field]: value };
    const dependencyChain: (keyof Selections)[] = [
        'service_category', 'state_name', 'service_code', 
        'service_description', 'program', 'location_region', 
        'provider_type', 'duration_unit', 'fee_schedule_date', 'modifier_1'
    ];
    const changedIndex = dependencyChain.indexOf(field);
    if (changedIndex !== -1) {
      for (let i = changedIndex + 1; i < dependencyChain.length; i++) {
        const fieldToClear = dependencyChain[i];
        // Only clear if the current value is not valid for the new selection
        if (selections[fieldToClear] && !getAvailableOptionsForFilter(fieldToClear).includes(selections[fieldToClear]!)) {
        newSelections[fieldToClear] = null;
      }
    }
    }
    // Clear date-based filters if their dependencies change
    if (field === 'service_category' || field === 'state_name') {
      newSelections.fee_schedule_date = null;
      setStartDate(null);
      setEndDate(null);
    }
    if (field === 'fee_schedule_date' && value) {
        setStartDate(null);
        setEndDate(null);
    }
    setSelections(newSelections);
    setCurrentPage(1);
    // Add to pendingFilters
    setPendingFilters(prev => new Set(prev).add(field));
    setTimeout(() => loadFilterOptions(), 100);
  };

  // Function to check if filters are applied
  const getAreFiltersApplied = () => selections.state_name && selections.service_category && (selections.service_code || selections.service_description || selections.fee_schedule_date || (startDate && endDate));

  // Update the handleSort function
  const handleSort = (key: string, event: React.MouseEvent) => {
    event.preventDefault();
    setSortConfig(prev => {
      const isCtrlPressed = event.ctrlKey;
      const existingSort = prev.find(sort => sort.key === key);
      const existingIndex = prev.findIndex(sort => sort.key === key);
      let newSortConfig: { key: string; direction: 'asc' | 'desc' }[];
      if (existingSort) {
        if (!isCtrlPressed) {
          if (existingSort.direction === 'desc') {
            newSortConfig = prev.filter(sort => sort.key !== key);
          } else {
            newSortConfig = prev.map((sort, i) =>
              i === existingIndex ? { ...sort, direction: (sort.direction === 'asc' ? 'desc' : 'asc') as 'asc' | 'desc' } : sort
            );
          }
        } else if (existingIndex > 0) {
          newSortConfig = prev.map((sort, i) =>
            i === existingIndex ? { ...sort, direction: (sort.direction === 'asc' ? 'desc' : 'asc') as 'asc' | 'desc' } : sort
          );
        } else {
          newSortConfig = prev.filter(sort => sort.key !== key);
        }
      } else {
        const newSort = { key, direction: 'asc' as 'asc' | 'desc' };
        newSortConfig = isCtrlPressed ? [...prev, newSort] : [newSort];
      }
      // Add a special 'sort' key to pendingFilters to indicate sort is pending
      setPendingFilters(prevPending => new Set(prevPending).add('sort' as keyof Selections));
      return newSortConfig;
    });
    const header = event.currentTarget;
    header.classList.add('sort-animation');
    setTimeout(() => {
      header.classList.remove('sort-animation');
    }, 200);
  };

  // Update the SortIndicator component
  const SortIndicator = ({ sortKey }: { sortKey: string }) => {
    const sort = sortConfig.find(sort => sort.key === sortKey);
    if (!sort) return null;
    
    return (
      <span className="ml-1 sort-indicator">
        <span className="arrow" style={{ 
          display: 'inline-block',
          transition: 'transform 0.2s ease',
          transform: sort.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
        }}>
          ▲
        </span>
        {sortConfig.length > 1 && (
          <sup className="sort-priority">
            {sortConfig.findIndex(s => s.key === sortKey) + 1}
          </sup>
        )}
      </span>
    );
  };

  // Update ErrorMessage component to handle null
  const ErrorMessage = ({ error }: { error: string | null }) => {
    if (!error) return null;
    
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <div className="flex items-center">
          <FaExclamationCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  };

  // All filtering now handled by backend for optimal performance
  // Removed unused dropdown utility functions

  const ClearButton = ({ filterKey }: { filterKey: keyof Selections }) => (
    selections[filterKey] ? (
    <button
        type="button"
        aria-label={`Clear ${filterKey}`}
        onClick={() => handleSelectionChange(filterKey, null)}
        className="ml-1 px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 focus:outline-none filter-clear-btn"
        tabIndex={0}
    >
      Clear
    </button>
    ) : null
  );

  // Update the resetFilters function
  const resetFilters = () => {
    setSelections({
      state_name: null,
      service_category: null,
      service_code: null,
      service_description: null,
      program: null,
      location_region: null,
      provider_type: null,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    setHasSearched(false);
    setSortConfig([]);
    setDisplayedItems(itemsPerPage);
    setData([]);
    setTotalCount(0);
    setError(null);
    setLocalError(null);
    setAuthError(null);
    setPendingFilters(new Set());
    setFilterOptionsData(null);
    setIsLoadingFilters(false);
    setIsUpdatingFilters(false);
  };

  // Add pagination controls component
  const PaginationControls = () => {
    if (!hasSearched || totalCount === 0) return null;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    if (totalPages <= 1) return null;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);
    return (
      <div className="flex flex-col items-center justify-center mt-4">
        <div className="mb-2 text-sm text-gray-700">
          Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalCount}</span> results
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50"> {'<<'} </button>
          <button onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50"> {'<'} </button>
          <span className="px-3 py-1">Page {currentPage} of {totalPages}</span>
          <button onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} className="px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50"> {'>'} </button>
          <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50"> {'>>'} </button>
        </div>
      </div>
    );
  };

  // After all useState/useEffect/useCallback hooks, but before any useMemo or code that uses available* variables:

  // Add client-side sorting functionality
  const sortedData = useMemo(() => {
    if (!data || data.length === 0 || sortConfig.length === 0) {
      return data;
    }
    return [...data].sort((a, b) => {
      for (const sort of sortConfig) {
        const { key, direction } = sort;
        let aValue: any = a[key];
        let bValue: any = b[key];
        if (key === 'rate') {
          aValue = parseFloat((aValue || '0').replace(/[^0-9.-]/g, ''));
          bValue = parseFloat((bValue || '0').replace(/[^0-9.-]/g, ''));
        } else if (key === 'rate_effective_date') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        } else {
          aValue = (aValue || '').toString().toLowerCase();
          bValue = (bValue || '').toString().toLowerCase();
        }
        if (aValue < bValue) {
          return direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Restore handleLoadMore for Load More mode
  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    const filters: any = {};
    for (const [key, value] of Object.entries(selections)) {
      if (value) filters[key] = value;
          }
      // Fix timezone issue: use local date components instead of UTC conversion
      if (startDate) filters.start_date = formatDateForAPI(startDate);
      if (endDate) filters.end_date = formatDateForAPI(endDate);
      filters.page = String(nextPage);
      filters.itemsPerPage = String(itemsPerPage);
    setLoading(true);
    const result = await refreshData(filters);
    setLoading(false);
    if (result?.data) {
      setData(prev => [...prev, ...result.data]); // APPEND
      setCurrentPage(nextPage);
      setTotalCount(result.totalCount);
    }
  };

  // Update hasMoreItems logic for Load More mode
  const hasMoreItems = data.length < totalCount;

  // Update handlePageChange for Pagination mode
  const handlePageChange = async (page: number) => {
    const filters: any = {};
    for (const [key, value] of Object.entries(selections)) {
      if (value) filters[key] = value;
          }
    // Fix timezone issue: use local date components instead of UTC conversion
    if (startDate) filters.start_date = formatDateForAPI(startDate);
    if (endDate) filters.end_date = formatDateForAPI(endDate);
    filters.page = String(page);
    filters.itemsPerPage = String(itemsPerPage);
    setLoading(true);
    const result = await refreshData(filters);
    setLoading(false);
    if (result?.data) {
      setData(result.data); // REPLACE
      setCurrentPage(page);
      setTotalCount(result.totalCount);
    }
  };

  // Helper
  function getAvailableOptionsForFilter(filterKey: keyof Selections) {
    if (!filterOptionsData || !filterOptionsData.combinations) return [];
    
    // Special handling for fee_schedule_date to aggregate dates from the 'rate_effective_date' column
    if (filterKey === 'fee_schedule_date') {
      const dateSet = new Set<string>();
      filterOptionsData.combinations.forEach(combo => {
        // Only check selections that are actually set (not null)
        const matches = Object.entries(selections).every(([key, value]) => {
          if (key === 'fee_schedule_date') return true; // skip current filter
          if (!value) return true; // skip unset selections
          return combo[key] === value;
        });
        if (matches && combo.rate_effective_date) {
          // Handle rate_effective_date as array of dates
          if (Array.isArray(combo.rate_effective_date)) {
            combo.rate_effective_date.forEach(date => {
              if (date) dateSet.add(date);
            });
          } else {
            // Fallback for single date string
            dateSet.add(combo.rate_effective_date);
          }
        }
      });
      return Array.from(dateSet).sort();
    }
    
    // For all other filters, ensure that if a fee_schedule_date is selected, we only consider combos where the date matches
    return Array.from(new Set(
      filterOptionsData.combinations
        .filter(combo => {
          // If a fee_schedule_date is selected, only consider combos where the date matches
          if (selections.fee_schedule_date) {
            if (Array.isArray(combo.rate_effective_date)) {
              if (!combo.rate_effective_date.includes(selections.fee_schedule_date)) return false;
            } else {
              if (combo.rate_effective_date !== selections.fee_schedule_date) return false;
            }
          }
          // Now check all other selections except the current filterKey
          return Object.entries(selections).every(([key, value]) => {
            if (key === filterKey || key === 'fee_schedule_date') return true;
            if (!value) return true;
            
            // Handle multi-select values (arrays) vs single values (strings)
            if (Array.isArray(value)) {
              return value.includes(combo[key]);
            } else {
              return combo[key] === value;
            }
          });
        })
        .map(c => c[filterKey])
        .filter(Boolean)
    )).sort();
  }

  const availableServiceCategories = getAvailableOptionsForFilter('service_category');
  const availableStates = getAvailableOptionsForFilter('state_name');
  const availableServiceCodes = getAvailableOptionsForFilter('service_code');
  const availableServiceDescriptions = getAvailableOptionsForFilter('service_description');
  const availablePrograms = getAvailableOptionsForFilter('program');
  const availableLocationRegions = getAvailableOptionsForFilter('location_region');
  const availableProviderTypes = getAvailableOptionsForFilter('provider_type');
  const availableDurationUnits = getAvailableOptionsForFilter('duration_unit');
  const availableFeeScheduleDates = getAvailableOptionsForFilter('fee_schedule_date');
  const availableModifiers = getAvailableOptionsForFilter('modifier_1');

  // Build modifier dropdown options with definitions
  const modifierOptions = useMemo(() => {
    if (!filterOptionsData || !availableModifiers.length) return [];
    const modDefMap = new Map<string, string>();
    filterOptionsData.combinations.forEach(c => {
      if (c.modifier_1) modDefMap.set(c.modifier_1, c.modifier_1_details || '');
      if (c.modifier_2) modDefMap.set(c.modifier_2, c.modifier_2_details || '');
      if (c.modifier_3) modDefMap.set(c.modifier_3, c.modifier_3_details || '');
      if (c.modifier_4) modDefMap.set(c.modifier_4, c.modifier_4_details || '');
    });
    return availableModifiers.map(mod => ({
      value: mod,
      label: modDefMap.get(mod) ? `${mod} - ${modDefMap.get(mod)}` : mod
    }));
  }, [filterOptionsData, availableModifiers]);

  // Find the current combination based on all selected filters
  const currentCombo = useMemo(() => {
    if (!filterOptionsData || !filterOptionsData.combinations) return null;
    return filterOptionsData.combinations.find(
      c =>
        c.service_category === selections.service_category &&
        c.state_name === selections.state_name &&
        c.service_code === selections.service_code &&
        c.service_description === selections.service_description &&
        c.program === selections.program &&
        c.location_region === selections.location_region &&
        c.provider_type === selections.provider_type &&
        c.duration_unit === selections.duration_unit &&
        c.modifier_1 === selections.modifier_1
    );
  }, [filterOptionsData, selections]);

  // Update the availableDates calculation to use the new helper function
  const availableDates: string[] = useMemo(() => {
    const dates = getAvailableOptionsForFilter('fee_schedule_date');
    return dates.sort((a, b) => parseDateSafely(b).getTime() - parseDateSafely(a).getTime());
  }, [filterOptionsData, selections]);



  // Only after all hooks, do any early returns:
  if (isLoading || !isAuthenticated || !isSubscriptionCheckComplete) {
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Helper function to format rates with 2 decimal points
  const formatRate = (rate: string | undefined) => {
    if (!rate) return '-';
    // Remove any existing $ and parse as number
    const numericRate = parseFloat(rate.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericRate)) return rate; // Return original if not a valid number
    return `$${numericRate.toFixed(2)}`;
  };

  // Filter options are now handled by the backend API

  // Replace the getDropdownOptions function with the following:
  const getDropdownOptions = (options: (Option | string)[], isMandatory: boolean): readonly Option[] => {
    const opts: Option[] = options.map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
    return isMandatory ? opts : [{ value: '-', label: '-' }, ...opts] as const;
  };

  // Add this after state declarations
  const isStateSelected = !!selections.state_name && (availableServiceCodes.length > 0 || availableServiceDescriptions.length > 0 || availableFeeScheduleDates.length > 0) && !isLoadingFilters;
  const hasAnyPrimaryFilter =
    !!selections.service_code ||
    !!selections.service_description ||
    (!!startDate && !!endDate) ||
    !!selections.fee_schedule_date;

  // Helper function to add date filters to any filter object
  const addDateFilters = (filters: any) => {
    if (selections.fee_schedule_date) {
      filters.feeScheduleDate = selections.fee_schedule_date;
    } else if (startDate && endDate) {
      // Fix timezone issue: use local date components instead of UTC conversion
      filters.startDate = formatDateForAPI(startDate);
      filters.endDate = formatDateForAPI(endDate);
    } else if (startDate) {
      filters.startDate = formatDateForAPI(startDate);
    } else if (endDate) {
      filters.endDate = formatDateForAPI(endDate);
    }
    return filters;
  };

  // Add this handler near other filter handlers
  const handleProviderTypeChange = async (providerType: string) => {
    setSelections({
      state_name: null,
      service_category: null,
      service_code: null,
      service_description: null,
      program: null,
      location_region: null,
      provider_type: providerType,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
    setCurrentPage(1);
  };

  // Simplified date handlers for client-side filtering
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
      setCurrentPage(1);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
      setCurrentPage(1);
  };

  const handleFeeScheduleDateChange = (feeScheduleDate: string) => {
    setSelections({
      ...selections,
      fee_schedule_date: feeScheduleDate,
    });
      setStartDate(null);
      setEndDate(null);
    setCurrentPage(1);
  };

  // 1. Remove Load More logic and button
  // ... existing code ...
  // Remove handleLoadMore, hasMoreItems, and LoadMoreButton
  // ... existing code ...

  // 2. Add handlePageChange for classic pagination
  // ... existing code ...
  // Remove handlePageChange, hasMoreItems, and LoadMoreButton
  // ... existing code ...

  // 4. Table rendering: just use sortedData (which is the current page's data)
  // ... existing code ...



  return (
    <AppLayout activeTab="dashboard">
      <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Error Messages */}
        <ErrorMessage error={localError} />
        {authError && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <div className="flex items-center">
              <FaExclamationCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <div>
                <p className="text-yellow-700 font-medium">{authError}</p>
                <button
                  onClick={() => router.push('/api/auth/login')}
                  className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm"
                >
                  Sign In Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Heading and Date Range */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl text-[#012C61] font-lemonMilkRegular uppercase mb-3 sm:mb-0">
            Dashboard
          </h1>
          {/* Date range and Fee Schedule Date selectors OUTSIDE the filter card, styled as in screenshot */}
          <div className="flex flex-col items-end w-full mb-4">
            <div className="flex flex-row gap-6 w-[400px] justify-center">
              <div className="flex flex-col gap-2 w-1/2">
                <label className="block text-sm font-bold text-[#012C61]">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={handleStartDateChange}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={!!selections.fee_schedule_date || !selections.service_category}
                  isClearable
                  includeDates={availableDates.map(date => parseDateSafely(date))}
                  popperClassName="datepicker-zindex"
                />
              </div>
              <div className="flex flex-col gap-2 w-1/2">
                <label className="block text-sm font-bold text-[#012C61]">End Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={handleEndDateChange}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={!!selections.fee_schedule_date || !selections.service_category}
                  isClearable
                  includeDates={availableDates.map(date => parseDateSafely(date))}
                  popperClassName="datepicker-zindex"
                />
              </div>
            </div>
            <div className="flex flex-col items-center w-[400px] mt-4">
              <label className="block text-sm font-bold text-[#012C61] mb-1">Fee Schedule Date</label>
              <Select
                instanceId="fee_schedule_date_select"
                options={availableDates.map(date => ({ value: date, label: formatDate(date) }))}
                value={selections.fee_schedule_date ? { value: selections.fee_schedule_date, label: formatDate(selections.fee_schedule_date) } : null}
                onChange={(option) => handleSelectionChange('fee_schedule_date', option?.value || null)}
                placeholder="Select Fee Schedule Date"
                isClearable
                isDisabled={!selections.service_category || !selections.state_name || availableDates.length === 0}
                className={clsx("react-select-container w-full", pendingFilters.has('fee_schedule_date') ? 'pending-outline' : 'applied-outline')}
                classNamePrefix="react-select"
                styles={{
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 999999999,
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 999999999,
                  })
                }}
                menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              />
              <div className="mt-1 w-full text-left">
                <ClearButton filterKey="fee_schedule_date" />
              </div>
            </div>
          </div>
        </div>

        {/* Reset All Filters button above filter card, aligned left */}
        <div className="flex items-center mb-2">
          <button
            onClick={resetFilters}
            className="px-6 py-2 text-sm bg-[#012C61] text-white rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-400 font-semibold shadow-sm"
          >
            Reset All Filters
          </button>
        </div>

        {/* Main filter card */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-lg relative z-40">
          {/* Loading indicator for filter options */}
          {isLoadingFilters && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-blue-700">
                  Loading filter options... This may take a moment for large datasets.
                </p>
              </div>
            </div>
          )}
          {!isLoadingFilters && filterOptionsData && (
            <>
              {/* Info message inside filter card */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Instructions:</strong> Select filters below. All filters are interconnected and update dynamically. Click "Search" to view results.
                </p>
              </div>
              {/* Filter updating indicator */}
              {isUpdatingFilters && (
                <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700 flex items-center">
                    <span className="animate-spin mr-2">⟳</span>
                    Updating available options...
                  </p>
                </div>
              )}
              {/* Main filter grid below info message */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Service Line
                  </label>
                  <Select
                    instanceId="service_category_select"
                    options={availableServiceCategories.map(o => ({ value: o, label: o }))}
                    value={selections.service_category ? { value: selections.service_category, label: selections.service_category } : null}
                    onChange={(option) => handleSelectionChange('service_category', option?.value || null)}
                    placeholder="Select Service Line"
                    isClearable
                    className={clsx("react-select-container", pendingFilters.has('service_category') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="service_category" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    State
                  </label>
                  <Select
                    instanceId="state_name_select"
                    options={availableStates.map(o => ({ value: o, label: o }))}
                    value={selections.state_name ? { value: selections.state_name, label: selections.state_name } : null}
                    onChange={(option) => handleSelectionChange('state_name', option?.value || null)}
                    placeholder="Select State"
                    isClearable
                    isDisabled={!selections.service_category || availableStates.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('state_name') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="state_name" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Service Code
                  </label>
                  <Select
                    instanceId="service_code_select"
                    options={availableServiceCodes.map(o => ({ value: o, label: o }))}
                    value={selections.service_code ? { value: selections.service_code, label: selections.service_code } : null}
                    onChange={(option) => handleSelectionChange('service_code', option?.value || null)}
                    placeholder="Select Service Code"
                    isClearable
                    isDisabled={!selections.service_category || !selections.state_name || availableServiceCodes.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('service_code') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="service_code" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Service Description
                  </label>
                  <Select
                    instanceId="service_description_select"
                    options={availableServiceDescriptions.map(o => ({ value: o, label: o }))}
                    value={selections.service_description ? { value: selections.service_description, label: selections.service_description } : null}
                    onChange={(option) => handleSelectionChange('service_description', option?.value || null)}
                    placeholder="Select Service Description"
                    isClearable
                    isDisabled={!selections.service_category || !selections.state_name || availableServiceDescriptions.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('service_description') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="service_description" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Program
                  </label>
                  <Select
                    instanceId="program_select"
                    options={getDropdownOptions(availablePrograms, false)}
                    value={selections.program ? selections.program.split(',').map(p => ({ value: p.trim(), label: p.trim() })) : null}
                    onChange={(options) => handleSelectionChange('program', options ? options.map(opt => opt.value).join(',') : null)}
                    placeholder="Select Program"
                    isMulti
                    isClearable
                    isDisabled={!selections.service_category || !selections.state_name || availablePrograms.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('program') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="program" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Location/Region
                  </label>
                  <Select
                    instanceId="location_region_select"
                    options={getDropdownOptions(availableLocationRegions, false)}
                    value={selections.location_region ? selections.location_region.split(',').map(l => ({ value: l.trim(), label: l.trim() })) : null}
                    onChange={(options) => handleSelectionChange('location_region', options ? options.map(opt => opt.value).join(',') : null)}
                    placeholder="Select Location/Region"
                    isMulti
                    isClearable
                    isDisabled={!selections.service_category || !selections.state_name || availableLocationRegions.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('location_region') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="location_region" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Provider Type
                  </label>
                  <Select
                    instanceId="provider_type_select"
                    options={getDropdownOptions(availableProviderTypes, false)}
                    value={selections.provider_type ? selections.provider_type.split(',').map(p => ({ value: p.trim(), label: p.trim() })) : null}
                    onChange={(options) => handleSelectionChange('provider_type', options ? options.map(opt => opt.value).join(',') : null)}
                    placeholder="Select Provider Type"
                    isMulti
                    isClearable
                    isDisabled={!selections.service_category || !selections.state_name || availableProviderTypes.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('provider_type') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="provider_type" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Duration Unit
                  </label>
                  <Select
                    instanceId="duration_unit_select"
                    options={getDropdownOptions(availableDurationUnits, false)}
                    value={selections.duration_unit ? selections.duration_unit.split(',').map(d => ({ value: d.trim(), label: d.trim() })) : null}
                    onChange={(options) => handleSelectionChange('duration_unit', options ? options.map(opt => opt.value).join(',') : null)}
                    placeholder="Select Duration Unit"
                    isMulti
                    isClearable
                    isDisabled={!selections.service_category || !selections.state_name || availableDurationUnits.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('duration_unit') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="duration_unit" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Modifier
                  </label>
                    <Select
                    instanceId="modifier_1_select"
                    options={getDropdownOptions(modifierOptions, false)}
                    value={selections.modifier_1 ? selections.modifier_1.split(',').map(m => {
                      const mod = modifierOptions.find(opt => opt.value === m.trim());
                      return mod || { value: m.trim(), label: m.trim() };
                    }) : null}
                    onChange={(options) => handleSelectionChange('modifier_1', options ? options.map(opt => opt.value).join(',') : null)}
                    placeholder="Select Modifier"
                        isMulti
                        isClearable
                    isDisabled={!selections.service_category || !selections.state_name || availableModifiers.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('modifier_1') ? 'pending-outline' : 'applied-outline')}
                        classNamePrefix="react-select"
                    />
                  <div className="mt-1">
                    <ClearButton filterKey="modifier_1" />
                </div>
                </div>
                </div>
              <div className="mt-6 flex items-center justify-end space-x-4">
                  <button 
                    onClick={handleSearch} 
                    disabled={!selections.state_name || !selections.service_category || isSearching} 
                    className="px-6 py-2 text-sm bg-[#012C61] text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-400"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
              </div>
              {/* Current selections summary */}
              {Object.values(selections).some(v => v !== null) && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Current Selections:</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selections).map(([key, value]) => 
                      value && (
                        <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {key.replace('_', ' ')}: {value}
                        </span>
                      )
                    )}
                    {startDate && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Start Date: {startDate.toLocaleDateString()}
                      </span>
                    )}
                    {endDate && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        End Date: {endDate.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sorting Instructions card below filter card */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center mb-2">
            <span className="text-blue-600 text-xl mr-2">⚡</span>
            <span className="font-semibold text-blue-800">Sorting Instructions</span>
          </div>
          <ul className="list-disc list-inside text-blue-900 text-sm pl-2">
            <li>Click any column header to sort the data</li>
            <li>Click again to toggle between ascending and descending order</li>
            <li>Click a third time to deselect the sort</li>
            <li>Hold <kbd className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded">Ctrl</kbd> while clicking to apply multiple sort levels</li>
            <li>Sort priority is indicated by numbers next to the sort arrows (1 = primary sort, 2 = secondary sort, etc.)</li>
          </ul>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loader-overlay">
            <div className="cssloader">
              <div className="sh1"></div>
              <div className="sh2"></div>
              <h4 className="lt">loading</h4>
            </div>
          </div>
        )}

        {/* Empty State Message */}
        {!loading && !hasSearched && (
          <div className="p-6 bg-white rounded-xl shadow-lg text-center">
            <div className="flex justify-center items-center mb-4">
              <FaFilter className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Please select filters and click Search to view data
            </p>
            <p className="text-sm text-gray-500">
              Start by selecting a Service Line and State.
            </p>
          </div>
        )}

        {/* Show the table when filters are applied and data is loaded */}
        {!loading && hasSearched && data.length > 0 && (
          <>
          <div 
            className="rounded-lg shadow-lg bg-white relative z-30 overflow-x-auto"
            style={{ 
              maxHeight: 'calc(100vh - 5.5rem)', 
              overflow: 'auto'
            }}
          >
              <table className="min-w-full" style={{ width: '100%', tableLayout: 'auto' }}>
                <thead className="bg-gray-50 sticky top-0 z-20">
                <tr>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('state_name', e)}>
                    State<SortIndicator sortKey="state_name" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('service_category', e)}>
                    Service Category<SortIndicator sortKey="service_category" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('service_code', e)}>
                    Service Code<SortIndicator sortKey="service_code" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('service_description', e)}>
                    Service Description<SortIndicator sortKey="service_description" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('rate', e)}>
                    Rate per Base Unit<SortIndicator sortKey="rate" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('duration_unit', e)}>
                    Duration Unit<SortIndicator sortKey="duration_unit" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('rate_effective_date', e)}>
                    Effective Date<SortIndicator sortKey="rate_effective_date" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('provider_type', e)}>
                    Provider Type<SortIndicator sortKey="provider_type" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('modifier_1', e)}>
                    Modifier 1<SortIndicator sortKey="modifier_1" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('modifier_2', e)}>
                    Modifier 2<SortIndicator sortKey="modifier_2" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('modifier_3', e)}>
                    Modifier 3<SortIndicator sortKey="modifier_3" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('modifier_4', e)}>
                    Modifier 4<SortIndicator sortKey="modifier_4" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('program', e)}>
                    Program<SortIndicator sortKey="program" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('location_region', e)}>
                    Location/Region<SortIndicator sortKey="location_region" />
                    </th>
                </tr>
              </thead>
                                <tbody className="divide-y divide-gray-200">
                  {sortedData.map((item: any, idx: number) => (
                    <tr key={`id-${item.id}-${item.service_code ?? ''}-${item.rate_effective_date ?? ''}-${idx}`}
                        className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.state_code || STATE_ABBREVIATIONS[item.state_name?.toUpperCase() || ""] || item.state_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{SERVICE_CATEGORY_ABBREVIATIONS[item.service_category?.toUpperCase() || ""] || item.service_category || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.service_code || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-[220px] truncate" title={item.service_description || '-'}>{item.service_description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRate(item.rate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.duration_unit || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.rate_effective_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.provider_type || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.modifier_1 ? (item.modifier_1_details ? `${item.modifier_1} - ${item.modifier_1_details}` : item.modifier_1) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.modifier_2 ? (item.modifier_2_details ? `${item.modifier_2} - ${item.modifier_2_details}` : item.modifier_2) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.modifier_3 ? (item.modifier_3_details ? `${item.modifier_3} - ${item.modifier_3_details}` : item.modifier_3) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.modifier_4 ? (item.modifier_4_details ? `${item.modifier_4} - ${item.modifier_4_details}` : item.modifier_4) : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.program || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.location_region || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            {/* Always show both controls after a search */}
            <div className="flex flex-col items-center mt-4">
            <PaginationControls />
            </div>
          </>
        )}
      </div>

      {/* Custom CSS for select dropdowns */}
      <style jsx>{`
        select {
          appearance: none;
          background-color: white;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%233b82f6%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 0.75rem;
        }
        select:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
        th.sortable {
          cursor: pointer;
          position: relative;
          user-select: none;
          transition: all 0.2s ease;
          padding: 12px 16px;
        }

        th.sortable:hover {
          background-color: #f5f5f5;
          box-shadow: inset 0 -2px 0 #3b82f6;
        }

        th.sortable.active {
          background-color: #e8f0fe;
          font-weight: 600;
          box-shadow: inset 0 -2px 0 #3b82f6;
        }

        .sort-indicator {
          margin-left: 4px;
          font-size: 0.8em;
          color: #666;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
        }

        th.sortable:hover .sort-indicator {
          color: #3b82f6;
        }

        .sort-priority {
          font-size: 0.6em;
          vertical-align: super;
          color: #3b82f6;
          margin-left: 2px;
          font-weight: 500;
          background-color: #e8f0fe;
          padding: 2px 4px;
          border-radius: 3px;
          transition: all 0.2s ease;
        }

        .arrow {
          transition: transform 0.2s ease;
        }

        .sorted-column {
          background-color: #f8f9fa;
        }

        .sorted-column:hover {
          background-color: #e9ecef;
        }

        .sort-animation {
          animation: sortPulse 0.2s ease;
        }

        @keyframes sortPulse {
          0% { background-color: transparent; }
          50% { background-color: #e8f0fe; }
          100% { background-color: transparent; }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .react-select__menu {
          z-index: 1000;
        }

        .react-datepicker-popper {
          z-index: 1000;
        }

        thead {
          z-index: 50;
          position: sticky;
          top: 0;
        }
      `}</style>
      <style jsx>{`
        .loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(57,57,57,0.9);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }
        .cssloader {
          padding-top: 0;
        }
        .sh1 {
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 50px 50px 0 0;
          border-color: #012C61 transparent transparent transparent;
          margin: 0 auto;
          animation: shk1 1s ease-in-out infinite normal;
        }
        .sh2 {
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 0 50px 50px;
          border-color: transparent  transparent #3b82f6 transparent ;
          margin: -50px auto 0;
          animation: shk2 1s ease-in-out infinite alternate;
        }
        @keyframes shk1 {
          0% { transform: rotate(-360deg); }
          100% {}
        }
        @keyframes shk2 {
          0% { transform: rotate(360deg); }
          100% {}
        }
        .lt {
          color: #bdbdbd;
          font-family: 'Roboto', 'Arial', sans-serif;
          margin: 30px auto;
          text-align: center;
          font-weight: 100;
          letter-spacing: 10px;
          text-transform: lowercase;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <style jsx>{`
        .blue-reset-btn {
          background: #012C61;
          color: #fff;
          font-weight: 600;
          padding: 0.5rem 1.5rem;
          border-radius: 0.5rem;
          border: none;
          font-size: 1rem;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .blue-reset-btn:hover, .blue-reset-btn:focus {
          background: #0141a2;
          box-shadow: 0 2px 8px rgba(1,44,97,0.08);
          outline: none;
        }
      `}</style>
      <style jsx global>{`
        .pending-outline .react-select__control {
          border-color: #FFD600 !important;
          box-shadow: 0 0 0 2px #FFD60033 !important;
        }
        .applied-outline .react-select__control {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px #3b82f633 !important;
        }
        .filter-clear-btn {
          margin-left: 0;
          font-size: 0.8em;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #2563eb;
          border-radius: 0.375rem;
          cursor: pointer;
          padding: 0.1em 0.7em;
          transition: background 0.15s, color 0.15s;
          height: 1.7rem;
          display: inline-flex;
          align-items: center;
        }
        .filter-clear-btn:hover {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .datepicker-zindex {
          z-index: 999999999 !important;
        }
      `}</style>
    </AppLayout>
  );
}