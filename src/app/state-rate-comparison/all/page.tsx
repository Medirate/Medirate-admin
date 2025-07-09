"use client";

import { useEffect, useState, useMemo, useId, useCallback, useRef } from "react";
import { Bar } from "react-chartjs-2";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import AppLayout from "@/app/components/applayout";
import Modal from "@/app/components/modal";
import { FaChartLine, FaArrowUp, FaArrowDown, FaDollarSign, FaSpinner, FaFilter, FaChartBar, FaExclamationCircle } from 'react-icons/fa';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useRouter } from "next/navigation";
import { DataTable } from './DataTable';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import clsx from 'clsx';
import { gunzipSync, strFromU8 } from "fflate";
import { supabase } from "@/lib/supabase";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

// Add this interface for API response
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

// Insert a type alias (Option) near the top
type Option = { value: string; label: string };

const colorSequence = [
  '#36A2EB', // Blue
  '#FF6384', // Red
  '#4BC0C0', // Teal
  '#FF9F40', // Orange
  '#9966FF', // Purple
  '#FFCD56', // Yellow
  '#C9CBCF', // Gray
  '#00A8E8', // Light Blue
  '#FF6B6B'  // Coral
];

// Chart.js default colors with 0.8 alpha for less transparency
const chartJsColors = [
  'rgba(54,162,235,0.8)',   // Blue
  'rgba(255,99,132,0.8)',   // Red
  'rgba(75,192,192,0.8)',   // Teal
  'rgba(255,159,64,0.8)',   // Orange
  'rgba(153,102,255,0.8)',  // Purple
  'rgba(255,205,86,0.8)',   // Yellow
  'rgba(201,203,207,0.8)',  // Gray
  'rgba(0,168,232,0.8)',    // Light Blue
  'rgba(255,107,107,0.8)',  // Coral
  'rgba(46,204,64,0.8)',    // Green
  'rgba(255,133,27,0.8)',   // Orange
  'rgba(127,219,255,0.8)',  // Aqua
  'rgba(177,13,201,0.8)',   // Violet
  'rgba(255,220,0,0.8)',    // Gold
  'rgba(0,31,63,0.8)',      // Navy
  'rgba(57,204,204,0.8)',   // Cyan
  'rgba(1,255,112,0.8)',    // Lime
  'rgba(133,20,75,0.8)',    // Maroon
  'rgba(240,18,190,0.8)',   // Fuchsia
  'rgba(61,153,112,0.8)',   // Olive
];

interface ServiceData {
  state_name: string;
  service_category: string;
  service_code: string;
  modifier_1?: string;
  modifier_1_details?: string;
  modifier_2?: string;
  modifier_2_details?: string;
  modifier_3?: string;
  modifier_3_details?: string;
  modifier_4?: string;
  modifier_4_details?: string;
  rate: string;
  rate_per_hour?: string;
  rate_effective_date: string;
  program: string;
  location_region: string;
  duration_unit?: string;
  service_description?: string;
  provider_type?: string; // Add this line
}

interface FilterSet {
  serviceCategory: string;
  states: string[];
  serviceCode: string;
  stateOptions: { value: string; label: string }[];
  serviceCodeOptions: string[];
  program?: string;
  locationRegion?: string;
  modifier?: string;
  serviceDescription: string; // Changed from optional to required
  providerType?: string;
  durationUnits: string[]; // Changed from durationUnit?: string to durationUnits: string[]
}

const darkenColor = (color: string, amount: number): string => {
  // Convert hex to RGB
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);

  // Darken each component
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));

  // Convert back to hex
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const lightenColor = (color: string, amount: number): string => {
  // Convert hex to RGB
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);

  // Lighten each component
  r = Math.min(255, Math.floor(r + (255 - r) * amount));
  g = Math.min(255, Math.floor(g + (255 - g) * amount));
  b = Math.min(255, Math.floor(b + (255 - b) * amount));

  // Convert back to hex
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// Add back the customFilterOption function
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

// Generate a stable unique key for a row
function getRowKey(item: ServiceData) {
  return [
    item.state_name,
    item.service_category,
    item.service_code,
    item.service_description,
    item.program,
    item.location_region,
    item.modifier_1,
    item.modifier_1_details,
    item.modifier_2,
    item.modifier_2_details,
    item.modifier_3,
    item.modifier_3_details,
    item.modifier_4,
    item.modifier_4_details,
    item.duration_unit,
    item.provider_type
  ].map(x => x ?? '').join('|');
}

// Add at the top of the component, after useState imports
const ITEMS_PER_STATE_PAGE = 50;

// Add this helper near the top (after imports)
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
}

