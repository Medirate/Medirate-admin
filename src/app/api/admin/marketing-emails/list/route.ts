import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    
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
    return NextResponse.json(
      { error: "Failed to fetch email lists" },
      { status: 500 }
    );
  }
}
