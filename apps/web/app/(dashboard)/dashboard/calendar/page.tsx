import CalendarTestClient from './CalendarTestClient';
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/authentication";

export default async function CalendarTestPage() {
  // Create Supabase client on the server
  const supabase = await createClient();
  
  // Get user profile if needed for personalization
  const user = await getUserProfile(supabase);
  
  // Fetch events from the database
  // We'll get all events for now - you can add filters later
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    // Handle error appropriately
    return (
      <div className="container mx-auto animate-in w-screen">
        <div className="text-red-500">Error loading calendar events</div>
      </div>
    );
  }

  // Transform the events data to match what the calendar expects
  const calendarEvents = events?.map(event => ({
    id: event.id,
    title: event.title || event.name, // Adjust based on your schema
    start: new Date(event.start_time),
    end: event.end_time ? new Date(event.end_time) : new Date(event.start_time),
    // Add any additional fields you want to pass
    city: event.city,
    location: event.location,
    description: event.description
  })) || [];

  return (
    <div className="container mx-auto animate-in">
      <CalendarTestClient 
        initialEvents={calendarEvents} 
        user={user}
      />
    </div>
  );
}