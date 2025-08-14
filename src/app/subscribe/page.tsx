"use client";

import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import Footer from "@/app/components/footer";
import { CreditCard, CheckCircle, Mail, Shield, ArrowLeft } from "lucide-react"; // Added new icons
import SubscriptionTermsModal from '@/app/components/SubscriptionTermsModal';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const StripePricingTableWithFooter = () => {
  const [showTerms, setShowTerms] = useState(false);
  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();
  const router = useRouter();
  const [showStripeTable, setShowStripeTable] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showRedirectBanner, setShowRedirectBanner] = useState(false);
  
  // Email verification states
  const [emailToVerify, setEmailToVerify] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'email' | 'code' | 'complete'>('email');
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState("");
  // resend cooldown UI
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    companyType: "",
    providerType: "",
    howDidYouHear: "",
    interest: "",
    demoRequest: "No",
  });
  const [loading, setLoading] = useState(false);
  const [formFilled, setFormFilled] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isSubUser, setIsSubUser] = useState(false);
  const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);

  // Check subscription status when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      checkSubscription();
      checkSubUser();
      fetchFormData(user.email);
      // If user is authenticated, mark email as verified
      setIsEmailVerified(true);
      setVerificationStep('complete');
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Dynamically load the Stripe Pricing Table script
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [hasActiveSubscription, isSubUser]);

  // Determine if purchasing should be disabled
  const disablePurchase = (!isAuthenticated || !formFilled) || hasActiveSubscription || isSubUser;

  // Inject or remove styles to disable Stripe pricing table buttons based on state
  useEffect(() => {
    const styleId = 'stripe-pricing-disable-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

    if (disablePurchase) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
          .Button-root[type="submit"] {
            opacity: 0.5 !important;
            pointer-events: none !important;
            cursor: not-allowed !important;
          }
        `;
        document.head.appendChild(styleEl);
      }
    } else {
      if (styleEl) {
        document.head.removeChild(styleEl);
      }
    }

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) document.head.removeChild(existing);
    };
  }, [disablePurchase]);

  // Fetch existing form data when the page loads or when the user's email changes
  useEffect(() => {
    if (user?.email) {
      fetchFormData(user.email);
    }
  }, [user]);

  // If a non-auth user verifies email and we already have a form on file, set cookie to allow account creation
  useEffect(() => {
    const checkExistingForm = async () => {
      if (!isAuthenticated && isEmailVerified && emailToVerify) {
        try {
          const { data, error } = await supabase
            .from("registrationform")
            .select("email")
            .eq("email", emailToVerify)
            .maybeSingle();
          if (!error && data) {
            setFormFilled(true);
            try {
              document.cookie = `mr_form_complete=1; path=/; max-age=${60 * 60}; samesite=Lax`;
              sessionStorage.setItem('mr_form_complete', '1');
            } catch {}
          }
        } catch {}
      }
    };
    checkExistingForm();
  }, [isAuthenticated, isEmailVerified, emailToVerify]);

  const fetchFormData = async (email: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("registrationform")
        .select("*")
        .eq("email", email)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 is the error code for "no rows found"
        console.error("Error fetching form data:", error);
      } else if (data) {
        // If form data exists, mark the form as filled
        setFormFilled(true);
        setFormData({
          firstName: data.firstname || "",
          lastName: data.lastname || "",
          companyName: data.companyname || "",
          companyType: data.companytype || "",
          providerType: data.providertype || "",
          howDidYouHear: data.howdidyouhear || "",
          interest: data.interest || "",
          demoRequest: data.demorequest || "No",
        });
      } else {
        // If no data is found, mark the form as not filled
        setFormFilled(false);
      }
    } catch (err) {
      console.error("Unexpected error during form data fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleModalVisibility = () => {
    setShowTerms(!showTerms); // Toggle modal visibility
  };

  const scrollToElementById = (elementId: string) => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(elementId);
    if (el && 'scrollIntoView' in el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If redirected with must_complete_form=1, show banner and guide to next step
  useEffect(() => {
    const flag = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('must_complete_form') : null;
    if (flag === '1') {
      setShowRedirectBanner(true);
      // Guide user to the appropriate step
      setTimeout(() => {
        if (!isAuthenticated) {
          if (!isEmailVerified) {
            setVerificationStep('email');
            scrollToElementById('email-verification');
          } else if (!formFilled) {
            setVerificationStep('complete');
            scrollToElementById('registration-form');
          }
        } else if (!formFilled) {
          scrollToElementById('registration-form');
        }
      }, 150);
    }
  }, [isAuthenticated, isEmailVerified, formFilled]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Determine which email to use for saving the form
    const targetEmail = isAuthenticated && user?.email
      ? user.email
      : (isEmailVerified && emailToVerify ? emailToVerify : null);

    if (!targetEmail) {
      toast.error("Please verify your email to continue.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("registrationform")
        .upsert({
          email: targetEmail,
          firstname: formData.firstName,
          lastname: formData.lastName,
          companyname: formData.companyName,
          companytype: formData.companyType,
          providertype: formData.providerType,
          howdidyouhear: formData.howDidYouHear,
          interest: formData.interest,
          demorequest: formData.demoRequest,
        });

        if (error) {
        console.error("Error saving form data:", error);
        console.error("Full error object:", JSON.stringify(error, null, 2));
        toast.error("Failed to save form data. Please try again.");
      } else {
        setFormFilled(true); // Mark the form as filled
        setFormSubmitted(true);
        // If user is not authenticated yet, prompt account creation before subscribing
        if (!isAuthenticated) {
          toast.success("Form submitted. Please create your account to continue.");
          // Mark form completion so middleware permits register route
          try {
            document.cookie = `mr_form_complete=1; path=/; max-age=${60 * 60}; samesite=Lax`;
            sessionStorage.setItem('mr_form_complete', '1');
          } catch {}
          router.push("/api/auth/register");
          return;
        }
        toast.success("Form submitted! You can now subscribe.");
      }
    } catch (err) {
      console.error("Unexpected error during form submission:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const testTableDetection = async () => {
      try {
        const { data, error } = await supabase
          .from("registrationform")
          .select("*")
          .limit(1); // Fetch just one row to test

        if (error) {
          console.error("Error fetching from registrationform table:", error);
        } else {
          console.log("Table detected. Data:", data);
        }
      } catch (err) {
        console.error("Unexpected error during table detection:", err);
      }
    };

    testTableDetection();
  }, []);

  const checkSubscription = async () => {
    const userEmail = user?.email ?? "";
    if (!userEmail) return;

    try {
      const response = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      if (data.error || !data.status || data.status !== "active") {
        setHasActiveSubscription(false); // No active subscription
      } else {
        setHasActiveSubscription(true); // Active subscription found
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setHasActiveSubscription(false); // Assume no active subscription on error
    }
  };

  const checkSubUser = async () => {
    const userEmail = user?.email ?? "";
    if (!userEmail) return;

    try {
      const response = await fetch("/api/subscription-users");
      if (!response.ok) {
        throw new Error("Failed to check sub-user status");
      }

      const data = await response.json();
      
      // Check if current user is a sub-user
      if (data.isSubUser) {
        setIsSubUser(true);
        // For sub-users, we need to find their primary user
        setPrimaryEmail(data.primaryUser || userEmail);
      } else {
        setIsSubUser(false);
      }
    } catch (err) {
      console.error("❌ Error checking sub-user:", err);
    }
  };

  // Email verification functions (real via Brevo-backed API)
  const handleSendVerificationCode = async () => {
    if (!emailToVerify) {
      setVerificationError("Please enter an email address");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");
    setVerificationSuccess("");

    try {
      const res = await fetch('/api/email-verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send verification');
      }
      setVerificationStep('code');
      setVerificationSuccess("Verification code sent! Check your email.");
      setTimeout(() => setVerificationSuccess(""), 3000);
      setResendCooldown(60);
    } catch (error) {
      console.error("Error sending verification code:", error);
      setVerificationError("Failed to send verification code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setVerificationError("Please enter the verification code");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");

    try {
      const res = await fetch('/api/email-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify, code: verificationCode })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed');
      }
      setIsEmailVerified(true);
      setVerificationStep('complete');
      setVerificationSuccess("Email verified successfully!");
      setTimeout(() => setVerificationSuccess(""), 3000);
    } catch (error) {
      console.error("Error verifying code:", error);
      setVerificationError("Invalid or expired verification code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const resetVerification = () => {
    setEmailToVerify("");
    setVerificationCode("");
    setVerificationStep('email');
    setIsEmailVerified(false);
    setVerificationError("");
    setVerificationSuccess("");
  };

  // Function to handle subscription button click
  const handleSubscribeClick = async () => {
    if (!isAuthenticated) {
      if (!isEmailVerified) {
        setVerificationStep('email');
        scrollToElementById('email-verification');
        return;
      }
      if (!formFilled) {
        setVerificationStep('complete');
        scrollToElementById('registration-form');
        return;
      }
      router.push('/api/auth/register');
      return;
    }

    if (!formFilled) {
      scrollToElementById('registration-form');
      return;
    }
    // Authenticated and form filled: pricing table already visible
  };

  // Function to handle subscription button click for non-authenticated users
  const handleNonAuthSubscribeClick = () => {
    if (!isEmailVerified) {
      setVerificationStep('email');
      scrollToElementById('email-verification');
      return;
    }
    if (!formFilled) {
      setVerificationStep('complete');
      scrollToElementById('registration-form');
      return;
    }
    router.push('/api/auth/register');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-16">
        <Toaster position="top-center" />
        {showRedirectBanner && (
          <div className="w-full max-w-4xl mb-6 p-5 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-yellow-900 font-semibold">Please finish these steps before creating your account</p>
                <ul className="mt-2 list-disc ml-6 text-yellow-900 text-sm space-y-1">
                  <li>Verify your email address</li>
                  <li>Complete the short registration form</li>
                  <li>Then you'll create your account and proceed to payment</li>
                </ul>
              </div>
              <button
                onClick={() => setShowRedirectBanner(false)}
                className="text-yellow-900 text-sm underline"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {!isAuthenticated && !isEmailVerified && (
                <button
                  onClick={() => { setVerificationStep('email'); scrollToElementById('email-verification'); }}
                  className="bg-[#012C61] text-white px-4 py-2 rounded-md"
                >
                  Go to email verification
                </button>
              )}
              {((!isAuthenticated && isEmailVerified && !formFilled) || (isAuthenticated && !formFilled)) && (
                <button
                  onClick={() => { setVerificationStep('complete'); scrollToElementById('registration-form'); }}
                  className="bg-[#012C61] text-white px-4 py-2 rounded-md"
                >
                  Go to registration form
                </button>
              )}
            </div>
          </div>
        )}
        {/* Subscription Status Banner - Show only for subscribed users */}
        {isAuthenticated && (hasActiveSubscription || isSubUser) && (
          <div className="w-full max-w-4xl mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">
                  ✓ You have an active subscription
                </p>
                {isSubUser && (
                  <p className="text-sm text-green-600">
                    This is a sub-user account
                  </p>
                )}
              </div>
              <a
                href="/dashboard"
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        )}

        {/* Subscription Details - Always Visible */}
        <div className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-[#012C61] text-center font-lemonMilkRegular">Subscription Models</h2>
          <p className="text-lg mb-10 text-gray-600 text-center">
            MediRate offers a comprehensive subscription plan designed to meet your company's needs:
          </p>
          <div className="max-w-xl mx-auto">
            <div className="p-8 bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-6 text-[#012C61] font-lemonMilkRegular tracking-wide text-center">Professional Plan</h3>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  <strong>Annual Payment Discount:</strong> Save 10% when you pay for a full year upfront - <strong>$8,100</strong>
                </p>
              </div>
              <ul className="space-y-5 w-full max-w-md">
                <li className="flex items-start gap-3 text-base text-gray-800">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Three user accounts included</span>
                </li>
                <li className="flex items-start gap-3 text-base text-gray-800">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-left">Access to payment rate data for 50 states and the District of Columbia</span>
                </li>
                <li className="flex items-start gap-3 text-base text-gray-800">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-left">
                    Access to MediRate's comprehensive reimbursement rate database and tracking tools including:
                    <ul className="list-disc ml-8 mt-2 space-y-1 text-gray-700 text-base">
                      <li>Historical payment rate data</li>
                      <li>Multi-state rate comparisons</li>
                      <li>Provider bulletins and other payment rate-related communications</li>
                      <li>Reimbursement-related legislative activity</li>
                    </ul>
                  </span>
                </li>
                <li className="flex items-start gap-3 text-base text-gray-800">
                    <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-left">
                    Customizable email alerts for real-time updates on topics and states of your choice
                    </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex space-x-4 justify-center">
            {isAuthenticated ? (
              <button
                onClick={handleSubscribeClick}
                className="bg-[#012C61] text-white px-8 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
              >
                Subscribe Now
              </button>
            ) : (
              <button
                onClick={handleNonAuthSubscribeClick}
                className="bg-[#012C61] text-white px-8 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
              >
                Subscribe Now
              </button>
            )}
            <a
              href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1QOXygd6Dpekn_BDsmrizOLq3D9aX8iq_aopMjF5o4Z2_APztYi8VXo5QMn2ab0sDZ5rTX18ii"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#012C61] text-white px-8 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
            >
              Schedule a Live Presentation
            </a>
          </div>
        </div>

        {/* Email Verification Section - Show for non-authenticated users */}
        {!isAuthenticated && verificationStep === 'email' && (
          <div id="email-verification" className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#012C61] font-lemonMilkRegular">Verify Your Email</h2>
              <p className="text-gray-600">
                Please verify your email address to proceed with the subscription process
              </p>
              {/* Info note */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  We will email you a verification code to continue.
                </p>
              </div>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={emailToVerify}
                  onChange={(e) => setEmailToVerify(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                />
              </div>
              
              {verificationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{verificationError}</p>
                </div>
              )}
              
              <button
                onClick={handleSendVerificationCode}
                disabled={isVerifying || !emailToVerify}
                className="w-full bg-[#012C61] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? "Sending..." : "Send Verification Code"}
              </button>
            </div>
          </div>
        )}

        {/* Verification Code Input Section */}
        {!isAuthenticated && verificationStep === 'code' && (
          <div className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#012C61] font-lemonMilkRegular">Enter Verification Code</h2>
              <p className="text-gray-600">
                We've sent a 6-digit verification code to <strong>{emailToVerify}</strong>
              </p>
              <div className="mt-2 text-sm text-gray-600 text-center">
                Enter the 6-digit code we sent to your email.
              </div>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all text-center text-lg tracking-widest"
                  required
                />
              </div>
              
              {verificationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{verificationError}</p>
                </div>
              )}
              
              {verificationSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 text-sm">{verificationSuccess}</p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={resetVerification}
                  className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-gray-600 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={isVerifying || !verificationCode}
                  className="flex-1 bg-[#012C61] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "Verifying..." : "Verify Code"}
                </button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => resendCooldown === 0 && handleSendVerificationCode()}
                  disabled={resendCooldown > 0}
                  className="text-blue-600 text-sm hover:underline disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification code'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form - Show for non-authenticated users after email verification (only if not already filled) */}
        {!isAuthenticated && verificationStep === 'complete' && !showStripeTable && !formFilled && (
          <div id="registration-form" className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#012C61] font-lemonMilkRegular">Email Verified!</h2>
              <p className="text-gray-600">
                Please complete the registration form to proceed with your subscription
              </p>
            </div>
            
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Type</label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="">Select Company Type</option>
                  <option value="Medicaid provider">Medicaid provider</option>
                  <option value="Healthcare IT">Healthcare IT</option>
                  <option value="Consulting firm">Consulting firm</option>
                  <option value="Law firm">Law firm</option>
                  <option value="Advocacy organization">Advocacy organization</option>
                  <option value="Foundation/research organization">Foundation/research organization</option>
                  <option value="Investment firm/investment advisory">Investment firm/investment advisory</option>
                  <option value="Governmental agency - state">Governmental agency - state</option>
                  <option value="Governmental agency - federal">Governmental agency - federal</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {formData.companyType === "Medicaid provider" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider Type</label>
                  <input
                    type="text"
                    name="providerType"
                    value={formData.providerType}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How did you hear about MediRate?</label>
                <select
                  name="howDidYouHear"
                  value={formData.howDidYouHear}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="">Select how you heard about MediRate</option>
                  <option value="Google Search">Google Search</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Word of Mouth">Word of Mouth</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What Medicaid rate information are you most interested in searching/tracking?</label>
                <textarea
                  name="interest"
                  value={formData.interest}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Would you like to set up a demo to learn more about MediRate?</label>
                <select
                  name="demoRequest"
                  value={formData.demoRequest}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-[#012C61] text-white px-8 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Registration Form - Show only when authenticated but form not filled and not subscribed */}
        {isAuthenticated && !formFilled && !showStripeTable && !hasActiveSubscription && !isSubUser && (
          <div id="registration-form" className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <h2 className="text-xl font-bold mb-8 text-[#012C61] text-center font-lemonMilkRegular">Please Complete the Form to Proceed</h2>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Type</label>
                <select
                  name="companyType"
                  value={formData.companyType}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="">Select Company Type</option>
                  <option value="Medicaid provider">Medicaid provider</option>
                  <option value="Healthcare IT">Healthcare IT</option>
                  <option value="Consulting firm">Consulting firm</option>
                  <option value="Law firm">Law firm</option>
                  <option value="Advocacy organization">Advocacy organization</option>
                  <option value="Foundation/research organization">Foundation/research organization</option>
                  <option value="Investment firm/investment advisory">Investment firm/investment advisory</option>
                  <option value="Governmental agency - state">Governmental agency - state</option>
                  <option value="Governmental agency - federal">Governmental agency - federal</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {formData.companyType === "Medicaid provider" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider Type</label>
                  <input
                    type="text"
                    name="providerType"
                    value={formData.providerType}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How did you hear about MediRate?</label>
                <select
                  name="howDidYouHear"
                  value={formData.howDidYouHear}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="">Select how you heard about MediRate</option>
                  <option value="Google Search">Google Search</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Word of Mouth">Word of Mouth</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What Medicaid rate information are you most interested in searching/tracking?</label>
                <textarea
                  name="interest"
                  value={formData.interest}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Would you like to set up a demo to learn more about MediRate?</label>
                <select
                  name="demoRequest"
                  value={formData.demoRequest}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] transition-all"
                  required
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-[#012C61] text-white px-8 py-3 rounded-lg transition-all duration-300 hover:bg-transparent hover:border hover:border-[#012C61] hover:text-[#012C61]"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stripe Pricing Table - Always visible; purchase buttons disabled until prerequisites are met */}
        <div id="pricing-table" className="w-full max-w-4xl transform scale-110 relative" style={{ transformOrigin: "center" }}>
          {disablePurchase && (
            <div
              className="absolute inset-0 z-10 bg-transparent cursor-not-allowed"
              onClick={() => {
                if (!isAuthenticated) {
                  if (!isEmailVerified) {
                    setVerificationStep('email');
                    scrollToElementById('email-verification');
                    return;
                  }
                  if (!formFilled) {
                    setVerificationStep('complete');
                    scrollToElementById('registration-form');
                    return;
                  }
                  router.push('/api/auth/register');
                  return;
                }
                if (!formFilled) {
                  scrollToElementById('registration-form');
                  return;
                }
              }}
            />
          )}
          {React.createElement("stripe-pricing-table", {
            "pricing-table-id": "prctbl_1RBMKo2NeWrBDfGslMwYkTKz",
            "publishable-key": "pk_live_51QXT6G2NeWrBDfGsjthMPwaWhPV7UIzSJjZ3fpmANYKT58UCVSnoHaHKyozK9EptYNbV3Y1y5SX1QQcuI9dK5pZW00VQH9T3Hh",
          })}
        </div>

        {/* Guidance under pricing table when purchasing is disabled */}
        {disablePurchase && (
          <div className="w-full max-w-4xl mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-center text-sm">
              To subscribe, please verify your email, complete the registration form, and {isAuthenticated ? 'ensure the form is complete below.' : 'create your account after submitting the form.'}
            </p>
          </div>
        )}

        {/* Warning message for subscribed users */}
        {isAuthenticated && (hasActiveSubscription || isSubUser) && (
          <div className="w-full max-w-4xl mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-center text-sm">
              You already have an active subscription. The purchase buttons are disabled.
            </p>
          </div>
        )}

        {/* Accepted Payment Methods - Always visible */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-md flex items-center space-x-2">
          <span className="text-lg font-semibold">Accepted Payment Methods:</span>
          <CreditCard className="w-6 h-6 text-blue-600" />
          <span className="text-lg">Card</span>
        </div>

        {/* Terms and Conditions Link - Always Visible */}
        <div className="mt-6 text-center">
          <button onClick={toggleModalVisibility} className="text-blue-600 underline">
            Terms and Conditions
          </button>
        </div>

        {/* Add a message for non-authenticated users who haven't started verification */}
        {!isAuthenticated && verificationStep === 'email' && (
          <div className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100 text-center">
            <h2 className="text-2xl font-bold mb-4 text-[#012C61] font-lemonMilkRegular">Ready to Subscribe?</h2>
            <p className="text-lg mb-6 text-gray-600">
              Please verify your email address above to view subscription options and complete the registration process.
            </p>
          </div>
        )}

        {/* Add a message for authenticated users who haven't filled the form */}
        {isAuthenticated && !formFilled && !hasActiveSubscription && !isSubUser && (
          <div className="w-full max-w-4xl mb-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100 text-center">
            <h2 className="text-2xl font-bold mb-4 text-[#012C61] font-lemonMilkRegular">Almost There!</h2>
            <p className="text-lg mb-6 text-gray-600">
              Please complete the registration form above to view subscription options.
            </p>
          </div>
        )}
      </main>

      {/* Subscription Terms and Conditions Modal */}
      <SubscriptionTermsModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default StripePricingTableWithFooter;

