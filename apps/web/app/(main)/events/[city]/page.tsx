import { Button } from "@/components/tailwind/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventsPageClient from "../EventsPageClient";

interface EventsCityPageProps {
  params: Promise<{
    city: string;
  }>;
}

// Revalidate every hour to keep data fresh
export const revalidate = 3600;

// Generate metadata for SEO (borrowed pattern from posts)
export async function generateMetadata({ params }: EventsCityPageProps): Promise<Metadata> {
  const { city } = await params;
  const decodedCity = decodeURIComponent(city).toLowerCase();
  const displayCity = decodedCity.charAt(0).toUpperCase() + decodedCity.slice(1);

  // You could fetch event count here if needed
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .gte("start_time", today.toISOString())
    .ilike("city", decodedCity);

  const description = count
    ? `Discover ${count} upcoming tech and startup events in ${displayCity}. Find networking opportunities, workshops, and conferences.`
    : `Find upcoming tech and startup events in ${displayCity}. Stay updated with the latest networking opportunities and conferences.`;

  return {
    title: `Tech Events in ${displayCity} | Adamastor`,
    description,
    openGraph: {
      title: `Tech Events in ${displayCity}`,
      description,
      type: "website",
      locale: "pt_PT",
      alternateLocale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `Tech Events in ${displayCity}`,
      description,
    },
    // Add canonical URL to avoid duplicate content issues
    alternates: {
      canonical: `/events/${city.toLowerCase()}`,
    },
  };
}

/* export async function generateStaticParams() {
  try {
    const supabase = await createClient();

    // More efficient query - only select what we need
    const { data: cities, error } = await supabase
      .from("events")
      .select("city")
      .gte("start_time", new Date().toISOString())
      .order("city");

    if (error) {
      console.error("Error fetching cities for static params:", error);
      return [];
    }

    // Count events per city
    const cityCount = new Map<string, number>();

    cities?.forEach(({ city }) => {
      const normalizedCity = city.toLowerCase().trim();
      cityCount.set(normalizedCity, (cityCount.get(normalizedCity) || 0) + 1);
    });

    // Pre-render popular cities
    const citiesToPrerender = Array.from(cityCount.entries())
      .filter(([city, count]) => {
        // Always pre-render major cities regardless of event count
        const majorCities = ["lisboa", "porto", "braga", "coimbra"];
        return count >= 2 || majorCities.includes(city);
      })
      .map(([city]) => ({ city }));

    console.log(`Pre-rendering ${citiesToPrerender.length} city pages at build time`);

    return citiesToPrerender;
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
} */

export default async function EventsCityPage({ params }: EventsCityPageProps) {
  const { city } = await params;
  const decodedCity = decodeURIComponent(city).toLowerCase();

  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch events with better error handling
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .gte("start_time", today.toISOString())
    .ilike("city", decodedCity)
    .order("start_time", { ascending: true });

  // Use notFound() like the posts page does
  if (error) {
    console.error("Error fetching events:", error);
    notFound(); // This will show a 404 page
  }

  // For empty results, you might want to keep the current behavior
  // or also use notFound() depending on your UX preference
  if (!events || events.length === 0) {
    // Option 1: Show custom empty state (current approach)
    return (
      <div className="max-w-[750px] mx-auto px-4 animate-in">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#104357] dark:text-[#E3F2F7] [font-family:var(--font-default)] mb-4">
          No events found in {decodedCity.charAt(0).toUpperCase() + decodedCity.slice(1)}
        </h1>
        <p className="text-muted-foreground mb-8">Check back later or explore events in other cities.</p>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <a href="/events">View All Events</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/add-event">Submit an Event</a>
          </Button>
        </div>
      </div>
    );

    // Option 2: Use 404 for consistency
    // notFound();
  }

  return <EventsPageClient initialEvents={events} city={decodedCity} />;
}
