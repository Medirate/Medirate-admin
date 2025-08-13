import { NextRequest, NextResponse } from "next/server";

const BREVO_API_KEY = process.env.BREVO_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!BREVO_API_KEY) {
      return NextResponse.json({ error: "Brevo API key not configured" }, { status: 500 });
    }

    // Get parameters from request body
    const body = await req.json();
    const days = parseInt(body.days?.toString() || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    console.log(`📅 Fetching analytics for date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Call Brevo's aggregated report endpoint for real analytics data
    const aggregatedUrl = new URL('https://api.brevo.com/v3/smtp/statistics/aggregatedReport');
    aggregatedUrl.searchParams.set('startDate', startDate.toISOString().split('T')[0]);
    aggregatedUrl.searchParams.set('endDate', endDate.toISOString().split('T')[0]);

    console.log('🔍 Fetching from Brevo aggregated report:', aggregatedUrl.toString());

    const aggregatedResponse = await fetch(aggregatedUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY,
      },
    });

    let aggregatedData = null;
    let aggregatedError = null;

    if (!aggregatedResponse.ok) {
      const errorText = await aggregatedResponse.text();
      console.error("❌ Brevo aggregated report API error:", aggregatedResponse.status, errorText);
      aggregatedError = `Brevo API error: ${aggregatedResponse.status} ${errorText}`;
    } else {
      aggregatedData = await aggregatedResponse.json();
      console.log(`✅ Retrieved aggregated data from Brevo:`, aggregatedData);
    }

    // Also get recent events for daily breakdown
    const eventsUrl = new URL('https://api.brevo.com/v3/smtp/statistics/events');
    eventsUrl.searchParams.set('limit', '100');
    eventsUrl.searchParams.set('startDate', startDate.toISOString().split('T')[0]);
    eventsUrl.searchParams.set('endDate', endDate.toISOString().split('T')[0]);

    console.log('🔍 Fetching events from Brevo:', eventsUrl.toString());

    const eventsResponse = await fetch(eventsUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY,
      },
    });

    let eventsData = null;
    let eventsError = null;

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error("❌ Brevo events API error:", eventsResponse.status, errorText);
      eventsError = `Brevo events API error: ${eventsResponse.status} ${errorText}`;
    } else {
      eventsData = await eventsResponse.json();
      console.log(`✅ Retrieved events data from Brevo:`, eventsData);
    }

    // Process daily stats from events
    const dailyStats = processDailyStats(eventsData?.events || [], startDate, endDate);

    // Create analytics response
    const analytics = {
      summary: {
        totalSent: aggregatedData?.requests || 0,
        totalOpened: aggregatedData?.opens || 0,
        totalClicked: aggregatedData?.clicks || 0,
        totalBounced: aggregatedData?.bounces || 0,
        openRate: aggregatedData?.requests > 0 ? ((aggregatedData.opens / aggregatedData.requests) * 100) : 0,
        clickRate: aggregatedData?.requests > 0 ? ((aggregatedData.clicks / aggregatedData.requests) * 100) : 0,
        bounceRate: aggregatedData?.requests > 0 ? ((aggregatedData.bounces / aggregatedData.requests) * 100) : 0,
      },
      dailyStats: dailyStats,
      recentEmails: eventsData?.events?.slice(0, 10) || [],
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days
      },
      debug: {
        aggregatedError,
        eventsError,
        message: aggregatedError || eventsError ? "Some data unavailable" : "All data retrieved successfully"
      }
    };

    console.log("✅ Analytics processed successfully:", {
      summary: analytics.summary,
      dailyStatsCount: dailyStats.length,
      recentEmailsCount: analytics.recentEmails.length,
      aggregatedError,
      eventsError
    });

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error("Error fetching email analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch email analytics" },
      { status: 500 }
    );
  }
}

// Helper function to process daily stats from events
function processDailyStats(events: any[], startDate: Date, endDate: Date) {
  const dailyStats: { [key: string]: { sent: number; opened: number; clicked: number; bounced: number } } = {};
  
  // Initialize all dates in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dailyStats[dateKey] = { sent: 0, opened: 0, clicked: 0, bounced: 0 };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Process events
  events.forEach((event: any) => {
    const eventDate = event.date?.split('T')[0];
    if (eventDate && dailyStats[eventDate]) {
      switch (event.event) {
        case 'sent':
        case 'delivered':
          dailyStats[eventDate].sent++;
          break;
        case 'opened':
          dailyStats[eventDate].opened++;
          break;
        case 'clicked':
          dailyStats[eventDate].clicked++;
          break;
        case 'bounce':
        case 'blocked':
          dailyStats[eventDate].bounced++;
          break;
      }
    }
  });

  // Convert to array format
  return Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    ...stats
  }));
}
