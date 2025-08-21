"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any;
  userEmail: string;
  isPrimaryUser: boolean;
  isSubUser: boolean;
  hasActiveSubscription: boolean;
  hasFormData: boolean;
  isCheckComplete: boolean;
  subscriptionData: any;
  checkStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();
  const router = useRouter();

  const [authState, setAuthState] = useState<{
    isPrimaryUser: boolean;
    isSubUser: boolean;
    hasActiveSubscription: boolean;
    hasFormData: boolean;
    isCheckComplete: boolean;
    subscriptionData: any;
  }>({
    isPrimaryUser: false,
    isSubUser: false,
    hasActiveSubscription: false,
    hasFormData: false,
    isCheckComplete: false,
    subscriptionData: null,
  });

  const userEmail = user?.email || "";

  const checkSubscriptionAndUserStatus = async () => {
    if (!isAuthenticated || !userEmail) {
      setAuthState(prev => ({ ...prev, isCheckComplete: true }));
      return;
    }

    console.log("🔍 AuthContext: Starting comprehensive auth check for:", userEmail);

    try {
      // Check sub-user status using the API endpoint
      console.log("🔍 AuthContext: Calling /api/subscription-users for email:", userEmail);
      const subUserResponse = await fetch("/api/subscription-users");
      let isPrimaryUser = false;
      let isSubUser = false;

      console.log("🔍 AuthContext: subscription-users API response status:", subUserResponse.status);
      
      if (subUserResponse.ok) {
        const subUserData = await subUserResponse.json();
        // Fix: API returns isSubUser and primaryUser, not isPrimaryUser
        isSubUser = subUserData.isSubUser || false;
        isPrimaryUser = !isSubUser && subUserData.primaryUser === userEmail; // Primary if not sub-user and email matches
        console.log("✅ AuthContext: Sub-user check complete:", { 
          isPrimaryUser, 
          isSubUser, 
          userEmail,
          apiPrimaryUser: subUserData.primaryUser,
          rawData: subUserData 
        });
      } else {
        const errorText = await subUserResponse.text();
        console.log("⚠️ AuthContext: Sub-user check failed:", subUserResponse.status, errorText);
      }

      // If user is primary or sub-user, they have access
      if (isPrimaryUser || isSubUser) {
        console.log("✅ AuthContext: User has access via subscription_users table");
        setAuthState({
          isPrimaryUser,
          isSubUser,
          hasActiveSubscription: true, // They have access through subscription_users
          hasFormData: true, // Assume they have form data if they're in subscription_users
          isCheckComplete: true,
          subscriptionData: { status: 'active', userType: isPrimaryUser ? 'primary' : 'sub' }
        });
        return;
      }

      // Check Stripe subscription status
      console.log("🔍 AuthContext: Checking Stripe subscription for:", userEmail);
      const stripeResponse = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const stripeData = await stripeResponse.json();
      console.log("🔍 AuthContext: Stripe response:", stripeData);

      const hasActiveSubscription = stripeData.status === 'active';

      // Check form data
      console.log("🔍 AuthContext: Checking form data for:", userEmail);
      const formResponse = await fetch(`/api/registrationform?email=${encodeURIComponent(userEmail)}`);
      const hasFormData = formResponse.ok && (await formResponse.json()).data;

      console.log("✅ AuthContext: Check complete:", {
        isPrimaryUser,
        isSubUser,
        hasActiveSubscription,
        hasFormData: !!hasFormData
      });

      setAuthState({
        isPrimaryUser: !!isPrimaryUser,
        isSubUser: !!isSubUser,
        hasActiveSubscription: !!hasActiveSubscription,
        hasFormData: !!hasFormData,
        isCheckComplete: true,
        subscriptionData: stripeData
      });

    } catch (error) {
      console.error("❌ AuthContext: Error during auth check:", error);
      setAuthState(prev => ({ ...prev, isCheckComplete: true }));
    }
  };

  // Run check when authentication state changes
  useEffect(() => {
    if (!isLoading) {
      checkStatus();
    }
  }, [isAuthenticated, isLoading, userEmail]);

  const checkStatus = async () => {
    await checkSubscriptionAndUserStatus();
  };

  const contextValue: AuthState = {
    isLoading: !!isLoading,
    isAuthenticated: !!isAuthenticated,
    user,
    userEmail,
    isPrimaryUser: authState.isPrimaryUser,
    isSubUser: authState.isSubUser,
    hasActiveSubscription: authState.hasActiveSubscription,
    hasFormData: authState.hasFormData,
    isCheckComplete: authState.isCheckComplete,
    subscriptionData: authState.subscriptionData,
    checkStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for protected pages that need subscription access
export function useProtectedPage() {
  const auth = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && auth.isCheckComplete) {
      console.log("🔍 ProtectedPage: Auth check complete:", {
        isAuthenticated: auth.isAuthenticated,
        isPrimaryUser: auth.isPrimaryUser,
        isSubUser: auth.isSubUser,
        hasActiveSubscription: auth.hasActiveSubscription,
        hasFormData: auth.hasFormData
      });

      if (!auth.isAuthenticated) {
        console.log("❌ ProtectedPage: Not authenticated, redirecting to login");
        router.push("/api/auth/login");
        return;
      }

      // Check if user has access (either subscription or is sub-user)
      const hasAccess = auth.isPrimaryUser || auth.isSubUser || auth.hasActiveSubscription;

      if (!hasAccess) {
        console.log("❌ ProtectedPage: No subscription access, checking form data");
        if (!auth.hasFormData) {
          console.log("❌ ProtectedPage: No form data, redirecting to subscribe");
          router.push("/subscribe");
        } else {
          console.log("❌ ProtectedPage: Has form data but no subscription, redirecting to subscribe");
          router.push("/subscribe?form_completed=1");
        }
        setShouldRedirect(true);
      }
    }
  }, [auth, router]);

  return {
    ...auth,
    shouldRedirect,
    isLoading: auth.isLoading || !auth.isCheckComplete,
  };
}
