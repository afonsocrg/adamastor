import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/datetime";
import Link from "next/link";
import { Separator } from "@/components/tailwind/ui/separator";

export default async function EventsPage() {
  const supabase = await createClient();
  // TODO: add filters (show only upcoming events)
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    return <div>Error loading events</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold mb-6">Upcoming Events</h1>
      <div className="space-y-4">
        {events?.map((event) => (
          <article key={event.id} className="group">
            <Link
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col sm:px-4 py-4 rounded-lg hover:bg-accent/50 transition-all animate-in"
            >
              <div className="flex gap-8 align-top">
                {event.banner_url && (
                  <img
                    src={event.banner_url}
                    alt={event.title}
                    className="w-40 h-40 object-cover rounded-lg hidden sm:block"
                  />
                )}
                <section className="space-y-3 mb-3">
                  <h2 className="text-xl font-bold group-hover:text-[#24acb5] [font-family:var(--font-default)]">
                    {event.title}
                  </h2>
                  <p className="text-muted-foreground prose line-clamp-2">{event.description}</p>
                  <p className="text-muted-foreground text-sm">{formatDate(event.start_time)}</p>
                </section>
              </div>
            </Link>
            <Separator />
          </article>
        ))}
      </div>
    </div>
  );
}
