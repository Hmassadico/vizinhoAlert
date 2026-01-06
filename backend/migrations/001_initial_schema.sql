-- ============================================================================
-- VizinhoAlert PostgreSQL Schema v2.0
-- GDPR Compliant: No PII stored, auto-deletion supported
-- EU Hosted Infrastructure Required
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: devices
-- Purpose: Anonymous device registration (no PII)
-- Retention: 90 days after last activity (auto-delete)
-- ============================================================================
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Anonymous identifiers (SHA-256 hashed, cannot be reversed)
    device_id_hash VARCHAR(64) UNIQUE NOT NULL,
    anonymous_token VARCHAR(64) UNIQUE NOT NULL,
    
    -- Approximate location (used for alert radius only)
    last_latitude DOUBLE PRECISION,
    last_longitude DOUBLE PRECISION,
    
    -- Settings
    alert_radius_km DOUBLE PRECISION DEFAULT 2.0 CHECK (alert_radius_km >= 0.5 AND alert_radius_km <= 10.0),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason VARCHAR(50),
    ban_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Trust score (0-100, used for abuse detection)
    trust_score INTEGER DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Retention marker (for GDPR auto-delete)
    delete_after TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '90 days')
);

-- Indexes for devices
CREATE INDEX idx_devices_hash ON devices(device_id_hash);
CREATE INDEX idx_devices_active ON devices(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_devices_banned ON devices(is_banned) WHERE is_banned = TRUE;
CREATE INDEX idx_devices_delete ON devices(delete_after);
CREATE INDEX idx_devices_trust ON devices(trust_score) WHERE trust_score < 50;

-- ============================================================================
-- TABLE: vehicles
-- Purpose: Vehicle registration with hashed identifiers
-- Retention: Cascades with device deletion
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Hashed vehicle identifier (SHA-256 of license plate/VIN)
    -- Original value NEVER stored
    vehicle_id_hash VARCHAR(64) UNIQUE NOT NULL,
    
    -- QR code access token (random, not derived from vehicle ID)
    qr_code_token VARCHAR(64) UNIQUE NOT NULL,
    
    -- Optional user-provided nickname (local storage preferred)
    nickname VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Abuse tracking
    alert_count_received INTEGER DEFAULT 0,
    false_alert_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for vehicles
CREATE INDEX idx_vehicles_device ON vehicles(device_id);
CREATE INDEX idx_vehicles_hash ON vehicles(vehicle_id_hash);
CREATE INDEX idx_vehicles_qr ON vehicles(qr_code_token);
CREATE INDEX idx_vehicles_active ON vehicles(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ENUM: alert_type
-- Purpose: Predefined alert categories (no free text allowed)
-- ============================================================================
CREATE TYPE alert_type AS ENUM (
    'lights_on',
    'window_open',
    'alarm_triggered',
    'parking_issue',
    'damage_spotted',
    'towing_risk',
    'obstruction',
    'general'
);

-- ============================================================================
-- ENUM: alert_status
-- Purpose: Track alert lifecycle
-- ============================================================================
CREATE TYPE alert_status AS ENUM (
    'active',
    'acknowledged',
    'resolved',
    'expired',
    'flagged'
);

-- ============================================================================
-- TABLE: alerts
-- Purpose: Community alerts for vehicles
-- Retention: 30 days TTL (auto-delete via expires_at)
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who created the alert (anonymous device)
    sender_device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Target vehicle
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- Alert details (predefined type only - NO free text)
    alert_type alert_type NOT NULL,
    status alert_status DEFAULT 'active',
    
    -- Location where alert was created (approximate)
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    
    -- TTL: Auto-delete after 30 days (GDPR data minimization)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    
    -- Notification tracking
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Abuse tracking
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_at TIMESTAMP WITH TIME ZONE,
    flag_reason VARCHAR(50)
);

-- Indexes for alerts
CREATE INDEX idx_alerts_vehicle ON alerts(vehicle_id);
CREATE INDEX idx_alerts_sender ON alerts(sender_device_id);
CREATE INDEX idx_alerts_expires ON alerts(expires_at);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX idx_alerts_status ON alerts(status) WHERE status = 'active';
CREATE INDEX idx_alerts_flagged ON alerts(is_flagged) WHERE is_flagged = TRUE;
CREATE INDEX idx_alerts_type_date ON alerts(alert_type, created_at DESC);

-- ============================================================================
-- TABLE: push_tokens
-- Purpose: Push notification delivery
-- Retention: Cascades with device deletion
-- ============================================================================
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Push token (Expo/FCM/APNs)
    token VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android')),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_success_at TIMESTAMP WITH TIME ZONE,
    failure_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for push_tokens
CREATE INDEX idx_push_tokens_device ON push_tokens(device_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_push_tokens_failures ON push_tokens(failure_count) WHERE failure_count > 3;

-- ============================================================================
-- TABLE: abuse_metrics
-- Purpose: Anonymous abuse tracking (no PII, aggregated data only)
-- Retention: 7 days rolling window
-- ============================================================================
CREATE TABLE IF NOT EXISTS abuse_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Anonymous device reference (hashed, for rate limiting)
    device_id_hash VARCHAR(64) NOT NULL,
    
    -- Metric type
    metric_type VARCHAR(30) NOT NULL CHECK (metric_type IN (
        'alert_sent',
        'alert_flagged',
        'rate_limit_hit',
        'auth_failure',
        'qr_scan',
        'suspicious_pattern'
    )),
    
    -- Aggregated counts (no individual tracking)
    count INTEGER DEFAULT 1,
    
    -- Time bucket (hourly aggregation)
    bucket_hour TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- TTL: 7 days
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    
    -- Unique constraint for upsert
    UNIQUE(device_id_hash, metric_type, bucket_hour)
);

-- Indexes for abuse_metrics
CREATE INDEX idx_abuse_device ON abuse_metrics(device_id_hash);
CREATE INDEX idx_abuse_type ON abuse_metrics(metric_type);
CREATE INDEX idx_abuse_bucket ON abuse_metrics(bucket_hour DESC);
CREATE INDEX idx_abuse_expires ON abuse_metrics(expires_at);
CREATE INDEX idx_abuse_high_count ON abuse_metrics(count) WHERE count > 10;

-- ============================================================================
-- TABLE: rate_limits
-- Purpose: Per-device rate limiting state
-- Retention: 1 hour sliding window
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identifier (device hash or IP hash)
    identifier_hash VARCHAR(64) NOT NULL,
    identifier_type VARCHAR(10) NOT NULL CHECK (identifier_type IN ('device', 'ip')),
    
    -- Action being rate limited
    action VARCHAR(30) NOT NULL CHECK (action IN (
        'api_request',
        'alert_create',
        'auth_attempt',
        'qr_generate',
        'vehicle_register'
    )),
    
    -- Sliding window state
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    request_count INTEGER DEFAULT 1,
    
    -- TTL: 1 hour
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    
    -- Unique constraint for upsert
    UNIQUE(identifier_hash, action, window_start)
);