export default function StatePaymentComparison() {
  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();
  const router = useRouter();
  const [isSubscriptionCheckComplete, setIsSubscriptionCheckComplete] = useState(false);

  // Add local state for data, loading, and error (like dashboard)
  const [data, setData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add filter options data state (like dashboard)
  const [filterOptionsData, setFilterOptionsData] = useState<FilterOptionsData | null>(null);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [isUpdatingFilters, setIsUpdatingFilters] = useState(false);

  // Add selections state (like dashboard)
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

  // Add pending filters state (like dashboard)
  const [pendingFilters, setPendingFilters] = useState<Set<keyof Selections>>(new Set());

  // Add state for authentication errors
  const [authError, setAuthError] = useState<string | null>(null);

  // Add refreshData function inside the component - moved here to fix declaration order
  const refreshData = async (filters: Record<string, string> = {}): Promise<RefreshDataResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // If All States is selected, do NOT send state_name filter
      const isAllStates = filterSets[0]?.states && filterSets[0].states.length === filterOptions.states.length;
      Object.entries(filters).forEach(([key, value]) => {
        if (isAllStates && key === 'state_name') return; // skip state_name in All States mode
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

  // Move filterOptions useMemo to the top of the component, before any usage
  const filterOptions = useMemo(() => {
    if (!filterOptionsData) {
      return {
        serviceCategories: [],
        states: [],
        serviceCodes: [],
        programs: [],
        locationRegions: [],
        modifiers: [],
        serviceDescriptions: [],
        providerTypes: [],
      };
    }
    return {
      serviceCategories: filterOptionsData.filters.service_category || [],
      states: filterOptionsData.filters.state_name || [],
      serviceCodes: filterOptionsData.filters.service_code || [],
      programs: filterOptionsData.filters.program || [],
      locationRegions: filterOptionsData.filters.location_region || [],
      modifiers: (filterOptionsData.filters.modifier_1 || []).map((m: string) => ({ value: m, label: m })),
      serviceDescriptions: filterOptionsData.filters.service_description || [],
      providerTypes: filterOptionsData.filters.provider_type || [],
    };
  }, [filterOptionsData]);

  // Add refreshFilters function
  const refreshFilters = async (serviceCategory?: string, state?: string, serviceCode?: string) => {
    // This function is not needed for the new structure, but keeping for compatibility
    return null;
  };

  const [filterSets, setFilterSets] = useState<FilterSet[]>([
    { 
      serviceCategory: "", 
      states: ["ALL_STATES"], // Default to "All States"
      serviceCode: "", 
      stateOptions: [], 
      serviceCodeOptions: [],
      durationUnits: [], // Initialize with empty array
      serviceDescription: "" // Initialize with empty string
    }
  ]);

  // Add areFiltersComplete before it's used in useEffect
  const areFiltersComplete = useMemo(() => 
    filterSets.every(filterSet => 
      filterSet.states.length > 0 && 
      filterSet.serviceCategory && 
      filterSet.durationUnits.length > 0 && // Require at least one duration unit
      // Either service code OR service description must be selected (but not necessarily both)
      (filterSet.serviceCode || filterSet.serviceDescription)
    ), 
    [filterSets]
  );

  // Add periodic authentication check for long-running sessions
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAuthStatus = async () => {
      try {
        // Make a lightweight authenticated request to verify the session is still valid
        const response = await fetch('/api/auth-check');
        if (response.status === 401) {
          setAuthError('Your session has expired. Please sign in again.');
      router.push("/api/auth/login");
        }
      } catch (error) {
        // Error handling
      }
    };

    // Check authentication status every 5 minutes
    const authCheckInterval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    // Also check when the page becomes visible again (user returns from another tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        checkAuthStatus();
        
        // Refresh data if filters are complete
        if (areFiltersComplete) {
          // Trigger a data refresh for all filter sets
          setChartRefreshKey(prev => prev + 1);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(authCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, router, areFiltersComplete]);

  // Add checkSubscriptionAndSubUser function
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

        if (fetchError && fetchError.code !== "PGRST116") {
          return;
        }

        if (existingUser) {
          const { error: updateError } = await supabase
            .from("User")
            .update({ Role: "sub-user", UpdatedAt: new Date().toISOString() })
            .eq("Email", userEmail);

          if (updateError) {
            // Error handling
          }
        } else {
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

  // State hooks
  const [filterLoading, setFilterLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState("");
  const [selectedState, setSelectedState] = useState("ALL_STATES"); // Default to "All States"
  const [selectedServiceCode, setSelectedServiceCode] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedLocationRegion, setSelectedLocationRegion] = useState("");
  const [selectedModifier, setSelectedModifier] = useState("");
  const [selectedServiceDescription, setSelectedServiceDescription] = useState("");
  const [selectedProviderType, setSelectedProviderType] = useState("");
  const [selectedDurationUnit, setSelectedDurationUnit] = useState("");
  const [showApplyToAllPrompt, setShowApplyToAllPrompt] = useState(false);
  const [lastSelectedModifier, setLastSelectedModifier] = useState<string | null>(null);
  const [selectedTableRows, setSelectedTableRows] = useState<{[state: string]: string[]}>({});
  const [showRatePerHour, setShowRatePerHour] = useState(false);
  const [isAllStatesSelected, setIsAllStatesSelected] = useState(true); // Default to true since "All States" is default
  const [globalModifierOrder, setGlobalModifierOrder] = useState<Map<string, number>>(new Map());
  const [globalSelectionOrder, setGlobalSelectionOrder] = useState<Map<string, number>>(new Map());
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [clickedStates, setClickedStates] = useState<string[]>([]);
  const chartRef = useRef<any>(null);
  const [selectedStateDetails, setSelectedStateDetails] = useState<{
    state: string;
    average: number;
    entries: ServiceData[];
  } | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<ServiceData | null>(null);
  const [comment, setComment] = useState<string | null>(null);
  const [comments, setComments] = useState<{ state: string; comment: string }[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [serviceCodes, setServiceCodes] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [locationRegions, setLocationRegions] = useState<string[]>([]);
  const [modifiers, setModifiers] = useState<{ value: string; label: string; details?: string }[]>([]);
  const [serviceDescriptions, setServiceDescriptions] = useState<string[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<{[key: string]: string}>({});
  const [providerTypes, setProviderTypes] = useState<string[]>([]);
  const [filterSetData, setFilterSetData] = useState<{ [index: number]: ServiceData[] }>({});
  const [selectedEntries, setSelectedEntries] = useState<{ [state: string]: ServiceData[] }>({});
  const [chartRefreshKey, setChartRefreshKey] = useState(0);
  // State to hold all states averages for All States mode
  const [allStatesAverages, setAllStatesAverages] = useState<{ state_name: string; avg_rate: number }[] | null>(null);
  // Add state to track per-state pagination and per-state selected entry
  const [allStatesTablePages, setAllStatesTablePages] = useState<{ [state: string]: number }>({});
  const [allStatesSelectedRows, setAllStatesSelectedRows] = useState<{ [state: string]: any | null }>({});
  // Add new state to track which entries contribute to each state's average
  const [stateAverageEntries, setStateAverageEntries] = useState<{ [state: string]: ServiceData[] }>({});
  // Add state to track which entries are selected for average calculation
  const [stateSelectedForAverage, setStateSelectedForAverage] = useState<{ [state: string]: Set<string> }>({});
  const [pendingSearch, setPendingSearch] = useState(false);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);
  // Add state to track missing required fields
  const [missingFields, setMissingFields] = useState<{[key: string]: boolean}>({});

  const hasSelectedRows = useMemo(() => 
    Object.values(selectedTableRows).some(selections => selections.length > 0),
    [selectedTableRows]
  );

  const shouldShowChart = useMemo(() => 
    areFiltersComplete && (isAllStatesSelected || hasSelectedRows),
    [areFiltersComplete, isAllStatesSelected, hasSelectedRows]
  );

  const shouldShowMetrics = useMemo(() => 
    areFiltersComplete,
    [areFiltersComplete]
  );

  const shouldShowEmptyState = useMemo(() => 
    areFiltersComplete && !isAllStatesSelected && !hasSelectedRows,
    [areFiltersComplete, isAllStatesSelected, hasSelectedRows]
  );

  // Move formatText function to top level
  const formatText = (text: string | null | undefined) => {
    if (!text) return "-";
    return text.trim();
  };

  // Move handleTableRowSelection to top level
  const handleTableRowSelection = (state: string, item: ServiceData) => {
    const modifierKey = [
      item.modifier_1?.trim().toUpperCase() || '',
      item.modifier_2?.trim().toUpperCase() || '',
      item.modifier_3?.trim().toUpperCase() || '',
      item.modifier_4?.trim().toUpperCase() || '',
      item.program?.trim().toUpperCase() || '',
      item.location_region?.trim().toUpperCase() || ''
    ].join('|');

    setSelectedTableRows(prev => {
      const stateSelections = prev[state] || [];
      const newSelections = stateSelections.includes(modifierKey)
        ? stateSelections.filter(key => key !== modifierKey)
        : [...stateSelections, modifierKey];

      return {
        ...prev,
        [state]: newSelections
      };
    });

    // Update the selected entry
    setSelectedEntry(prev => 
      prev?.state_name === item.state_name &&
      prev?.service_code === item.service_code &&
      prev?.program === item.program &&
      prev?.location_region === item.location_region &&
      prev?.modifier_1 === item.modifier_1 &&
      prev?.modifier_2 === item.modifier_2 &&
      prev?.modifier_3 === item.modifier_3 &&
      prev?.modifier_4 === item.modifier_4
        ? null
        : item
    );
  };

  // Move latestRates calculation to top level
  const latestRates = useMemo(() => {
    const latestRatesMap = new Map<string, ServiceData>();
    data.forEach((item) => {
      const key = `${item.state_name}|${item.service_category}|${item.service_code}|${item.modifier_1}|${item.modifier_2}|${item.modifier_3}|${item.modifier_4}|${item.program}|${item.location_region}`;
      const currentDate = new Date(item.rate_effective_date);
      const existing = latestRatesMap.get(key);
      
      if (!existing || currentDate > new Date(existing.rate_effective_date)) {
        latestRatesMap.set(key, item);
      }
    });
    return Array.from(latestRatesMap.values());
  }, [data]);

  // Update deleteFilterSet function
  const deleteFilterSet = (index: number) => {
    // Get the states from the filter set being removed
    const removedFilterSet = filterSets[index];
    const statesToRemove = removedFilterSet.states;

    // Remove the filter set
    setFilterSets(prev => prev.filter((_, i) => i !== index));

    // Clear selected entries for the removed states
    setSelectedEntries(prev => {
      const newEntries = { ...prev };
      statesToRemove.forEach(state => {
        delete newEntries[state];
      });
      return newEntries;
    });

    // Clear filter set data for the removed index
    setFilterSetData(prev => {
      const newData = { ...prev };
      delete newData[index];
      return newData;
    });
  };

  // Update useEffect to use refreshData
  useEffect(() => {
    if (pendingSearch) return; // Only fetch when not pending
    const loadData = async () => {
      try {
        setFilterLoading(true);
        const result = await refreshData();
        if (result) {
          extractFilters(result.data);
        }
      } catch (error) {
        setFetchError("Failed to load data. Please try again.");
    } finally {
        setFilterLoading(false);
      }
    };
    loadData();
  }, [pendingSearch]);

  // Update extractFilters to use filterOptions from context
  const extractFilters = (data: ServiceData[]) => {
    setServiceCategories(filterOptions.serviceCategories);
    setStates(filterOptions.states);
    setPrograms(filterOptions.programs);
    setLocationRegions(filterOptions.locationRegions);
    setModifiers(filterOptions.modifiers);
    setServiceDescriptions(filterOptions.serviceDescriptions);
    setProviderTypes(filterOptions.providerTypes);
  };

  // Update filter handlers to work with existing UI but use new dynamic filtering
  const handleServiceCategoryChange = (index: number, serviceCategory: string) => {
    // Update filterSets for UI
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      serviceCategory: serviceCategory,
      states: ["ALL_STATES"], // Default to All States
      serviceCode: "",
      serviceCodeOptions: []
    };
    setFilterSets(newFilters);
    
    // Update selections for dynamic filtering
    setSelections({
      ...selections,
      service_category: serviceCategory,
      state_name: null,
      service_code: null,
      service_description: null,
      program: null,
      location_region: null,
      provider_type: null,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
  };

  const handleStateChange = (index: number, state: string) => {
    // Update filterSets for UI
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      states: [state],
      serviceCode: "",
      serviceCodeOptions: []
    };
    setFilterSets(newFilters);
    
    // Update selections for dynamic filtering
    setSelections({
      ...selections,
      state_name: state,
      service_code: null,
      service_description: null,
      program: null,
      location_region: null,
      provider_type: null,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
  };

  const handleServiceCodeChange = (index: number, serviceCode: string) => {
    // Update filterSets for UI
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      serviceCode: serviceCode,
      serviceDescription: "" // Clear service description when service code changes
    };
    setFilterSets(newFilters);
    // Update selections for dynamic filtering
    setSelections({
      ...selections,
      service_code: serviceCode,
      service_description: null, // Clear service description
      program: null,
      location_region: null,
      provider_type: null,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
  };

  const handleServiceDescriptionChange = (index: number, serviceDescription: string) => {
    // Update filterSets for UI
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      serviceDescription: serviceDescription,
      serviceCode: "" // Clear service code when service description changes
    };
    setFilterSets(newFilters);
    // Update selections for dynamic filtering
    setSelections({
      ...selections,
      service_description: serviceDescription,
      service_code: null, // Clear service code
      program: null,
      location_region: null,
      provider_type: null,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
  };

  const handleProgramChange = (index: number, program: string) => {
    // Update filterSets for UI
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      program: program
    };
    setFilterSets(newFilters);
    
    // Update selections for dynamic filtering
    setSelections({
      ...selections,
      program: program,
      service_code: null,
      service_description: null,
      location_region: null,
      provider_type: null,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
  };

  const handleLocationRegionChange = (index: number, locationRegion: string) => {
    // Update filterSets for UI
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      locationRegion: locationRegion
    };
    setFilterSets(newFilters);
    
    // Update selections for dynamic filtering
    setSelections({
      ...selections,
      location_region: locationRegion,
      service_code: null,
      service_description: null,
      program: null,
      provider_type: null,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
  };

  const handleProviderTypeChange = (index: number, providerType: string) => {
    // Update filterSets for UI
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      providerType: providerType
    };
    setFilterSets(newFilters);
    
    // Update selections for dynamic filtering
    setSelections({
      ...selections,
      provider_type: providerType,
      service_code: null,
      service_description: null,
      program: null,
      location_region: null,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
  };

  const handleDurationUnitChange = (index: number, durationUnit: string) => {
    // Update filterSets for UI
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      durationUnits: [durationUnit]
    };
    setFilterSets(newFilters);
    
    // Update selections for dynamic filtering
    setSelections({
      ...selections,
      duration_unit: durationUnit,
      service_code: null,
      service_description: null,
      program: null,
      location_region: null,
      provider_type: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
  };

  const handleModifierChange = (index: number, modifier: string) => {
    // Update filterSets for UI
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      modifier: modifier
    };
    setFilterSets(newFilters);
    
    // Update selections for dynamic filtering
    setSelections({
      ...selections,
      modifier_1: modifier,
      service_code: null,
      service_description: null,
      program: null,
      location_region: null,
      provider_type: null,
      duration_unit: null,
      fee_schedule_date: null,
    });
  };

  // Fetch state averages for All States mode
  const fetchAllStatesAverages = useCallback(async (serviceCategory: string, serviceCode: string) => {
    try {
      // Build query parameters for the API call
      const params = new URLSearchParams();
      params.append('mode', 'stateAverages');
      params.append('serviceCategory', serviceCategory);
      params.append('serviceCode', serviceCode);
      
      // Add all filter parameters from the first filter set
      if (filterSets[0]) {
        const filterSet = filterSets[0];
        if (filterSet.program) params.append('program', filterSet.program);
        if (filterSet.locationRegion) params.append('locationRegion', filterSet.locationRegion);
        if (filterSet.providerType) params.append('providerType', filterSet.providerType);
        if (filterSet.modifier) params.append('modifier', filterSet.modifier);
        if (filterSet.serviceDescription) params.append('serviceDescription', filterSet.serviceDescription);
        if (filterSet.durationUnits && filterSet.durationUnits.length > 0) {
          filterSet.durationUnits.forEach(unit => params.append('durationUnit', unit));
        }
      }
      
      const res = await fetch(`/api/state-payment-comparison?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch state averages');
      const data = await res.json();
      setAllStatesAverages(data.stateAverages || []);
      
      // Also fetch the individual entries that contribute to each state's average
      const entriesParams = new URLSearchParams();
      entriesParams.append('serviceCategory', serviceCategory);
      entriesParams.append('serviceCode', serviceCode);
      entriesParams.append('itemsPerPage', '1000'); // Get all entries
      
      // Add all filter parameters from the first filter set
      if (filterSets[0]) {
        const filterSet = filterSets[0];
        if (filterSet.program) entriesParams.append('program', filterSet.program);
        if (filterSet.locationRegion) entriesParams.append('locationRegion', filterSet.locationRegion);
        if (filterSet.providerType) entriesParams.append('providerType', filterSet.providerType);
        if (filterSet.modifier) entriesParams.append('modifier', filterSet.modifier);
        if (filterSet.serviceDescription) entriesParams.append('serviceDescription', filterSet.serviceDescription);
        if (filterSet.durationUnits && filterSet.durationUnits.length > 0) {
          filterSet.durationUnits.forEach(unit => entriesParams.append('durationUnit', unit));
        }
      }
      
      const entriesRes = await fetch(`/api/state-payment-comparison?${entriesParams.toString()}`);
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        const entries = entriesData.data || [];
        
        // Group entries by state and find the latest entry for each state
        const stateEntries: { [state: string]: ServiceData[] } = {};
        const latestEntries: { [state: string]: ServiceData } = {};
        
        entries.forEach((entry: ServiceData) => {
          const state = entry.state_name;
          if (!stateEntries[state]) {
            stateEntries[state] = [];
          }
          stateEntries[state].push(entry);
          
          // Track the latest entry for each state
          if (!latestEntries[state] || new Date(entry.rate_effective_date) > new Date(latestEntries[state].rate_effective_date)) {
            latestEntries[state] = entry;
          }
        });
        
        // Set the entries that contribute to each state's average
        setStateAverageEntries(stateEntries);
        
        console.log('📊 State Average Entries populated:', {
          totalStates: Object.keys(stateEntries).length,
          entriesPerState: Object.entries(stateEntries).map(([state, entries]) => ({
            state,
            count: entries.length,
            sampleEntries: entries.slice(0, 3).map(entry => ({
              rate: entry.rate,
              program: entry.program,
              location_region: entry.location_region
            }))
          }))
        });
        
        // Initialize selected entries for average calculation (all entries are selected by default)
        const initialSelected: { [state: string]: Set<string> } = {};
        Object.keys(stateEntries).forEach(state => {
          // Apply the same deduplication logic as DataTable
          const grouped: { [key: string]: ServiceData[] } = {};
          stateEntries[state].forEach(item => {
            const key = JSON.stringify({
              state_name: item.state_name,
              service_category: item.service_category,
              service_code: item.service_code,
              service_description: item.service_description,
              program: item.program,
              location_region: item.location_region,
              modifier_1: item.modifier_1,
              modifier_1_details: item.modifier_1_details,
              modifier_2: item.modifier_2,
              modifier_2_details: item.modifier_2_details,
              modifier_3: item.modifier_3,
              modifier_3_details: item.modifier_3_details,
              modifier_4: item.modifier_4,
              modifier_4_details: item.modifier_4_details,
              duration_unit: item.duration_unit,
              provider_type: item.provider_type
            });
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
          });
          
          // Only keep the latest entry for each group (same as DataTable)
          const deduplicatedEntries = Object.values(grouped).map(entries => {
            return entries.reduce((latest, current) => {
              const latestDate = new Date(latest.rate_effective_date);
              const currentDate = new Date(current.rate_effective_date);
              return currentDate > latestDate ? current : latest;
            });
          });
          
          // Select all deduplicated entries by default
          initialSelected[state] = new Set(deduplicatedEntries.map(entry => getRowKey(entry)));
        });
        setStateSelectedForAverage(initialSelected);
        
        console.log('✅ Initial selections set for all states (using deduplicated entries)');
      }
    } catch (err) {
      setAllStatesAverages([]);
      console.error('Error fetching state averages:', err);
    }
  }, [filterSets]);

  // Then filter based on selections
  const filteredData = useMemo(() => {
    return latestRates.filter((item) => {
      return filterSets.some(filterSet => (
        (!filterSet.serviceCategory || item.service_category?.trim().toUpperCase() === filterSet.serviceCategory.trim().toUpperCase()) &&
        (!filterSet.states.length || filterSet.states.map(s => s.trim().toUpperCase()).includes(item.state_name?.trim().toUpperCase())) &&
        (!filterSet.serviceCode || item.service_code?.trim() === filterSet.serviceCode.trim()) &&
        (
          !selectedProgram ||
          (selectedProgram === '-' ? !item.program || item.program.trim() === '' : item.program?.trim() === selectedProgram.trim())
        ) &&
        (
          !selectedLocationRegion ||
          (selectedLocationRegion === '-' ? !item.location_region || item.location_region.trim() === '' : item.location_region?.trim() === selectedLocationRegion.trim())
        ) &&
        (
          !selectedModifier ||
          (selectedModifier === '-' ?
            (!item.modifier_1 && !item.modifier_2 && !item.modifier_3 && !item.modifier_4) :
            [item.modifier_1, item.modifier_2, item.modifier_3, item.modifier_4].includes(selectedModifier)
          )
        ) &&
        (
          !selectedServiceDescription ||
          (selectedServiceDescription === '-' ? !item.service_description || item.service_description.trim() === '' : item.service_description?.trim() === selectedServiceDescription.trim())
        ) &&
        (
          !selectedProviderType ||
          (selectedProviderType === '-' ? !item.provider_type || item.provider_type.trim() === '' : item.provider_type?.trim() === selectedProviderType.trim())
        ) &&
        (
          !selectedDurationUnit ||
          (selectedDurationUnit === '-' ? !item.duration_unit || item.duration_unit.trim() === '' : item.duration_unit?.trim() === selectedDurationUnit.trim())
        )
      ));
    });
  }, [latestRates, filterSets, selectedProgram, selectedLocationRegion, selectedModifier, selectedServiceDescription, selectedProviderType, selectedDurationUnit]);

  // Group filtered data by state
  const groupedByState = useMemo(() => {
    const groups: { [state: string]: ServiceData[] } = {};
    filteredData.forEach(item => {
      if (!groups[item.state_name]) {
        groups[item.state_name] = [];
      }
      groups[item.state_name].push(item);
    });
    return groups;
  }, [filteredData]);

  // Move this function above the useMemo for processedData
  const calculateProcessedData = () => {
    const newProcessedData: { [state: string]: { [modifierKey: string]: number } } = {};

    filterSets.forEach(filterSet => {
      const filteredDataForSet = latestRates.filter((item) => (
        item.service_category === filterSet.serviceCategory &&
        filterSet.states.includes(item.state_name?.trim().toUpperCase()) &&
        item.service_code === filterSet.serviceCode &&
        (!filterSet.program || item.program === filterSet.program) &&
        (!filterSet.locationRegion || item.location_region === filterSet.locationRegion) &&
        (!filterSet.modifier || [item.modifier_1, item.modifier_2, item.modifier_3, item.modifier_4].includes(filterSet.modifier)) &&
        (!filterSet.serviceDescription || item.service_description === filterSet.serviceDescription) &&
        (!filterSet.providerType || item.provider_type === filterSet.providerType) &&
        (!filterSet.durationUnits || filterSet.durationUnits.length === 0 || (item.duration_unit && filterSet.durationUnits.includes(item.duration_unit)))
      ));

      // If "All States" is selected, calculate the average rate for each state
      if (filterSet.states.length === filterOptions.states.length && filterSets[0].states.length === filterOptions.states.length) {
        const stateRates: { [state: string]: number[] } = {};

        // Group rates by state
        filteredDataForSet.forEach(item => {
          const state = item.state_name;
        let rateValue = parseFloat(item.rate?.replace('$', '') || '0');
        const durationUnit = item.duration_unit?.toUpperCase();
        
        if (showRatePerHour) {
            if (durationUnit === '15 MINUTES') {
              rateValue *= 4;
            } else if (durationUnit !== 'PER HOUR') {
              rateValue = 0; // Or handle differently if needed
            }
          }

          if (!stateRates[state]) {
            stateRates[state] = [];
          }
          stateRates[state].push(rateValue);
        });

        // Calculate the average rate for each state
        Object.entries(stateRates).forEach(([state, rates]) => {
          const averageRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
          newProcessedData[state] = {
            'average': averageRate
          };
          
          // Log average calculation details
          console.log(`📊 Average calculation for ${state}:`, {
            totalEntries: rates.length,
            rates: rates,
            average: averageRate,
            showRatePerHour: showRatePerHour
          });
        });
      } else {
        // Otherwise, process data as usual
        filteredDataForSet.forEach(item => {
          const rate = showRatePerHour 
            ? (() => {
                let rateValue = parseFloat(item.rate?.replace('$', '') || '0');
                const durationUnit = item.duration_unit?.toUpperCase();
                
                if (durationUnit === '15 MINUTES') {
                  rateValue *= 4;
                } else if (durationUnit !== 'PER HOUR') {
                  rateValue = 0; // Or handle differently if needed
                }
                return Math.round(rateValue * 100) / 100;
              })()
            : Math.round(parseFloat(item.rate?.replace("$", "") || "0") * 100) / 100;

          const currentModifier = [
            item.modifier_1?.trim().toUpperCase() || '',
            item.modifier_2?.trim().toUpperCase() || '',
            item.modifier_3?.trim().toUpperCase() || '',
            item.modifier_4?.trim().toUpperCase() || '',
            item.program?.trim().toUpperCase() || '',
            item.location_region?.trim().toUpperCase() || ''
          ].join('|');
          const stateKey = item.state_name?.trim().toUpperCase();
          const stateSelections = selectedTableRows[stateKey] || [];

          if (stateSelections.includes(currentModifier)) {
            if (!newProcessedData[stateKey]) {
              newProcessedData[stateKey] = {};
            }
            newProcessedData[stateKey][currentModifier] = rate;
          }
        });
      }
    });

    return newProcessedData;
  };

  // Then use it in the useMemo
  const processedData = useMemo(() => calculateProcessedData(), [
    filterSets,
    latestRates,
    selectedTableRows,
    showRatePerHour,
    states.length,
  ]);

  // Function to calculate average for a state based on selected entries
  const calculateStateAverage = useCallback((state: string): number => {
    // Use the same deduplication logic as the DataTable
    const stateEntries = stateAverageEntries[state] || [];
    const selectedKeys = stateSelectedForAverage[state] || new Set();
    
    // Get the latest entries (what's shown in the table) for comparison
    const latestEntriesForState = latestRates.filter(item => item.state_name === state);
    
    console.log(`🔍 Calculating average for ${state}:`, {
      totalEntries: stateEntries.length,
      latestEntriesInTable: latestEntriesForState.length,
      selectedKeys: Array.from(selectedKeys),
      selectedEntriesCount: selectedKeys.size,
      allStateEntries: stateEntries.map(entry => ({
        key: getRowKey(entry),
        state: entry.state_name,
        rate: entry.rate,
        program: entry.program,
        location_region: entry.location_region
      })),
      tableEntries: latestEntriesForState.map(entry => ({
        key: getRowKey(entry),
        state: entry.state_name,
        rate: entry.rate,
        program: entry.program,
        location_region: entry.location_region
      }))
    });
    
    if (stateEntries.length === 0 || selectedKeys.size === 0) {
      console.log(`❌ No entries or selections for ${state}`);
      return 0;
    }
    
    // Apply the same deduplication logic as DataTable
    const grouped: { [key: string]: ServiceData[] } = {};
    stateEntries.forEach(item => {
      const key = JSON.stringify({
        state_name: item.state_name,
        service_category: item.service_category,
        service_code: item.service_code,
        service_description: item.service_description,
        program: item.program,
        location_region: item.location_region,
        modifier_1: item.modifier_1,
        modifier_1_details: item.modifier_1_details,
        modifier_2: item.modifier_2,
        modifier_2_details: item.modifier_2_details,
        modifier_3: item.modifier_3,
        modifier_3_details: item.modifier_3_details,
        modifier_4: item.modifier_4,
        modifier_4_details: item.modifier_4_details,
        duration_unit: item.duration_unit,
        provider_type: item.provider_type
      });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    
    // Only keep the latest entry for each group (same as DataTable)
    const deduplicatedEntries = Object.values(grouped).map(entries => {
      return entries.reduce((latest, current) => {
        const latestDate = new Date(latest.rate_effective_date);
        const currentDate = new Date(current.rate_effective_date);
        return currentDate > latestDate ? current : latest;
      });
    });
    
    // Filter to only selected entries
    const selectedEntries = deduplicatedEntries.filter(entry => selectedKeys.has(getRowKey(entry)));
    
    if (selectedEntries.length === 0) {
      console.log(`❌ No selected entries found for ${state} after deduplication`);
      return 0;
    }
    
    console.log(`📋 Selected entries for ${state} (after deduplication):`, selectedEntries.map(entry => ({
      state: entry.state_name,
      rate: entry.rate,
      duration_unit: entry.duration_unit,
      modifier_1: entry.modifier_1,
      program: entry.program,
      location_region: entry.location_region,
      rowKey: getRowKey(entry)
    })));
    
    const rates = selectedEntries.map(entry => {
      let rateValue = parseFloat(entry.rate?.replace('$', '') || '0');
      const durationUnit = entry.duration_unit?.toUpperCase();
      
      if (showRatePerHour) {
        if (durationUnit === '15 MINUTES') {
          rateValue *= 4;
        } else if (durationUnit !== 'PER HOUR') {
          rateValue = 0;
        }
      }
      
      return rateValue;
    }).filter(rate => rate > 0);
    
    if (rates.length === 0) {
      console.log(`❌ No valid rates found for ${state}`);
      return 0;
    }
    
    const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    console.log(`✅ Final average for ${state}:`, {
      rates: rates,
      average: average,
      showRatePerHour: showRatePerHour,
      selectedEntriesCount: selectedEntries.length,
      totalStateEntries: stateEntries.length,
      deduplicatedEntriesCount: deduplicatedEntries.length
    });
    
    return average;
  }, [stateAverageEntries, stateSelectedForAverage, showRatePerHour, latestRates]);

  // Add dynamic filtering logic (like dashboard) - moved here to fix declaration order
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
    
    // For state rate comparison pages, use less restrictive filtering
    // Only check primary filters (service_category, state_name, service_code, service_description)
    // Secondary filters (program, location_region, provider_type, duration_unit, modifier_1) should be independent
    const filteredCombinations = filterOptionsData.combinations.filter(combo => {
      // Check primary filters only
      if (selections.service_category && combo.service_category !== selections.service_category) return false;
      if (selections.state_name && combo.state_name !== selections.state_name) return false;
      if (selections.service_code && combo.service_code !== selections.service_code) return false;
      if (selections.service_description && combo.service_description !== selections.service_description) return false;
      
      // For secondary filters, check them properly
      // Handle multi-select values (arrays) vs single values (strings)
      if (selections.program && selections.program !== "-") {
        const selectedPrograms = Array.isArray(selections.program) ? selections.program : [selections.program];
        if (!selectedPrograms.includes(combo.program)) return false;
      }
      if (selections.location_region && selections.location_region !== "-") {
        const selectedRegions = Array.isArray(selections.location_region) ? selections.location_region : [selections.location_region];
        if (!selectedRegions.includes(combo.location_region)) return false;
      }
      if (selections.provider_type && selections.provider_type !== "-") {
        const selectedTypes = Array.isArray(selections.provider_type) ? selections.provider_type : [selections.provider_type];
        if (!selectedTypes.includes(combo.provider_type)) return false;
      }
      if (selections.duration_unit && selections.duration_unit !== "-") {
        const selectedUnits = Array.isArray(selections.duration_unit) ? selections.duration_unit : [selections.duration_unit];
        if (!selectedUnits.includes(combo.duration_unit)) return false;
      }
      if (selections.modifier_1 && selections.modifier_1 !== "-") {
        const selectedModifiers = Array.isArray(selections.modifier_1) ? selections.modifier_1 : [selections.modifier_1];
        if (!selectedModifiers.includes(combo.modifier_1)) return false;
      }
      
      // Handle "-" selections (empty/null values)
      if (selections.program === "-" && combo.program) return false;
      if (selections.location_region === "-" && combo.location_region) return false;
      if (selections.provider_type === "-" && combo.provider_type) return false;
      if (selections.duration_unit === "-" && combo.duration_unit) return false;
      if (selections.modifier_1 === "-" && combo.modifier_1) return false;
      
      return true;
    });

    const availableOptions = Array.from(new Set(
      filteredCombinations
        .map(c => c[filterKey])
        .filter(Boolean)
    )).sort();

    // DEBUG: Log when modifier filter is being checked
    if (filterKey === 'modifier_1') {
      console.log('🔍 DEBUG - Modifier Filter Check (All Page):', {
        filterKey,
        currentSelections: selections,
        totalCombinations: filterOptionsData.combinations.length,
        filteredCombinations: filteredCombinations.length,
        availableOptions: availableOptions,
        availableOptionsCount: availableOptions.length,
        willBeDisabled: availableOptions.length === 0
      });
      
      // Log a few sample combinations to understand the data
      if (filteredCombinations.length > 0) {
        console.log('📊 Sample filtered combinations (All):', filteredCombinations.slice(0, 3).map(c => ({
          service_category: c.service_category,
          state_name: c.state_name,
          service_code: c.service_code,
          modifier_1: c.modifier_1,
          duration_unit: c.duration_unit,
          program: c.program,
          location_region: c.location_region,
          provider_type: c.provider_type
        })));
      }
      
      // Also log when duration_unit is selected to see what's happening
      if (selections.duration_unit) {
        console.log('🎯 Duration Unit Selected:', selections.duration_unit);
        console.log('🔍 Looking for combinations with duration_unit:', selections.duration_unit);
        const selectedUnits = Array.isArray(selections.duration_unit) ? selections.duration_unit : [selections.duration_unit];
        const matchingDurationCombos = filterOptionsData.combinations.filter(c => 
          selectedUnits.includes(c.duration_unit) &&
          c.service_category === selections.service_category &&
          c.state_name === selections.state_name &&
          c.service_code === selections.service_code
        );
        console.log('📊 Combinations matching duration unit:', matchingDurationCombos.length);
        if (matchingDurationCombos.length > 0) {
          console.log('📋 Sample matching combinations:', matchingDurationCombos.slice(0, 3).map(c => ({
            service_category: c.service_category,
            state_name: c.state_name,
            service_code: c.service_code,
            modifier_1: c.modifier_1,
            duration_unit: c.duration_unit
          })));
        }
      }
    }

    return availableOptions;
  }

  // Function to get available options for a specific filter set
  const getAvailableOptionsForFilterSet = (filterKey: keyof Selections, filterSetIndex: number) => {
    return getAvailableOptionsForFilter(filterKey);
  };

  // Add dynamic filter options computed from filterOptionsData (like dashboard)
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

  // Add loadFilterOptions function (like dashboard)
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
      
      const durationUnits = Array.from(new Set(
        filteredCombinations
          .map(c => c.duration_unit)
          .filter(Boolean)
          .filter(unit => !selections.duration_unit || unit === selections.duration_unit)
      )).sort();
      
      const modifiers = Array.from(new Set(
        filteredCombinations
          .map(c => c.modifier_1)
          .filter(Boolean)
          .filter(modifier => !selections.modifier_1 || modifier === selections.modifier_1)
      )).sort();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Filter options updated:`, {
          states: states.length,
          serviceCodes: serviceCodes.length,
          serviceDescriptions: serviceDescriptions.length,
          programs: programs.length,
          locationRegions: locationRegions.length,
          providerTypes: providerTypes.length,
          durationUnits: durationUnits.length,
          modifiers: modifiers.length
        });
      }
    } catch (error) {
      console.error('Error updating filter options:', error);
    } finally {
      setIsUpdatingFilters(false);
    }
  }, [filterOptionsData, selections]);

  // Add handleSelectionChange function (like dashboard)
  const handleSelectionChange = (field: keyof Selections, value: string | null) => {
    // Only reset dependent filters if the new selection makes previous selections impossible
    const newSelections: Selections = { ...selections, [field]: value };
    const dependencyChain: (keyof Selections)[] = [
        'service_category', 'state_name', 'service_code', 
        'service_description', 'program', 'location_region', 
        'provider_type', 'duration_unit', 'modifier_1'
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
    setSelections(newSelections);
    // Add to pendingFilters
    setPendingFilters(prev => new Set(prev).add(field));
    setTimeout(() => loadFilterOptions(), 100);
  };

  // Add ClearButton component (like dashboard)
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

  // ✅ Prepare ECharts Data
  const echartOptions = useMemo(() => {
    if (isAllStatesSelected && filterSets[0]?.serviceCode && allStatesAverages) {
      const code = filterSets[0].serviceCode;
      // Only include states with a value (bar)
      const statesWithData = filterOptions.states.filter((state: any, idx: number) => {
        const avg = calculateStateAverage(state);
        return typeof avg === 'number' && !isNaN(avg) && avg > 0;
      });
      const chartData = statesWithData.map((state: any) => {
        const stateKey = state.trim().toUpperCase();
        const selected = allStatesSelectedRows[stateKey];
        const avg = calculateStateAverage(state);
        // Determine selection status
        const allEntries = stateAverageEntries[state] || [];
        const allKeys = allEntries.map(getRowKey);
        const selectedSet = stateSelectedForAverage[state] || new Set();
        const total = allKeys.length;
        // Count how many of the ALL keys are in the selected set
        let selectedCount = 0;
        for (const key of allKeys) {
          if (selectedSet.has(key)) selectedCount++;
        }
        let barColor = '#36A2EB'; // default blue
        let selectionStatus = 'all';
        if (selected && selected.row && selected.row.rate) {
          barColor = 'green';
          selectionStatus = 'custom';
        } else if (selectedCount === 0) {
          barColor = '#A0AEC0'; // gray for none
          selectionStatus = 'none';
        } else if (selectedCount === 1) {
          barColor = '#FFB347'; // yellow/orange for single selection
          selectionStatus = 'single';
        } else if (selectedCount > 1) {
          barColor = '#36A2EB'; // blue for multiple (average)
          selectionStatus = 'all';
        }
        return {
          name: state, // Unique name for animation
          value: selected && selected.row && selected.row.rate
            ? parseFloat((selected.row.rate || '').replace(/[^\d.-]/g, ''))
            : (typeof avg === 'number' && !isNaN(avg) ? avg : undefined),
          itemStyle: { color: barColor },
          selectionStatus,
          selectedCount,
          total
        };
      });
      let sortedStatesWithData = [...statesWithData];
      let sortedChartData = [...chartData];
      if (sortOrder === 'asc') {
        const zipped = sortedStatesWithData.map((state, i) => ({ state, ...sortedChartData[i] }));
        zipped.sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
        sortedStatesWithData = zipped.map(z => z.state);
        sortedChartData = zipped.map(z => ({ name: z.state, value: z.value, itemStyle: z.itemStyle, selectionStatus: z.selectionStatus, selectedCount: z.selectedCount, total: z.total }));
      } else if (sortOrder === 'desc') {
        const zipped = sortedStatesWithData.map((state, i) => ({ state, ...sortedChartData[i] }));
        zipped.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
        sortedStatesWithData = zipped.map(z => z.state);
        sortedChartData = zipped.map(z => ({ name: z.state, value: z.value, itemStyle: z.itemStyle, selectionStatus: z.selectionStatus, selectedCount: z.selectedCount, total: z.total }));
      }
      const numBars = sortedStatesWithData.length || 1;
      // Calculate a dynamic barWidth so all bars fit in the chart area (e.g., 80% of grid width)
      const dynamicBarWidth = Math.max(10, Math.min(60, Math.floor(800 / numBars)));
      return {
        legend: { show: false },
        title: {
          text: 'State Rate Comparison',
          left: 'center',
          top: 10,
          textStyle: {
            fontSize: 22,
            fontWeight: 'bold',
            color: '#012C61',
            fontFamily: 'Lemon Milk, sans-serif',
            shadowColor: '#e0e7ef',
            shadowBlur: 8
          }
        },
        tooltip: {
          trigger: 'item',
          confine: true,
          extraCssText: 'max-width: 350px; white-space: normal; border-radius: 10px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);',
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderColor: '#012C61',
          borderWidth: 1,
          textStyle: { color: '#012C61', fontSize: 14, fontWeight: 'bold' },
          position: function (point: any, params: any, dom: any, rect: any, size: any) {
            const [x, y] = point;
            const chartWidth = size.viewSize[0];
            const chartHeight = size.viewSize[1];
            let posX = x;
            let posY = y;
            if (x + 350 > chartWidth) posX = chartWidth - 360;
            if (y + 200 > chartHeight) posY = chartHeight - 210;
            return [posX, posY];
          },
          formatter: (params: any) => {
            const state = params.name;
            const value = params.value;
            let tooltipContent = `<strong>State:</strong> ${state}<br/>`;
            tooltipContent += `<strong>Rate:</strong> $${value?.toFixed(2)}<br/>`;
            tooltipContent += `<strong>Service Category:</strong> ${filterSets[0].serviceCategory}<br/>`;
            tooltipContent += `<strong>Service Code:</strong> ${code}<br/>`;
            if (params.data && params.data.selectionStatus === 'partial') {
              tooltipContent += `<span style='color:#FFB347'><strong>Partial selection (${params.data.selectedCount} of ${params.data.total})</strong></span><br/>`;
            } else if (params.data && params.data.selectionStatus === 'none') {
              tooltipContent += `<span style='color:#A0AEC0'><strong>None selected</strong></span><br/>`;
            } else if (params.data && params.data.selectionStatus === 'all') {
              tooltipContent += `<span style='color:#36A2EB'><strong>All selected</strong></span><br/>`;
            } else if (allStatesSelectedRows[state.trim().toUpperCase()] && allStatesSelectedRows[state.trim().toUpperCase()].row) {
              tooltipContent += `<span style='color:green'><strong>Selected Entry</strong></span><br/>`;
            }
            return tooltipContent;
          }
        },
        xAxis: {
          type: 'category',
          data: sortedStatesWithData,
          axisLabel: {
            rotate: 45,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#012C61',
            fontFamily: 'Lemon Milk, sans-serif',
            margin: 12
          },
          axisTick: { show: false },
          axisLine: {
            show: true,
            lineStyle: { color: '#012C61', width: 2 }
          },
          splitLine: { show: false }
        },
        yAxis: {
          type: 'value',
          name: showRatePerHour ? 'Rate ($ per hour)' : 'Rate ($ per base unit)',
          nameLocation: 'middle',
          nameGap: 30,
          nameTextStyle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#012C61',
            fontFamily: 'Lemon Milk, sans-serif'
          },
          axisLabel: {
            fontSize: 12,
            color: '#012C61',
            fontWeight: 'bold',
            fontFamily: 'Lemon Milk, sans-serif'
          },
          axisLine: {
            show: true,
            lineStyle: { color: '#012C61', width: 2 }
          },
          splitLine: {
            show: true,
            lineStyle: { color: '#e0e7ef', type: 'dashed' }
          }
        },
        series: [{
          name: 'Rate',
          type: 'bar',
          barWidth: dynamicBarWidth, // Use dynamic bar width
          barGap: '2%',
          data: sortedChartData,
          label: {
            show: true,
            position: 'top',
            fontSize: 13,
            color: '#012C61',
            fontWeight: 'bold',
            fontFamily: 'Lemon Milk, sans-serif',
            distance: 8,
            rotate: 45, // Make the value labels diagonal
            formatter: (params: any) => (params.value > 0 ? `$${Number(params.value).toFixed(2)}` : ''),
            shadowColor: '#fff',
            shadowBlur: 4
          },
          animation: true,
          animationDuration: 1200,
          animationEasing: 'elasticOut',
          animationDurationUpdate: 800,
          animationEasingUpdate: 'cubicOut',
        }],
        grid: {
          containLabel: true,
          left: '3%',
          right: '3%',
          bottom: '16%',
          top: '5%',
          width: '94%', // Ensure grid takes full width
        }
      };
    }
    // Multi-select/table-driven chart logic
    const states = Object.keys(selectedEntries);
    if (states.length === 0) {
      return {
        legend: { show: false },
        tooltip: { show: false },
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value', name: showRatePerHour ? 'Rate ($ per hour)' : 'Rate ($ per base unit)' },
        series: [],
        grid: { containLabel: true }
      };
    }
    // Get all unique modifier keys across all states
    const allModifierKeys = new Set<string>();
    states.forEach(state => {
      selectedEntries[state].forEach(item => {
        const modifierKey = [
          item.modifier_1?.trim().toUpperCase() || '',
          item.modifier_2?.trim().toUpperCase() || '',
          item.modifier_3?.trim().toUpperCase() || '',
          item.modifier_4?.trim().toUpperCase() || '',
          item.program?.trim().toUpperCase() || '',
          item.location_region?.trim().toUpperCase() || ''
        ].join('|');
        allModifierKeys.add(modifierKey);
      });
    });
    const modifierKeys = Array.from(allModifierKeys);
    const xAxisData: string[] = states;
    const series = modifierKeys.map((modifierKey, index) => {
      const data = xAxisData.map(state => {
        const stateEntries = selectedEntries[state] || [];
        const matchingEntry = stateEntries.find(item => {
          const itemModifierKey = [
            item.modifier_1?.trim().toUpperCase() || '',
            item.modifier_2?.trim().toUpperCase() || '',
            item.modifier_3?.trim().toUpperCase() || '',
            item.modifier_4?.trim().toUpperCase() || '',
            item.program?.trim().toUpperCase() || '',
            item.location_region?.trim().toUpperCase() || ''
          ].join('|');
          return itemModifierKey === modifierKey;
        });
        if (!matchingEntry) return 0; // Always return 0 for missing
        let rateValue = parseFloat(matchingEntry.rate?.replace('$', '') || '0');
        const durationUnit = matchingEntry.duration_unit?.toUpperCase();
        if (showRatePerHour) {
          if (durationUnit === '15 MINUTES') rateValue *= 4;
          else if (durationUnit === '30 MINUTES') rateValue *= 2;
          else if (durationUnit !== 'PER HOUR') rateValue = 0;
        }
        return Math.round(rateValue * 100) / 100;
      });
      return {
        name: modifierKey || 'No Modifiers',
        type: 'bar',
        barGap: '0%',
        data: data,
        itemStyle: { color: chartJsColors[index % chartJsColors.length] },
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => params.value > 0 ? `$${Number(params.value).toFixed(2)}` : '',
          fontSize: 10,
          color: '#374151',
          fontWeight: 'bold'
        },
        emphasis: {
          focus: 'series'
        }
      };
    });
    return {
      legend: { show: false },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const state = params.name;
          const seriesName = params.seriesName;
          const value = params.value;
          if (value <= 0) return '';
          const stateEntries = selectedEntries[state] || [];
          const matchingEntry = stateEntries.find(item => {
            const itemModifierKey = [
              item.modifier_1?.trim().toUpperCase() || '',
              item.modifier_2?.trim().toUpperCase() || '',
              item.modifier_3?.trim().toUpperCase() || '',
              item.modifier_4?.trim().toUpperCase() || '',
              item.program?.trim().toUpperCase() || '',
              item.location_region?.trim().toUpperCase() || ''
            ].join('|');
            return itemModifierKey === seriesName;
          });
          let result = `<strong>State:</strong> ${state}<br/>`;
          result += `<strong>Series:</strong> ${seriesName}<br/>`;
          result += `<strong>Rate:</strong> $${value.toFixed(2)}<br/>`;
          if (matchingEntry) {
            if (matchingEntry.service_description) {
              result += `<strong>Description:</strong> ${matchingEntry.service_description}<br/>`;
            }
            if (matchingEntry.program) {
              result += `<strong>Program:</strong> ${matchingEntry.program}<br/>`;
            }
            if (matchingEntry.location_region) {
              result += `<strong>Region:</strong> ${matchingEntry.location_region}<br/>`;
            }
            if (matchingEntry.provider_type) {
              result += `<strong>Provider:</strong> ${matchingEntry.provider_type}<br/>`;
            }
            if (matchingEntry.duration_unit) {
              result += `<strong>Unit:</strong> ${matchingEntry.duration_unit}<br/>`;
            }
            if (matchingEntry.rate_effective_date) {
              result += `<strong>Effective:</strong> ${formatDate(matchingEntry.rate_effective_date)}<br/>`;
            }
            const modifiers = [];
            if (matchingEntry.modifier_1) {
              modifiers.push(`Mod 1: ${matchingEntry.modifier_1}${matchingEntry.modifier_1_details ? ` (${matchingEntry.modifier_1_details})` : ''}`);
            }
            if (matchingEntry.modifier_2) {
              modifiers.push(`Mod 2: ${matchingEntry.modifier_2}${matchingEntry.modifier_2_details ? ` (${matchingEntry.modifier_2_details})` : ''}`);
            }
            if (matchingEntry.modifier_3) {
              modifiers.push(`Mod 3: ${matchingEntry.modifier_3}${matchingEntry.modifier_3_details ? ` (${matchingEntry.modifier_3_details})` : ''}`);
            }
            if (matchingEntry.modifier_4) {
              modifiers.push(`Mod 4: ${matchingEntry.modifier_4}${matchingEntry.modifier_4_details ? ` (${matchingEntry.modifier_4_details})` : ''}`);
            }
            if (modifiers.length > 0) {
              result += `<strong>Modifiers:</strong><br/>${modifiers.join('<br/>')}`;
            }
          }
          return result;
        }
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: { rotate: 45, fontSize: 10 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: showRatePerHour ? 'Rate ($ per hour)' : 'Rate ($ per base unit)',
        nameLocation: 'middle',
        nameGap: 30
      },
      series: series.map((s, idx) => ({
        ...s,
        barWidth: 14, // Fixed bar width for guaranteed gaps
        itemStyle: {
          ...s.itemStyle,
          shadowColor: 'rgba(1,44,97,0.15)',
          shadowBlur: 8,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#36A2EB' },
              { offset: 1, color: '#012C61' }
            ]
          }
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowColor: 'rgba(54,162,235,0.4)',
            shadowBlur: 16,
            borderColor: '#36A2EB',
            borderWidth: 2
          },
          label: {
            fontSize: 14,
            color: '#36A2EB',
            fontWeight: 'bold',
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: 6,
            padding: [2, 6]
          }
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 13,
          color: '#012C61',
          fontWeight: 'bold',
          fontFamily: 'Lemon Milk, sans-serif',
          distance: 8,
          formatter: (params: any) => (params.value > 0 ? `$${Number(params.value).toFixed(2)}` : ''),
          shadowColor: '#fff',
          shadowBlur: 4
        },
        animation: true,
        animationDuration: 1200,
        animationEasing: 'elasticOut'
      })),
      barCategoryGap: '300%', // Extreme gap for always-visible separation
      grid: {
        containLabel: true,
        left: '3%',
        right: '3%',
        bottom: '15%',
        top: '15%'
      }
    };
  }, [selectedEntries, showRatePerHour, isAllStatesSelected, filterSets, allStatesAverages, filterOptions.states, allStatesSelectedRows, sortOrder, calculateStateAverage]);

  const ChartWithErrorBoundary = () => {
    try {
      return (
        <ReactECharts
          key={JSON.stringify(Object.keys(selectedEntries).sort()) + '-' + chartRefreshKey}
          option={echartOptions}
          style={{ height: '400px', width: '100%', minWidth: (statesWithData.length || 1) * 74 }}
        />
      );
    } catch (error) {
      console.error("Error rendering chart:", error);
      return <div>Error: Failed to render chart.</div>;
    }
  };

  const ErrorMessage = ({ error, onRetry }: { error: string | null, onRetry?: () => void }) => {
    if (!error) return null;
    
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <div className="flex items-center">
          <FaExclamationCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-auto px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  };

  const resetFilters = () => {
    // Reset filter sets to one filter set with "All States" as default
    setFilterSets([{ 
      serviceCategory: "", 
      states: ["ALL_STATES"], // Default to "All States"
      serviceCode: "", 
      stateOptions: [], 
      serviceCodeOptions: [],
      durationUnits: [], // Initialize with empty array
      serviceDescription: "" // Initialize with empty string
    }]);

    // Reset other filter-related states
    setSelectedServiceCategory("");
    setSelectedState("ALL_STATES"); // Set default state
    setSelectedServiceCode("");
    setSelectedEntry(null);
    setServiceCodes([]);
    setSelectedTableRows({});
    setIsAllStatesSelected(true); // Set to true since "All States" is default
    setSortOrder('default');
    setSelectedStateDetails(null);
    setSelectedEntries({});         // <-- Clear selected entries
    setClickedStates([]);          // <-- Clear clicked states
    setChartRefreshKey(k => k + 1); // <-- Force chart to re-render/reset
    
    // Clear all additional state variables that might persist
    setFilterSetData({});
    setAllStatesTablePages({});
    setAllStatesSelectedRows({});
    setStateAverageEntries({});
    setStateSelectedForAverage({});
    setAllStatesAverages(null);
    setPendingSearch(false);
    setHasSearchedOnce(false);
    setMissingFields({});
    setGlobalModifierOrder(new Map());
    setGlobalSelectionOrder(new Map());
    setComment(null);
    setComments([]);
    
    // Reset selections for dynamic filtering
    setSelections({
      service_category: null,
      state_name: null,
      service_code: null,
      service_description: null,
      program: null,
      location_region: null,
      provider_type: null,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
  };

  // Calculate highest and lowest among currently selected bars
  const selectedRates = useMemo(() => {
    if (isAllStatesSelected && filterSets[0]?.serviceCode && allStatesAverages) {
      // Use the chartData for metrics (matches the bars shown)
      const statesList = filterOptions.states;
      const chartData = statesList.map((state: any) => {
        const avg = calculateStateAverage(state);
        return typeof avg === 'number' && !isNaN(avg) ? avg : undefined;
      });
      return chartData.filter((rate: any): rate is number => typeof rate === 'number' && !isNaN(rate));
    }
    // Flatten all selected entries and extract the rate value as a number
    return Object.values(selectedEntries)
      .flat()
      .map(item => {
        let rateValue = parseFloat(item.rate?.replace('$', '') || '0');
        const durationUnit = item.duration_unit?.toUpperCase();
        if (showRatePerHour) {
          if (durationUnit === '15 MINUTES') rateValue *= 4;
          else if (durationUnit === '30 MINUTES') rateValue *= 2;
          else if (durationUnit !== 'PER HOUR') rateValue = 0;
        }
        return rateValue;
      })
      .filter(rate => rate > 0);
  }, [selectedEntries, showRatePerHour, isAllStatesSelected, filterSets, allStatesAverages, filterOptions.states, calculateStateAverage]);

  const filteredRates = useMemo(
    () => selectedRates.filter((rate: any): rate is number => typeof rate === 'number' && !isNaN(rate)),
    [selectedRates]
  );
  const maxRate = useMemo(() => filteredRates.length > 0 ? Math.max(...filteredRates) : 0, [filteredRates]);
  const minRate = useMemo(() => filteredRates.length > 0 ? Math.min(...filteredRates) : 0, [filteredRates]);
  const avgRate = useMemo(() => filteredRates.length > 0 ? filteredRates.reduce((sum: number, rate: number) => sum + rate, 0) / filteredRates.length : 0, [filteredRates]);

  // Calculate national average
  const nationalAverage = useMemo(() => {
    if (!selectedServiceCategory || !selectedServiceCode) return 0;

    const rates = data
      .filter((item: ServiceData) => 
        item.service_category === selectedServiceCategory &&
        item.service_code === selectedServiceCode
      )
      .map((item: ServiceData) => 
        (() => {
          let rateValue = parseFloat(item.rate?.replace('$', '') || '0');
          const durationUnit = item.duration_unit?.toUpperCase();
          
          if (durationUnit === '15 MINUTES') {
            rateValue *= 4;
          } else if (durationUnit !== 'PER HOUR') {
            rateValue = 0; // Or handle differently if needed
          }
          return Math.round(rateValue * 100) / 100;
        })()
      )
      .filter((rate: number) => rate > 0);

    if (rates.length === 0) return 0;

    const sum = rates.reduce((sum: number, rate: number) => sum + rate, 0);
    return (sum / rates.length).toFixed(2);
  }, [data, selectedServiceCategory, selectedServiceCode, showRatePerHour]);

  // Add this component to display the calculation details
  const CalculationDetails = () => {
    if (!selectedStateDetails) return null;

    return (
      <div className="mt-6 p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4">
          Average Calculation for {selectedStateDetails.state}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="text-sm text-gray-600">
              <strong>Average Rate:</strong> ${selectedStateDetails.average.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Number of Entries:</strong> {selectedStateDetails.entries.length}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Service Code</th>
                  <th className="px-4 py-2">Program</th>
                  <th className="px-4 py-2">Region</th>
                  <th className="px-4 py-2">Modifier 1</th>
                  <th className="px-4 py-2">Modifier 2</th>
                  <th className="px-4 py-2">Modifier 3</th>
                  <th className="px-4 py-2">Modifier 4</th>
                  <th className="px-4 py-2">Rate</th>
                  <th className="px-4 py-2">Effective Date</th>
                </tr>
              </thead>
              <tbody>
                {selectedStateDetails.entries.map((entry, index) => (
                  <tr key={index} className="bg-white border-b">
                    <td className="px-4 py-2">{entry.service_code}</td>
                    <td className="px-4 py-2">{entry.program}</td>
                    <td className="px-4 py-2">{entry.location_region}</td>
                    <td className="px-4 py-2">
                      {entry.modifier_1 ? `${entry.modifier_1}${entry.modifier_1_details ? ` - ${entry.modifier_1_details}` : ''}` : '-'}
                    </td>
                    <td className="px-4 py-2">
                      {entry.modifier_2 ? `${entry.modifier_2}${entry.modifier_2_details ? ` - ${entry.modifier_2_details}` : ''}` : '-'}
                    </td>
                    <td className="px-4 py-2">
                      {entry.modifier_3 ? `${entry.modifier_3}${entry.modifier_3_details ? ` - ${entry.modifier_3_details}` : ''}` : '-'}
                    </td>
                    <td className="px-4 py-2">
                      {entry.modifier_4 ? `${entry.modifier_4}${entry.modifier_4_details ? ` - ${entry.modifier_4_details}` : ''}` : '-'}
                    </td>
                    <td className="px-4 py-2">
                      ${showRatePerHour 
                        ? (() => {
                            let rateValue = parseFloat(entry.rate_per_hour?.replace('$', '') || '0');
                            const durationUnit = entry.duration_unit?.toUpperCase();
                            
                            if (durationUnit === '15 MINUTES') {
                              rateValue *= 4;
                            } else if (durationUnit !== 'PER HOUR') {
                              rateValue = 0; // Or handle differently if needed
                            }
                            return Math.round(rateValue * 100) / 100;
                          })()
                        : parseFloat(entry.rate?.replace("$", "") || "0").toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      {formatDate(entry.rate_effective_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Add a function to check which columns have data
  const getVisibleColumns = useMemo(() => {
    const columns = {
      state_name: false,
      service_category: false,
      service_code: false,
      service_description: false,
      program: false,
      location_region: false,
      modifier_1: false,
      modifier_2: false,
      modifier_3: false,
      modifier_4: false,
      duration_unit: false,
      rate: false,
      rate_per_hour: false,
      rate_effective_date: false
    };

    if (filteredData.length > 0) {
      filteredData.forEach(item => {
        const rateStr = (item.rate || '').replace('$', '');
        const rate = parseFloat(rateStr);
        const durationUnit = item.duration_unit?.toUpperCase();
        
        if (!isNaN(rate) && 
            (durationUnit === '15 MINUTES' || 
             durationUnit === '30 MINUTES' || 
             durationUnit === 'PER HOUR')) {
          columns.rate_per_hour = true;
        }
        
        Object.keys(columns).forEach(key => {
          if (item[key as keyof ServiceData] && item[key as keyof ServiceData] !== '-') {
            columns[key as keyof typeof columns] = true;
          }
        });
      });
    }

    return columns;
  }, [filteredData]);

  // Add useEffect to update filter options when service category or state changes
  useEffect(() => {
    if (selectedServiceCategory && selectedState) {
      refreshFilters(selectedServiceCategory, selectedState);
    } else if (selectedServiceCategory) {
      refreshFilters(selectedServiceCategory);
    }
  }, [selectedServiceCategory, selectedState, refreshFilters]);

  // Update the row selection handler to update selectedEntries and refresh chart
  const handleRowSelection = (state: string, item: ServiceData) => {
    setSelectedEntries(prev => {
      const prevArr = prev[state] || [];
      // Check if already selected (by unique key)
      const key = getRowKey(item);
      const exists = prevArr.some(i => getRowKey(i) === key);
      let newArr;
      if (exists) {
        newArr = prevArr.filter(i => getRowKey(i) !== key);
    } else {
        newArr = [...prevArr, item];
      }
      // If newArr is empty, remove the state key entirely
      if (newArr.length === 0) {
        const { [state]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [state]: newArr };
    });
    setChartRefreshKey(k => k + 1);
  };


  // Add filter options loading logic
  useEffect(() => {
    async function loadUltraFilterOptions() {
      try {
        setIsLoadingFilters(true);
        const res = await fetch("/filter_options.json.gz");
        if (!res.ok) throw new Error(`Failed to fetch filter options: ${res.status} ${res.statusText}`);
        const gzipped = new Uint8Array(await res.arrayBuffer());
        const decompressed = gunzipSync(gzipped);
        const jsonStr = strFromU8(decompressed);
        const data = JSON.parse(jsonStr);
        if (data.m && data.v && data.c) {
          const { m: mappings, v: values, c: columns } = data;
          const numRows: number = values[0].length;
          const combinations: any[] = [];
          for (let i = 0; i < numRows; i++) {
            const combo: Record<string, string> = {};
            columns.forEach((col: string, colIndex: number) => {
              const intValue = values[colIndex][i];
              combo[col] = intValue === -1 ? '' : mappings[col][intValue];
            });
            combinations.push(combo);
          }
          // Extract unique values for each filter
          const filters: Record<string, string[]> = {};
          columns.forEach((col: string) => {
            const uniqueValues = [...new Set(combinations.map((c: any) => c[col]).filter((v: string) => v))];
            filters[col as string] = uniqueValues.sort();
          });
          setFilterOptionsData({ filters, combinations });
        } else {
          setFilterOptionsData(data);
        }
      } catch (err) {
        setError('Could not load filter options. Please try refreshing the page.');
      } finally {
        setIsLoadingFilters(false);
      }
    }
    loadUltraFilterOptions();
  }, []);

  // Generate a key for the chart to force re-render
  const chartKey = useMemo(() => {
    return filterSets.map(fs => `${fs.serviceCategory}-${fs.serviceCode}-${fs.states.join(',')}`).join('|');
  }, [filterSets]);

  // Handler for page change in a state's table
  const handleAllStatesTablePageChange = (state: string, newPage: number) => {
    setAllStatesTablePages(prev => ({ ...prev, [state]: newPage }));
  };

  // Handler for row selection in a state's table
  const handleAllStatesRowSelect = (state: string, row: ServiceData) => {
    const rowKey = getRowKey(row);
    setAllStatesSelectedRows(prev => ({
      ...prev,
      [state]: prev[state] && prev[state].rowKey === rowKey ? null : { rowKey, row }
    }));
  };

  // Handler for average calculation entry selection/deselection
  const handleAverageEntrySelection = (state: string, item: ServiceData) => {
    const rowKey = getRowKey(item);
    console.log(`🔄 Toggling entry selection for ${state}:`, {
      item: {
        state: item.state_name,
        rate: item.rate,
        duration_unit: item.duration_unit,
        modifier_1: item.modifier_1,
        program: item.program,
        location_region: item.location_region
      },
      rowKey: rowKey,
      action: 'toggle'
    });
    
    setStateSelectedForAverage(prev => {
      const currentSelected = prev[state] || new Set();
      const newSelected = new Set(currentSelected);
      
      if (newSelected.has(rowKey)) {
        newSelected.delete(rowKey);
        console.log(`❌ Removed entry from ${state} selection`);
      } else {
        newSelected.add(rowKey);
        console.log(`✅ Added entry to ${state} selection`);
      }
      
      return {
        ...prev,
        [state]: newSelected
      };
    });
    
    // Force chart refresh to update the average
    setChartRefreshKey(k => k + 1);
  };

  // On any filter change, set pendingSearch to true
  const handleFilterChange = (handler: (...args: any[]) => void) => (...args: any[]) => {
    setPendingSearch(true);
    handler(...args);
  };

  // Check if search is ready (all required fields are filled)
  const isSearchReady = useMemo(() => {
    return filterSets.every(filterSet => 
      filterSet.serviceCategory && 
      filterSet.states.length > 0 && 
      filterSet.durationUnits.length > 0 &&
      // Either service code OR service description must be selected (but not necessarily both)
      (filterSet.serviceCode || filterSet.serviceDescription)
    );
  }, [filterSets]);

  // Wrap all filter handlers
  const wrappedHandleServiceCategoryChange = handleFilterChange(handleServiceCategoryChange);
  const wrappedHandleStateChange = handleFilterChange(handleStateChange);
  const wrappedHandleServiceCodeChange = handleFilterChange(handleServiceCodeChange);
  const wrappedHandleProgramChange = handleFilterChange(handleProgramChange);
  const wrappedHandleLocationRegionChange = handleFilterChange(handleLocationRegionChange);
  const wrappedHandleModifierChange = handleFilterChange(handleModifierChange);
  const wrappedHandleServiceDescriptionChange = handleFilterChange(handleServiceDescriptionChange);
  const wrappedHandleProviderTypeChange = handleFilterChange(handleProviderTypeChange);
  const wrappedHandleDurationUnitChange = handleFilterChange(handleDurationUnitChange);

  // Only fetch data when Search is clicked
  const handleSearch = async () => {
    const requiredFields = ['serviceCategory', 'serviceCodeOrDescription', 'durationUnits'];
    const newMissing: {[key: string]: boolean} = {};
    const filterSet = filterSets[0]; // Only one filter set for all states
    newMissing.serviceCategory = !filterSet.serviceCategory;
    newMissing.serviceCodeOrDescription = !(filterSet.serviceCode || filterSet.serviceDescription);
    newMissing.durationUnits = !filterSet.durationUnits || filterSet.durationUnits.length === 0;
    setMissingFields(newMissing);
    if (Object.values(newMissing).some(Boolean)) return; // Don't search if missing
    console.log('🔍 Search button clicked - fetching data...');
    setPendingSearch(false);
    setClickedStates([]); // Clear clicked states when starting a new search
    let success = false;
    // Now trigger the actual data fetching
    try {
      setFilterLoading(true);
      // For each filter set, fetch the appropriate data
      for (let index = 0; index < filterSets.length; index++) {
        const filterSet = filterSets[index];
        console.log(`📊 Processing filter set ${index}:`, {
          serviceCategory: filterSet.serviceCategory,
          states: filterSet.states,
          serviceCode: filterSet.serviceCode,
          isAllStatesSelected: isAllStatesSelected
        });
        
        if (filterSet.serviceCategory && filterSet.states.length > 0 && filterSet.serviceCode) {
          if (isAllStatesSelected && index === 0) {
            console.log('🌍 Fetching all states averages...');
            await fetchAllStatesAverages(filterSet.serviceCategory, filterSet.serviceCode);
            const result = await refreshData({
              serviceCategory: filterSet.serviceCategory,
              serviceCode: filterSet.serviceCode,
              itemsPerPage: '1000'
            });
            if (result) {
              console.log(`✅ All states data fetched:`, {
                dataLength: result.data.length,
                sampleEntries: result.data.slice(0, 3)
              });
              setFilterSetData(prev => ({ ...prev, [index]: result.data }));
              success = true;
            }
          } else {
            const result = await refreshData({
              serviceCategory: filterSet.serviceCategory,
              state_name: filterSet.states[0],
              serviceCode: filterSet.serviceCode,
              itemsPerPage: '1000'
            });
            if (result) {
              console.log(`✅ Individual state data fetched:`, {
                state: filterSet.states[0],
                dataLength: result.data.length,
                sampleEntries: result.data.slice(0, 3)
              });
              setFilterSetData(prev => ({ ...prev, [index]: result.data }));
              success = true;
            }
          }
        }
      }
      setChartRefreshKey(k => k + 1);
      if (success) setHasSearchedOnce(true);
    } catch (error) {
      console.error("Error fetching data on search:", error);
      setFetchError("Failed to fetch data. Please try again.");
    } finally {
      setFilterLoading(false);
    }
  };

  // Add useEffect to load filter options when component mounts
  useEffect(() => {
    async function loadUltraFilterOptions() {
      try {
        setIsLoadingFilters(true);
        setError(null);
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
            const combo: Record<string, string> = {};
            columns.forEach((col: string, colIndex: number) => {
              const intValue = values[colIndex][i];
              combo[col] = intValue === -1 ? '' : mappings[col][intValue];
            });
            combinations.push(combo);
          }
          // Extract unique values for each filter
          const filters: Record<string, string[]> = {};
          columns.forEach((col: string) => {
            const uniqueValues = [...new Set(combinations.map((c: any) => c[col]).filter((v: string) => v))];
            filters[col as string] = uniqueValues.sort();
          });
          setFilterOptionsData({ filters, combinations });
        } else {
          setFilterOptionsData(data);
        }
      } catch (err) {
        setError(`Could not load filter options: ${err instanceof Error ? err.message : 'Unknown error'}. Please try refreshing the page.`);
      } finally {
        setIsLoadingFilters(false);
      }
    }
    loadUltraFilterOptions();
  }, []);

  // Update useEffect for initial data load and filter changes
  useEffect(() => {
    if (pendingSearch) return; // Only fetch when not pending
    // ...existing data loading logic...
    // For example, call refreshData() or fetchAllStatesAverages() here as needed
    // (You may need to move your data loading logic from other useEffects here)
  }, [/* other dependencies */, pendingSearch]);

  // Add before the return statement in the component:
  let statesWithData: string[] = [];
  if (isAllStatesSelected && filterOptions.states && allStatesAverages) {
    statesWithData = filterOptions.states.filter((state: any) => {
      const avg = calculateStateAverage(state);
      return typeof avg === 'number' && !isNaN(avg) && avg > 0;
    });
  }

  // Show loading state while initial data is being fetched
  const isInitialLoading = isLoadingFilters || (filterLoading && !hasSearchedOnce);
  
  // Don't render chart until we have filter options loaded
  const shouldRenderChart = !isInitialLoading && filterOptionsData && (hasSearchedOnce || !isAllStatesSelected);

  return (
    <AppLayout activeTab="stateRateComparison">
      <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Error Messages */}
        <div className="mb-4 sm:mb-8">
          <ErrorMessage 
            error={fetchError} 
            onRetry={() => window.location.reload()} 
          />
          <ErrorMessage error={filterError} />
          <ErrorMessage error={chartError} />
          <ErrorMessage error={tableError} />
          {authError && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <div className="flex items-center">
                <div className="h-5 w-5 text-yellow-500 mr-2">⚠️</div>
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
        </div>

        {/* Heading with Reset Button */}
        <div className="flex flex-col items-start mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl text-[#012C61] font-lemonMilkRegular uppercase mb-3 sm:mb-4">
            State Rate Comparison
          </h1>
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-[#012C61] text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            Reset All Filters
          </button>
          <p className="text-sm text-gray-500 mt-2">
            <strong>Note:</strong> The rates displayed are the current rates as of the latest available data. Rates are subject to change based on updates from state programs.
          </p>
        </div>

        {/* Loading State */}
        {(filterLoading || loading) && (
          <div className="loader-overlay">
            <div className="cssloader">
              <div className="sh1"></div>
              <div className="sh2"></div>
              <h4 className="lt">loading</h4>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Filters */}
            <div className="mb-6 sm:mb-8">
              {filterSets.map((filterSet, index) => (
                <div key={index} className="p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-4 relative">
                  {/* Remove the filter set number badge for All States */}
                  {/* <div className="absolute -top-3 -left-3 bg-[#012C61] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                    {index + 1}
                  </div> */}
                  {/* Remove or comment out the above badge */}
                  {/* Remove button for extra filter sets */}
                  {index > 0 && (
                    <button
                      onClick={() => deleteFilterSet(index)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl font-bold focus:outline-none"
                      title="Remove this filter set"
                    >
                      ×
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* State Selector - First */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">State</label>
                      <Select
                        instanceId={`state-select-${index}`}
                        options={[
                          { value: "ALL_STATES", label: "All States" }
                        ]}
                        value={{ value: "ALL_STATES", label: "All States" }}
                        isDisabled={true}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </div>

                    {/* Service Category Selector - Second */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Service Line</label>
                      <Select
                        instanceId={`service-category-select-${index}`}
                        options={filterOptions.serviceCategories
                          .filter((category: any) => {
                            const trimmedCategory = category.trim();
                            return trimmedCategory && 
                                   !['HCBS', 'IDD', 'SERVICE CATEGORY'].includes(trimmedCategory);
                          })
                          .map((category: any) => ({ value: category, label: category }))}
                        value={filterSet.serviceCategory ? { value: filterSet.serviceCategory, label: filterSet.serviceCategory } : null}
                        onChange={(option) => wrappedHandleServiceCategoryChange(index, option?.value || "")}
                        placeholder="Select Service Line"
                        isSearchable
                        filterOption={customFilterOption}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {missingFields.serviceCategory && <div className="text-xs text-red-500 mt-1">Please select a service line.</div>}
                    </div>

                    {/* Service Code Selector - Third */}
                    {filterSet.serviceCategory ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Service Code
                          {filterSet.serviceDescription && (
                            <span className="text-xs text-gray-500 ml-2">(Choose either Service Code OR Service Description)</span>
                          )}
                        </label>
                        <Select
                          instanceId={`service-code-select-${index}`}
                          options={
                            (() => {
                              const availableServiceCodes = getAvailableOptionsForFilterSet('service_code', index);
                              return availableServiceCodes && availableServiceCodes.length > 0
                                ? availableServiceCodes.map((code: any) => ({ value: code, label: code }))
                                : [];
                            })()
                          }
                          value={filterSet.serviceCode ? { value: filterSet.serviceCode, label: filterSet.serviceCode } : null}
                          onChange={(option) => {
                            const newValue = option?.value || "";
                            wrappedHandleServiceCodeChange(index, newValue);
                          }}
                          placeholder="Select Service Code (Required if no Service Description)"
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={(() => {
                            const availableServiceCodes = getAvailableOptionsForFilterSet('service_code', index);
                            return (!filterSet.serviceCode && (!availableServiceCodes || availableServiceCodes.length === 0));
                          })()}
                          className={`react-select-container ${(() => {
                            const availableServiceCodes = getAvailableOptionsForFilterSet('service_code', index);
                            return (!filterSet.serviceCode && (!availableServiceCodes || availableServiceCodes.length === 0)) ? 'opacity-50' : '';
                          })()}`}
                          classNamePrefix="react-select"
                        />
                        {filterSet.serviceCode && (
                          <button
                            onClick={() => wrappedHandleServiceCodeChange(index, "")}
                            className="text-xs text-blue-500 hover:underline mt-1"
                          >
                            Clear
                          </button>
                        )}
                        {missingFields.serviceCodeOrDescription && <div className="text-xs text-red-500 mt-1">Please select a service code or description.</div>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Service Code</label>
                        <div className="text-gray-400 text-sm">
                          Select a service line to see available service codes
                        </div>
                      </div>
                    )}

                    {/* Program Selector */}
                    {filterSet.serviceCategory && filterSet.states.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Program</label>
                        <Select
                          instanceId={`program-select-${index}`}
                          options={
                            (() => {
                              const availablePrograms = getAvailableOptionsForFilterSet('program', index);
                              return availablePrograms && availablePrograms.length > 0
                                ? [{ value: '-', label: '-' }, ...availablePrograms.map((program: any) => ({ value: program, label: program }))]
                                : [];
                            })()
                          }
                          value={filterSet.program ? filterSet.program.split(',').map(p => ({ value: p.trim(), label: p.trim() })) : null}
                          onChange={(options) => wrappedHandleProgramChange(index, options ? options.map(opt => opt.value).join(',') : "")}
                          placeholder="Select Program"
                          isMulti
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={(() => {
                            const availablePrograms = getAvailableOptionsForFilterSet('program', index);
                            return (!filterSet.program && (!availablePrograms || availablePrograms.length === 0));
                          })()}
                          className={`react-select-container ${(() => {
                            const availablePrograms = getAvailableOptionsForFilterSet('program', index);
                            return (!filterSet.program && (!availablePrograms || availablePrograms.length === 0)) ? 'opacity-50' : '';
                          })()}`}
                          classNamePrefix="react-select"
                        />
                        {filterSet.program && (
                          <button
                            onClick={() => wrappedHandleProgramChange(index, "")}
                            className="text-xs text-blue-500 hover:underline mt-1"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}

                    {/* Location/Region Selector */}
                    {filterSet.serviceCategory && filterSet.states.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Location/Region</label>
                        <Select
                          instanceId={`location-region-select-${index}`}
                          options={
                            (() => {
                              const availableLocationRegions = getAvailableOptionsForFilterSet('location_region', index);
                              return availableLocationRegions && availableLocationRegions.length > 0
                                ? [{ value: '-', label: '-' }, ...availableLocationRegions.map((region: any) => ({ value: region, label: region }))]
                                : [];
                            })()
                          }
                          value={filterSet.locationRegion ? filterSet.locationRegion.split(',').map(l => ({ value: l.trim(), label: l.trim() })) : null}
                          onChange={(options) => wrappedHandleLocationRegionChange(index, options ? options.map(opt => opt.value).join(',') : "")}
                          placeholder="Select Location/Region"
                          isMulti
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={(() => {
                            const availableLocationRegions = getAvailableOptionsForFilterSet('location_region', index);
                            return (availableLocationRegions || []).length === 0;
                          })()}
                          className={`react-select-container ${(() => {
                            const availableLocationRegions = getAvailableOptionsForFilterSet('location_region', index);
                            return (availableLocationRegions || []).length === 0 ? 'opacity-50' : '';
                          })()}`}
                          classNamePrefix="react-select"
                        />
                        {filterSet.locationRegion && (
                          <button
                            onClick={() => wrappedHandleLocationRegionChange(index, "")}
                            className="text-xs text-blue-500 hover:underline mt-1"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}

                    {/* Modifier Selector */}
                    {filterSet.serviceCategory && filterSet.states.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Modifier</label>
                        <Select
                          instanceId={`modifier-select-${index}`}
                          options={
                            (() => {
                              const availableModifiers = getAvailableOptionsForFilterSet('modifier_1', index);
                              return availableModifiers && availableModifiers.length > 0
                                ? [{ value: '-', label: '-' }, ...availableModifiers.map((modifier: any) => ({ value: modifier, label: modifier }))]
                                : [];
                            })()
                          }
                          value={filterSet.modifier ? filterSet.modifier.split(',').map(m => {
                            const mod = availableModifiers.find(opt => opt === m.trim());
                            if (mod) {
                              const def =
                                filterOptionsData?.combinations?.find((c: any) => c.modifier_1 === mod)?.modifier_1_details ||
                                filterOptionsData?.combinations?.find((c: any) => c.modifier_2 === mod)?.modifier_2_details ||
                                filterOptionsData?.combinations?.find((c: any) => c.modifier_3 === mod)?.modifier_3_details ||
                                filterOptionsData?.combinations?.find((c: any) => c.modifier_4 === mod)?.modifier_4_details;
                              return { value: mod, label: def ? `${mod} - ${def}` : mod };
                            }
                            return { value: m.trim(), label: m.trim() };
                          }) : null}
                          onChange={(options) => wrappedHandleModifierChange(index, options ? options.map(opt => opt.value).join(',') : "")}
                          placeholder="Select Modifier"
                          isMulti
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={(() => {
                            const availableModifiers = getAvailableOptionsForFilterSet('modifier_1', index);
                            return (!filterSet.modifier && (!availableModifiers || availableModifiers.length === 0));
                          })()}
                          className={`react-select-container ${(() => {
                            const availableModifiers = getAvailableOptionsForFilterSet('modifier_1', index);
                            return (!filterSet.modifier && (!availableModifiers || availableModifiers.length === 0)) ? 'opacity-50' : '';
                          })()}`}
                          classNamePrefix="react-select"
                        />
                        {filterSet.modifier && (
                          <button
                            onClick={() => wrappedHandleModifierChange(index, "")}
                            className="text-xs text-blue-500 hover:underline mt-1"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}

                    {/* Provider Type Selector */}
                    {filterSet.serviceCategory && filterSet.states.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Provider Type</label>
                        <Select
                          instanceId={`provider-type-select-${index}`}
                          options={
                            (() => {
                              const availableProviderTypes = getAvailableOptionsForFilterSet('provider_type', index);
                              return availableProviderTypes && availableProviderTypes.length > 0
                                ? [{ value: '-', label: '-' }, ...availableProviderTypes.map((type: any) => ({ value: type, label: type }))]
                                : [];
                            })()
                          }
                          value={filterSet.providerType ? filterSet.providerType.split(',').map(p => ({ value: p.trim(), label: p.trim() })) : null}
                          onChange={(options) => wrappedHandleProviderTypeChange(index, options ? options.map(opt => opt.value).join(',') : "")}
                          placeholder="Select Provider Type"
                          isMulti
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={(() => {
                            const availableProviderTypes = getAvailableOptionsForFilterSet('provider_type', index);
                            return (!filterSet.providerType && (!availableProviderTypes || availableProviderTypes.length === 0));
                          })()}
                          className={`react-select-container ${(() => {
                            const availableProviderTypes = getAvailableOptionsForFilterSet('provider_type', index);
                            return (!filterSet.providerType && (!availableProviderTypes || availableProviderTypes.length === 0)) ? 'opacity-50' : '';
                          })()}`}
                          classNamePrefix="react-select"
                        />
                        {filterSet.providerType && (
                          <button
                            onClick={() => wrappedHandleProviderTypeChange(index, "")}
                            className="text-xs text-blue-500 hover:underline mt-1"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}

                    {/* Duration Unit Selector - Mandatory */}
                      <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Duration Unit 
                      </label>
                        <Select
                          instanceId={`duration-unit-select-${index}`}
                          options={
                            (() => {
                              const availableDurationUnits = getAvailableOptionsForFilterSet('duration_unit', index);
                              return availableDurationUnits && availableDurationUnits.length > 0
                                ? availableDurationUnits.map((unit: any) => ({ value: unit, label: unit }))
                                : [];
                            })()
                        }
                        value={filterSet.durationUnits.map(unit => ({ value: unit, label: unit }))}
                        onChange={(options) => {
                          const selectedValues = options ? options.map(opt => opt.value) : [];
                          wrappedHandleDurationUnitChange(index, selectedValues);
                        }}
                        placeholder="Select Duration Units (Required)"
                          isSearchable
                        isMulti
                          filterOption={customFilterOption}
                          isDisabled={(() => {
                            const availableDurationUnits = getAvailableOptionsForFilterSet('duration_unit', index);
                            return (!filterSet.durationUnits.length && (!availableDurationUnits || availableDurationUnits.length === 0));
                          })()}
                          className={`react-select-container ${(() => {
                            const availableDurationUnits = getAvailableOptionsForFilterSet('duration_unit', index);
                            return (!filterSet.durationUnits.length && (!availableDurationUnits || availableDurationUnits.length === 0)) ? 'opacity-50' : '';
                          })()}`}
                          classNamePrefix="react-select"
                        />
                      {filterSet.durationUnits.length > 0 && (
                          <button
                          onClick={() => wrappedHandleDurationUnitChange(index, [])}
                            className="text-xs text-blue-500 hover:underline mt-1"
                          >
                          Clear All
                          </button>
                        )}
                        {missingFields.durationUnits && <div className="text-xs text-red-500 mt-1">Please select at least one duration unit.</div>}
                      </div>

                    {/* Service Description Selector - Mandatory */}
                      <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Service Description 
                        {filterSet.serviceCode && (
                          <span className="text-xs text-gray-500 ml-2">(Choose either Service Code OR Service Description)</span>
                        )}
                      </label>
                        <Select
                          instanceId={`service-description-select-${index}`}
                          options={
                            (() => {
                              const availableServiceDescriptions = getAvailableOptionsForFilterSet('service_description', index);
                              return availableServiceDescriptions && availableServiceDescriptions.length > 0
                                ? availableServiceDescriptions.map((desc: any) => ({ value: desc, label: desc }))
                                : [];
                            })()
                          }
                          value={filterSet.serviceDescription ? { value: filterSet.serviceDescription, label: filterSet.serviceDescription } : null}
                        onChange={(option) => {
                          const newValue = option?.value || "";
                          wrappedHandleServiceDescriptionChange(index, newValue);
                        }}
                        placeholder="Select Service Description (Required if no Service Code)"
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={(() => {
                            const availableServiceDescriptions = getAvailableOptionsForFilterSet('service_description', index);
                            return (!filterSet.serviceDescription && (!availableServiceDescriptions || availableServiceDescriptions.length === 0));
                          })()}
                          className={`react-select-container ${(() => {
                            const availableServiceDescriptions = getAvailableOptionsForFilterSet('service_description', index);
                            return (!filterSet.serviceDescription && (!availableServiceDescriptions || availableServiceDescriptions.length === 0)) ? 'opacity-50' : '';
                          })()}`}
                          classNamePrefix="react-select"
                        />
                        {filterSet.serviceDescription && (
                          <button
                            onClick={() => wrappedHandleServiceDescriptionChange(index, "")}
                            className="text-xs text-blue-500 hover:underline mt-1"
                          >
                            Clear
                          </button>
                        )}
                        {missingFields.serviceCodeOrDescription && <div className="text-xs text-red-500 mt-1">Please select a service code or description.</div>}
                    </div>
                  </div>
                </div>
              ))}
              {/* Add State to Compare Rate Button (only show if not All States mode) */}
              {!isAllStatesSelected && (
                <div className="mt-2">
                  <button
                    onClick={() => setFilterSets([...filterSets, { serviceCategory: "", states: [], serviceCode: "", stateOptions: [], serviceCodeOptions: [], durationUnits: [], serviceDescription: "" }])}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add State to Compare Rate
                  </button>
                </div>
              )}
              {/* Search Button */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow"
                >
                  Search
                </button>
              </div>
            </div>
            {/* Show message or results based on pendingSearch and hasSearchedOnce */}
            {pendingSearch && !hasSearchedOnce ? (
              <div className="text-center text-gray-500 text-lg py-12">
                <p>Please select all required filters:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Service Category</li>
                  <li>• State(s)</li>
                  <li>• <span className="text-red-500 font-semibold">Service Code OR Service Description - Required</span></li>
                  <li>• <span className="text-red-500 font-semibold">Duration Unit(s) - Required</span></li>
                </ul>
                <p className="mt-4">Then click <span className="font-semibold text-blue-600">Search</span> to see results.</p>
              </div>
            ) : (
              <>
                {/* Comparison Metrics */}
                {shouldShowMetrics && (
                  <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Highest Rate */}
              <div className="flex items-center space-x-4 p-4 bg-green-100 rounded-lg">
                <FaArrowUp className="h-8 w-8 text-green-500" />
                <div>
                          <p className="text-sm text-gray-500">Highest Rate of Selected States</p>
                  <p className="text-xl font-semibold text-gray-800">${maxRate.toFixed(2)}</p>
                </div>
              </div>

              {/* Lowest Rate */}
              <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg">
                <FaArrowDown className="h-8 w-8 text-red-500" />
                <div>
                          <p className="text-sm text-gray-500">Lowest Rate of Selected States</p>
                  <p className="text-xl font-semibold text-gray-800">${minRate.toFixed(2)}</p>
                </div>
              </div>
                </div>
              </div>
                )}

                {/* Graph Component */}
                {isInitialLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600">Loading filter options...</p>
            </div>
          </div>
                ) : shouldRenderChart ? (
                  <>
                    {isAllStatesSelected && (
                      <div className="flex justify-end mb-4">
                        <div className="bg-gray-100 rounded-full p-1 flex items-center shadow-inner">
                          <button
                            onClick={() => setSortOrder('default')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              sortOrder === 'default' 
                                ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            Default
                          </button>
                          <button
                            onClick={() => setSortOrder('asc')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              sortOrder === 'asc' 
                                ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            Low→High
                          </button>
                          <button
                            onClick={() => setSortOrder('desc')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              sortOrder === 'desc' 
                                ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            High→Low
                          </button>
                        </div>
                      </div>
                    )}
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <ReactECharts
                ref={chartRef}
                key={`all-states-${filterSets[0]?.serviceCategory || ''}-${filterSets[0]?.serviceCode || ''}`}
                option={echartOptions}
                        style={{ height: '400px', width: '100%' }}
                onEvents={{
                  click: (params: any) => {
                    console.log('Chart click event:', params);
                    console.log('isAllStatesSelected:', isAllStatesSelected);
                    console.log('clickedStates before:', clickedStates);
                    // Try to handle all click events first
                    if (params.componentType === 'series' && params.seriesType === 'bar') {
                      const stateName = params.name;
                      console.log('Bar clicked for state:', stateName);
                      // Toggle the state in the array
                      setClickedStates(prev => {
                        if (prev.includes(stateName)) {
                          return prev.filter(s => s !== stateName);
                        } else {
                          return [...prev, stateName];
                        }
                      });
                    }
                  }
                }}
              />
            </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Select filters and click Search to view the chart</p>
                      <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {shouldShowEmptyState && (
                  <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-lg text-center">
                    <div className="flex justify-center items-center mb-2 sm:mb-3">
                      <FaChartBar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
                    <p className="text-sm sm:text-base text-gray-600 font-medium">
              Select data from the tables below to generate the rate comparison visualization
            </p>
          </div>
        )}

                {/* Data Table */}
                {!isAllStatesSelected && filterSets.map((set, index) => (
            <DataTable
                    key={index}
                    filterSets={[{ ...set, number: index + 1 }]}
                    latestRates={filterSetData[index] || []}
              selectedTableRows={selectedTableRows}
              isAllStatesSelected={isAllStatesSelected}
                    onRowSelection={handleRowSelection}
              formatText={formatText}
                    selectedEntries={selectedEntries}
                  />
                ))}

                {/* Calculation Details */}
                <CalculationDetails />

                {isAllStatesSelected && filterSets[0]?.serviceCode && (
                  <div className="mt-8">

                    {filterOptions.states.map(state => {
                      const stateKey = state.trim().toUpperCase();
                      // Get all entries for this state from data (not filteredData)
                      const stateEntries = data.filter(item => item.state_name?.trim().toUpperCase() === stateKey);
                      console.log('Processing state:', state, 'stateKey:', stateKey, 'stateEntries.length:', stateEntries.length);
                      if (stateEntries.length === 0) return null;
                      
                      // Only show the table if this state is clicked
                      console.log('Checking state:', state, 'clickedStates:', clickedStates, 'should show:', clickedStates.includes(state));
                      if (!clickedStates.includes(state)) return null;
                      
                      // Pagination
                      const currentPage = allStatesTablePages[stateKey] || 1;
                      const totalPages = Math.ceil(stateEntries.length / ITEMS_PER_STATE_PAGE);
                      const paginatedEntries = stateEntries.slice((currentPage - 1) * ITEMS_PER_STATE_PAGE, currentPage * ITEMS_PER_STATE_PAGE);
                      // Use DataTable for consistency, no extra heading
                      return (
                        <div key={stateKey} className="mb-8 bg-white rounded-lg shadow-lg">
                          <div className="bg-[#012C61] text-white px-6 py-3 font-lemonMilkRegular text-lg font-bold rounded-t-lg flex justify-between items-center">
                            <span>{state.toUpperCase()}</span>
                            <button
                              onClick={() => setClickedStates(prev => prev.filter(s => s !== state))}
                              className="text-white hover:text-gray-200 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                          <DataTable
                            filterSets={[
                              {
                                serviceCategory: filterSets[0].serviceCategory,
                                states: [state],
                                serviceCode: filterSets[0].serviceCode,
                                stateOptions: [],
                                serviceCodeOptions: [],
                                number: 1
                              }
                            ]}
                            latestRates={paginatedEntries}
                            selectedTableRows={{}}
                            isAllStatesSelected={true}
                            onRowSelection={(state, item) => handleAllStatesRowSelect(stateKey, item)}
                            formatText={formatText}
                            selectedEntries={allStatesSelectedRows[stateKey]?.row ? { [stateKey]: [allStatesSelectedRows[stateKey].row] } : {}}
                            hideNumberBadge={true}
                            hideStateHeading={true}
                            // Add new props for average calculation
                            stateAverageEntries={stateAverageEntries[state] || []}
                            stateSelectedForAverage={stateSelectedForAverage[state] || new Set()}
                            onAverageEntrySelection={(item) => handleAverageEntrySelection(state, item)}
                            isAverageCalculationMode={true}
                          />
                          {/* Pagination controls */}
                          {totalPages > 1 && (
                            <div className="flex justify-center mt-4">
                              <button
                                onClick={() => handleAllStatesTablePageChange(stateKey, Math.max(currentPage - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Previous
                              </button>
                              <span className="text-sm text-gray-600 mx-2">
                                Page {currentPage} of {totalPages}
                              </span>
                              <button
                                onClick={() => handleAllStatesTablePageChange(stateKey, Math.min(currentPage + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Next
                              </button>
                </div>
                          )}
            </div>
                      );
                    })}
          </div>
        )}
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}