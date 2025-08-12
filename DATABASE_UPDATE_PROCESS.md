# 🔄 **Database Update Process - Complete Breakdown**

## **Overview**
The database update process downloads Excel files from Azure Blob Storage, parses them, and updates/inserts data into Supabase tables. There are two main types of updates:

1. **BillTrack Update** (`?type=billtrack`) - Updates `bill_track_50` table
2. **Provider Alerts Update** (`?type=provider_alerts`) - Updates `provider_alerts` table

---

## **📋 BillTrack Update Process (Default)**

### **Phase 1: Connection & Download**
1. **Connect to Azure Blob Storage**
   - Uses `AZURE_CONNECTION_STRING` environment variable
   - Connects to container specified by `CONTAINER_NAME`

2. **Find Current File**
   - Searches for: `"Medicaid Rates bill sheet with categories.xlsx"`
   - This is a hardcoded filename - always the same file

3. **Download File**
   - Downloads the Excel file to memory as a buffer
   - Reports file size in bytes

### **Phase 2: Excel Parsing**
1. **Find Latest Sheet**
   - Looks for sheets named in MMDDYY format (6 digits)
   - Example: `080925` (August 9, 2025)
   - Sorts sheets and uses the latest date

2. **Parse Excel Data**
   - Converts sheet to JSON format
   - Cleans column names (lowercase, trim)
   - **Handles Multiple SERVICE Columns:**
     ```
     "service" → maps to "service_lines_impacted"
     "service 1" → maps to "service_lines_impacted_1"
     "service 2" → maps to "service_lines_impacted_2"
     "service 3" → maps to "service_lines_impacted_3"
     ```

3. **Column Mapping**
   - Maps Excel column names to database field names:
     ```
     'action date' → 'action_date'
     'bill number' → 'bill_number'
     'ai summary' → 'ai_summary'
     'bill progress' → 'bill_progress'
     'last action' → 'last_action'
     'sponsor list' → 'sponsor_list'
     ```

4. **Data Filtering**
   - Removes BillTrack50 footer rows
   - Adds `source_sheet` column with sheet name
   - Only processes rows with valid URLs

### **Phase 3: Database Operations**

#### **Step 1: Reset Flags**
```sql
-- Reset all existing entries to not be "new"
UPDATE bill_track_50 SET is_new = 'no' WHERE is_new != 'no';
UPDATE provider_alerts SET is_new = 'no' WHERE id IS NOT NULL;
```

#### **Step 2: Fetch Existing Data**
- Downloads ALL rows from `bill_track_50` table
- Creates a lookup map by URL: `Map<url, existing_row>`

#### **Step 3: Insert New Entries**
- **Identifies new entries:** Excel rows with URLs not in database
- **Filters columns:** Only inserts known database columns to prevent schema errors
- **Known columns:**
  ```
  'id', 'state', 'bill_number', 'name', 'last_action', 'action_date',
  'sponsor_list', 'bill_progress', 'url', 'ai_summary', 'is_new',
  'date_extracted', 'service_lines_impacted', 'service_lines_impacted_1',
  'service_lines_impacted_2', 'service_lines_impacted_3'
  ```
- **Marks as new:** Sets `is_new = 'yes'` and `date_extracted = today`

#### **Step 4: Update Changed Entries**
- **Compares:** Excel data vs existing database data
- **Protected fields:** Does NOT overwrite service line fields for existing entries
- **Updates if changed:** Any non-service field that differs
- **Marks as updated:** Sets `is_new = 'yes'` and `date_extracted = today`

---

## **📧 Provider Alerts Update Process**

### **Phase 1: Connection & Download**
1. **Reset Flags** (both tables)
2. **Download Different File:** `"provideralerts_data.xlsx"`

### **Phase 2: Excel Parsing**
1. **Uses specific sheet:** `'provideralerts_data'`
2. **Column mapping:**
   ```
   'announcement date' → 'announcement_date'
   All other fields map directly
   ```

