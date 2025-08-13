import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    console.log('🔍 Code Definitions API - Fetching data from Supabase...');
    
    // Create service client for server-side operations
    const supabase = createServiceClient();
    
    // Simple fetch without pagination to debug the issue
    const { data, error } = await supabase
      .from('code_definitions')
      .select('hcpcs_code_cpt_code, service_code, service_description')
      .order('service_code')
      .limit(1000); // Limit to first 1000 records for now
    
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
