"use client";

import { useEffect, useState, useMemo, useId, useCallback } from "react";
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

// Add state color mapping after the color arrays
const getStateColor = (stateName: string, allStates: string[]): string => {
  const stateIndex = allStates.indexOf(stateName);
  if (stateIndex === -1) return '#36A2EB'; // default color
  return colorSequence[stateIndex % colorSequence.length];
};

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
    { serviceCategory: "", states: [], serviceCode: "", stateOptions: [], serviceCodeOptions: [], serviceDescription: "", durationUnits: [] }
  ]);

  // Add areFiltersComplete before it's used in useEffect
  const areFiltersComplete = useMemo(() => 
    filterSets.every(filterSet => 
      filterSet.serviceCategory && 
      filterSet.states.length > 0 && 
      filterSet.serviceCode
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
  const [selectedState, setSelectedState] = useState("");
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
  const [isAllStatesSelected, setIsAllStatesSelected] = useState(false);
  const [globalModifierOrder, setGlobalModifierOrder] = useState<Map<string, number>>(new Map());
  const [globalSelectionOrder, setGlobalSelectionOrder] = useState<Map<string, number>>(new Map());
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
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
  const [pendingSearch, setPendingSearch] = useState(false);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);

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

  // Update handleServiceCategoryChange to use dynamic filtering
  const handleServiceCategoryChange = async (index: number, category: string) => {
    try {
      setFilterLoading(true);
      const newFilters = [...filterSets];
      
      // If 'All States' is already selected for this filter set, set all states and all codes for the category
      if (
        newFilters[index].states.length === filterOptions.states.length ||
        newFilters[index].states.includes("ALL_STATES")
      ) {
        // Set all states
        const allStates = filterOptions.states;
        newFilters[index] = {
          ...newFilters[index],
          serviceCategory: category,
          states: allStates,
          serviceCode: "",
          serviceCodeOptions: []
        };
        // Get all codes for the selected category using dynamic filtering
        if (filterOptionsData) {
          const availableCodes = getAvailableOptionsForFilter('service_code');
          newFilters[index].serviceCodeOptions = availableCodes;
        }
        setFilterSets(newFilters);
        setFilterLoading(false);
        return;
      }
      
      // Default: just update the category and clear dependent filters
      newFilters[index] = {
        ...newFilters[index],
        serviceCategory: category,
        states: [],
        serviceCode: "",
        serviceCodeOptions: []
      };
      setFilterSets(newFilters);
      
      // Update selections for dynamic filtering - but only for this specific filter set
      // Don't update global selections that affect other filter sets
      if (index === 0) {
        handleSelectionChange('service_category', category);
      }
      
      if (index === filterSets.length - 1) {
        setServiceCodes([]);
        setPrograms([]);
        setLocationRegions([]);
        setModifiers([]);
        setProviderTypes([]);
        setServiceDescriptions([]);
      }
    } catch (error) {
      setFilterError("Failed to update filters. Please try again.");
    } finally {
      setFilterLoading(false);
    }
  };

  // Update handleStateChange to use dynamic filtering
  const handleStateChange = async (index: number, option: { value: string; label: string } | null) => {
    try {
      setFilterLoading(true);
      const newFilters = [...filterSets];
      const selectedState = option?.value || "";

      if (selectedState === "ALL_STATES") {
        setIsAllStatesSelected(true);
        // Set all states
        const allStates = filterOptions.states;
        newFilters[index] = {
          ...newFilters[index],
          states: allStates,
          serviceCode: "",
          serviceCodeOptions: []
        };
        // Get all codes for the selected category using dynamic filtering
        if (newFilters[index].serviceCategory && filterOptionsData) {
          const availableCodes = getAvailableOptionsForFilter('service_code');
          newFilters[index].serviceCodeOptions = availableCodes;
        }
        setFilterSets(newFilters);
        setSelectedState("ALL_STATES");
        setFilterLoading(false);
        return;
      } else {
        setIsAllStatesSelected(false);
        // Existing logic for single state
        newFilters[index] = {
          ...newFilters[index],
          states: selectedState ? [selectedState] : [],
          serviceCode: "",
          serviceCodeOptions: []
        };
        setFilterSets(newFilters);
        
        // Update selections for dynamic filtering - but only for this specific filter set
        if (index === 0) {
          handleSelectionChange('state_name', selectedState);
        }
        
        // Clear dependent filters for this filter set only
        if (index === filterSets.length - 1) {
          setServiceCodes([]);
          setPrograms([]);
          setLocationRegions([]);
          setModifiers([]);
          setProviderTypes([]);
          setServiceDescriptions([]);
        }
        if (selectedState && newFilters[index].serviceCategory && filterOptionsData) {
          // Get service codes using dynamic filtering
          const availableCodes = getAvailableOptionsForFilter('service_code');
          newFilters[index].serviceCodeOptions = availableCodes;
          setFilterSets(newFilters);
        }
        if (index === 0) setSelectedState(selectedState);
      }
    } catch (error) {
      setFilterError("Failed to update state filters. Please try again.");
    } finally {
      setFilterLoading(false);
    }
  };

  // Update handleServiceCodeChange to use dynamic filtering
  const handleServiceCodeChange = async (index: number, code: string) => {
    try {
      setFilterLoading(true);
      const newFilters = [...filterSets];
      newFilters[index] = {
        ...newFilters[index],
        serviceCode: code
      };
      setFilterSets(newFilters);
      
      // Update selections for dynamic filtering - but only for this specific filter set
      if (index === 0) {
        handleSelectionChange('service_code', code);
      }
      
      // Clear dependent filters for this filter set only
      if (index === filterSets.length - 1) {
        setServiceCodes([]);
        setPrograms([]);
        setLocationRegions([]);
        setModifiers([]);
        setProviderTypes([]);
        setServiceDescriptions([]);
      }
      
      // Remove all automatic data fetching - this will only happen when Search is clicked
      if (isAllStatesSelected) {
        setAllStatesAverages(null); // Clear averages if not in All States mode
      }
    } catch (error) {
      setFilterError("Failed to update service code filters. Please try again.");
    } finally {
      setFilterLoading(false);
    }
  };

  // Update other filter handlers to use dynamic filtering
  const handleProgramChange = (index: number, program: string) => {
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      program: program
    };
    setFilterSets(newFilters);
    if (index === 0) {
      handleSelectionChange('program', program);
    }
  };

  const handleLocationRegionChange = (index: number, region: string) => {
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      locationRegion: region
    };
    setFilterSets(newFilters);
    if (index === 0) {
      handleSelectionChange('location_region', region);
    }
  };

  const handleModifierChange = (index: number, modifier: string) => {
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      modifier: modifier
    };
    setFilterSets(newFilters);
    if (index === 0) {
      handleSelectionChange('modifier_1', modifier);
    }
  };

  const handleServiceDescriptionChange = (index: number, desc: string) => {
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      serviceDescription: desc
    };
    setFilterSets(newFilters);
    if (index === 0) {
      handleSelectionChange('service_description', desc);
    }
  };

  const handleProviderTypeChange = async (index: number, providerType: string) => {
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      providerType: providerType
    };
    setFilterSets(newFilters);
    if (index === 0) {
      handleSelectionChange('provider_type', providerType);
    }
  };

  const handleDurationUnitChange = async (index: number, durationUnits: string[]) => {
    const newFilters = [...filterSets];
    newFilters[index] = {
      ...newFilters[index],
      durationUnits: durationUnits
    };
    setFilterSets(newFilters);
    if (index === 0) {
      // For multiple duration units, we'll handle this differently
      // For now, just set the first one for backward compatibility
      handleSelectionChange('duration_unit', durationUnits.length > 0 ? durationUnits[0] : null);
    }
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
    } catch (err) {
      setAllStatesAverages([]);
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

  // Add dynamic filtering logic (like dashboard) - moved here to fix declaration order
  function getAvailableOptionsForFilter(filterKey: keyof Selections) {
    if (!filterOptionsData || !filterOptionsData.combinations) return [];
    
    // For all filters, ensure that we only consider combos that match current selections
    return Array.from(new Set(
      filterOptionsData.combinations
        .filter(combo => {
          // Check all other selections except the current filterKey
          return Object.entries(selections).every(([key, value]) => {
            if (key === filterKey) return true; // skip current filter
            if (!value) return true;
            return combo[key] === value;
          });
        })
        .map(c => c[filterKey])
        .filter(Boolean)
    )).sort();
  }

  // Add dynamic filter options computed from filterOptionsData (like dashboard)
  const availableServiceCategories = getAvailableOptionsForFilter('service_category');
  const availableStates = getAvailableOptionsForFilter('state_name');
  const availableServiceCodes = getAvailableOptionsForFilter('service_code');
  const availableServiceDescriptions = getAvailableOptionsForFilter('service_description');
  const availablePrograms = getAvailableOptionsForFilter('program');
  const availableLocationRegions = getAvailableOptionsForFilter('location_region');
  const availableProviderTypes = getAvailableOptionsForFilter('provider_type');
  const availableDurationUnits = getAvailableOptionsForFilter('duration_unit');
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
      }
    } catch (error) {
      // Error handling
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

  // Move stateColorMap before echartOptions
  const stateColorMap = useMemo(() => {
    const colorMap: { [state: string]: string } = {};
    const allSelectedStates = new Set<string>();
    
    // Collect all states from all filter sets
    filterSets.forEach((filterSet: FilterSet) => {
      filterSet.states.forEach((state: string) => {
        allSelectedStates.add(state);
      });
    });
    
    // Assign colors to states
    Array.from(allSelectedStates).forEach((state, index) => {
      colorMap[state] = colorSequence[index % colorSequence.length];
    });
    
    return colorMap;
  }, [filterSets]);

  // ✅ Prepare ECharts Data
  const echartOptions = useMemo(() => {
    if (isAllStatesSelected && filterSets[0]?.serviceCode && allStatesAverages) {
      const code = filterSets[0].serviceCode;
      const statesList = filterOptions.states;
      const avgMap = new Map(
        allStatesAverages.map(row => [row.state_name.trim().toUpperCase(), Number(row.avg_rate)])
      );
      // Use selected row if present, otherwise average
      const chartData = statesList.map((state: any) => {
        const stateKey = state.trim().toUpperCase();
        const selected = allStatesSelectedRows[stateKey];
        if (selected && selected.row && selected.row.rate) {
          return { 
            state: state,
            value: parseFloat((selected.row.rate || '').replace(/[^\d.-]/g, '')), 
            color: stateColorMap[state.trim().toUpperCase()] || '#36A2EB' 
          };
        }
        const avg = avgMap.get(stateKey);
        return { 
          state: state,
          value: typeof avg === 'number' && !isNaN(avg) ? avg : undefined, 
          color: stateColorMap[state.trim().toUpperCase()] || '#36A2EB' 
        };
      });

      // Sort the data based on sortOrder
      let sortedChartData = [...chartData];
      if (sortOrder === 'asc') {
        sortedChartData.sort((a, b) => {
          const aValue = a.value || 0;
          const bValue = b.value || 0;
          return aValue - bValue;
        });
      } else if (sortOrder === 'desc') {
        sortedChartData.sort((a, b) => {
          const aValue = a.value || 0;
          const bValue = b.value || 0;
          return bValue - aValue;
        });
      }

      const sortedStatesList = sortedChartData.map(item => item.state);
      const sortedValues = sortedChartData.map(item => item.value);
      const sortedColors = sortedChartData.map(item => item.color);
      return {
        legend: { show: false },
        barCategoryGap: '50%', // More gap between bars
        tooltip: {
          trigger: 'item',
          confine: true,
          extraCssText: 'max-width: 350px; white-space: normal;',
          position: (
            point: any,
            params: any,
            dom: any,
            rect: any,
            size: any
          ) => {
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
            if (allStatesSelectedRows[state.trim().toUpperCase()] && allStatesSelectedRows[state.trim().toUpperCase()].row) {
              tooltipContent += `<span style='color:green'><strong>Selected Entry</strong></span><br/>`;
            } else {
              tooltipContent += `<span style='color:#36A2EB'><strong>Average</strong></span><br/>`;
            }
            return tooltipContent;
          }
        },
        xAxis: {
          type: 'category',
          data: sortedStatesList,
          axisLabel: { rotate: 45, fontSize: 10 }
        },
        yAxis: {
          type: 'value',
          name: showRatePerHour ? 'Rate ($ per hour)' : 'Rate ($ per base unit)',
          nameLocation: 'middle',
          nameGap: 30
        },
        series: [{
          name: 'Rate',
          type: 'bar',
          barWidth: 24, // Fixed pixel width for bars
          barGap: '30%', // More gap between each bar
          itemStyle: {
            color: (params: any) => sortedColors[params.dataIndex] || '#36A2EB'
          },
          data: sortedValues,
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            color: '#222',
            fontWeight: 'bold',
            rotate: 45, // Tilt the labels 45 degrees
            align: 'center', // Center the label horizontally
            verticalAlign: 'bottom', // Align the label's bottom to the bar
            distance: 6, // Move label closer to the bar
            formatter: (params: any) => (params.value > 0 ? `$${Number(params.value).toFixed(2)}` : ''),
            rich: {
              shadow: {
                textShadowColor: '#fff',
                textShadowBlur: 4
              }
            },
          }
        }],
        grid: {
          containLabel: true,
          left: '3%',
          right: '3%',
          bottom: '16%',
          top: '5%'
        }
      };
    }
    // Multi-select/table-driven chart logic
    const allSelectedEntries: { label: string; value: number; color: string; entry: ServiceData }[] = [];
    Object.entries(selectedEntries).forEach(([state, entries]) => {
      entries.forEach((item, idx) => {
        let rateValue = parseFloat(item.rate?.replace('$', '') || '0');
        const durationUnit = item.duration_unit?.toUpperCase();
        if (showRatePerHour) {
          if (durationUnit === '15 MINUTES') rateValue *= 4;
          else if (durationUnit === '30 MINUTES') rateValue *= 2;
          else if (durationUnit !== 'PER HOUR') rateValue = 0;
        }
        // Label: State - Service Code - Modifiers (customize as needed)
        const label = [
          item.state_name,
          item.service_code,
          item.modifier_1,
          item.modifier_2,
          item.modifier_3,
          item.modifier_4,
          item.program,
          item.location_region
        ].filter(Boolean).join(' | ');
        allSelectedEntries.push({
          label,
          value: Math.round(rateValue * 100) / 100,
          color: stateColorMap[item.state_name] || '#36A2EB',
          entry: item
        });
      });
    });
    // Sort all bars by rate if needed
    let sortedEntries = [...allSelectedEntries];
    if (sortOrder === 'asc') {
      sortedEntries.sort((a, b) => a.value - b.value);
    } else if (sortOrder === 'desc') {
      sortedEntries.sort((a, b) => b.value - a.value);
    }
    // Chart config
    return {
      legend: { show: false },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const entry = sortedEntries[params.dataIndex]?.entry;
          if (!entry) return '';
          let result = `<strong>State:</strong> ${entry.state_name}<br/>`;
          result += `<strong>Service Code:</strong> ${entry.service_code}<br/>`;
          result += `<strong>Rate:</strong> $${params.value.toFixed(2)}<br/>`;
          if (entry.service_description) result += `<strong>Description:</strong> ${entry.service_description}<br/>`;
          if (entry.program) result += `<strong>Program:</strong> ${entry.program}<br/>`;
          if (entry.location_region) result += `<strong>Region:</strong> ${entry.location_region}<br/>`;
          if (entry.provider_type) result += `<strong>Provider:</strong> ${entry.provider_type}<br/>`;
          if (entry.duration_unit) result += `<strong>Unit:</strong> ${entry.duration_unit}<br/>`;
          if (entry.rate_effective_date) result += `<strong>Effective:</strong> ${formatDate(entry.rate_effective_date)}<br/>`;
            const modifiers = [];
          if (entry.modifier_1) modifiers.push(`Mod 1: ${entry.modifier_1}${entry.modifier_1_details ? ` (${entry.modifier_1_details})` : ''}`);
          if (entry.modifier_2) modifiers.push(`Mod 2: ${entry.modifier_2}${entry.modifier_2_details ? ` (${entry.modifier_2_details})` : ''}`);
          if (entry.modifier_3) modifiers.push(`Mod 3: ${entry.modifier_3}${entry.modifier_3_details ? ` (${entry.modifier_3_details})` : ''}`);
          if (entry.modifier_4) modifiers.push(`Mod 4: ${entry.modifier_4}${entry.modifier_4_details ? ` (${entry.modifier_4_details})` : ''}`);
          if (modifiers.length > 0) result += `<strong>Modifiers:</strong><br/>${modifiers.join('<br/>')}`;
          return result;
        }
      },
      xAxis: {
        type: 'category',
        data: sortedEntries.map(e => e.label),
        axisLabel: { rotate: 45, fontSize: 10 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: showRatePerHour ? 'Rate ($ per hour)' : 'Rate ($ per base unit)',
        nameLocation: 'middle',
        nameGap: 30
      },
      series: [{
        name: 'Rate',
        type: 'bar',
        barGap: '0%',
        data: sortedEntries.map(e => e.value),
        itemStyle: {
          color: (params: any) => sortedEntries[params.dataIndex]?.color || '#36A2EB'
        },
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
      }],
      barCategoryGap: '10%',
      grid: {
        containLabel: true,
        left: '3%',
        right: '3%',
        bottom: '15%',
        top: '15%'
      }
    };
  }, [selectedEntries, showRatePerHour, isAllStatesSelected, filterSets, allStatesAverages, filterOptions.states, allStatesSelectedRows, sortOrder, stateColorMap]);

  const ChartWithErrorBoundary = () => {
    try {
      return (
        <ReactECharts
          key={JSON.stringify(Object.keys(selectedEntries).sort()) + '-' + chartRefreshKey}
          option={echartOptions}
          style={{ height: '400px', width: '100%' }}
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
    // Reset filter sets to one empty filter set
    setFilterSets([{ serviceCategory: "", states: [], serviceCode: "", stateOptions: [], serviceCodeOptions: [], serviceDescription: "", durationUnits: [] }]);

    // Reset other filter-related states
    setSelectedServiceCategory("");
    setSelectedState("");
    setSelectedServiceCode("");
    setSelectedEntry(null);
    setServiceCodes([]);
    setSelectedTableRows({});
    setIsAllStatesSelected(false);
    setSortOrder('default');
    setSelectedStateDetails(null);
    setSelectedEntries({});         // <-- Clear selected entries
    setChartRefreshKey(k => k + 1); // <-- Force chart to re-render/reset
  };

  // Calculate highest and lowest among currently selected bars
  const selectedRates = useMemo(() => {
    if (isAllStatesSelected && filterSets[0]?.serviceCode && allStatesAverages) {
      // Use the chartData for metrics (matches the bars shown)
      const statesList = filterOptions.states;
      const avgMap = new Map(
        allStatesAverages.map(row => [row.state_name.trim().toUpperCase(), Number(row.avg_rate)])
      );
      const chartData = statesList.map((state: any) => {
        const avg = avgMap.get(state.trim().toUpperCase());
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
  }, [selectedEntries, showRatePerHour, isAllStatesSelected, filterSets, allStatesAverages, filterOptions.states]);

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

  // Debug: Log filterOptions and data when they change
  useEffect(() => {
    console.log('filterOptions:', filterOptions);
    console.log('data:', data);
    console.log('latestRates:', latestRates);
    console.log('filterSets:', filterSets);
    console.log('isAllStatesSelected:', isAllStatesSelected);
    console.log('areFiltersComplete:', areFiltersComplete);
  }, [filterOptions, data, latestRates, filterSets, isAllStatesSelected, areFiltersComplete]);

  // Debug: Log when refreshData and refreshFilters are called
  useEffect(() => {
    console.log('Calling refreshFilters on mount');
  }, []);

  // Add useEffect to update filter options when service category or state changes
  useEffect(() => {
    // Log the params being sent to refreshFilters
    console.log('Calling refreshFilters with:', selectedServiceCategory, selectedState);
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



  // Trigger state averages fetch when "All States" mode is active
  // Remove automatic fetchAllStatesAverages - this will only happen when Search is clicked
  // useEffect(() => {
  //   if (isAllStatesSelected && filterSets[0]?.serviceCategory && filterSets[0]?.serviceCode) {
  //     fetchAllStatesAverages(filterSets[0].serviceCategory, filterSets[0].serviceCode);
  //   }
  // }, [isAllStatesSelected, filterSets, fetchAllStatesAverages]);

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

  // On any filter change, set pendingSearch to true
  const handleFilterChange = (handler: (...args: any[]) => void) => (...args: any[]) => {
    setPendingSearch(true);
    handler(...args);
  };

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

  // Only fetch data when Search is clicked
  const handleSearch = async () => {
    setPendingSearch(false);
    let success = false;
    // Now trigger the actual data fetching
    try {
      setFilterLoading(true);
      // For each filter set, fetch the appropriate data
      for (let index = 0; index < filterSets.length; index++) {
        const filterSet = filterSets[index];
        if (filterSet.serviceCategory && filterSet.states.length > 0 && (filterSet.serviceCode || filterSet.serviceDescription)) {
          if (isAllStatesSelected && index === 0) {
            await fetchAllStatesAverages(filterSet.serviceCategory, filterSet.serviceCode);
            const result = await refreshData({
              serviceCategory: filterSet.serviceCategory,
              serviceCode: filterSet.serviceCode,
              itemsPerPage: '1000'
            });
            if (result) {
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
                  {/* Filter Set Number Badge */}
                  <div className="absolute -top-3 -left-3 bg-[#012C61] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                    {index + 1}
                  </div>
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
                    {/* Service Category Selector */}
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
                    </div>

                    {/* State Selector */}
                    {filterSet.serviceCategory ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">State</label>
                        <Select
                          instanceId={`state-select-${index}`}
                          options={
                            filterOptions.states.map((state: any) => ({ value: state, label: state }))
                          }
                          value={
                            filterSet.states.length > 0
                              ? { value: filterSet.states[0], label: filterSet.states[0] }
                              : null
                          }
                          onChange={(option) => {
                            wrappedHandleStateChange(index, option);
                            setSelectedState(option?.value || "");
                            console.log('State selected (top-level):', option?.value);
                          }}
                          placeholder="Select State"
                          isSearchable
                          filterOption={customFilterOption}
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">State</label>
                        <div className="text-gray-400 text-sm">
                          Select a service line first
                        </div>
                      </div>
                    )}

                    {/* Service Code Selector */}
                    {filterSet.serviceCategory && filterSet.states.length > 0 ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Service Code <span className="text-red-500">*</span></label>
                        <Select
                          instanceId={`service-code-select-${index}`}
                          options={
                            filterSet.serviceCodeOptions.length > 0
                              ? filterSet.serviceCodeOptions.map((code: any) => ({ value: code, label: code }))
                              : []
                          }
                          value={filterSet.serviceCode ? { value: filterSet.serviceCode, label: filterSet.serviceCode } : null}
                          onChange={(option) => {
                            // Clear service description when service code is selected
                            const newFilters = [...filterSets];
                            newFilters[index] = {
                              ...newFilters[index],
                              serviceDescription: "",
                              serviceCode: option?.value || ""
                            };
                            setFilterSets(newFilters);
                            wrappedHandleServiceCodeChange(index, option?.value || "");
                          }}
                          placeholder="Select Service Code"
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={!!filterSet.serviceDescription}
                          className={`react-select-container ${!!filterSet.serviceDescription ? 'opacity-50' : ''}`}
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
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Service Code <span className="text-red-500">*</span></label>
                        <div className="text-gray-400 text-sm">
                          {filterSet.serviceCategory ? "Select a state to see available service codes" : "Select a service line first"}
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
                            (availablePrograms && availablePrograms.length > 0)
                              ? [{ value: '-', label: '-' }, ...availablePrograms.map((program: any) => ({ value: program, label: program }))]
                              : []
                          }
                            value={filterSet.program ? { value: filterSet.program, label: filterSet.program } : null}
                          onChange={(option) => wrappedHandleProgramChange(index, option?.value || "")}
                          placeholder="Select Program"
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={(availablePrograms || []).length === 0}
                          className={`react-select-container ${(availablePrograms || []).length === 0 ? 'opacity-50' : ''}`}
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
                            (availableLocationRegions && availableLocationRegions.length > 0)
                              ? [{ value: '-', label: '-' }, ...availableLocationRegions.map((region: any) => ({ value: region, label: region }))]
                              : []
                          }
                          value={filterSet.locationRegion ? { value: filterSet.locationRegion, label: filterSet.locationRegion } : null}
                          onChange={(option) => wrappedHandleLocationRegionChange(index, option?.value || "")}
                          placeholder="Select Location/Region"
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={(availableLocationRegions || []).length === 0}
                          className={`react-select-container ${(availableLocationRegions || []).length === 0 ? 'opacity-50' : ''}`}
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
                            (availableModifiers && availableModifiers.length > 0)
                              ? [{ value: '-', label: '-' }, ...availableModifiers.map((modifier: any) => {
                                  // Find the first matching definition from filterOptionsData.combinations
                                  const def =
                                    filterOptionsData?.combinations?.find((c: any) => c.modifier_1 === modifier)?.modifier_1_details ||
                                    filterOptionsData?.combinations?.find((c: any) => c.modifier_2 === modifier)?.modifier_2_details ||
                                    filterOptionsData?.combinations?.find((c: any) => c.modifier_3 === modifier)?.modifier_3_details ||
                                    filterOptionsData?.combinations?.find((c: any) => c.modifier_4 === modifier)?.modifier_4_details;
                                  return {
                                    value: modifier,
                                    label: def ? `${modifier} - ${def}` : modifier
                                  };
                                })]
                              : []
                          }
                          value={filterSet.modifier ? { value: filterSet.modifier, label: filterSet.modifier } : null}
                          onChange={(option) => wrappedHandleModifierChange(index, option?.value || "")}
                          placeholder="Select Modifier"
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={(availableModifiers || []).length === 0}
                          className={`react-select-container ${(availableModifiers || []).length === 0 ? 'opacity-50' : ''}`}
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
                            (availableProviderTypes && availableProviderTypes.length > 0)
                              ? [{ value: '-', label: '-' }, ...availableProviderTypes.map((type: any) => ({ value: type, label: type }))]
                              : []
                          }
                          value={filterSet.providerType ? { value: filterSet.providerType, label: filterSet.providerType } : null}
                          onChange={(option) => wrappedHandleProviderTypeChange(index, option?.value || "")}
                          placeholder="Select Provider Type"
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={(availableProviderTypes || []).length === 0}
                          className={`react-select-container ${(availableProviderTypes || []).length === 0 ? 'opacity-50' : ''}`}
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

                    {/* Duration Unit Selector */}
                    {filterSet.serviceCategory && filterSet.states.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Duration Unit(s) <span className="text-red-500">*</span></label>
                        <Select
                          instanceId={`duration-unit-select-${index}`}
                          options={
                            (availableDurationUnits && availableDurationUnits.length > 0)
                              ? availableDurationUnits.map((unit: any) => ({ value: unit, label: unit }))
                              : []
                          }
                          value={filterSet.durationUnits && filterSet.durationUnits.length > 0 
                            ? filterSet.durationUnits.map(unit => ({ value: unit, label: unit }))
                            : []
                          }
                          onChange={(options) => {
                            const selectedValues = options ? options.map(opt => opt.value) : [];
                            wrappedHandleDurationUnitChange(index, selectedValues);
                          }}
                          placeholder="Select Duration Unit(s)"
                          isSearchable
                          isMulti
                          filterOption={customFilterOption}
                          isDisabled={(availableDurationUnits || []).length === 0}
                          className={`react-select-container ${(availableDurationUnits || []).length === 0 ? 'opacity-50' : ''}`}
                          classNamePrefix="react-select"
                        />
                        {filterSet.durationUnits && filterSet.durationUnits.length > 0 && (
                          <button
                            onClick={() => wrappedHandleDurationUnitChange(index, [])}
                            className="text-xs text-blue-500 hover:underline mt-1"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    )}

                    {/* Service Description Selector */}
                    {filterSet.serviceCategory && filterSet.states.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Service Description <span className="text-red-500">*</span></label>
                        <Select
                          instanceId={`service-description-select-${index}`}
                          options={
                            (availableServiceDescriptions && availableServiceDescriptions.length > 0)
                              ? availableServiceDescriptions.map((desc: any) => ({ value: desc, label: desc }))
                              : []
                          }
                          value={filterSet.serviceDescription ? { value: filterSet.serviceDescription, label: filterSet.serviceDescription } : null}
                          onChange={(option) => {
                            // Clear service code when service description is selected
                            const newFilters = [...filterSets];
                            newFilters[index] = {
                              ...newFilters[index],
                              serviceCode: "",
                              serviceDescription: option?.value || ""
                            };
                            setFilterSets(newFilters);
                            wrappedHandleServiceDescriptionChange(index, option?.value || "");
                          }}
                          placeholder="Select Service Description"
                          isSearchable
                          filterOption={customFilterOption}
                          isDisabled={(availableServiceDescriptions || []).length === 0 || !!filterSet.serviceCode}
                          className={`react-select-container ${(availableServiceDescriptions || []).length === 0 || !!filterSet.serviceCode ? 'opacity-50' : ''}`}
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
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* Add State to Compare Rate Button (only show if not All States mode) */}
              {!isAllStatesSelected && (
                <div className="mt-2">
                  <button
                    onClick={() => setFilterSets([...filterSets, { serviceCategory: "", states: [], serviceCode: "", stateOptions: [], serviceCodeOptions: [], serviceDescription: "", durationUnits: [] }])}
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!pendingSearch || !isSearchReady}
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
                  <li>• Service Line</li>
                  <li>• State</li>
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
                {(isAllStatesSelected && filterSets[0]?.serviceCode && echartOptions) || (Object.values(selectedEntries).length > 0 && echartOptions) ? (
                  <>
                    {/* Display the comment above the graph */}
                    {comments.length > 0 && (
                      <div className="space-y-4 mb-4">
                        {comments.map(({ state, comment }, index) => (
                          <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-700">
                              <strong>Comment for {state}:</strong> {comment}
                            </p>
            </div>
                        ))}
          </div>
        )}
                    
                    {/* Chart Sorting Controls */}
                    <div className="mb-4 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
                      <div className="text-xs text-gray-500">
                        {sortOrder === 'default' && 'Original order'}
                        {sortOrder === 'asc' && 'Sorted by rate (lowest first)'}
                        {sortOrder === 'desc' && 'Sorted by rate (highest first)'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Sort Chart:</span>
                        <div className="flex items-center bg-gray-100 rounded-full p-1 transition-all" style={{ minWidth: 220 }}>
                          <button
                            onClick={() => setSortOrder('default')}
                            className={`px-4 py-1 rounded-full text-sm font-semibold focus:outline-none transition-all duration-150 ${
                              sortOrder === 'default'
                                ? 'bg-white text-blue-600 shadow font-bold'
                                : 'bg-transparent text-gray-600 hover:text-blue-600'
                            }`}
                            style={{ minWidth: 80 }}
                          >
                            Default
                          </button>
                          <button
                            onClick={() => setSortOrder('asc')}
                            className={`px-4 py-1 rounded-full text-sm font-semibold focus:outline-none transition-all duration-150 ${
                              sortOrder === 'asc'
                                ? 'bg-white text-green-600 shadow font-bold'
                                : 'bg-transparent text-gray-600 hover:text-green-600'
                            }`}
                            style={{ minWidth: 80 }}
                          >
                            Low → High
                          </button>
                          <button
                            onClick={() => setSortOrder('desc')}
                            className={`px-4 py-1 rounded-full text-sm font-semibold focus:outline-none transition-all duration-150 ${
                              sortOrder === 'desc'
                                ? 'bg-white text-red-600 shadow font-bold'
                                : 'bg-transparent text-gray-600 hover:text-red-600'
                            }`}
                            style={{ minWidth: 80 }}
                          >
                            High → Low
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chart component */}
            <ReactECharts
                      key={`${isAllStatesSelected ? 'all-states-' : 'selected-'}${JSON.stringify(Object.keys(selectedEntries).sort())}-${chartRefreshKey}-${allStatesAverages ? allStatesAverages.length : 0}-${sortOrder}`}
                      option={echartOptions}
              style={{ height: '400px', width: '100%' }}
            />
                  </>
                ) : null}

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
                    stateColorMap={stateColorMap}
                  />
                ))}

                {/* Calculation Details */}
                <CalculationDetails />

                {isAllStatesSelected && filterSets[0]?.serviceCode && (
                  <div className="mt-8">
                    {filterOptions.states.map(state => {
                      const stateKey = state.trim().toUpperCase();
                      // Get all entries for this state from filteredData
                      const stateEntries = filteredData.filter(item => item.state_name?.trim().toUpperCase() === stateKey);
                      if (stateEntries.length === 0) return null;
                      // Pagination
                      const currentPage = allStatesTablePages[stateKey] || 1;
                      const totalPages = Math.ceil(stateEntries.length / ITEMS_PER_STATE_PAGE);
                      const paginatedEntries = stateEntries.slice((currentPage - 1) * ITEMS_PER_STATE_PAGE, currentPage * ITEMS_PER_STATE_PAGE);
                      // Use DataTable for consistency, no extra heading
                      return (
                        <div key={stateKey} className="mb-8 bg-white rounded-lg shadow-lg">
                          <div className="bg-[#012C61] text-white px-6 py-3 font-lemonMilkRegular text-lg font-bold rounded-t-lg">
                            {state.toUpperCase()}
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
                            stateColorMap={stateColorMap}
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