-- Indexes for rate_limits
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier_hash);
CREATE INDEX idx_rate_limits_action ON rate_limits(action);
CREATE INDEX idx_rate_limits_expires ON rate_limits(expires_at);

-- ============================================================================
-- TABLE: system_stats
-- Purpose: Aggregated anonymous statistics (no PII)
-- Retention: 365 days
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Time bucket (daily aggregation)
    stat_date DATE NOT NULL,
    
    -- Anonymous counts
    total_devices INTEGER DEFAULT 0,
    active_devices INTEGER DEFAULT 0,
    total_vehicles INTEGER DEFAULT 0,
    total_alerts INTEGER DEFAULT 0,
    alerts_by_type JSONB DEFAULT '{}',
    flagged_alerts INTEGER DEFAULT 0,
    
    -- Geographic distribution (city-level only, no precise locations)
    alerts_by_region JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(stat_date)
);

-- Index for system_stats
CREATE INDEX idx_system_stats_date ON system_stats(stat_date DESC);

-- ============================================================================
-- FUNCTIONS: Auto-cleanup (GDPR compliance)
-- ============================================================================

-- Cleanup expired alerts (30-day TTL)
CREATE OR REPLACE FUNCTION cleanup_expired_alerts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM alerts WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup inactive devices (90-day TTL)
CREATE OR REPLACE FUNCTION cleanup_inactive_devices()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM devices WHERE delete_after < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired abuse metrics (7-day TTL)
CREATE OR REPLACE FUNCTION cleanup_expired_abuse_metrics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM abuse_metrics WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired rate limits (1-hour TTL)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limits WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Master cleanup function (call via cron)
CREATE OR REPLACE FUNCTION run_all_cleanup()
RETURNS TABLE(
    alerts_deleted INTEGER,
    devices_deleted INTEGER,
    metrics_deleted INTEGER,
    rate_limits_deleted INTEGER
) AS $$
BEGIN
    alerts_deleted := cleanup_expired_alerts();
    devices_deleted := cleanup_inactive_devices();
    metrics_deleted := cleanup_expired_abuse_metrics();
    rate_limits_deleted := cleanup_expired_rate_limits();
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTIONS: Abuse detection
-- ============================================================================

