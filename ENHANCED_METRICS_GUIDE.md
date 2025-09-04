# Enhanced Metrics System - Complete Guide

## Overview

The Enhanced Metrics System is a comprehensive data management solution that combines all admin data (provider alerts, legislative updates, service categories, master data, and recent rate changes) into a single compressed file for efficient access and processing.

## System Architecture

### Data Sources
- **Provider Alerts** (`provider_alerts` table)
- **Legislative Updates** (`bill_track_50` table) 
- **Service Categories** (`service_category_list` table)
- **Master Data** (`master_data_sept_2` table)
- **Recent Rate Changes** (derived from master data)

### File Structure
```
public/
├── enhanced_metrics_detailed.json.gz    # Main enhanced metrics file
├── state_metrics_detailed.json.gz        # Fallback metrics file
└── filter_options.json.gz               # Filter options for dashboard
```

## Data Structure

### Enhanced Metrics Format
```json
{
  "provider_alerts": {
    "m": {},           // Mappings for decompression
    "v": {},           // Compressed values
    "c": [],           // Column names
    "total_records": 0
  },
  "legislative_updates": {
    "m": {},
    "v": {},
    "c": [],
    "total_records": 0
  },
  "service_categories": {
    "m": {},
    "v": {},
    "c": [],
    "total_records": 0
  },
  "master_data": {
    "m": {},
    "v": {},
    "c": [],
    "total_records": 0
  },
  "recent_rate_changes": {
    "m": {},
    "v": {},
    "c": [],
    "total_records": 0
  },
  "summary": {
    "totalProviderAlerts": 0,
    "totalLegislativeUpdates": 0,
    "totalServiceCategories": 0,
    "totalMasterDataRecords": 0,
    "totalRecentRateChanges": 0,
    "newProviderAlerts": 0,
    "newLegislativeUpdates": 0,
    "lastUpdated": "",
    "dataVersion": "2.0",
    "description": ""
  },
  "metadata": {
    "generatedAt": "",
    "version": "2.0",
    "description": "",
    "tables": [],
    "compressionRatio": ""
  }
}
```

## API Endpoints

### 1. Enhanced Metrics API
**Endpoint:** `/api/enhanced-metrics`
**Method:** GET
**Description:** Serves the main enhanced metrics file
**Response:** Complete enhanced metrics data structure

### 2. Recent Rate Changes API
**Endpoint:** `/api/recent-rate-changes`
**Method:** GET
**Description:** Serves recent rate changes data (extracted from enhanced metrics)
**Response:** Recent rate changes data structure

### 3. State Metrics API (Legacy)
**Endpoint:** `/api/state-metrics`
**Method:** GET
**Description:** Serves the original state metrics file
**Response:** Original metrics data structure

### 4. State Alerts API
**Endpoint:** `/api/state-alerts?state={stateName}`
**Method:** GET
**Description:** Fetches alerts for a specific state
**Response:** Array of alerts for the specified state

## Utility Library (`src/lib/enhanced-metrics.ts`)

### Core Functions

#### Enhanced Metrics Functions
```typescript
// Fetch enhanced metrics data
fetchEnhancedMetrics(): Promise<EnhancedMetricsData>

// Get provider alerts
getProviderAlerts(data: EnhancedMetricsData): ProviderAlert[]

// Get legislative updates  
getLegislativeUpdates(data: EnhancedMetricsData): LegislativeUpdate[]

// Get service categories
getServiceCategories(data: EnhancedMetricsData): ServiceCategory[]

// Get master data records
getMasterDataRecords(data: EnhancedMetricsData): MasterDataRecord[]

// Get state summary
getStateSummary(data: EnhancedMetricsData, stateName: string): StateSummary
```

#### Recent Rate Changes Functions
```typescript
// Fetch recent rate changes
fetchRecentRateChanges(): Promise<RecentRateChangesData | null>

// Get all recent rate changes
getRecentRateChanges(data: RecentRateChangesData): RecentRateChange[]

// Filter recent rate changes
filterRecentRateChanges(data: RecentRateChangesData, filters: FilterOptions): RecentRateChange[]

// Get summary statistics
getRecentRateChangesSummary(data: RecentRateChangesData): SummaryStats

// Decompress single record
decompressRecentRateChange(data: RecentRateChangesData, recordIndex: number): RecentRateChange | null
```

