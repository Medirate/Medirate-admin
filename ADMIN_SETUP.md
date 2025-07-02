# Admin Dashboard Setup Guide

This guide will help you set up the admin dashboard with proper access control using Supabase.

## 1. Create the Admin Users Table

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `admin_users_table.sql` into the editor
4. Click **Run** to execute the SQL

### Option B: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

## 2. Add Your First Admin User

After creating the table, you need to add your first admin user. You can do this directly in the Supabase dashboard:

1. Go to **Table Editor** in your Supabase dashboard
2. Select the `admin_users` table
3. Click **Insert row**
4. Add your admin user with the following data:
   ```json
   {
     "email": "your-email@example.com",
     "role": "super_admin",
     "permissions": {"all": true},
     "is_active": true
   }
   ```

## 3. Test the Admin Access

1. Start your development server: `npm run dev`
2. Sign in with the email you added to the admin_users table
3. You should now see the "Admin Dashboard" option in the sidebar
4. Click on it to access the admin dashboard

## 4. Admin Dashboard Features

The admin dashboard includes:

- **User Management**: Manage user accounts and subscriptions
- **Analytics**: View system analytics and usage statistics
- **System Settings**: Configure system settings and integrations
- **Content Management**: Manage application content and data
- **Audit Logs**: View system audit logs and security events
- **Backup & Recovery**: Manage system backups and recovery

## 5. Security Features

### Row Level Security (RLS)
- The `admin_users` table has RLS enabled
- Users can only read their own admin record
- Service role has full access for API operations

### Access Control
- Only users in the `admin_users` table can access the admin dashboard
- Non-admin users are automatically redirected to the main dashboard
- The admin option only appears in the sidebar for authorized users

### API Protection
- All admin API endpoints require admin authentication
- Admin operations are logged and auditable

## 6. Managing Admin Users

### Add New Admin Users
```javascript
// Using the API endpoint
const response = await fetch('/api/admin-users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'new-admin@example.com',
    role: 'admin',
    permissions: { user_management: true, analytics: true }
  })
});
```

### Update Admin Users
```javascript
const response = await fetch('/api/admin-users', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 1,
    role: 'super_admin',
    permissions: { all: true },
    is_active: true
  })
});
```

### Remove Admin Users
```javascript
const response = await fetch('/api/admin-users?id=1', {
  method: 'DELETE'
});
```

## 7. Database Schema

The `admin_users` table has the following structure:

```sql
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(100) DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Fields:
- `id`: Unique identifier
- `email`: Admin user's email (must match Kinde authentication)
- `role`: Admin role (e.g., 'admin', 'super_admin', 'support_admin')
- `permissions`: JSON object with specific permissions
- `is_active`: Whether the admin account is active
- `created_at`: When the admin user was created
- `updated_at`: When the admin user was last updated

## 8. Troubleshooting

### Admin Dashboard Not Showing
1. Check that your email is in the `admin_users` table
2. Verify `is_active` is set to `true`
3. Check browser console for any errors
4. Ensure you're signed in with the correct email

### Access Denied Errors
1. Verify the `admin_users` table exists
2. Check that RLS policies are properly configured
3. Ensure your Supabase environment variables are correct

### API Errors
1. Check that `SUPABASE_SERVICE_ROLE` is set in your environment
2. Verify the API endpoints are accessible
3. Check server logs for detailed error messages

## 9. Environment Variables

Make sure you have these environment variables set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key
```

## 10. Next Steps

Once the admin dashboard is set up, you can:

1. Customize the admin tools and features
2. Add more granular permissions
3. Implement audit logging
4. Add admin user management interface
5. Create role-based access control
6. Add system monitoring and alerts

The admin dashboard is now ready to use! Only users added to the `admin_users` table will be able to see and access the admin features. 