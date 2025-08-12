import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE) {
      console.error("SUPABASE_SERVICE_ROLE environment variable is missing");
      return NextResponse.json(
        { error: "Database configuration error", details: "SUPABASE_SERVICE_ROLE not set" },
        { status: 500 }
      );
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("NEXT_PUBLIC_SUPABASE_URL environment variable is missing");
      return NextResponse.json(
        { error: "Database configuration error", details: "NEXT_PUBLIC_SUPABASE_URL not set" },
        { status: 500 }
      );
    }
    
    console.log("Creating Supabase service client...");
    const supabase = createServiceClient();
    console.log("Supabase service client created successfully");
    
    // Fetch both email lists
    const [testEmailResult, marketingEmailResult] = await Promise.all([
      supabase
        .from("test_email_list")
        .select("*")
        .order("email", { ascending: true }),
      supabase
        .from("marketing_email_list")
        .select("*")
        .order("email", { ascending: true })
    ]);

    if (testEmailResult.error) {
      console.error("Error fetching test email list:", testEmailResult.error);
    }

    if (marketingEmailResult.error) {
      console.error("Error fetching marketing email list:", marketingEmailResult.error);
    }

    return NextResponse.json({
      testEmailList: testEmailResult.data || [],
      marketingEmailList: marketingEmailResult.data || []
    });

  } catch (error) {
    console.error("Error in marketing emails list API:", error);
    
    // Check if it's a Supabase connection error
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: "Database connection failed", details: "Unable to connect to database" },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch email lists", details: "Internal server error" },
      { status: 500 }
    );
  }
}