### Data Types

#### Enhanced Metrics Types
```typescript
interface EnhancedMetricsData {
  provider_alerts: CompressedData;
  legislative_updates: CompressedData;
  service_categories: CompressedData;
  master_data: CompressedData;
  recent_rate_changes: CompressedData;
  summary: SummaryStats;
  metadata: Metadata;
}

interface ProviderAlert {
  id: string;
  link?: string;
  state?: string;
  service_lines_impacted?: string;
  subject?: string;
  announcement_date?: string;
  is_new?: string;
  summary?: string;
}

interface LegislativeUpdate {
  url: string;
  state?: string;
  bill_number?: string;
  name?: string;
  ai_summary?: string;
  bill_progress?: string;
  last_action?: string;
  created?: string;
  action_date?: string;
  sponsor_list?: string;
  date_extracted?: string;
  is_new?: string;
}

interface MasterDataRecord {
  id: number;
  service_category?: string;
  state_name?: string;
  service_code?: string;
  service_description?: string;
  rate?: string;
  rate_effective_date?: string;
  duration_unit?: string;
  program?: string;
  modifier_1?: string;
  modifier_1_details?: string;
  provider_type?: string;
  location_region?: string;
  // ... additional fields
}
```

#### Recent Rate Changes Types
```typescript
interface RecentRateChange {
  id: string;
  serviceCode: string;
  description: string;
  state: string;
  serviceCategory: string;
  oldRate: string;
  newRate: string;
  percentageChange: number;
  effectiveDate: string;
  modifiers: string[];
  providerType: string;
  program: string;
  locationRegion: string;
  durationUnit: string;
}

interface RecentRateChangesData {
  m: Record<string, Record<string, number>>;
  v: Record<string, number[]>;
  total_records: number;
  date_range: {
    earliest: string;
    latest: string;
  };
  rate_range: {
    min: number;
    max: number;
  };
  states: string[];
  service_categories: string[];
}
```

## Generation Script

### Location
`scripts/generate-enhanced-metrics.js`

### Usage
```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run the script
node scripts/generate-enhanced-metrics.js
```

### What it does
1. Connects to Supabase using service role key
2. Fetches data from all required tables
3. Processes recent rate changes from master data
4. Creates compression mappings for each column
5. Compresses all data using gzip
6. Saves to `public/enhanced_metrics_detailed.json.gz`
7. Calculates and reports compression statistics

### Output
- **File:** `public/enhanced_metrics_detailed.json.gz`
- **Size:** Typically 80-90% smaller than original JSON
- **Content:** All admin data in compressed format

## Integration Examples

### 1. Home Page Integration
```typescript
import { fetchEnhancedMetrics, getStateSummary } from '@/lib/enhanced-metrics';

// Load enhanced metrics
const enhancedData = await fetchEnhancedMetrics();

// Get state-specific data
const stateSummary = getStateSummary(enhancedData, 'California');
console.log('New alerts:', stateSummary.totalNewAlerts);
```

### 2. Recent Rate Changes Page
```typescript
import { fetchRecentRateChanges, getRecentRateChanges, filterRecentRateChanges } from '@/lib/enhanced-metrics';

// Load recent rate changes
const recentData = await fetchRecentRateChanges();

// Get all changes
const allChanges = getRecentRateChanges(recentData);

// Filter by state
const californiaChanges = filterRecentRateChanges(recentData, {
  state: 'California',
  serviceCategory: 'BEHAVIORAL HEALTH'
});
```

### 3. Dashboard Integration
```typescript
import { fetchEnhancedMetrics, getProviderAlerts, getLegislativeUpdates } from '@/lib/enhanced-metrics';

// Load enhanced metrics
const enhancedData = await fetchEnhancedMetrics();

// Get new alerts
const newProviderAlerts = getProviderAlerts(enhancedData).filter(alert => alert.is_new === 'yes');
const newLegislativeUpdates = getLegislativeUpdates(enhancedData).filter(update => update.is_new === 'yes');

// Calculate totals
const totalNewAlerts = newProviderAlerts.length + newLegislativeUpdates.length;
```

## Performance Benefits

### 1. Reduced API Calls
- Single file contains all data
- No need for multiple database queries
- Faster page loads

