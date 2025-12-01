import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
    const projectId = process.env.POSTHOG_PROJECT_ID;
    const host = process.env.POSTHOG_API_HOST;
    // Hardcode your insight ID here
    const insightId = '974616'; // Replace with your actual insight ID

    // Validate that we have all required credentials
    if (!apiKey || !projectId || !insightId) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Construct the PostHog API URL for fetching insight data
    const url = `${host}/api/projects/${projectId}/insights/${insightId}`;
    
    console.log('Fetching insight from:', url); // Debug log

    // Make the request to PostHog
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PostHog API error:', response.status, errorText);
      return NextResponse.json(
        { error: `PostHog API error: ${response.status}` },
        { status: response.status }
      );
    }

    // Parse the response
    const insightData = await response.json();
    
    // Log the structure to understand it better
    console.log('Insight structure:', JSON.stringify(insightData, null, 2));

    // Extract WAU value - this structure may vary based on your insight type
    let wauValue = 0;
    
    // For trends insights (line/bar charts)
    if (insightData.result && Array.isArray(insightData.result)) {
      const latestResult = insightData.result[0];
      if (latestResult?.data && Array.isArray(latestResult.data)) {
        // Get the most recent value (last item in the array)
        wauValue = latestResult.data[latestResult.data.length - 2] || 0; // -2 = last week
      }
    }
    
    // For number insights (single value)
    else if (insightData.result?.value !== undefined) {
      wauValue = insightData.result.value;
    }
    
    // For funnel insights
    else if (insightData.result?.steps) {
      wauValue = insightData.result.steps[0]?.count || 0;
    }

    // Return the formatted response
    return NextResponse.json({
      wau: wauValue,
      insightName: insightData.name || 'Weekly Active Users',
      lastRefresh: insightData.last_refresh || new Date().toISOString(),
      insightId: insightData.id,
      // Include debug info - remove in production
      debug: {
        resultStructure: insightData.result ? Object.keys(insightData.result) : null,
        filters: insightData.filters,
      }
    });

  } catch (error) {
    console.error('Error fetching WAU insight:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WAU data', details: error.message },
      { status: 500 }
    );
  }
}

// Optional: Cache the response for 5 minutes to reduce API calls
export const revalidate = 300;