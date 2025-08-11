import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    console.log('🔍 Code Definitions API - Fetching data from Supabase...');
    
    // Create service client for server-side operations
    const supabase = createServiceClient();
    
    // Fetch ALL data from code_definitions table using pagination to bypass limits
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: pageData, error: pageError } = await supabase
        .from('code_definitions')
        .select('hcpcs_code_cpt_code, service_code, service_description')
        .order('service_code')
        .range(from, from + pageSize - 1);
      
      if (pageError) {
        console.error(`Supabase error fetching page ${from}-${from + pageSize - 1}:`, pageError);
        return NextResponse.json(
          { error: "Failed to fetch code definitions" },
          { status: 500 }
        );
      }
      
      if (pageData && pageData.length > 0) {
        allData = allData.concat(pageData);
        from += pageSize;
        hasMore = pageData.length === pageSize; // Continue if we got a full page
      } else {
        hasMore = false;
      }
    }
    
    const data = allData;
    const error = null;

    if (error) {
      console.error("Supabase error fetching code definitions:", error);
      return NextResponse.json(
        { error: "Failed to fetch code definitions" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log('⚠️ Code Definitions API - No data found');
      return NextResponse.json(
        { error: "No code definitions found" },
        { status: 404 }
      );
    }

    console.log(`✅ Code Definitions API - Successfully fetched ${data.length} records (CPT: ${data.filter(item => item.hcpcs_code_cpt_code === 'CPT').length}, HCPCS: ${data.filter(item => item.hcpcs_code_cpt_code === 'HCPCS').length})`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching code definitions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