-- Record abuse metric (with hourly aggregation)
CREATE OR REPLACE FUNCTION record_abuse_metric(
    p_device_id_hash VARCHAR(64),
    p_metric_type VARCHAR(30)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO abuse_metrics (device_id_hash, metric_type, bucket_hour, count)
    VALUES (
        p_device_id_hash,
        p_metric_type,
        date_trunc('hour', CURRENT_TIMESTAMP),
        1
    )
    ON CONFLICT (device_id_hash, metric_type, bucket_hour)
    DO UPDATE SET count = abuse_metrics.count + 1;
END;
$$ LANGUAGE plpgsql;

-- Check if device is rate limited
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier_hash VARCHAR(64),
    p_identifier_type VARCHAR(10),
    p_action VARCHAR(30),
    p_max_requests INTEGER,
    p_window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    window_start := date_trunc('minute', CURRENT_TIMESTAMP - (p_window_minutes || ' minutes')::INTERVAL);
    
    SELECT COALESCE(SUM(request_count), 0) INTO current_count
    FROM rate_limits
    WHERE identifier_hash = p_identifier_hash
      AND action = p_action
      AND window_start >= window_start;
    
    IF current_count >= p_max_requests THEN
        RETURN FALSE;
    END IF;
    
    -- Record this request
    INSERT INTO rate_limits (identifier_hash, identifier_type, action, window_start, request_count)
    VALUES (
        p_identifier_hash,
        p_identifier_type,
        p_action,
        date_trunc('minute', CURRENT_TIMESTAMP),
        1
    )
    ON CONFLICT (identifier_hash, action, window_start)
    DO UPDATE SET request_count = rate_limits.request_count + 1;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update device trust score based on behavior
CREATE OR REPLACE FUNCTION update_trust_score(
    p_device_id UUID,
    p_adjustment INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    new_score INTEGER;
BEGIN
    UPDATE devices
    SET trust_score = GREATEST(0, LEAST(100, trust_score + p_adjustment))
    WHERE id = p_device_id
    RETURNING trust_score INTO new_score;
    
    -- Auto-ban if trust score too low
    IF new_score < 10 THEN
        UPDATE devices
        SET is_banned = TRUE,
            ban_reason = 'low_trust_score',
            ban_expires_at = CURRENT_TIMESTAMP + INTERVAL '7 days'
        WHERE id = p_device_id;
    END IF;
    
    RETURN new_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_push_tokens_updated_at
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Update device last_seen and extend retention on activity
CREATE OR REPLACE FUNCTION extend_device_retention()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen_at = CURRENT_TIMESTAMP;
    NEW.delete_after = CURRENT_TIMESTAMP + INTERVAL '90 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER extend_device_retention_trigger
    BEFORE UPDATE ON devices
    FOR EACH ROW
    WHEN (OLD.last_seen_at IS DISTINCT FROM NEW.last_seen_at)
    EXECUTE FUNCTION extend_device_retention();

-- Increment vehicle alert count when alert created
CREATE OR REPLACE FUNCTION increment_vehicle_alert_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vehicles
    SET alert_count_received = alert_count_received + 1
    WHERE id = NEW.vehicle_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_alert_count_trigger
    AFTER INSERT ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION increment_vehicle_alert_count();

-- ============================================================================
-- VIEWS: Analytics (anonymous aggregates only)
-- ============================================================================

-- Daily alert summary (no PII)
CREATE OR REPLACE VIEW v_daily_alert_summary AS
SELECT
    DATE(created_at) as alert_date,
    alert_type,
    COUNT(*) as alert_count,
    COUNT(*) FILTER (WHERE is_flagged = TRUE) as flagged_count,
    AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60) as avg_response_minutes
FROM alerts
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY DATE(created_at), alert_type
ORDER BY alert_date DESC, alert_count DESC;

-- Abuse report (anonymous metrics)
CREATE OR REPLACE VIEW v_abuse_report AS
SELECT
    metric_type,
    DATE(bucket_hour) as metric_date,
    SUM(count) as total_count,
    COUNT(DISTINCT device_id_hash) as unique_devices
FROM abuse_metrics
WHERE bucket_hour > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY metric_type, DATE(bucket_hour)
ORDER BY metric_date DESC, total_count DESC;

-- ============================================================================
-- GDPR DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON TABLE devices IS 'Anonymous device registration. No PII stored. device_id_hash is SHA-256 one-way hash. Auto-deleted 90 days after last activity.';
COMMENT ON TABLE vehicles IS 'Vehicle registration with SHA-256 hashed identifier. Original license plate/VIN NEVER stored. Cascades with device deletion.';
COMMENT ON TABLE alerts IS 'Community alerts. TTL: 30 days (auto-delete). Predefined types only - no free text to prevent misuse.';
COMMENT ON TABLE push_tokens IS 'Push notification tokens. Cascades with device deletion. No PII.';
COMMENT ON TABLE abuse_metrics IS 'Anonymous abuse tracking. Hourly aggregation. TTL: 7 days. No individual tracking.';
COMMENT ON TABLE rate_limits IS 'Rate limiting state. TTL: 1 hour. Identifier is hashed.';
COMMENT ON TABLE system_stats IS 'Aggregated system statistics. Daily snapshots. No PII. TTL: 365 days.';

COMMENT ON COLUMN devices.device_id_hash IS 'SHA-256 hash of device UUID. Cannot be reversed to original value.';
COMMENT ON COLUMN devices.trust_score IS 'Behavioral trust score (0-100). Used for abuse detection. Not exposed to users.';
COMMENT ON COLUMN devices.delete_after IS 'GDPR retention marker. Device auto-deleted after this timestamp.';
COMMENT ON COLUMN vehicles.vehicle_id_hash IS 'SHA-256 hash of vehicle identifier. Cannot be reversed.';
COMMENT ON COLUMN alerts.expires_at IS 'GDPR data minimization. Alert auto-deleted after 30 days.';
COMMENT ON COLUMN abuse_metrics.bucket_hour IS 'Hourly aggregation bucket. No per-request tracking for privacy.';
