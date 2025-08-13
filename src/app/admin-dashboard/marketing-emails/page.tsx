"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/app/components/applayout";

interface EmailRow {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
}

export default function MarketingEmailsAdminPage() {
  const [testEmailList, setTestEmailList] = useState<EmailRow[]>([]);
  const [marketingEmailList, setMarketingEmailList] = useState<EmailRow[]>([]);
  const [emailTemplate, setEmailTemplate] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendingTo, setSendingTo] = useState<"test" | "marketing" | null>(null);
  const [sendingLogs, setSendingLogs] = useState<Array<{
    type: "info" | "success" | "error";
    message: string;
    timestamp: number;
  }>>([]);
  const [sendingProgress, setSendingProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiStatus, setAiStatus] = useState<{
    type: "info" | "success" | "error";
    message: string;
  } | null>(null);
  const [isPromptMode, setIsPromptMode] = useState<boolean>(false);

  // Search state for both lists
  const [testEmailSearch, setTestEmailSearch] = useState<string>("");
  const [marketingEmailSearch, setMarketingEmailSearch] = useState<string>("");

  // State for adding new emails
  const [newTestEmail, setNewTestEmail] = useState({
    email: "",
    firstname: "",
    lastname: ""
  });
  const [newMarketingEmail, setNewMarketingEmail] = useState({
    email: "",
    firstname: "",
    lastname: ""
  });

  // State for editing emails
  const [editingEmail, setEditingEmail] = useState<{
    table: "test_email_list" | "marketing_email_list";
    email: string;
    data: { email: string; firstname: string; lastname: string };
  } | null>(null);

  // Sample HTML email template for testing
  const sampleHtmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marketing Email</title>
    <style>
        @media only screen and (max-width: 600px) {
            .main-content { padding: 0 !important; }
            .content-card { padding: 16px 4% !important; font-size: 15px !important; margin: 16px 2% !important; }
            .button { padding: 12px 20px !important; font-size: 14px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family: Arial, sans-serif;">
    <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td>
                <!-- Header -->
                <div style="background:#0F3557; padding:30px 0 20px 0; border-radius:0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td align="left" style="padding-left:30px;">
                                <img src="https://raw.githubusercontent.com/Medirate/Medirate-Developement/main/public/top-black-just-word.png" alt="MediRate Wordmark" style="max-width:200px; width:90%; display:block;">
                            </td>
                            <td align="right" style="padding-right:30px;">
                                <img src="https://raw.githubusercontent.com/Medirate/Medirate-Developement/main/public/top-black-just-logo.png" alt="MediRate Logo" style="max-width:80px; width:80px; display:block;">
                            </td>
                        </tr>
                    </table>
                </div>
                
                <!-- Main Content -->
                <div class="main-content" style="padding:0; margin:0;">
                    <h2 style="color:#0F3557; font-size:22px; margin:30px 0 10px 0; text-align:center;">Marketing Campaign</h2>
                    <p style="color:#555; text-align:center; margin:0 0 20px 0;">Your custom marketing message goes here.</p>

                    <!-- Main Content Card -->
                    <div class="content-card" style="background:#f8fafc; border-radius:0; box-shadow:none; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:32px 40px; font-family:Arial,sans-serif; color:#0F3557; box-sizing:border-box; margin:32px 48px;">
                        <div style="font-size:18px; font-weight:bold; margin-bottom:16px; color:#0F3557;">
                            🎯 Campaign Highlights
                        </div>
                        <div style="font-size:14px; margin-bottom:16px; color:#334155; line-height:1.6;">
                            This is a sample marketing email template that you can customize for your campaigns. It includes the professional MediRate branding and responsive design.
                        </div>
                        
                        <div style="font-size:14px; margin-bottom:20px; color:#334155; line-height:1.6;">
                            <strong>Key Features:</strong>
                            <ul style="margin:8px 0; padding-left:20px;">
                                <li>Professional MediRate branding</li>
                                <li>Responsive email design</li>
                                <li>Easy to customize content</li>
                                <li>Mobile-friendly layout</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Call to Action Card -->
                    <div class="content-card" style="background:#f8fafc; border-radius:0; box-shadow:none; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:32px 40px; font-family:Arial,sans-serif; color:#0F3557; box-sizing:border-box; margin:32px 48px;">
                        <div style="font-size:16px; font-weight:bold; margin-bottom:12px; color:#0F3557;">
                            🚀 Take Action
                        </div>
                        <div style="font-size:14px; margin-bottom:16px; color:#334155; line-height:1.6;">
                            Customize this template with your specific marketing content, calls to action, and branding elements.
                        </div>
                        
                        <div style="text-align:center; margin:20px 0;">
                            <a href="#" style="background:#0F3557; color:#fff; text-decoration:none; padding:14px 28px; border-radius:5px; font-weight:bold; font-size:16px; display:inline-block;">Learn More</a>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background:#0F3557; color:#fff; font-size:13px; padding:12px; border-radius:0; text-align:center;">
                    © 2025 MediRate. All rights reserved.
                </div>
            </td>
        </tr>
    </table>
</body>
</html>`;

  // Function to generate AI template
  const generateAITemplate = async () => {
    if (!aiPrompt.trim()) {
      setAiStatus({ type: "error", message: "Please describe the email you want to create" });
      return;
    }

    setIsGenerating(true);
    setAiStatus({ type: "info", message: "Generating your email template..." });

    try {
      const response = await fetch("/api/admin/marketing-emails/generate-ai-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await response.json();
      
      // Log the full response for debugging
      console.log('AI Template Generation Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });

      if (response.ok && data.htmlContent) {
        setEmailTemplate(data.htmlContent);
        setAiStatus({ 
          type: "success", 
          message: "✨ Template generated successfully! You can now preview and customize it." 
        });
        // Switch back to code mode after successful generation
        setIsPromptMode(false);
      } else {
        let errorMessage = "Failed to generate template";
        
        if (data.error) {
          errorMessage = data.error;
        } else if (data.details) {
          errorMessage = data.details;
        }
        
        // Add HTTP status code for better debugging
        const statusText = response.statusText || `HTTP ${response.status}`;
        setAiStatus({ 
          type: "error", 
          message: `❌ ${statusText}: ${errorMessage}` 
        });
      }
    } catch (error) {
      let errorMessage = "Unknown error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      setAiStatus({ 
        type: "error", 
        message: `❌ Network Error: ${errorMessage}` 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to send email campaign
  const sendEmailCampaign = async (target: "test" | "marketing") => {
    if (!emailTemplate.trim() || !emailSubject.trim()) {
      addLog("error", "Please provide both email template and subject");
      return;
    }

    setIsSending(true);
    setSendingTo(target);
    setSendingLogs([]);
    setSendingProgress({ current: 0, total: 0 });

    try {
      addLog("info", `Starting email campaign to ${target === "test" ? "test users" : "marketing list"}...`);
      
      const targetList = target === "test" ? testEmailList : marketingEmailList;
      
      if (targetList.length === 0) {
        addLog("error", `No emails found in ${target === "test" ? "test" : "marketing"} list`);
        setIsSending(false);
        setSendingTo(null);
        return;
      }

      setSendingProgress({ current: 0, total: targetList.length });
      addLog("info", `Found ${targetList.length} emails to send to`);

      const batchSize = 10;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < targetList.length; i += batchSize) {
        const batch = targetList.slice(i, i + batchSize);
        
        try {
          const response = await fetch("/api/admin/marketing-emails/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emails: batch.map(row => row.email),
              subject: emailSubject,
              htmlContent: emailTemplate,
              target: target
            }),
          });

          if (response.ok) {
            const responseData = await response.json();
            successCount += responseData.emailsSent || 0;
            errorCount += (batch.length - (responseData.emailsSent || 0));
            
            if (responseData.logs && Array.isArray(responseData.logs)) {
              responseData.logs.forEach((log: string) => {
                if (log.includes("✅")) {
                  addLog("success", log);
                } else if (log.includes("❌")) {
                  addLog("error", log);
                } else {
                  addLog("info", log);
                }
              });
            }
            
            addLog("success", `Successfully sent batch ${Math.floor(i / batchSize) + 1} (${responseData.emailsSent || 0}/${batch.length} emails)`);
          } else {
            const errorData = await response.json();
            errorCount += batch.length;
            addLog("error", `Failed to send batch ${Math.floor(i / batchSize) + 1}: ${errorData.error || "Unknown error"}`);
          }
        } catch (error) {
          errorCount += batch.length;
          addLog("error", `Network error sending batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        setSendingProgress({ current: Math.min(i + batchSize, targetList.length), total: targetList.length });
        if (i + batchSize < targetList.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      if (errorCount === 0) {
        addLog("success", `🎉 Campaign completed successfully! Sent ${successCount} emails to ${target === "test" ? "test users" : "marketing list"}`);
      } else {
        addLog("error", `Campaign completed with errors. Success: ${successCount}, Errors: ${errorCount}`);
      }
    } catch (error) {
      addLog("error", `Campaign failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSending(false);
      setSendingTo(null);
      setSendingProgress({ current: 0, total: 0 });
    }
  };

  const addLog = (type: "info" | "success" | "error", message: string) => {
    setSendingLogs(prev => [...prev, {
      type,
      message,
      timestamp: Date.now()
    }]);
  };

  // Function to add new email
  const handleAddEmail = async (table: "test_email_list" | "marketing_email_list", emailData: {email: string, firstname: string, lastname: string}) => {
    if (!emailData.email.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch("/api/admin/marketing-emails/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table,
          email: emailData.email.trim(),
          firstname: emailData.firstname.trim(),
          lastname: emailData.lastname.trim()
        }),
      });

      if (response.ok) {
        // Refresh the lists
        await loadEmailLists();
        
        // Clear the form
        if (table === "test_email_list") {
          setNewTestEmail({ email: "", firstname: "", lastname: "" });
        } else {
          setNewMarketingEmail({ email: "", firstname: "", lastname: "" });
        }
        
        console.log(`✅ Added email to ${table}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to add email: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Error adding email:", error);
      alert("Failed to add email. Please try again.");
    }
  };

  // Function to delete email
  const handleDeleteEmail = async (table: "test_email_list" | "marketing_email_list", email: string) => {
    if (!confirm(`Are you sure you want to delete ${email} from the ${table === "test_email_list" ? "test" : "marketing"} list?`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/marketing-emails/rows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table,
          email
        }),
      });

      if (response.ok) {
        // Refresh the lists
        await loadEmailLists();
        console.log(`✅ Deleted email from ${table}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete email: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Error deleting email:", error);
      alert("Failed to delete email. Please try again.");
    }
  };

  // Function to start editing an email
  const handleEditEmail = (table: "test_email_list" | "marketing_email_list", item: EmailRow) => {
    setEditingEmail({
      table,
      email: item.email,
      data: { ...item }
    });
  };

  // Function to save edited email
  const handleSaveEdit = async () => {
    if (!editingEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingEmail.data.email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch("/api/admin/marketing-emails/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: editingEmail.table,
          email: editingEmail.data.email.trim(),
          firstname: editingEmail.data.firstname.trim(),
          lastname: editingEmail.data.lastname.trim()
        }),
      });

      if (response.ok) {
        // Refresh the lists
        await loadEmailLists();
        setEditingEmail(null);
        console.log(`✅ Updated email in ${editingEmail.table}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update email: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Error updating email:", error);
      alert("Failed to update email. Please try again.");
    }
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditingEmail(null);
  };

  // Load email lists on component mount
  useEffect(() => {
    loadEmailLists();
  }, []);

  const loadEmailLists = async () => {
    try {
      console.log("🔍 Loading email lists...");
      const response = await fetch("/api/admin/marketing-emails/list");
      
      console.log("📡 API Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", response.status, errorText);
        return false;
      }
      
      const json = await response.json();
      console.log("📊 API Response data:", json);
      
      setTestEmailList(json.testEmailList || []);
      setMarketingEmailList(json.marketingEmailList || []);
      
      console.log("✅ Email lists loaded successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to load email lists:", error);
      return false;
    }
  };

  // Search filtering functions
  const getFilteredTestEmails = () => {
    if (!testEmailSearch.trim()) return testEmailList;
    
    const searchTerm = testEmailSearch.toLowerCase();
    return testEmailList.filter(item => 
      item.email.toLowerCase().includes(searchTerm) ||
      item.firstname.toLowerCase().includes(searchTerm) ||
      item.lastname.toLowerCase().includes(searchTerm)
    );
  };

  const getFilteredMarketingEmails = () => {
    if (!marketingEmailSearch.trim()) return marketingEmailList;
    
    const searchTerm = marketingEmailSearch.toLowerCase();
    return marketingEmailList.filter(item => 
      item.email.toLowerCase().includes(searchTerm) ||
      item.firstname.toLowerCase().includes(searchTerm) ||
      item.lastname.toLowerCase().includes(searchTerm)
    );
  };

  // Clear search functions
  const clearTestEmailSearch = () => setTestEmailSearch("");
  const clearMarketingEmailSearch = () => setMarketingEmailSearch("");

  return (
    <AppLayout activeTab="adminDashboard">
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-2">
          Marketing Emails Admin
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          Create and manage marketing campaigns separate from rate developments.
        </p>

        {/* Email Lists Management Section */}
        <div className="bg-white rounded-xl shadow p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-[#012C61]">Manage Email Lists</h3>
            {(testEmailSearch || marketingEmailSearch) && (
              <button
                onClick={() => {
                  clearTestEmailSearch();
                  clearMarketingEmailSearch();
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                🗑️ Clear All Searches
              </button>
            )}
          </div>
          
          {/* Test Email List */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-700">
                Test Email List ({testEmailSearch ? `${getFilteredTestEmails().length}/${testEmailList.length}` : testEmailList.length} emails)
              </h4>
              <div className="text-sm text-gray-500">Click on any field to edit</div>
            </div>
            
            {/* Add New Email Form - Top */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <h5 className="text-sm font-medium text-blue-800 mb-3">➕ Add New Test Email</h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTestEmail.email}
                  onChange={(e) => setNewTestEmail({...newTestEmail, email: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="First name"
                  className="px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTestEmail.firstname}
                  onChange={(e) => setNewTestEmail({...newTestEmail, firstname: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Last name"
                  className="px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTestEmail.lastname}
                  onChange={(e) => setNewTestEmail({...newTestEmail, lastname: e.target.value})}
                />
                <button
                  onClick={() => handleAddEmail("test_email_list", newTestEmail)}
                  disabled={!newTestEmail.email}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    newTestEmail.email
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Add Email
                </button>
              </div>
            </div>

            {/* Search Test Email List */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search test emails by email, first name, or last name..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={testEmailSearch}
                  onChange={(e) => setTestEmailSearch(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {testEmailSearch && (
                  <button
                    onClick={clearTestEmailSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {testEmailSearch && (
                <div className="mt-2 text-sm text-gray-600">
                  Showing {getFilteredTestEmails().length} of {testEmailList.length} test emails
                </div>
              )}
            </div>

            {/* Test Email List Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredTestEmails().map((item, index) => (
                    <tr key={item.email} className="hover:bg-gray-50">
                      {editingEmail?.table === "test_email_list" && editingEmail?.email === item.email ? (
                        // Edit mode
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="email"
                              value={editingEmail.data.email}
                              onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, email: e.target.value}})}
                              className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingEmail.data.firstname}
                              onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, firstname: e.target.value}})}
                              className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingEmail.data.lastname}
                              onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, lastname: e.target.value}})}
                              className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-800 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // View mode
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50" onClick={() => handleEditEmail("test_email_list", item)}>{item.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50" onClick={() => handleEditEmail("test_email_list", item)}>{item.firstname}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50" onClick={() => handleEditEmail("test_email_list", item)}>{item.lastname}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleEditEmail("test_email_list", item)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEmail("test_email_list", item.email)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {getFilteredTestEmails().length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        {testEmailSearch ? `No test emails found matching "${testEmailSearch}"` : "No test emails yet. Add one using the form above."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Marketing Email List */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-700">
                Marketing Email List ({marketingEmailSearch ? `${getFilteredMarketingEmails().length}/${marketingEmailList.length}` : marketingEmailList.length} emails)
              </h4>
              <div className="text-sm text-gray-500">Click on any field to edit</div>
            </div>
            
            {/* Add New Email Form - Top */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
              <h5 className="text-sm font-medium text-green-800 mb-3">➕ Add New Marketing Email</h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newMarketingEmail.email}
                  onChange={(e) => setNewMarketingEmail({...newMarketingEmail, email: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="First name"
                  className="px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newMarketingEmail.firstname}
                  onChange={(e) => setNewMarketingEmail({...newMarketingEmail, firstname: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Last name"
                  className="px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newMarketingEmail.lastname}
                  onChange={(e) => setNewMarketingEmail({...newMarketingEmail, lastname: e.target.value})}
                />
                <button
                  onClick={() => handleAddEmail("marketing_email_list", newMarketingEmail)}
                  disabled={!newMarketingEmail.email}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    newMarketingEmail.email
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Add Email
                </button>
              </div>
            </div>

            {/* Search Marketing Email List */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search marketing emails by email, first name, or last name..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={marketingEmailSearch}
                  onChange={(e) => setMarketingEmailSearch(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {marketingEmailSearch && (
                  <button
                    onClick={clearMarketingEmailSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {marketingEmailSearch && (
                <div className="mt-2 text-sm text-gray-600">
                  Showing {getFilteredMarketingEmails().length} of {marketingEmailList.length} marketing emails
                </div>
              )}
            </div>

            {/* Marketing Email List Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredMarketingEmails().map((item, index) => (
                    <tr key={item.email} className="hover:bg-gray-50">
                      {editingEmail?.table === "marketing_email_list" && editingEmail?.email === item.email ? (
                        // Edit mode
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="email"
                              value={editingEmail.data.email}
                              onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, email: e.target.value}})}
                              className="w-full px-2 py-1 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingEmail.data.firstname}
                              onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, firstname: e.target.value}})}
                              className="w-full px-2 py-1 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editingEmail.data.lastname}
                              onChange={(e) => setEditingEmail({...editingEmail, data: {...editingEmail.data, lastname: e.target.value}})}
                              className="w-full px-2 py-1 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-800 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // View mode
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-green-50" onClick={() => handleEditEmail("marketing_email_list", item)}>{item.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-green-50" onClick={() => handleEditEmail("marketing_email_list", item)}>{item.firstname}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-green-50" onClick={() => handleEditEmail("marketing_email_list", item)}>{item.lastname}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleEditEmail("marketing_email_list", item)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEmail("marketing_email_list", item.email)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {getFilteredMarketingEmails().length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        {marketingEmailSearch ? `No marketing emails found matching "${marketingEmailSearch}"` : "No marketing emails yet. Add one using the form above."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Email Template Editor */}
        <div className="bg-white rounded-xl shadow p-6 mb-10">
          <h3 className="text-xl font-semibold text-[#012C61] mb-4">Email Template Editor</h3>
          
          {/* Email Preview - Full Width */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Preview</label>
            <div className="border border-gray-300 rounded-md overflow-hidden bg-white shadow-lg">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Email Preview</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="p-8 min-h-[500px] overflow-auto">
                <div 
                  dangerouslySetInnerHTML={{ __html: emailTemplate }}
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Preview updates in real-time as you type
            </div>
          </div>
          
          {/* Dynamic Input Section - Switches between Prompt and HTML Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {isPromptMode ? "AI Prompt" : "HTML Code"}
              </label>
              {isPromptMode && (
                <button
                  onClick={() => setIsPromptMode(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  ← Back to HTML Code
                </button>
              )}
            </div>
            
            {isPromptMode ? (
              // AI Prompt Input Mode
              <div>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your email in detail for AI generation (e.g., 'A sophisticated welcome email for healthcare professionals, highlighting our advanced rate tracking dashboard, featuring social proof from industry leaders, with compelling CTAs for immediate engagement')"
                  className="w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <p className="text-sm text-purple-800">
                    <strong>💡 Pro Tip:</strong> Be specific about your audience, tone, and goals. Include details about industry context, target demographics, and desired outcomes for the best results.
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    <strong>🔧 Troubleshooting:</strong> If you encounter errors, check the console for detailed information. Common issues include API rate limits or quota limits.
                  </p>
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <button
                    onClick={generateAITemplate}
                    disabled={!aiPrompt.trim() || isGenerating}
                    className={`px-6 py-2 rounded-md text-white font-medium ${
                      !aiPrompt.trim() || isGenerating
                        ? "bg-purple-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    <span className="flex items-center">
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating Template...
                        </>
                      ) : (
                        <>
                          <span className="mr-1">✨</span>
                          Generate Template
                        </>
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setAiPrompt("");
                      setIsPromptMode(false);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // HTML Code Input Mode
              <div>
                <textarea
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  placeholder="Paste your HTML email code here..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="mt-2 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setEmailTemplate(sampleHtmlTemplate)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Load Sample Template
                  </button>
                  <button
                    onClick={() => setEmailTemplate("")}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsPromptMode(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                  >
                    <span className="flex items-center">
                      <span className="mr-1">✨</span>
                      Generate with AI
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Status Display */}
          {aiStatus && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              aiStatus.type === "success" 
                ? "bg-green-100 text-green-800 border border-green-200"
                : aiStatus.type === "error"
                ? "bg-red-100 text-red-800 border border-red-200 font-mono"
                : "bg-blue-100 text-blue-800 border border-blue-200"
            }`}>
              {aiStatus.message}
              {aiStatus.type === "error" && (
                <div className="mt-2 text-xs text-red-600">
                  💡 Check the browser console for detailed error information
                  {aiStatus.message.includes("rate limit") && (
                    <div className="mt-1">
                      ⏱️ <strong>Solution:</strong> You've hit the API rate limit. Wait a bit longer before trying again.
                    </div>
                  )}
                  {aiStatus.message.includes("quota") && (
                    <div className="mt-1">
                      💳 <strong>Solution:</strong> API quota exceeded. Contact support if this persists.
                    </div>
                  )}
                  {aiStatus.message.includes("insufficient_quota") && (
                    <div className="mt-1">
                      💳 <strong>Solution:</strong> OpenAI quota exceeded. Contact support to upgrade your plan.
                    </div>
                  )}
                  {aiStatus.message.includes("model_not_found") && (
                    <div className="mt-1">
                      🔧 <strong>Solution:</strong> Model configuration issue. Contact support immediately.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* AI Generation Status - Only show when in prompt mode */}
          {isGenerating && isPromptMode && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center text-purple-800">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                <span className="text-sm font-medium">AI is generating your email template...</span>
              </div>
            </div>
          )}
        </div>

        {/* Email Sending Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-[#012C61] mb-4">Send Email Campaign</h4>
          
          {/* Email Subject Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Enter email subject line..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Send Buttons */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => sendEmailCampaign("test")}
              disabled={!emailTemplate.trim() || !emailSubject.trim() || isSending}
              className={`px-6 py-3 rounded-md text-white font-medium ${
                !emailTemplate.trim() || !emailSubject.trim() || isSending
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isSending && sendingTo === "test" ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to Test Users...
                </span>
              ) : (
                "📧 Send to Test Users"
              )}
            </button>
            
            <button
              onClick={() => sendEmailCampaign("marketing")}
              disabled={!emailTemplate.trim() || !emailSubject.trim() || isSending}
              className={`px-6 py-3 rounded-md text-white font-medium ${
                !emailTemplate.trim() || !emailSubject.trim() || isSending
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSending && sendingTo === "marketing" ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to Marketing List...
                </span>
              ) : (
                "📢 Send to Marketing List"
              )}
            </button>
          </div>

          {/* Sending Logs */}
          {sendingLogs.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Sending Logs</h5>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {sendingLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-sm p-2 rounded ${
                      log.type === "success"
                        ? "bg-green-100 text-green-800"
                        : log.type === "error"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    <span className="font-mono text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {" - "}
                    {log.message}
                  </div>
                ))}
              </div>
              {isSending && (
                <div className="mt-2 text-sm text-gray-600">
                  Sending in progress... {sendingProgress.current}/{sendingProgress.total} emails sent
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
