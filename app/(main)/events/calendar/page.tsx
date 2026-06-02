// Public, organiser-facing calendar — the same big-calendar view admins use,
// but read-only and filterable by category (design, software engineering, …).
// Lets organisers see what else is happening on a given day/category before
// they schedule, the same overlap awareness the same-day alert email gives
// after the fact.
//
// The rbc stylesheet (incl. its base CSS via @import) is imported here at the
// page level so it ships with the initial document, not the dynamic calendar
// chunk — same reasoning as the dashboard page, avoids an unstyled flash.
import "@/app/(dashboard)/dashboard/calendar/calendar-custom.css";

import { createPublicClient } from "@/lib/supabase/public";
import type { Metadata } from "next";
import PublicEventsCalendar from "./PublicEventsCalendar";

export const revalidate = 3600;

// Match the dashboard window: a little past context, lots of future. Organisers
// care about what's coming, not what shipped.
const WINDOW_PAST_DAYS = 30;
const WINDOW_FUTURE_DAYS = 180;
const FALLBACK_DURATION_MS = 2 * 60 * 60 * 1000;

export const metadata: Metadata = {
	title: "Events Calendar | Adamastor",
	description:
		"A live calendar of upcoming startup, design, product, software engineering, and AI events across Portugal. Filter by category to see what's on.",
	alternates: { canonical: "/events/calendar" },
	openGraph: {
		title: "Events Calendar | Adamastor",
		description: "Upcoming tech and startup events across Portugal, on one calendar. Filter by category.",
		url: "https://adamastor.blog/events/calendar",
		type: "website",
		siteName: "Adamastor",
		images: [
			{ url: "/og/events?title=Events+Calendar", width: 1200, height: 630, alt: "Adamastor Events Calendar" },
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Events Calendar | Adamastor",
		description: "Upcoming tech and startup events across Portugal, on one calendar. Filter by category.",
		images: ["/og/events?title=Events+Calendar"],
	},
};

export default async function PublicEventsCalendarPage() {
	const now = new Date();
	const windowStart = new Date(now);
	windowStart.setDate(windowStart.getDate() - WINDOW_PAST_DAYS);
	const windowEnd = new Date(now);
	windowEnd.setDate(windowEnd.getDate() + WINDOW_FUTURE_DAYS);

	const supabase = createPublicClient();
	const { data: events, error } = await supabase
		.from("events")
		.select("id, title, start_time, end_time, city, url, event_category_assignments(category_slug)")
		.eq("status", "approved")
		.gte("start_time", windowStart.toISOString())
		.lte("start_time", windowEnd.toISOString())
		.order("start_time", { ascending: true });

	if (error) {
		console.error("[events/calendar] failed to load events", error);
	}

	const calendarEvents = (events ?? []).map((event) => {
		const start = new Date(event.start_time);
		const assignments = (event.event_category_assignments ?? []) as { category_slug: string }[];
		return {
			id: event.id,
			title: event.title,
			start,
			end: event.end_time ? new Date(event.end_time) : new Date(start.getTime() + FALLBACK_DURATION_MS),
			city: event.city ?? undefined,
			url: event.url ?? undefined,
			categorySlugs: assignments.map((a) => a.category_slug),
		};
	});

	return (
		<div className="space-y-8 py-2">
			<header className="space-y-2">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-tone dark:text-navy-dim">
					Events Calendar
				</p>
				<h1 className="text-3xl font-bold text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)]">
					What's on across Portugal
				</h1>
				<p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
					Every approved event on one calendar. Filter by category to see what's already booked on a given day before
					you schedule yours.
				</p>
			</header>

			{/* PublicEventsCalendar is a client component but no longer uses
			    useSearchParams (the ?category= deep-link is read from
			    window.location after mount), so it server-renders here — shipping
			    the calendar skeleton in the static HTML so it holds its height and
			    doesn't shift the footer on hydration (the cold-load CLS fix). */}
			<PublicEventsCalendar initialEvents={calendarEvents} serverNow={now} />
		</div>
	);
}
