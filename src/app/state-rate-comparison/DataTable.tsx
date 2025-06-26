import { useMemo, useState } from 'react';
import { FilterSet, ServiceData } from './types';

interface DataTableProps {
  filterSets: FilterSet[];
  latestRates: ServiceData[];
  selectedTableRows: { [state: string]: string[] };
  isAllStatesSelected: boolean;
  onRowSelection: (state: string, item: ServiceData) => void;
  formatText: (text: string | null | undefined) => string;
  selectedEntries: { [state: string]: ServiceData[] };
}

const ITEMS_PER_PAGE = 25;

export const DataTable = ({
  filterSets,
  latestRates,
  selectedTableRows,
  isAllStatesSelected,
  onRowSelection,
  formatText,
  selectedEntries
}: DataTableProps) => {
  // Track current page for each filter set
  const [currentPages, setCurrentPages] = useState<{ [filterIndex: number]: number }>({});

  // Debug logging
  console.log('DataTable props:', {
    filterSets,
    latestRatesLength: latestRates?.length,
    isAllStatesSelected
  });

  const handlePageChange = (filterIndex: number, page: number) => {
    setCurrentPages(prev => ({ ...prev, [filterIndex]: page }));
  };

  const tableContent = useMemo(() => {
    console.log('DataTable tableContent calculation:', {
      isAllStatesSelected,
      filterSetsLength: filterSets?.length,
      latestRatesLength: latestRates?.length
    });
    
    return filterSets.map((filterSet, filterIndex) => {
      console.log(`DataTable: Processing filterSet ${filterIndex}:`, filterSet);
      
      const grouped: { [key: string]: ServiceData[] } = {};
      latestRates.forEach(item => {
        if (
          item.service_category === filterSet.serviceCategory &&
          filterSet.states.includes(item.state_name?.trim().toUpperCase()) &&
          item.service_code === filterSet.serviceCode &&
          (!filterSet.program || item.program === filterSet.program) &&
          (!filterSet.locationRegion || item.location_region === filterSet.locationRegion) &&
          (!filterSet.modifier || [item.modifier_1, item.modifier_2, item.modifier_3, item.modifier_4].includes(filterSet.modifier)) &&
          (!filterSet.serviceDescription || item.service_description === filterSet.serviceDescription) &&
          (!filterSet.providerType || item.provider_type === filterSet.providerType)
        ) {
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
        }
      });
      
      console.log(`DataTable: FilterSet ${filterIndex} grouped data:`, Object.keys(grouped).length);
      
      // Only keep the latest entry for each group
      const filteredDataForSet = Object.values(grouped).map(entries => {
        return entries.reduce((latest, current) => {
          const latestDate = new Date(latest.rate_effective_date);
          const currentDate = new Date(current.rate_effective_date);
          return currentDate > latestDate ? current : latest;
        });
      });

      console.log(`DataTable: FilterSet ${filterIndex} filtered data:`, filteredDataForSet.length);

      // Pagination logic
      const totalCount = filteredDataForSet.length;
      const currentPage = currentPages[filterIndex] || 1;
      const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIdx = startIdx + ITEMS_PER_PAGE;
      const paginatedData = filteredDataForSet.slice(startIdx, endIdx);
      const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

      const groupedByState = paginatedData.reduce((acc, item) => {
        const state = item.state_name?.trim();
        if (!state) return acc;
        if (!acc[state]) acc[state] = [];
        acc[state].push(item);
        return acc;
      }, {} as { [key: string]: ServiceData[] });

      // Calculate visible columns for this filter set's data
      const calculateVisibleColumns = (data: ServiceData[]) => {
        const columns: Record<string, boolean> = {
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
          rate_effective_date: false,
          provider_type: false,
        };
        data.forEach(item => {
          Object.keys(columns).forEach(key => {
            if (item[key as keyof ServiceData] && item[key as keyof ServiceData] !== '-') {
              columns[key] = true;
            }
          });
        });
        return columns;
      };

      const visibleColumns = calculateVisibleColumns(paginatedData);

      return (
        <div key={filterIndex} className="mb-8 overflow-hidden rounded-lg shadow-lg">
          {Object.keys(groupedByState).length > 0 && (
            <div className="bg-[#012C61] text-white px-6 py-3 flex items-center">
              <div className="bg-white text-[#012C61] rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {filterSet.number}
              </div>
            </div>
          )}
          {Object.entries(groupedByState).map(([state, items]) => (
            <div key={state} className="mb-8">
              <div className="font-lemonMilkRegular text-lg text-[#012C61] mb-2 mt-4">{state}</div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-white sticky top-0 z-10 shadow">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"></th>
                      {visibleColumns.state_name && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">State</th>
                      )}
                      {visibleColumns.service_category && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Service Category</th>
                      )}
                      {visibleColumns.service_code && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Service Code</th>
                      )}
                      {visibleColumns.service_description && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Service Description</th>
                      )}
                      {visibleColumns.program && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Program</th>
                      )}
                      {visibleColumns.location_region && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Region</th>
                      )}
                      {visibleColumns.modifier_1 && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Modifier 1</th>
                      )}
                      {visibleColumns.modifier_2 && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Modifier 2</th>
                      )}
                      {visibleColumns.modifier_3 && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Modifier 3</th>
                      )}
                      {visibleColumns.modifier_4 && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Modifier 4</th>
                      )}
                      {visibleColumns.rate && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                      )}
                      {visibleColumns.duration_unit && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Duration Unit</th>
                      )}
                      {visibleColumns.rate_effective_date && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                      )}
                      {visibleColumns.provider_type && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Provider Type</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, index) => {
                      const rowKey = getRowKey(item);
                      const selectedArr = selectedEntries[state] || [];
                      const isSelected = selectedArr.some(i => getRowKey(i) === rowKey);
                      return (
                        <tr 
                          key={index} 
                          className={`group relative transition-all duration-200 ease-in-out cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]' 
                              : 'hover:bg-gray-50 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:scale-[1.01] hover:z-10'
                          }`}
                          onClick={() => {
                            onRowSelection(item.state_name?.trim(), item);
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {isSelected && (
                                <button
                                  onClick={e => { e.stopPropagation(); onRowSelection(item.state_name?.trim(), item); }}
                                  className="mr-1 p-0.5 rounded-full hover:bg-red-100 focus:outline-none"
                                  title="Deselect"
                                  style={{ lineHeight: 0 }}
                                >
                                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]' 
                                  : 'border-gray-300 group-hover:border-blue-300 group-hover:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]'
                              }`}>
                                {isSelected && (
                                  <svg 
                                    className="w-3 h-3 text-white transition-transform duration-200" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M5 13l4 4L19 7" 
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </td>
                          {visibleColumns.state_name && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {STATE_ABBREVIATIONS[item.state_name?.toUpperCase() || ""] || item.state_name || '-'}
                            </td>
                          )}
                          {visibleColumns.service_category && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {SERVICE_CATEGORY_ABBREVIATIONS[item.service_category?.trim().toUpperCase() || ""] || item.service_category || '-'}
                            </td>
                          )}
                          {visibleColumns.service_code && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatText(item.service_code)}</td>
                          )}
                          {visibleColumns.service_description && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-[220px]">
                              <div className="relative group">
                                <span className="truncate block group-hover:text-blue-600 transition-colors duration-200" title={item.service_description || '-'}>
                                  {item.service_description && item.service_description.length > 30
                                    ? item.service_description.slice(0, 30) + '...'
                                    : item.service_description || '-'}
                                </span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.program && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatText(item.program)}</td>
                          )}
                          {visibleColumns.location_region && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatText(item.location_region)}</td>
                          )}
                          {visibleColumns.modifier_1 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatText(item.modifier_1)}</td>
                          )}
                          {visibleColumns.modifier_2 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatText(item.modifier_2)}</td>
                          )}
                          {visibleColumns.modifier_3 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatText(item.modifier_3)}</td>
                          )}
                          {visibleColumns.modifier_4 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatText(item.modifier_4)}</td>
                          )}
                          {visibleColumns.rate && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRate(item.rate)}</td>
                          )}
                          {visibleColumns.duration_unit && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatText(item.duration_unit)}</td>
                          )}
                          {visibleColumns.rate_effective_date && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatText(item.rate_effective_date)}</td>
                          )}
                          {visibleColumns.provider_type && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatText(item.provider_type)}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination controls for this state */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(filterIndex, Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(filterIndex, Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    });
  }, [filterSets, latestRates, selectedEntries, currentPages, onRowSelection, formatText]);

  return tableContent;
};

// Add abbreviations mappings (copy from historical rates)
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

// Helper function to format rates with 2 decimal points
const formatRate = (rate: string | undefined) => {
  if (!rate) return '-';
  // Remove any existing $ and parse as number
  const numericRate = parseFloat(rate.replace(/[^0-9.-]/g, ''));
  if (isNaN(numericRate)) return rate; // Return original if not a valid number
  return `$${numericRate.toFixed(2)}`;
}; 