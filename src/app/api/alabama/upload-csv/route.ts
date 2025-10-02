import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRole } from '../../../../lib/supabase';

// Helper function to update progress
async function updateProgress(uploadId: string, progress: number, message: string, status: 'uploading' | 'completed' | 'error') {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/alabama/upload-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId, progress, message, status })
    });
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
}

// Helper function to parse CSV line properly handling quoted fields
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result.map(field => field.replace(/^"|"$/g, ''));
}

export async function POST(request: NextRequest) {
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log('📤 CSV Upload started');
    const supabase = getSupabaseServiceRole();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📁 File received: ${file.name}, size: ${file.size} bytes`);
    
    // Update progress: Reading file
    await updateProgress(uploadId, 10, 'Reading CSV file...', 'uploading');

    // Read CSV file
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must have at least a header and one data row' }, { status: 400 });
    }
    
    // Parse CSV headers
    const headers = parseCSVLine(lines[0]);
    
    console.log(`📊 Parsing ${lines.length - 1} data rows`);
    await updateProgress(uploadId, 20, 'Parsing CSV data...', 'uploading');
    
    // Clear existing dev data
    console.log('🗑️ Clearing existing dev data...');
    await updateProgress(uploadId, 30, 'Clearing existing data...', 'uploading');
    await supabase.from('alabama_dev').delete().neq('id', 0);
    
    // Parse and insert data
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = parseCSVLine(lines[i]);
        const record: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index] || '';
          
          // Skip the 'id' column - let the database auto-generate it
          if (header === 'id') {
            return;
          }
          
          // Handle rate_effective_date as DATE type, everything else as TEXT
          if (header === 'rate_effective_date') {
            record[header] = value ? new Date(value).toISOString().split('T')[0] : null;
          } else {
            record[header] = value || null;
          }
        });
        
        records.push(record);
      }
    }

    console.log(`📝 Parsed ${records.length} records`);
    await updateProgress(uploadId, 40, `Parsed ${records.length} records`, 'uploading');
    
    // Insert records in batches
    const batchSize = 100;
    const totalBatches = Math.ceil(records.length / batchSize);
    console.log(`💾 Inserting ${records.length} records in batches of ${batchSize}`);
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNumber = Math.floor(i/batchSize) + 1;
      const progress = 40 + (batchNumber / totalBatches) * 50; // 40% to 90%
      
      console.log(`📦 Inserting batch ${batchNumber}/${totalBatches} (${batch.length} records)`);
      await updateProgress(uploadId, Math.round(progress), `Inserting batch ${batchNumber}/${totalBatches}...`, 'uploading');
      
      const { error } = await supabase.from('alabama_dev').insert(batch);
      
      if (error) {
        console.error('❌ Error inserting batch:', error);
        await updateProgress(uploadId, 0, `Error: ${error.message}`, 'error');
        return NextResponse.json({ error: 'Failed to insert data' }, { status: 500 });
      }
    }

    console.log('✅ All records inserted successfully');
    await updateProgress(uploadId, 100, `Successfully uploaded ${records.length} records`, 'completed');
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully uploaded ${records.length} records to development table`,
      recordCount: records.length,
      uploadId
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process CSV file' }, { status: 500 });
  }
}
