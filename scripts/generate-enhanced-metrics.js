const { createClient } = require('@supabase/supabase-js');
const { gzipSync } = require('fflate');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
require('dotenv').config({ path: '.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file contains:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_SERVICE_ROLE=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to compress data
function compressData(data) {
  const jsonString = JSON.stringify(data);
  const compressed = gzipSync(Buffer.from(jsonString, 'utf8'));
  return compressed;
}

// Helper function to create mappings for compression
function createMappings(data, columnName) {
  const uniqueValues = [...new Set(data.map(row => row[columnName]).filter(Boolean))];
  const mappings = {};
  uniqueValues.forEach((value, index) => {
    mappings[value] = index;
  });
  return mappings;
}

// Helper function to compress column data
function compressColumn(data, columnName, mappings) {
  return data.map(row => {
    const value = row[columnName];
    return value && mappings[value] !== undefined ? mappings[value] : -1;
  });
}

// Helper function to compress array column data (for modifiers)
function compressArrayColumn(data, columnName, mappings) {
  return data.map(row => {
    const value = row[columnName];
    if (!value) return -1;
    
    if (Array.isArray(value)) {
      return value.map(v => v && mappings[v] !== undefined ? mappings[v] : -1);
    } else {
      return value && mappings[value] !== undefined ? mappings[value] : -1;
    }
  });
}

async function generateEnhancedMetrics() {
  try {
    console.log('🚀 Starting enhanced metrics generation...');
    
    // Fetch data from all tables
    console.log('📊 Fetching provider alerts...');
    const { data: providerAlerts, error: alertsError } = await supabase
      .from('provider_alerts')
      .select('*');
    
    if (alertsError) {
      console.error('❌ Error fetching provider alerts:', alertsError);
      return;
    }
    
    console.log('📊 Fetching legislative updates...');
    const { data: legislativeUpdates, error: updatesError } = await supabase
      .from('bill_track_50')
      .select('*');
    
    if (updatesError) {
      console.error('❌ Error fetching legislative updates:', updatesError);
      return;
    }
    
    console.log('📊 Fetching service categories...');
    const { data: serviceCategories, error: categoriesError } = await supabase
      .from('service_category_list')
      .select('*');
    
    if (categoriesError) {
      console.error('❌ Error fetching service categories:', categoriesError);
      return;
    }
    
    console.log('📊 Fetching master data...');
    const { data: masterData, error: masterError } = await supabase
      .from('master_data_sept_2')
      .select('*');
    
    if (masterError) {
      console.error('❌ Error fetching master data:', masterError);
      return;
    }
    
    console.log('✅ All data fetched successfully');
    console.log(`📈 Provider Alerts: ${providerAlerts.length} records`);
    console.log(`📈 Legislative Updates: ${legislativeUpdates.length} records`);
    console.log(`📈 Service Categories: ${serviceCategories.length} records`);
    console.log(`📈 Master Data: ${masterData.length} records`);
    
    // Process recent rate changes from master data
    console.log('🔄 Processing recent rate changes...');
    const recentRateChanges = processRecentRateChanges(masterData);
    console.log(`📈 Recent Rate Changes: ${recentRateChanges.length} records`);
    
    // Create enhanced metrics structure
    const enhancedMetrics = {
      // Provider Alerts
      provider_alerts: {
        m: {},
        v: {},
        c: [],
        total_records: providerAlerts.length
      },
      
      // Legislative Updates
      legislative_updates: {
        m: {},
        v: {},
        c: [],
        total_records: legislativeUpdates.length
      },
      
      // Service Categories
      service_categories: {
        m: {},
        v: {},
        c: [],
        total_records: serviceCategories.length
      },
      
      // Master Data
      master_data: {
        m: {},
        v: {},
        c: [],
        total_records: masterData.length
      },
      
      // Recent Rate Changes
      recent_rate_changes: {
        m: {},
        v: {},
        c: [],
        total_records: recentRateChanges.length
      },
      
      // Summary statistics
      summary: {
        totalProviderAlerts: providerAlerts.length,
        totalLegislativeUpdates: legislativeUpdates.length,
        totalServiceCategories: serviceCategories.length,
        totalMasterDataRecords: masterData.length,
        totalRecentRateChanges: recentRateChanges.length,
        newProviderAlerts: providerAlerts.filter(alert => alert.is_new === 'yes').length,
        newLegislativeUpdates: legislativeUpdates.filter(update => update.is_new === 'yes').length,
        lastUpdated: new Date().toISOString(),
        dataVersion: '2.0',
        description: 'Enhanced metrics including provider alerts, legislative updates, service categories, master data, and recent rate changes'
      },
      
      // Metadata
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0',
        description: 'Enhanced metrics with all admin data combined',
        tables: ['provider_alerts', 'bill_track_50', 'service_category_list', 'master_data_sept_2'],
        compressionRatio: 'N/A'
      }
    };
    
    // Process provider alerts
    if (providerAlerts.length > 0) {
      const alertColumns = Object.keys(providerAlerts[0]);
      enhancedMetrics.provider_alerts.c = alertColumns;
      
      alertColumns.forEach(column => {
        const mappings = createMappings(providerAlerts, column);
        enhancedMetrics.provider_alerts.m[column] = mappings;
        enhancedMetrics.provider_alerts.v[column] = compressColumn(providerAlerts, column, mappings);
      });
    }
    
    // Process legislative updates
    if (legislativeUpdates.length > 0) {
      const updateColumns = Object.keys(legislativeUpdates[0]);
      enhancedMetrics.legislative_updates.c = updateColumns;
      
      updateColumns.forEach(column => {
        const mappings = createMappings(legislativeUpdates, column);
        enhancedMetrics.legislative_updates.m[column] = mappings;
        enhancedMetrics.legislative_updates.v[column] = compressColumn(legislativeUpdates, column, mappings);
      });
    }
    
    // Process service categories
    if (serviceCategories.length > 0) {
      const categoryColumns = Object.keys(serviceCategories[0]);
      enhancedMetrics.service_categories.c = categoryColumns;
      
      categoryColumns.forEach(column => {
        const mappings = createMappings(serviceCategories, column);
        enhancedMetrics.service_categories.m[column] = mappings;
        enhancedMetrics.service_categories.v[column] = compressColumn(serviceCategories, column, mappings);
      });
    }
    
    // Process master data
    if (masterData.length > 0) {
      const masterColumns = Object.keys(masterData[0]);
      enhancedMetrics.master_data.c = masterColumns;
      
      masterColumns.forEach(column => {
        const mappings = createMappings(masterData, column);
        enhancedMetrics.master_data.m[column] = mappings;
        
        // Handle array columns (modifiers)
        if (column.startsWith('modifier_') && column !== 'modifier_1_details' && column !== 'modifier_2_details' && column !== 'modifier_3_details' && column !== 'modifier_4_details') {
          enhancedMetrics.master_data.v[column] = compressArrayColumn(masterData, column, mappings);
        } else {
          enhancedMetrics.master_data.v[column] = compressColumn(masterData, column, mappings);
        }
      });
    }
    
    // Process recent rate changes
    if (recentRateChanges.length > 0) {
      const changeColumns = Object.keys(recentRateChanges[0]);
      enhancedMetrics.recent_rate_changes.c = changeColumns;
      
      changeColumns.forEach(column => {
        const mappings = createMappings(recentRateChanges, column);
        enhancedMetrics.recent_rate_changes.m[column] = mappings;
        
        // Handle array columns (modifiers)
        if (column === 'modifiers') {
          enhancedMetrics.recent_rate_changes.v[column] = compressArrayColumn(recentRateChanges, column, mappings);
        } else {
          enhancedMetrics.recent_rate_changes.v[column] = compressColumn(recentRateChanges, column, mappings);
        }
      });
    }
    
    // Compress the entire enhanced metrics object
    console.log('🗜️ Compressing enhanced metrics...');
    const compressed = compressData(enhancedMetrics);
    
    // Save to file
    const outputPath = path.join(process.cwd(), 'public', 'enhanced_metrics_detailed.json.gz');
    fs.writeFileSync(outputPath, compressed);
    
    // Calculate compression ratio
    const originalSize = JSON.stringify(enhancedMetrics).length;
    const compressedSize = compressed.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
    
    console.log('✅ Enhanced metrics generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📊 Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 Compressed size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 Compression ratio: ${compressionRatio}%`);
    
    // Update the compression ratio in the metadata
    enhancedMetrics.metadata.compressionRatio = `${compressionRatio}%`;
    
  } catch (error) {
    console.error('❌ Error generating enhanced metrics:', error);
    process.exit(1);
  }
}

// Function to process recent rate changes from master data
function processRecentRateChanges(masterData) {
  const changes = [];
  
  // Group records by service code and state
  const groupedRecords = masterData.reduce((acc, record) => {
    const key = `${record.service_code}-${record.state_name}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(record);
    return acc;
  }, {});
  
  // Process each group to find rate changes
  Object.values(groupedRecords).forEach(records => {
    if (records.length < 2) return; // Need at least 2 records to show a change
    
    // Sort by effective date
    const sortedRecords = records.sort((a, b) => {
      const dateA = new Date(a.rate_effective_date || '');
      const dateB = new Date(b.rate_effective_date || '');
      return dateA.getTime() - dateB.getTime();
    });
    
    // Compare consecutive records
    for (let i = 1; i < sortedRecords.length; i++) {
      const oldRecord = sortedRecords[i - 1];
      const newRecord = sortedRecords[i];
      
      if (oldRecord.rate && newRecord.rate && oldRecord.rate !== newRecord.rate) {
        const oldRate = parseFloat(oldRecord.rate.replace(/[^0-9.-]/g, '')) || 0;
        const newRate = parseFloat(newRecord.rate.replace(/[^0-9.-]/g, '')) || 0;
        const percentageChange = oldRate > 0 ? ((newRate - oldRate) / oldRate) * 100 : 0;
        
        const modifiers = [
          oldRecord.modifier_1,
          oldRecord.modifier_2,
          oldRecord.modifier_3,
          oldRecord.modifier_4
        ].filter(Boolean);
        
        changes.push({
          service_code: oldRecord.service_code || '',
          service_description: oldRecord.service_description || '',
          state_name: oldRecord.state_name || '',
          service_category: oldRecord.service_category || '',
          old_rate: oldRecord.rate || '',
          new_rate: newRecord.rate || '',
          percentage_change: percentageChange.toFixed(2),
          effective_date: newRecord.rate_effective_date || '',
          modifiers: modifiers,
          provider_type: oldRecord.provider_type || '',
          program: oldRecord.program || '',
          location_region: oldRecord.location_region || '',
          duration_unit: oldRecord.duration_unit || ''
        });
      }
    }
  });
  
  return changes;
}

// Run the script
generateEnhancedMetrics();
