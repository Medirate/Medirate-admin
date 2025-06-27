import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

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
        .from('master_data')
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

      // Find the latest rate per state
      const latestRates: { [state: string]: { rate: number, rate_effective_date: string } } = {};
      data?.forEach((item: any) => {
        const state = item.state_name;
        const rate = parseRate(item.rate);
        const date = item.rate_effective_date;
        if (rate > 0) {
          if (!latestRates[state] || new Date(date) > new Date(latestRates[state].rate_effective_date)) {
            latestRates[state] = { rate, rate_effective_date: date };
          }
        }
      });

      // Calculate averages for each state (just the latest rate)
      const stateAverages = Object.entries(latestRates).map(([state, obj]) => ({
        state_name: state,
        avg_rate: obj.rate,
        rate_effective_date: obj.rate_effective_date
      }));

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
    let query = supabase.from('master_data').select('*', { count: 'exact' });
    if (serviceCategory) query = query.eq('service_category', serviceCategory);
    if (state) query = query.eq('state_name', state);
    if (serviceCode) query = query.eq('service_code', serviceCode);
    if (serviceDescription) query = query.eq('service_description', serviceDescription);
    if (program) query = query.eq('program', program);
    if (locationRegion) query = query.eq('location_region', locationRegion);
    if (providerType) query = query.eq('provider_type', providerType);
    if (modifier) {
      // Check all modifier columns
      query = query.or(`modifier_1.eq.${modifier},modifier_2.eq.${modifier},modifier_3.eq.${modifier},modifier_4.eq.${modifier}`);
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
