import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { gunzip } from 'zlib';
import { promisify } from 'util';

const gunzipAsync = promisify(gunzip);

export async function GET(request: NextRequest) {
  try {
    // Path to the enhanced metrics file
    const filePath = path.join(process.cwd(), 'public', 'enhanced_metrics_detailed.json.gz');
    
    // Check if the enhanced file exists
    if (!fs.existsSync(filePath)) {
      // Fallback to the original metrics file
      const fallbackPath = path.join(process.cwd(), 'public', 'state_metrics_detailed.json.gz');
      
      if (!fs.existsSync(fallbackPath)) {
        return NextResponse.json(
          { error: 'No metrics data available' },
          { status: 404 }
        );
      }
      
      // Read and decompress the fallback file
      const compressedData = fs.readFileSync(fallbackPath);
      const decompressedData = await gunzipAsync(compressedData);
      const data = JSON.parse(decompressedData.toString());
      
      // Transform the data to match the recent rate changes format
      const transformedData = {
        m: data.m || {},
        v: data.v || {},
        total_records: data.t || 0,
        date_range: {
          earliest: data.earliest_date || '',
          latest: data.latest_date || ''
        },
        rate_range: {
          min: data.min_rate || 0,
          max: data.max_rate || 0
        },
        states: data.s || [],
        service_categories: data.service_categories || []
      };
      
      return NextResponse.json(transformedData);
    }
    
    // Read and decompress the enhanced metrics file
    const compressedData = fs.readFileSync(filePath);
    const decompressedData = await gunzipAsync(compressedData);
    const jsonString = decompressedData.toString();
    const enhancedData = JSON.parse(jsonString);
    
    // Extract recent rate changes data from the enhanced metrics
    // This assumes the enhanced metrics includes recent rate changes data
    const recentRateChangesData = {
      m: enhancedData.recent_rate_changes?.m || {},
      v: enhancedData.recent_rate_changes?.v || {},
      total_records: enhancedData.recent_rate_changes?.total_records || 0,
      date_range: {
        earliest: enhancedData.recent_rate_changes?.date_range?.earliest || '',
        latest: enhancedData.recent_rate_changes?.date_range?.latest || ''
      },
      rate_range: {
        min: enhancedData.recent_rate_changes?.rate_range?.min || 0,
        max: enhancedData.recent_rate_changes?.rate_range?.max || 0
      },
      states: enhancedData.recent_rate_changes?.states || [],
      service_categories: enhancedData.recent_rate_changes?.service_categories || []
    };
    
    return NextResponse.json(recentRateChangesData);
    
  } catch (error) {
    console.error('Error serving recent rate changes data:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to load recent rate changes data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
