import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function GET(request: Request) {
  try {
    // Validate authentication
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Only update the main data-fetching logic (not filter options or fee schedule dates)
    const mode = searchParams.get("mode");
    if (mode) {
      // Keep existing logic for filter options and fee schedule dates
      // ...
      return NextResponse.json({ error: "Not implemented in this refactor" }, { status: 501 });
    }
    // Extract filters from query params (camelCase and snake_case supported)
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
