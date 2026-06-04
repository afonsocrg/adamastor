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
import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
		"A live calendar of upcoming startup, design, product, software engineering, and AI events across Portugal. Filter by city and category to plan around what's already on.",
	alternates: { canonical: "/events/calendar" },
	openGraph: {
		title: "Events Calendar | Adamastor",
		description: "Upcoming tech and startup events across Portugal. Filter by city and category to plan around clashes.",
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
		description: "Upcoming tech and startup events across Portugal. Filter by city and category to plan around clashes.",
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

	const calendarEvents = (events ?? [])
		// Online events are excluded entirely: the calendar is a collision planner
		// for physical, city-bound events, and an online webinar has no geographic
		// clash with a meetup in Porto. Keeping them would only inflate every
		// city's count with noise. (The listing routes + the .ics feed still carry
		// online events — this exclusion is specific to the planning view.)
		.filter((event) => (event.city ?? "").trim().toLowerCase() !== "online")
		.map((event) => {
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
					Find a date when your audience is free
				</h1>
				<p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
					See what's already on in your city before you set your date. Filter by category to catch the events competing
					for the same audience, then pick a night that gives yours a clear run.
				</p>
			</header>

			{/* PublicEventsCalendar is a client component but no longer uses
			    useSearchParams (the ?category= deep-link is read from
			    window.location after mount), so it server-renders here — shipping
			    the calendar skeleton in the static HTML so it holds its height and
			    doesn't shift the footer on hydration (the cold-load CLS fix). */}
			<PublicEventsCalendar initialEvents={calendarEvents} serverNow={now} />

			{/* Plan -> promote. The calendar above is the free planning tool; this is
			    the natural next step once an organiser has a clear date. It mirrors
			    the reciprocal "Plan your event" link the submit page already points
			    back here, closing the loop. Every claim is grounded in a real
			    offering (per-category newsletters, personal review by the three
			    founders) — no invented reach numbers, per the brand's no-quantify rule. */}
			<section
				aria-labelledby="submit-cta-heading"
				className="rounded-lg bg-navy-veil p-6 md:p-8 dark:bg-navy-tint/[0.06] dark:ring-1 dark:ring-navy-edge"
			>
				<div className="max-w-2xl space-y-2">
					<h2
						id="submit-cta-heading"
						className="text-2xl font-bold text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)]"
					>
						Got your date? Now fill the room.
					</h2>
					<p className="text-base leading-relaxed text-navy dark:text-navy-dim">
						Once it's on Adamastor, your event reaches people already looking for somewhere worth showing up to, instead
						of scrolling past it in a feed.
					</p>
				</div>

				<ul className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-3">
					<li className="space-y-1">
						<h3 className="text-sm font-semibold text-navy dark:text-navy-lifted">It lands in the right inbox</h3>
						<p className="text-sm leading-relaxed text-navy-tone dark:text-navy-dim">
							A design event goes out in the design newsletter; software engineering, AI, product, and startups each
							have their own. Yours reaches people who asked for exactly this.
						</p>
					</li>
					<li className="space-y-1">
						<h3 className="text-sm font-semibold text-navy dark:text-navy-lifted">It carries a curator's stamp</h3>
						<p className="text-sm leading-relaxed text-navy-tone dark:text-navy-dim">
							We don't list everything. An event on Adamastor reads as one worth showing up to, not one more line in a
							feed.
						</p>
					</li>
					<li className="space-y-1">
						<h3 className="text-sm font-semibold text-navy dark:text-navy-lifted">It's chosen by people who run the scene</h3>
						<p className="text-sm leading-relaxed text-navy-tone dark:text-navy-dim">
							Carlos runs Founder Institute Portugal, Afonso leads Startup Grind Lisbon, and Malik runs LisboaJS and
							LisboaUX. Your event is read by the people building Portugal's scene.
						</p>
					</li>
				</ul>

				<div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
					<Link
						href="/events/submit"
						className="inline-flex items-center gap-2 self-start rounded-full bg-gold-hue px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-shade focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						Submit your event
						<ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
					</Link>
					<div className="flex items-center gap-3">
						<div className="flex shrink-0 -space-x-2">
							<Image
								src="/afonso.jpeg"
								alt="Afonso Gonçalves"
								width={32}
								height={32}
								className="h-8 w-8 rounded-full border-2 border-background object-cover"
							/>
							<Image
								src="/carlos.jpeg"
								alt="Carlos Resende"
								width={32}
								height={32}
								className="h-8 w-8 rounded-full border-2 border-background object-cover"
							/>
							<Image
								src="/malik.jpeg"
								alt="Malik Piara"
								width={32}
								height={32}
								className="h-8 w-8 rounded-full border-2 border-background object-cover"
							/>
						</div>
						<p className="text-sm text-navy-tone dark:text-navy-dim">Reviewed by the three of us, within a couple of hours.</p>
					</div>
				</div>
			</section>
		</div>
	);
}
