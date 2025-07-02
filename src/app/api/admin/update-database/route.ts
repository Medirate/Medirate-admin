import { NextRequest, NextResponse } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";
import * as XLSX from "xlsx";
import { createClient } from '@supabase/supabase-js';

// Helper to get env vars safely
function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

// Helper to get file name for a given date (MMYY Medicaid Rates bill sheet with categories.xlsx)
function getFileNameForDate(date: Date): string {
  const month = date.toLocaleString("en-US", { month: "2-digit" });
  const year = date.toLocaleString("en-US", { year: "2-digit" });
  return `${month}${year} Medicaid Rates bill sheet with categories.xlsx`;
}

// Find the latest available file in Azure Blob Storage (up to 12 months back)
async function findLatestFile(blobServiceClient: BlobServiceClient, containerName: string): Promise<string> {
  let currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const fileName = getFileNameForDate(currentDate);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(fileName);
    const exists = await blobClient.exists();
    if (exists) return fileName;
    // Go to previous month
    currentDate.setMonth(currentDate.getMonth() - 1);
  }
  throw new Error("No available files found in the last 12 months");
}

// Helper to read a Node.js Readable stream into a Buffer
async function toBufferFromStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const logs: { message: string; type: string; phase: string }[] = [];
  function log(message: string, type: string = 'info', phase: string = 'general') {
    logs.push({ message, type, phase });
  }
  try {
    // Get env vars
    const AZURE_CONNECTION_STRING = getEnv("AZURE_CONNECTION_STRING");
    const CONTAINER_NAME = getEnv("CONTAINER_NAME");
    const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE = getEnv("SUPABASE_SERVICE_ROLE");

    // Get type param (default to 'billtrack')
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'billtrack';

    log('Connecting to Azure Blob Storage...', 'info', 'connection');
    // Connect to Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    log('Azure Blob Storage connection successful.', 'success', 'connection');

    // Find the latest file
    log('Searching for latest Excel file in Azure Blob Storage...', 'info', 'download');
    const fileName = await findLatestFile(blobServiceClient, CONTAINER_NAME);
    log(`Found file: ${fileName}`, 'success', 'download');

    // Download the file to memory
    log('Downloading file from Azure Blob Storage...', 'info', 'download');
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blobClient = containerClient.getBlobClient(fileName);
    const downloadBlockBlobResponse = await blobClient.download();
    const stream = downloadBlockBlobResponse.readableStreamBody;
    if (!stream) throw new Error("Failed to get file stream from blob");
    const buffer = await toBufferFromStream(stream as any);
    const fileSize = buffer.length;
    log(`Downloaded file (${fileSize} bytes)`, 'success', 'download');

    // Parse the Excel file
    log('Parsing Excel file...', 'info', 'parse');
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const allSheetNames = workbook.SheetNames;
    // Filter sheets matching MMDDYY (6 digits)
    const dateSheets = allSheetNames.filter(name => /^\d{6}$/.test(name));
    if (dateSheets.length === 0) throw new Error("No sheets found in MMDDYY format");
    // Sort descending (latest first)
    dateSheets.sort((a, b) => b.localeCompare(a));
    const latestSheet = dateSheets[0];
    log(`Using latest sheet: ${latestSheet}`, 'success', 'parse');

    // Read the latest sheet
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[latestSheet], { defval: "" });
    // Lowercase and trim column names
    const rows = rawRows.map((row: any) => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        newRow[key.trim().toLowerCase()] = row[key];
      });
      return newRow;
    });
    // Map Excel columns to DB columns
    const columnMap: Record<string, string> = {
      'action date': 'action_date',
      'bill number': 'bill_number',
      'ai summary': 'ai_summary',
      'bill progress': 'bill_progress',
      'last action': 'last_action',
      'sponsor list': 'sponsor_list',
      'service lines impacted': 'service_lines_impacted',
      'service lines impacted 1': 'service_lines_impacted_1',
      'service lines impacted 2': 'service_lines_impacted_2',
      'service lines impacted 3': 'service_lines_impacted_3',
    };
    function mapToDbColumns(obj: any) {
      const mapped: any = {};
      for (const key in obj) {
        if (columnMap[key]) {
          mapped[columnMap[key]] = obj[key];
        } else {
          mapped[key] = obj[key];
        }
      }
      return mapped;
    }
    // Add source_sheet column
    rows.forEach(r => (r.source_sheet = latestSheet));
    // Remove rows where url contains '** Data provided by www.BillTrack50.com **'
    const filteredRows = rows.filter(r =>
      !(typeof r.url === "string" && r.url.includes("** Data provided by www.BillTrack50.com **"))
    ).map(mapToDbColumns);
    // Get columns
    const columns = filteredRows.length > 0 ? Object.keys(filteredRows[0]) : [];
    log(`Parsed ${filteredRows.length} rows from sheet.`, 'success', 'parse');

    // --- Supabase client ---
    log('Connecting to Supabase...', 'info', 'connection');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    log('Supabase connection successful.', 'success', 'connection');

    if (type === 'billtrack') {
      // 1. Reset all is_new flags to 'no' in both tables
      log('Resetting is_new flags in bill_track_50...', 'info', 'reset');
      await supabase.from('bill_track_50').update({ is_new: 'no' }).neq('is_new', 'no');
      log('Resetting is_new flags in provider_alerts...', 'info', 'reset');
      await supabase.from('provider_alerts').update({ is_new: 'no' }).neq('is_new', 'no');
      log('is_new flags reset in both tables.', 'success', 'reset');

      // 2. Fetch all rows from bill_track_50
      log('Fetching all rows from bill_track_50...', 'info', 'fetch');
      const { data: dbRows, error: dbError } = await supabase.from('bill_track_50').select('*');
      if (dbError) {
        log(`Supabase fetch error: ${dbError.message}`, 'error', 'fetch');
        throw new Error(`Supabase fetch error: ${dbError.message}`);
      }
      log(`Fetched ${dbRows?.length || 0} rows from bill_track_50.`, 'success', 'fetch');
      const dbRowsClean = (dbRows || []).map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          newRow[key.trim().toLowerCase()] = row[key];
        });
        return newRow;
      });
      const dbByUrl = new Map<string, any>();
      dbRowsClean.forEach(r => {
        if (r.url) dbByUrl.set(r.url, r);
      });
      // 3. Insert new entries
      const today = new Date().toISOString().slice(0, 10);
      const newEntries = filteredRows.filter(r => r.url && !dbByUrl.has(r.url));
      let inserted = [];
      for (const entry of newEntries) {
        const insertObj = { ...entry, is_new: 'yes', date_extracted: today };
        delete insertObj.source_sheet;
        const { data, error } = await supabase.from('bill_track_50').insert([insertObj]);
        if (!error) {
          inserted.push(insertObj);
          log(`Inserted new entry: ${insertObj.url}`, 'success', 'insert');
        } else {
          log(`Failed to insert: ${insertObj.url} - ${error.message}`, 'error', 'insert');
        }
      }
      log(`Inserted ${inserted.length} new entries.`, 'success', 'insert');
      // 4. Update changed entries
      const updated = [];
      for (const entry of filteredRows) {
        if (!entry.url || !dbByUrl.has(entry.url)) continue;
        const dbRow = dbByUrl.get(entry.url);
        let changed = false;
        const updateObj: any = {};
        for (const col of columns) {
          if (col === 'source_sheet') continue;
          if ((entry[col] ?? "") !== (dbRow[col] ?? "")) {
            updateObj[col] = entry[col];
            changed = true;
          }
        }
        if (changed) {
          updateObj.is_new = 'yes';
          updateObj.date_extracted = today;
          const { data, error } = await supabase.from('bill_track_50').update(updateObj).eq('url', entry.url);
          if (!error) {
            updated.push({ url: entry.url, ...updateObj });
            log(`Updated entry: ${entry.url}`, 'success', 'update');
          } else {
            log(`Failed to update: ${entry.url} - ${error.message}`, 'error', 'update');
          }
        }
      }
      log(`Updated ${updated.length} entries.`, 'success', 'update');
      return NextResponse.json({
        success: true,
        fileName,
        fileSize,
        latestSheet,
        insertedCount: inserted.length,
        updatedCount: updated.length,
        insertedPreview: inserted.slice(0, 5),
        updatedPreview: updated.slice(0, 5),
        logs,
        message: `Updated bill_track_50: ${inserted.length} inserted, ${updated.length} updated.`
      });
    }
    if (type === 'provider_alerts') {
      // 1. Reset is_new flags in provider_alerts and bill_track_50
      log('Resetting is_new flags in provider_alerts...', 'info', 'reset');
      await supabase.from('provider_alerts').update({ is_new: 'no' }).neq('is_new', 'no');
      log('Resetting is_new flags in bill_track_50...', 'info', 'reset');
      await supabase.from('bill_track_50').update({ is_new: 'no' }).neq('is_new', 'no');
      log('is_new flags reset in both tables.', 'success', 'reset');

      // 2. Download the provider alerts file (separate from bill track file)
      log('Downloading provider alerts file...', 'info', 'download');
      const providerFileName = "provideralerts_data.xlsx";
      const providerContainerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const providerBlobClient = providerContainerClient.getBlobClient(providerFileName);
      const providerDownloadResponse = await providerBlobClient.download();
      const providerStream = providerDownloadResponse.readableStreamBody;
      if (!providerStream) throw new Error("Failed to get provider alerts file stream from blob");
      const providerBuffer = await toBufferFromStream(providerStream as any);
      log(`Downloaded provider alerts file (${providerBuffer.length} bytes)`, 'success', 'download');

      // 3. Parse provider alerts Excel file
      log('Parsing provider alerts Excel file...', 'info', 'parse');
      const providerWorkbook = XLSX.read(providerBuffer, { type: "buffer" });
      const providerSheetName = 'provideralerts_data';
      if (!providerWorkbook.SheetNames.includes(providerSheetName)) {
        throw new Error(`Provider alerts sheet '${providerSheetName}' not found in file`);
      }
      log(`Using provider alerts sheet: ${providerSheetName}`, 'success', 'parse');
      
      const rawProviderRows = XLSX.utils.sheet_to_json(providerWorkbook.Sheets[providerSheetName], { defval: "" });
      // Lowercase and trim column names, replace spaces with underscores
      const providerRows = rawProviderRows.map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
          newRow[cleanKey] = row[key];
        });
        return newRow;
      });
      
      // Map Excel columns to DB columns for provider_alerts
      const providerColumnMap: Record<string, string> = {
        'announcement_date': 'announcement_date',
        'subject': 'subject',
        'state': 'state',
        'links': 'links',
        'summary': 'summary',
        'service_lines_impacted': 'service_lines_impacted',
        'service_lines_impacted_1': 'service_lines_impacted_1',
        'service_lines_impacted_2': 'service_lines_impacted_2',
        'service_lines_impacted_3': 'service_lines_impacted_3'
      };
      
      function mapProviderToDbColumns(obj: any) {
        const mapped: any = {};
        for (const key in obj) {
          if (providerColumnMap[key]) {
            mapped[providerColumnMap[key]] = obj[key];
          } else {
            mapped[key] = obj[key];
          }
        }
        return mapped;
      }
      const mappedProviderRows = providerRows.map(mapProviderToDbColumns);
      log(`Parsed ${mappedProviderRows.length} rows from provider alerts sheet.`, 'success', 'parse');

      // 3. Fetch all rows from provider_alerts
      log('Fetching all rows from provider_alerts...', 'info', 'fetch');
      const { data: dbProviderRows, error: dbProviderError } = await supabase.from('provider_alerts').select('*');
      if (dbProviderError) {
        log(`Supabase fetch error: ${dbProviderError.message}`, 'error', 'fetch');
        throw new Error(`Supabase fetch error: ${dbProviderError.message}`);
      }
      log(`Fetched ${dbProviderRows?.length || 0} rows from provider_alerts.`, 'success', 'fetch');
      const dbProviderRowsClean = (dbProviderRows || []).map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          newRow[key.trim().toLowerCase()] = row[key];
        });
        return newRow;
      });
      const dbById = new Map<string, any>();
      dbProviderRowsClean.forEach(r => {
        if (r.id) dbById.set(r.id.toString(), r);
      });
      // 4. Insert new entries
      const today = new Date().toISOString().slice(0, 10);
      const newEntries = mappedProviderRows.filter(r => !r.id || !dbById.has(r.id.toString()));
      let inserted = [];
      for (const entry of newEntries) {
        const insertObj = { ...entry, is_new: 'yes', date_extracted: today };
        delete insertObj.id; // Remove id for new insertions
        const { data, error } = await supabase.from('provider_alerts').insert([insertObj]);
        if (!error) {
          inserted.push(insertObj);
          log(`Inserted new entry: ${insertObj.url || insertObj.subject || 'Unknown'}`, 'success', 'insert');
        } else {
          log(`Failed to insert: ${insertObj.url || insertObj.subject || 'Unknown'} - ${error.message}`, 'error', 'insert');
        }
      }
      log(`Inserted ${inserted.length} new entries.`, 'success', 'insert');
      // 5. Update changed entries
      const updated = [];
      const providerColumns = mappedProviderRows.length > 0 ? Object.keys(mappedProviderRows[0]) : [];
      for (const entry of mappedProviderRows) {
        if (!entry.id || !dbById.has(entry.id.toString())) continue;
        const dbRow = dbById.get(entry.id.toString());
        let changed = false;
        const updateObj: any = {};
        for (const col of providerColumns) {
          if (col === 'id') continue; // Skip id column for updates
          if ((entry[col] ?? "") !== (dbRow[col] ?? "")) {
            updateObj[col] = entry[col];
            changed = true;
          }
        }
        if (changed) {
          updateObj.is_new = 'yes';
          updateObj.date_extracted = today;
          const { data, error } = await supabase.from('provider_alerts').update(updateObj).eq('id', entry.id);
          if (!error) {
            updated.push({ id: entry.id, ...updateObj });
            log(`Updated entry: ${entry.id}`, 'success', 'update');
          } else {
            log(`Failed to update: ${entry.id} - ${error.message}`, 'error', 'update');
          }
        }
      }
      log(`Updated ${updated.length} entries.`, 'success', 'update');
      return NextResponse.json({
        success: true,
        fileName: providerFileName,
        fileSize: providerBuffer.length,
        providerSheetName,
        insertedCount: inserted.length,
        updatedCount: updated.length,
        insertedPreview: inserted.slice(0, 5),
        updatedPreview: updated.slice(0, 5),
        logs,
        message: `Updated provider_alerts: ${inserted.length} inserted, ${updated.length} updated.`
      });
    }

    return NextResponse.json({
      success: false,
      logs,
      message: 'Unknown update type.'
    }, { status: 400 });
  } catch (error: any) {
    logs.push({ message: error.message, type: 'error', phase: 'error' });
    return NextResponse.json({ success: false, logs, error: error.message }, { status: 500 });
  }
} 