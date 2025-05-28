import { createClient } from "@/lib/supabase/server";
import { MapPinIcon } from "lucide-react";
import Link from "next/link";

function formatShortDate(date: string | Date) {
  const d = new Date(date);
  const day = d.toLocaleDateString("en-US", { day: "numeric" });
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  return `${month} ${day}, ${weekday}`;
}

export default async function EventsByCityPage({ params }: { params: { city: string } }) {
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
    return <div className="p-4">No upcoming events found in {params.city}.</div>;
  }

  let lastDate: string | null = null;

  return (
    <div className="space-y-4 md:p-4">
      <h1 className="text-2xl font-bold mb-6 capitalize">Startup Events in {params.city}</h1>
      <div className="space-y-4">
        {events.map((event) => {
          const eventDate = new Date(event.start_time).toISOString().split("T")[0];
          const showDateHeading = eventDate !== lastDate;
          lastDate = eventDate;

          return (
            <div key={event.id} className="space-y-4">
              {showDateHeading && (
                <h2 className="text-lg font-semibold text-muted-foreground mt-6">
                  {formatShortDate(event.start_time)}
                </h2>
              )}

              <article className="group">
                <Link
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col sm:px-4 py-4 rounded-lg hover:bg-accent/50 transition-all animate-in border-l-4 border-[#04C9D8] rounded-l"
                >
                  <div className="flex gap-8 align-top ml-1">
                    <section className="space-y-3 mb-3">
                      <h3 className="text-xl font-bold group-hover:text-[#24acb5]">{event.title}</h3>
                      <p className="text-muted-foreground prose line-clamp-2">{event.description}</p>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <MapPinIcon className="h-5 w-5" />
                        {event.city.charAt(0).toUpperCase() + event.city.slice(1)}
                      </div>
                    </section>
                  </div>
                </Link>
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}
