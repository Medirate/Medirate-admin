import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Initialize Supabase Client
const supabase = createServiceClient();

// Helper function to parse rate from text
function parseRate(rateText: string): number {
  if (!rateText) return 0;
  
  // Remove $, spaces, and other non-numeric characters except decimal point and minus
  const cleaned = rateText.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

export async function GET(request: Request) {
  try {
    // Validate authentication
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    
    // Handle state averages mode for "All States" feature
    if (mode === "stateAverages") {
      const serviceCategory = searchParams.get("serviceCategory");
      const serviceCode = searchParams.get("serviceCode");
      const program = searchParams.get("program");
      const locationRegion = searchParams.get("locationRegion");
      const providerType = searchParams.get("providerType");
      const modifier = searchParams.get("modifier");
      const serviceDescription = searchParams.get("serviceDescription");
      const durationUnit = searchParams.get("durationUnit");
      const feeScheduleDate = searchParams.get("feeScheduleDate");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      
      if (!serviceCategory || !serviceCode) {
        return NextResponse.json({ error: "Service category and service code are required" }, { status: 400 });
      }

      // Build the query for state averages
      let query = supabase
        .from('master_data_july_7')
        .select('state_name, rate, duration_unit, rate_effective_date')
        .eq('service_category', serviceCategory)
        .eq('service_code', serviceCode);

      // Apply additional filters
      if (program && program !== '-') query = query.eq('program', program);
      if (locationRegion && locationRegion !== '-') query = query.eq('location_region', locationRegion);
      if (providerType && providerType !== '-') query = query.eq('provider_type', providerType);
      if (durationUnit && durationUnit !== '-') query = query.eq('duration_unit', durationUnit);
      if (serviceDescription && serviceDescription !== '-') query = query.eq('service_description', serviceDescription);
      
      if (modifier && modifier !== '-') {
        query = query.or(`modifier_1.eq.${modifier},modifier_2.eq.${modifier},modifier_3.eq.${modifier},modifier_4.eq.${modifier}`);
      }

      // Apply date filters
      if (feeScheduleDate) {
        query = query.eq('rate_effective_date', feeScheduleDate);
      } else if (startDate && endDate) {
        query = query.gte('rate_effective_date', startDate).lte('rate_effective_date', endDate);
      } else if (startDate) {
        query = query.gte('rate_effective_date', startDate);
      } else if (endDate) {
        query = query.lte('rate_effective_date', endDate);
      }

      // Fetch the data
      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Group by state and unique combination, then pick latest per combo
      const stateCombos: { [state: string]: { [combo: string]: any } } = {};
      data?.forEach((item: any) => {
        const state = item.state_name;
        // Build a unique key for the combination (excluding date and rate)
        const comboKey = [
          item.service_code,
          item.program,
          item.location_region,
          item.provider_type,
          item.duration_unit,
          item.service_description,
          item.modifier_1,
          item.modifier_2,
          item.modifier_3,
          item.modifier_4
        ].map(x => x ?? '').join('|');
        if (!stateCombos[state]) stateCombos[state] = {};
        const existing = stateCombos[state][comboKey];
        if (!existing || new Date(item.rate_effective_date) > new Date(existing.rate_effective_date)) {
          stateCombos[state][comboKey] = item;
        }
      });

      // For each state, average the latest rates for all combos
      const stateAverages = Object.entries(stateCombos).map(([state, combos]) => {
        const rates = Object.values(combos).map((item: any) => parseRate(item.rate)).filter((r: number) => r > 0);
        const avg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
        return {
          state_name: state,
          avg_rate: avg,
          count: rates.length
        };
      });

      return NextResponse.json({
        stateAverages,
        totalStates: stateAverages.length
      });
    }

    // Regular data fetching mode (existing logic)
    const getParam = (key: string) => searchParams.get(key) || searchParams.get(key.replace(/_/g, ''));
    const serviceCategory = getParam("service_category") || getParam("serviceCategory");
    const state = getParam("state_name") || getParam("state");
    const serviceCode = getParam("service_code") || getParam("serviceCode");
    const serviceDescription = getParam("service_description") || getParam("serviceDescription");
    const program = getParam("program");
    const locationRegion = getParam("location_region") || getParam("locationRegion");
    const providerType = getParam("provider_type") || getParam("providerType");
    const modifier = getParam("modifier_1") || getParam("modifier");
    const startDate = getParam("start_date") || getParam("startDate");
    const endDate = getParam("end_date") || getParam("endDate");
    const feeScheduleDate = getParam("fee_schedule_date") || getParam("feeScheduleDate");
    const page = parseInt(getParam("page") || "1");
    const itemsPerPage = parseInt(getParam("itemsPerPage") || "50");
    const sortParam = getParam("sort");

    // Build Supabase query
    let query = supabase.from('master_data_july_7').select('*', { count: 'exact' });
    if (serviceCategory) query = query.eq('service_category', serviceCategory);
    if (state) query = query.eq('state_name', state);
    if (serviceCode) query = query.eq('service_code', serviceCode);
    if (serviceDescription) query = query.eq('service_description', serviceDescription);
    
    // Handle secondary filters with "-" option for empty values and multi-select support
    if (program) {
      if (program === '-') {
        query = query.or('program.is.null,program.eq.');
      } else if (program.includes(',')) {
        // Handle multi-select - split by comma and use OR
        const programs = program.split(',').map(p => p.trim()).filter(p => p);
        if (programs.length > 0) {
          const orConditions = programs.map(p => `program.eq.${p}`).join(',');
          query = query.or(orConditions);
        }
      } else {
        query = query.eq('program', program);
      }
    }
    if (locationRegion) {
      if (locationRegion === '-') {
        query = query.or('location_region.is.null,location_region.eq.');
      } else if (locationRegion.includes(',')) {
        // Handle multi-select - split by comma and use OR
        const regions = locationRegion.split(',').map(r => r.trim()).filter(r => r);
        if (regions.length > 0) {
          const orConditions = regions.map(r => `location_region.eq.${r}`).join(',');
          query = query.or(orConditions);
        }
      } else {
        query = query.eq('location_region', locationRegion);
      }
    }
    if (providerType) {
      if (providerType === '-') {
        query = query.or('provider_type.is.null,provider_type.eq.');
      } else if (providerType.includes(',')) {
        // Handle multi-select - split by comma and use OR
        const types = providerType.split(',').map(t => t.trim()).filter(t => t);
        if (types.length > 0) {
          const orConditions = types.map(t => `provider_type.eq.${t}`).join(',');
          query = query.or(orConditions);
        }
      } else {
        query = query.eq('provider_type', providerType);
      }
    }
    if (modifier) {
      if (modifier === '-') {
        // Show entries with no modifiers
        query = query.is('modifier_1', null).is('modifier_2', null).is('modifier_3', null).is('modifier_4', null);
      } else if (modifier.includes(',')) {
        // Handle multi-select - split by comma and check all modifier columns
        const modifiers = modifier.split(',').map(m => m.trim()).filter(m => m);
        if (modifiers.length > 0) {
          const orConditions = modifiers.map(m => 
            `modifier_1.eq.${m},modifier_2.eq.${m},modifier_3.eq.${m},modifier_4.eq.${m}`
          ).join(',');
          query = query.or(orConditions);
        }
      } else {
        // Check all modifier columns
        query = query.or(`modifier_1.eq.${modifier},modifier_2.eq.${modifier},modifier_3.eq.${modifier},modifier_4.eq.${modifier}`);
      }
    }
    if (feeScheduleDate) {
      query = query.eq('rate_effective_date', feeScheduleDate);
    } else if (startDate && endDate) {
      query = query.gte('rate_effective_date', startDate).lte('rate_effective_date', endDate);
    } else if (startDate) {
      query = query.gte('rate_effective_date', startDate);
    } else if (endDate) {
      query = query.lte('rate_effective_date', endDate);
    }
    // Sorting
    if (sortParam) {
      for (const sortPart of sortParam.split(',')) {
        const [col, dir] = sortPart.split(':');
        if (col) query = query.order(col, { ascending: dir !== 'desc' });
      }
    } else {
      query = query.order('state_name', { ascending: true }).order('service_code', { ascending: true });
    }
    // Pagination
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    // Fetch data
    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      data: data || [],
      totalCount: count || 0,
      currentPage: page,
      itemsPerPage,
      filterOptions: {} // Optionally, you can add filter options here if needed
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
