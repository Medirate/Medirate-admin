import { createServiceClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * Validates admin access for admin-only site
 * @returns {Promise<{user: any, error: NextResponse | null}>}
 */
export async function validateAdminAuth(): Promise<{ user: any; error: NextResponse | null }> {
  try {
    // Admin-only site - no authentication needed
    const user = { email: "admin@medirate.com", id: "admin" };

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
      .single();

    if (adminError || !adminData) {
      console.warn(`🚨 Admin access denied for user: ${user.email}`, adminError);
      return {
        user: null,
        error: NextResponse.json({ error: "Forbidden - Admin privileges required" }, { status: 403 })
      };
    }

    // Check if user is active (if is_active field exists)
    if (adminData.is_active === false) {
      console.warn(`🚨 Admin access denied - user is inactive: ${user.email}`);
      return {
        user: null,
        error: NextResponse.json({ error: "Forbidden - Admin account is inactive" }, { status: 403 })
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

