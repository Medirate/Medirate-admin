-- Alabama Development Table
CREATE TABLE alabama_dev (
    id SERIAL PRIMARY KEY,
    service_category TEXT,
    service_sub_category TEXT,
    state_id_pk TEXT,
    state_name TEXT,
    state_code TEXT,
    filename TEXT,
    page_number TEXT,
    service_id_pk TEXT,
    service_code TEXT,
    service_description TEXT,
    rate TEXT,
    rate_last_updated TEXT,
    rate_effective_date DATE,
    duration_unit TEXT,
    minutes TEXT,
    program TEXT,
    modifier_1 TEXT,
    modifier_1_details TEXT,
    modifier_2 TEXT,
    modifier_2_details TEXT,
    modifier_3 TEXT,
    modifier_3_details TEXT,
    modifier_4 TEXT,
    modifier_4_details TEXT,
    fee TEXT,
    max_fee TEXT,
    modifier_id_pk TEXT,
    service_id_fk TEXT,
    prior_auth_required TEXT,
    comments TEXT,
    location_region TEXT,
    update_id_pk TEXT,
    times_rate_updated TEXT,
    percentage_change TEXT,
    last_database_refresh TEXT,
    requires_pa TEXT,
    rate_per_hour TEXT,
    provider_type TEXT,
    age TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alabama Production Table (same structure as dev)
CREATE TABLE alabama_prod (
    id SERIAL PRIMARY KEY,
    service_category TEXT,
    service_sub_category TEXT,
    state_id_pk TEXT,
    state_name TEXT,
    state_code TEXT,
    filename TEXT,
    page_number TEXT,
    service_id_pk TEXT,
    service_code TEXT,
    service_description TEXT,
    rate TEXT,
    rate_last_updated TEXT,
    rate_effective_date DATE,
    duration_unit TEXT,
    minutes TEXT,
    program TEXT,
    modifier_1 TEXT,
    modifier_1_details TEXT,
    modifier_2 TEXT,
    modifier_2_details TEXT,
    modifier_3 TEXT,
    modifier_3_details TEXT,
    modifier_4 TEXT,
    modifier_4_details TEXT,
    fee TEXT,
    max_fee TEXT,
    modifier_id_pk TEXT,
    service_id_fk TEXT,
    prior_auth_required TEXT,
    comments TEXT,
    location_region TEXT,
    update_id_pk TEXT,
    times_rate_updated TEXT,
    percentage_change TEXT,
    last_database_refresh TEXT,
    requires_pa TEXT,
    rate_per_hour TEXT,
    provider_type TEXT,
    age TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_alabama_dev_service_code ON alabama_dev(service_code);
CREATE INDEX idx_alabama_dev_state_code ON alabama_dev(state_code);
CREATE INDEX idx_alabama_dev_rate_effective_date ON alabama_dev(rate_effective_date);

CREATE INDEX idx_alabama_prod_service_code ON alabama_prod(service_code);
CREATE INDEX idx_alabama_prod_state_code ON alabama_prod(state_code);
CREATE INDEX idx_alabama_prod_rate_effective_date ON alabama_prod(rate_effective_date);

-- Create a function to copy data from dev to prod
CREATE OR REPLACE FUNCTION push_alabama_to_production()
RETURNS VOID AS $$
BEGIN
    -- Clear production table
    DELETE FROM alabama_prod;
    
    -- Copy all data from dev to prod
    INSERT INTO alabama_prod (
        service_category, service_sub_category, state_id_pk, state_name, state_code,
        filename, page_number, service_id_pk, service_code, service_description,
        rate, rate_last_updated, rate_effective_date, duration_unit, minutes,
        program, modifier_1, modifier_1_details, modifier_2, modifier_2_details,
        modifier_3, modifier_3_details, modifier_4, modifier_4_details, fee, max_fee,
        modifier_id_pk, service_id_fk, prior_auth_required, comments, location_region,
        update_id_pk, times_rate_updated, percentage_change, last_database_refresh,
        requires_pa, rate_per_hour, provider_type, age, created_at, updated_at
    )
    SELECT 
        service_category, service_sub_category, state_id_pk, state_name, state_code,
        filename, page_number, service_id_pk, service_code, service_description,
        rate, rate_last_updated, rate_effective_date, duration_unit, minutes,
        program, modifier_1, modifier_1_details, modifier_2, modifier_2_details,
        modifier_3, modifier_3_details, modifier_4, modifier_4_details, fee, max_fee,
        modifier_id_pk, service_id_fk, prior_auth_required, comments, location_region,
        update_id_pk, times_rate_updated, percentage_change, last_database_refresh,
        requires_pa, rate_per_hour, provider_type, age, created_at, updated_at
    FROM alabama_dev;
END;
$$ LANGUAGE plpgsql;