### 2. Compression
- 80-90% size reduction
- Faster downloads
- Reduced bandwidth usage

### 3. Caching
- Static file can be cached by CDN
- Reduced server load
- Better user experience

### 4. Offline Capability
- Data available without internet
- Works in low-connectivity areas
- Better reliability

## Troubleshooting

### Common Issues

#### 1. File Not Found
```bash
# Check if file exists
ls -la public/enhanced_metrics_detailed.json.gz

# Regenerate if missing
node scripts/generate-enhanced-metrics.js
```

#### 2. Decompression Errors
```typescript
// Add error handling
try {
  const data = await fetchEnhancedMetrics();
  // Process data
} catch (error) {
  console.error('Failed to load enhanced metrics:', error);
  // Fallback to original metrics
}
```

#### 3. Missing Environment Variables
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Set if missing
export NEXT_PUBLIC_SUPABASE_URL="your_url"
export SUPABASE_SERVICE_ROLE_KEY="your_key"
```

#### 4. Large File Size
```bash
# Check file size
ls -lh public/enhanced_metrics_detailed.json.gz

# If too large, consider:
# - Reducing data scope
# - Increasing compression
# - Splitting into multiple files
```

### Debug Mode
```typescript
// Enable debug logging
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('Loading enhanced metrics...');
  console.log('Data structure:', Object.keys(enhancedData));
  console.log('Summary:', enhancedData.summary);
}
```

## Best Practices

### 1. Error Handling
```typescript
// Always handle errors gracefully
try {
  const data = await fetchEnhancedMetrics();
  return data;
} catch (error) {
  console.error('Enhanced metrics error:', error);
  return null;
}
```

### 2. Fallback Strategy
```typescript
// Provide fallback to original metrics
const enhancedData = await fetchEnhancedMetrics();
if (!enhancedData) {
  const originalData = await fetchStateMetrics();
  return originalData;
}
```

### 3. Caching
```typescript
// Cache data in memory for performance
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedEnhancedMetrics() {
  const now = Date.now();
  if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedData;
  }
  
  cachedData = await fetchEnhancedMetrics();
  cacheTimestamp = now;
  return cachedData;
}
```

### 4. Progressive Loading
```typescript
// Load data progressively
const [basicData, setBasicData] = useState(null);
const [detailedData, setDetailedData] = useState(null);

useEffect(() => {
  // Load basic data first
  fetchStateMetrics().then(setBasicData);
  
  // Load detailed data in background
  fetchEnhancedMetrics().then(setDetailedData);
}, []);
```

## Migration Guide

### From Original Metrics to Enhanced Metrics

#### 1. Update Imports
```typescript
// Old
import { fetchStateMetrics } from '@/lib/metrics';

// New
import { fetchEnhancedMetrics } from '@/lib/enhanced-metrics';
```

#### 2. Update Function Calls
```typescript
// Old
const data = await fetchStateMetrics();
const serviceCount = data.unique_service_codes[state];

// New
const data = await fetchEnhancedMetrics();
const masterRecords = getMasterDataRecords(data);
const stateRecords = masterRecords.filter(r => r.state_name === state);
const serviceCount = new Set(stateRecords.map(r => r.service_code)).size;
```

#### 3. Update Error Handling
```typescript
// Old
if (!data) {
  // Handle missing data
}

// New
if (!data) {
  // Try fallback
  const fallbackData = await fetchStateMetrics();
  if (!fallbackData) {
    // Handle complete failure
  }
}
```

## Future Enhancements

### 1. Real-time Updates
- WebSocket integration for live data
- Incremental updates
- Push notifications

### 2. Advanced Analytics
- Trend analysis
- Predictive modeling
- Custom dashboards

### 3. Data Export
- CSV/Excel export
- API for external systems
- Scheduled reports

### 4. Performance Optimization
- Lazy loading
- Virtual scrolling
- Advanced caching strategies

## Support

For issues or questions:
1. Check this documentation
2. Review the troubleshooting section
3. Check the console for error messages
4. Verify environment variables
5. Regenerate the enhanced metrics file

## Version History

### v2.0 (Current)
- Added recent rate changes functionality
- Enhanced compression algorithms
- Improved error handling
- Better documentation

### v1.0 (Previous)
- Basic enhanced metrics
- Provider alerts and legislative updates
- Service categories and master data
- Initial compression system
