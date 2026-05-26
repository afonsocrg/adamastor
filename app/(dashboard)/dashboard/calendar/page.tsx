import CalendarTestClient from "./CalendarTestClient";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/authentication";

export default async function CalendarTestPage() {
	// Create Supabase client on the server
	const supabase = await createClient();

	// Parallelize the two independent queries (user profile + events). Both
	// depend on `supabase` but not on each other — running them sequentially
	// added one unnecessary round-trip to the page's TTFB.
	//
	// `select()` lists only the columns the client actually renders. The
	// events table has scraped-source columns (banner_url, raw_data, status,
	// etc.) we don't need on this surface; explicit columns cut the
	// server→client serialization payload meaningfully, which matters more
	// once this calendar moves to public-facing surfaces.
	const [user, eventsResult] = await Promise.all([
		getUserProfile(supabase),
		supabase
			.from("events")
			.select("id, title, start_time, end_time, city, url, event_category_assignments(category_slug)")
			.order("start_time", { ascending: true }),
	]);

	const { data: events, error } = eventsResult;

	if (error) {
		console.error("Error fetching events:", error);
		// Handle error appropriately
		return (
			<div className="container mx-auto animate-in w-screen">
				<div className="text-red-500">Error loading calendar events</div>
			</div>
		);
	}

	// Transform the events data to match what the calendar expects.
	//
	// end_time is nullable in the DB (organisers don't always know when an event
	// wraps). When missing we default to start + 2h so the block has visible
	// height — needed for the overlap visualisation to work. 2h is the
	// assumed-typical Lisbon tech meetup length; tune here if it stops matching
	// what you see in the data.
	const FALLBACK_DURATION_MS = 2 * 60 * 60 * 1000;
	const calendarEvents =
		events?.map((event) => {
			const start = new Date(event.start_time);
			const assignments = (event.event_category_assignments ?? []) as { category_slug: string }[];
			return {
				id: event.id,
				title: event.title,
				start,
				end: event.end_time ? new Date(event.end_time) : new Date(start.getTime() + FALLBACK_DURATION_MS),
				city: event.city,
				url: event.url ?? undefined,
				categorySlugs: assignments.map((a) => a.category_slug),
			};
		}) || [];

	return (
		<div>
			<CalendarTestClient initialEvents={calendarEvents} user={user} />
		</div>
	);
}
