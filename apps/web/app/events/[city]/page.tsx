import { createClient } from "@/lib/supabase/server";
import CityEventsPageClient from "./CityEventsPageClient";

interface PageProps {
  params: {
    city: string;
  };
}

export default async function EventsByCityPage({ params }: PageProps) {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .gte("start_time", today.toISOString())
    .ilike("city", params.city) // case-insensitive match
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    return <div>Error loading events</div>;
  }

  if (!events || events.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 capitalize">Startup Events in {params.city}</h1>
        <p>No upcoming events found in {params.city}.</p>
      </div>
    );
  }

  return <CityEventsPageClient initialEvents={events} city={params.city} />;
}
