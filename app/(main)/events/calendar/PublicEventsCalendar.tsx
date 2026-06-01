"use client";

// Reuses the dashboard's react-big-calendar machinery (CalendarWithSkeleton →
// CalendarTestClient) verbatim — same look, motion, and category colour-coding
// — but public and read-only (no `user`, so slot-creation is off; events open
// their source URL on click). A category filter row sits on top.
//
// Filtering is client-side: the server ships every approved event once, and
// switching category just re-filters in memory. The big calendar caches its
// event list in local state, so we force a clean re-init per category via the
// `key` on its wrapper rather than mutating its internals.

import CalendarWithSkeleton from "@/app/(dashboard)/dashboard/calendar/CalendarWithSkeleton";
import { EVENT_CATEGORIES, EVENT_CATEGORY_COLORS, type EventCategorySlug, isEventCategorySlug } from "@/lib/events/categories";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useMemo, useRef, useState } from "react";

interface PublicCalendarEvent {
	id: number | string;
	title: string;
	start: Date;
	end: Date;
	city?: string;
	url?: string;
	categorySlugs?: string[];
}

interface PublicEventsCalendarProps {
	initialEvents: PublicCalendarEvent[];
	serverNow: Date;
}

const CHIP_BASE =
	"inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40";
const CHIP_INACTIVE =
	"border-navy-frame text-navy-tone hover:bg-navy-veil/40 hover:text-navy dark:border-navy-edge dark:text-navy-dim dark:hover:bg-navy-tint/[0.08] dark:hover:text-navy-lifted";

export default function PublicEventsCalendar({ initialEvents, serverNow }: PublicEventsCalendarProps) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const initialCategory = (() => {
		const c = searchParams.get("category");
		return c && isEventCategorySlug(c) ? (c as EventCategorySlug) : null;
	})();
	const [category, setCategory] = useState<EventCategorySlug | null>(initialCategory);

	const filtered = useMemo(() => {
		if (!category) return initialEvents;
		// Keep only events in this category, AND hoist the active category to the
		// front of each event's slugs. The calendar colours an event by
		// categorySlugs[0], so without this a multi-category event (e.g.
		// [design, ai]) filtered under "AI" would still render in the design
		// colour. Reordering makes the block's colour match the chip you clicked.
		return initialEvents
			.filter((e) => (e.categorySlugs ?? []).includes(category))
			.map((e) => ({
				...e,
				categorySlugs: [category, ...(e.categorySlugs ?? []).filter((slug) => slug !== category)],
			}));
	}, [category, initialEvents]);

	// One view event on first mount (with whatever category the deep-link
	// carried). The ref guard stops React 18 StrictMode's double-invoke from
	// double-counting in dev.
	const viewedRef = useRef(false);
	useEffect(() => {
		if (viewedRef.current) return;
		viewedRef.current = true;
		posthog.capture("events_calendar_viewed", {
			category: category ?? "all",
			event_count: filtered.length,
		});
	}, [category, filtered.length]);

	const selectCategory = (next: EventCategorySlug | null) => {
		setCategory(next);
		// Keep the URL shareable (?category=design) without a full navigation —
		// replace() + scroll:false so the calendar doesn't jump.
		const params = new URLSearchParams(Array.from(searchParams.entries()));
		if (next) params.set("category", next);
		else params.delete("category");
		const qs = params.toString();
		router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

		const count = next ? initialEvents.filter((e) => (e.categorySlugs ?? []).includes(next)).length : initialEvents.length;
		posthog.capture("events_calendar_filtered", { category: next ?? "all", event_count: count });
	};

	return (
		<div className="space-y-6">
			<fieldset className="m-0 flex flex-wrap items-center gap-2 border-0 p-0">
				<legend className="sr-only">Filter calendar by category</legend>
				<button
					type="button"
					onClick={() => selectCategory(null)}
					aria-pressed={category === null}
					className={cn(
						CHIP_BASE,
						category === null
							? "border-navy bg-navy-tint text-navy dark:border-navy-tint/[0.45] dark:bg-navy-tint/[0.18] dark:text-navy-lifted"
							: CHIP_INACTIVE,
					)}
				>
					All events
				</button>
				{EVENT_CATEGORIES.map((c) => {
					const colors = EVENT_CATEGORY_COLORS[c.slug];
					const active = category === c.slug;
					return (
						<button
							key={c.slug}
							type="button"
							onClick={() => selectCategory(c.slug)}
							aria-pressed={active}
							className={cn(CHIP_BASE, active ? `border-transparent ${colors.chip}` : CHIP_INACTIVE)}
						>
							<span className={cn("h-2 w-2 rounded-full", colors.dot)} aria-hidden="true" />
							{c.name}
						</button>
					);
				})}
			</fieldset>

			<p className="text-sm text-muted-foreground" aria-live="polite">
				{filtered.length === 0
					? "No events in view for this category yet."
					: `Showing ${filtered.length} ${filtered.length === 1 ? "event" : "events"}${
							category ? ` in ${EVENT_CATEGORIES.find((c) => c.slug === category)?.name}` : ""
						}.`}
			</p>

			{/* key forces a clean re-init of the big calendar's internal event
			    state whenever the category changes. */}
			<div key={category ?? "all"}>
				<CalendarWithSkeleton initialEvents={filtered} serverNow={serverNow} />
			</div>
		</div>
	);
}
