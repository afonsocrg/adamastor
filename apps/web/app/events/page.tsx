import { createClient } from "@/lib/supabase/server";
import EventsPageClient from "./EventsPageClient";
import { getUserProfile } from "@/lib/supabase/authentication";

export default async function EventsPage() {
  const supabase = await createClient();
  const user = await getUserProfile(supabase);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to 00:00:00.000

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .gte("start_time", today.toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    return <div>Error loading events</div>;
  }

  return <EventsPageClient initialEvents={events || []} user={user} />;
}
