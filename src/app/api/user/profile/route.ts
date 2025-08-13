import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    
    // Fetch user profile data
    const { data, error } = await supabase
      .from("User")
      .select("FirstName, LastName, Email, Picture")
      .eq("Email", user.email)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No user found, return empty profile
        return NextResponse.json({
          firstName: "",
          lastName: "",
          email: user.email,
          picture: null
        });
      }
      console.error("Error fetching user profile:", error);
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    return NextResponse.json({
      firstName: data.FirstName || "",
      lastName: data.LastName || "",
      email: data.Email || user.email,
      picture: data.Picture || null
    });

  } catch (error) {
    console.error("Error in user profile API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName, lastName, picture } = await request.json();
    const supabase = createServiceClient();
    
    // Update user profile data
    const { error } = await supabase
      .from("User")
      .update({
        FirstName: firstName,
        LastName: lastName,
        Picture: picture,
        UpdatedAt: new Date().toISOString(),
      })
      .eq("Email", user.email);

    if (error) {
      console.error("Error updating user profile:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error in user profile update API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
