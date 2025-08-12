# 📊 Supabase Logging System Setup

## Overview
This system stores all admin operation logs in Supabase for persistent tracking and debugging.

## 🛠️ Setup Steps

### 1. Create the Database Table
Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of admin_logs_table.sql
```

### 2. Verify Table Creation
Check that the `admin_logs` table exists with these columns:
- `id` (Primary Key)
- `timestamp` (Timestamptz)
- `level` (VARCHAR - info/success/error/warn)
- `phase` (VARCHAR - connection/parse/insert/update/etc.)
- `message` (TEXT - Log message)
- `operation` (VARCHAR - billtrack/provider_alerts/etc.)
- `user_email` (VARCHAR - Who triggered the operation)
- `metadata` (JSONB - Additional structured data)

### 3. Configure Row Level Security (RLS)
The table includes RLS policies that only allow admin users to access logs.
Make sure your `admin_users` table is properly configured.

### 4. Test the System
1. Go to `/admin-dashboard/rate-developments/update-database`
2. Run a database update (billtrack or provider alerts)
3. Go to `/admin-dashboard/logs` to view the stored logs

## 📋 Features

### Automatic Logging
- All database update operations are automatically logged
- Logs include: timestamp, operation type, phase, message, user email
- Both successful operations and errors are tracked

### Log Viewing Dashboard
- Filter by: level, operation, phase, user
- Adjustable result limits (50-500 entries)
- Real-time log viewing
- Color-coded log levels

### API Endpoints
- `GET /api/admin/logs` - Retrieve logs with filtering
- `POST /api/admin/logs` - Store new log entry
- `DELETE /api/admin/logs` - Clean up old logs

## 🔍 Log Levels
- **info**: General information (connections, parsing, etc.)
- **success**: Successful operations (inserted/updated entries)
- **error**: Errors and failures
- **warn**: Warnings and potential issues

## 🎯 Usage Examples

### View Recent Errors
Filter by: Level = "error", Limit = 50

### Track Database Updates
Filter by: Operation = "billtrack"

### Debug Connection Issues
Filter by: Phase = "connection"

### Monitor User Activity
View all logs to see which admin users are performing operations

## 🧹 Maintenance

### Clean Up Old Logs
Use the DELETE endpoint with a `days` parameter:
```
DELETE /api/admin/logs?days=30
```
This removes logs older than 30 days.

### Performance
The table includes indexes on commonly queried columns:
- timestamp (for ordering)
- level (for filtering)
- operation (for filtering)
- phase (for filtering)
- user_email (for filtering)

## 🚀 Next Steps
The logging system is now ready! Every database update will be automatically logged to Supabase, and you can view them in the admin dashboard.
