import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * Validates that the current user is authenticated and has admin privileges
 * @returns {Promise<{user: any, error: NextResponse | null}>}
 */
export async function validateAdminAuth(): Promise<{ user: any; error: NextResponse | null }> {
  try {
    // Check authentication
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return {
        user: null,
        error: NextResponse.json({ error: "Unauthorized - Authentication required" }, { status: 401 })
      };
    }

    // Check admin authorization
    const supabase = createServiceClient();
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", user.email)
      .eq("is_active", true)
      .single();

    if (adminError || !adminData) {
      console.warn(`🚨 Admin access denied for user: ${user.email}`);
      return {
        user: null,
        error: NextResponse.json({ error: "Forbidden - Admin privileges required" }, { status: 403 })
      };
    }

    console.log(`✅ Admin access granted for user: ${user.email}`);
    return { user: adminData, error: null };
  } catch (error) {
    console.error("🚨 Admin authentication error:", error);
    return {
      user: null,
      error: NextResponse.json({ error: "Internal server error during authorization" }, { status: 500 })
    };
  }
}

