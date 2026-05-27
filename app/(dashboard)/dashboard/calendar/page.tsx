import CalendarWithSkeleton from "./CalendarWithSkeleton";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/authentication";
// Hoisted from CalendarTestClient so the stylesheet (incl. rbc's base CSS via @import)
// ships with the initial document, not the dynamic chunk. Avoids one-frame unstyled
// flash when the calendar's JS arrives before its CSS is applied.
import "./calendar-custom.css";

// Fetch window: 60 days back, 180 days (6mo) forward. Past matters less than
// future (organisers care about what's coming, not what shipped), so the
// asymmetry is intentional. Outside this window: empty cells; we can add
// on-demand re-fetch later if/when admins navigate past the edges.
const WINDOW_PAST_DAYS = 60;
const WINDOW_FUTURE_DAYS = 180;

export default async function CalendarTestPage() {
	// Create Supabase client on the server
	const supabase = await createClient();

	const now = new Date();
	const windowStart = new Date(now);
	windowStart.setDate(windowStart.getDate() - WINDOW_PAST_DAYS);
	const windowEnd = new Date(now);
	windowEnd.setDate(windowEnd.getDate() + WINDOW_FUTURE_DAYS);

	// Parallelize the two independent queries (user profile + events). Both
	// depend on `supabase` but not on each other — running them sequentially
	// added one unnecessary round-trip to the page's TTFB.
	//
	// `select()` lists only the columns the client actually renders. The
	// events table has scraped-source columns (banner_url, raw_data, status,
	// etc.) we don't need on this surface; explicit columns cut the
	// server→client serialization payload meaningfully, which matters more
	// once this calendar moves to public-facing surfaces.
	//
	// The windowed `gte` / `lte` cuts the payload from ~840 rows to ~100–200,
	// which compounds with the explicit column list to slash both SSR time
	// and hydration JS work.
	const [user, eventsResult] = await Promise.all([
		getUserProfile(supabase),
		supabase
			.from("events")
			.select("id, title, start_time, end_time, city, url, event_category_assignments(category_slug)")
			.gte("start_time", windowStart.toISOString())
			.lte("start_time", windowEnd.toISOString())
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
			<CalendarWithSkeleton initialEvents={calendarEvents} user={user} serverNow={now} />
		</div>
	);
}
