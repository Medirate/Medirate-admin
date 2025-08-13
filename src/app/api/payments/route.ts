import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    
    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("UserID")
      .eq("Email", user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get payment history with plan details
    const { data: payments, error: paymentsError } = await supabase
      .from("Payment")
      .select(`
        *,
        plan:Plan(planName, price),
        user:User(FirstName, LastName, Email)
      `)
      .eq("UserId", userData.UserID)
      .order("paymentDate", { ascending: false });

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }

    return NextResponse.json({ payments: payments || [] });
  } catch (error) {
    console.error("Error in payments API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
