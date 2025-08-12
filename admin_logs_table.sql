-- Create admin_logs table for storing system logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'success', 'error', 'warn')),
    phase VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    operation VARCHAR(100),
    user_email VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON admin_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_level ON admin_logs (level);
CREATE INDEX IF NOT EXISTS idx_admin_logs_operation ON admin_logs (operation);
CREATE INDEX IF NOT EXISTS idx_admin_logs_phase ON admin_logs (phase);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_email ON admin_logs (user_email);

-- Add row level security (RLS)
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin users to access logs
-- You'll need to adjust this based on your admin user setup
CREATE POLICY "Admin users can access logs" ON admin_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.email = auth.jwt() ->> 'email'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE admin_logs IS 'System logs for admin operations and debugging';
COMMENT ON COLUMN admin_logs.level IS 'Log level: info, success, error, warn';
COMMENT ON COLUMN admin_logs.phase IS 'Operation phase: connection, parse, insert, update, etc.';
COMMENT ON COLUMN admin_logs.message IS 'Log message content';
COMMENT ON COLUMN admin_logs.operation IS 'Operation type: billtrack, provider_alerts, etc.';
COMMENT ON COLUMN admin_logs.user_email IS 'Email of user who triggered the operation';
COMMENT ON COLUMN admin_logs.metadata IS 'Additional structured data as JSON';