### **Phase 3: Database Operations**
1. **Fetch existing data** from `provider_alerts` table
2. **Create lookup by ID:** `Map<id, existing_row>`
3. **Insert new entries only** (no updates for provider alerts)
4. **Batch insert** with duplicate detection

---

## **🚨 Current Issues & Debugging**

### **Issue 1: Entries Not Updating**
**Symptoms:** File has entries not in table, but no inserts/updates happening

**Possible Causes:**
1. **URL Mismatch:** Excel URLs don't match database URLs exactly
2. **Column Schema Errors:** Unknown columns causing insert failures
3. **Data Type Mismatches:** Excel data doesn't match expected database types
4. **Empty/Invalid Data:** Required fields are empty in Excel

### **Issue 2: Service Column Mapping**
**Problem:** Multiple "SERVICE" columns in Excel need to map to specific database fields

**Current Solution:**
- First "service" column → `service_lines_impacted`
- Second "service" column → `service_lines_impacted_1`
- And so on...

### **Issue 3: Protected Fields**
**Behavior:** For existing entries, service line fields are NOT overwritten
- This prevents losing manually curated service line data
- Only applies to updates, not new inserts

---

## **🔍 Debugging Steps**

### **1. Check Excel File Structure**
```bash
# Look at the terminal logs for:
[parse] Excel columns found: state, bill_number, service, service 1, ...
[parse] SERVICE columns detected: service, service 1, service 2
```

### **2. Check Database Comparison**
```bash
# Look for logs like:
[fetch] Fetched X rows from bill_track_50
[insert] Found Y new entries to insert
[update] Found Z entries to update
```

### **3. Check Column Filtering**
```bash
# Look for:
[insert] Skipping unknown column: some_column_name
[insert] Attempting to insert with columns: id, state, bill_number, ...
```

### **4. Check Individual Failures**
```bash
# Look for:
[insert] Failed to insert: https://... - Error message
[update] Failed to update: https://... - Error message
```

---

## **🛠️ Common Fixes**

### **Fix 1: Column Schema Mismatch**
- Add unknown columns to `knownColumns` array
- Or update Excel file to use expected column names

### **Fix 2: URL Mismatch**
- Check if Excel URLs have extra whitespace/formatting
- Ensure URL field is exactly the same in both Excel and database

### **Fix 3: Data Type Issues**
- Check if dates are in correct format
- Ensure numeric fields don't contain text
- Verify boolean fields use expected values

### **Fix 4: Missing Required Fields**
- Ensure all required database fields have values in Excel
- Check for NULL constraints in database schema

---

## **📊 Expected Output**

**Successful Run:**
```
[connection] Connecting to Azure Blob Storage...
[connection] Azure Blob Storage connection successful.
[download] Found file: Medicaid Rates bill sheet with categories.xlsx
[download] Downloaded file (433454 bytes)
[parse] Using latest sheet: 080925
[parse] Parsed 478 rows from sheet.
[parse] Excel columns found: state, bill_number, service, service 1, ...
[parse] SERVICE columns detected: service, service 1, service 2
[connection] Connecting to Supabase...
[connection] Supabase connection successful.
[reset] Resetting is_new flags in bill_track_50...
[reset] is_new flags reset in both tables.
[fetch] Fetching all rows from bill_track_50...
[fetch] Fetched 500 rows from bill_track_50.
[insert] Inserted new entry: https://www.billtrack50.com/billdetail/1234567
[insert] Inserted 15 new entries.
[update] Updated entry: https://www.billtrack50.com/billdetail/7654321
[update] Updated 8 entries.
```

This process ensures that:
- ✅ New bills are added with proper service line mapping
- ✅ Changed bills are updated while preserving existing service lines
- ✅ All entries are properly flagged as new/updated for email alerts
- ✅ Data integrity is maintained with proper column filtering
