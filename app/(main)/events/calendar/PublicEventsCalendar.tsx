"use client";

// Reuses the dashboard's react-big-calendar machinery (CalendarWithSkeleton →
// CalendarTestClient) verbatim — same look, motion, and category colour-coding
// — but public and read-only (no `user`, so slot-creation is off; events open
// their source URL on click). A city tab row + a category chip row sit on top.
//
// City scope is the PRIMARY filter: the calendar is a collision-planning tool,
// and a Porto organiser doesn't care about Lisboa events, so it defaults to one
// city (Lisboa) rather than a mixed all-Portugal view. "Everywhere" stays an
// explicit, non-default escape hatch for the macro/sponsor scan. Category is the
// secondary lens within the chosen city.
//
// Filtering is client-side: the server ships every approved event once, and
// switching city/category just re-filters in memory (filterCalendarEvents). The
// big calendar caches its event list in local state, so we force a clean
// re-init per scope via the `key` on its wrapper rather than mutating internals.

import CalendarWithSkeleton from "@/app/(dashboard)/dashboard/calendar/CalendarWithSkeleton";
import { filterCalendarEvents } from "@/lib/events/calendar-filter";
import { EVENT_CATEGORIES, EVENT_CATEGORY_COLORS, type EventCategorySlug, isEventCategorySlug } from "@/lib/events/categories";
import { SELECTABLE_CITIES, formatCityLabel } from "@/lib/events/route-slugs";
import type { WorldCupCalendarEvent } from "@/lib/events/world-cup-fixtures";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
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
	// Portugal's World Cup games + the final — a fixed gold ⚽ overlay merged in
	// after city/category filtering, so a national kickoff shows in every scope.
	fixtureEvents: WorldCupCalendarEvent[];
	serverNow: Date;
}

// The calendar SERVER-RENDERS scoped to this city (see the state note below).
// Lisboa is the dominant market (~56% of in-window events), so it's the most
// useful default landing scope.
const DEFAULT_CITY = "lisboa";
// "Everywhere" sentinel used in the URL + localStorage so it round-trips
// distinctly from "no choice yet" (which falls back to DEFAULT_CITY).
const EVERYWHERE = "all";
const CITY_STORAGE_KEY = "adamastor:events-calendar-city";

// The calendar scopes only physical cities — "online" is dropped from the
// shared SELECTABLE_CITIES (online events are excluded from the data in
// page.tsx, since they have no geographic collision relevance). A ?city=online
// link or a stale remembered "online" therefore falls back to the default.
const CALENDAR_CITIES = SELECTABLE_CITIES.filter((city) => city !== "online");
const CALENDAR_CITY_SET = new Set<string>(CALENDAR_CITIES);
const isCalendarCity = (slug: string) => CALENDAR_CITY_SET.has(slug);

const CHIP_BASE =
	"inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40";
const CHIP_INACTIVE =
	"border-navy-frame text-navy-tone hover:bg-navy-veil/40 hover:text-navy dark:border-navy-edge dark:text-navy-dim dark:hover:bg-navy-tint/[0.08] dark:hover:text-navy-lifted";

// City scope reads as a tab row (matching the persistent /events tab row in
// EventsLayoutShell) so it signals a bigger scope decision than the category
// chips below it. Static active border — no sliding underline here, which keeps
// this self-contained.
const CITY_TAB_BASE =
	"inline-flex items-center text-sm leading-6 pb-2 shrink-0 whitespace-nowrap border-b-2 transition-colors duration-150 ease motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 focus-visible:rounded";
const CITY_TAB_ACTIVE = "font-semibold text-navy dark:text-navy-lifted border-navy dark:border-navy-lifted";
const CITY_TAB_INACTIVE =
	"text-navy-tone hover:text-navy dark:text-navy-dim/[0.7] dark:hover:text-navy-lifted border-transparent";

export default function PublicEventsCalendar({ initialEvents, fixtureEvents, serverNow }: PublicEventsCalendarProps) {
	const router = useRouter();
	const pathname = usePathname();

	// city === null  → "Everywhere" (no city scope).
	// city === slug  → scoped to that one city.
	//
	// Both states default so this component SERVER-RENDERS (reading the deep-link
	// or localStorage via useSearchParams/window during render would force the
	// whole subtree client-only and reintroduce the cold-load CLS the calendar
	// skeleton was built to avoid). The calendar's height is identical across any
	// scope, so adjusting these after mount is a filter change, never a layout
	// shift. The ?city= / ?category= deep-link + the remembered city are applied
	// just after mount below.
	const [city, setCity] = useState<string | null>(DEFAULT_CITY);
	const [category, setCategory] = useState<EventCategorySlug | null>(null);

	// One mount pass: resolve the initial scope (URL > remembered > default),
	// apply it, and fire a single view event with the resolved scope. The ref
	// guard stops React 18 StrictMode's double-invoke from double-counting in dev.
	const viewedRef = useRef(false);
	useEffect(() => {
		if (viewedRef.current) return;
		viewedRef.current = true;

		const params = new URLSearchParams(window.location.search);

		// City precedence: explicit ?city= link wins, then the organiser's last
		// remembered pick, otherwise the Lisboa default already in state.
		let resolvedCity: string | null = DEFAULT_CITY;
		const cityParam = params.get("city");
		const remembered = window.localStorage.getItem(CITY_STORAGE_KEY);
		if (cityParam === EVERYWHERE) resolvedCity = null;
		else if (cityParam && isCalendarCity(cityParam)) resolvedCity = cityParam;
		else if (remembered === EVERYWHERE) resolvedCity = null;
		else if (remembered && isCalendarCity(remembered)) resolvedCity = remembered;

		const categoryParam = params.get("category");
		const resolvedCategory = categoryParam && isEventCategorySlug(categoryParam) ? (categoryParam as EventCategorySlug) : null;

		if (resolvedCity !== DEFAULT_CITY) setCity(resolvedCity);
		if (resolvedCategory) setCategory(resolvedCategory);

		posthog.capture("events_calendar_viewed", {
			city: resolvedCity ?? EVERYWHERE,
			category: resolvedCategory ?? "all",
			event_count: filterCalendarEvents(initialEvents, { city: resolvedCity, category: resolvedCategory }).length,
		});
	}, []);

	const filtered = useMemo(
		() => filterCalendarEvents(initialEvents, { city, category }),
		[city, category, initialEvents],
	);

	// World Cup fixtures are national context, not community competition: they
	// bypass the city + category filters entirely (merged here, after filtering)
	// so a Porto organiser scoping to Porto, or anyone filtering to "AI", still
	// sees the kickoffs they need to plan around. The "Showing N events" count
	// below stays community-only — fixtures are an always-on overlay, not part
	// of what's competing for the audience.
	const calendarEvents = useMemo(() => [...fixtureEvents, ...filtered], [fixtureEvents, filtered]);

	// Keep the URL shareable (?city=porto&category=design) without a full
	// navigation, and remember the city so a returning organiser lands back on
	// their scope. replace() + scroll:false so the calendar doesn't jump.
	const syncUrl = (params: URLSearchParams) => {
		const qs = params.toString();
		router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
	};

	const selectCity = (next: string | null) => {
		setCity(next);
		const params = new URLSearchParams(window.location.search);
		params.set("city", next ?? EVERYWHERE);
		syncUrl(params);
		window.localStorage.setItem(CITY_STORAGE_KEY, next ?? EVERYWHERE);

		posthog.capture("events_calendar_filtered", {
			filter: "city",
			city: next ?? EVERYWHERE,
			category: category ?? "all",
			event_count: filterCalendarEvents(initialEvents, { city: next, category }).length,
		});
	};

	const selectCategory = (next: EventCategorySlug | null) => {
		setCategory(next);
		const params = new URLSearchParams(window.location.search);
		if (next) params.set("category", next);
		else params.delete("category");
		syncUrl(params);

		posthog.capture("events_calendar_filtered", {
			filter: "category",
			city: city ?? EVERYWHERE,
			category: next ?? "all",
			event_count: filterCalendarEvents(initialEvents, { city, category: next }).length,
		});
	};

	const cityName = city ? formatCityLabel(city) : null;
	const categoryName = category ? EVENT_CATEGORIES.find((c) => c.slug === category)?.name : null;
	// "across Portugal" / "in Porto" — reads naturally in the live-region summary.
	const scopeLabel = city ? `in ${cityName}` : "across Portugal";

	return (
		<div className="space-y-6">
			{/* City scope — primary filter, styled as a tab row to read as a bigger
			    decision than the category chips. */}
			<nav
				aria-label="City"
				className="overflow-x-auto -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-x-visible sm:-mx-0 sm:px-0 border-b border-navy-frame dark:border-navy-edge"
			>
				<div className="flex min-w-full w-max items-center gap-x-6 gap-y-1 sm:w-auto sm:flex-wrap">
					<button
						type="button"
						onClick={() => selectCity(null)}
						aria-pressed={city === null}
						className={cn(CITY_TAB_BASE, city === null ? CITY_TAB_ACTIVE : CITY_TAB_INACTIVE)}
					>
						Everywhere
					</button>
					{CALENDAR_CITIES.map((c) => {
						const active = city === c;
						return (
							<button
								key={c}
								type="button"
								onClick={() => selectCity(c)}
								aria-pressed={active}
								className={cn(CITY_TAB_BASE, active ? CITY_TAB_ACTIVE : CITY_TAB_INACTIVE)}
							>
								{formatCityLabel(c)}
							</button>
						);
					})}
				</div>
			</nav>

			{/* Category — secondary lens within the chosen city. */}
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
					All categories
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
					? `No${categoryName ? ` ${categoryName.toLowerCase()}` : ""} events ${scopeLabel} in view yet.`
					: `Showing ${filtered.length} ${categoryName ? `${categoryName.toLowerCase()} ` : ""}${
							filtered.length === 1 ? "event" : "events"
						} ${scopeLabel}.`}
			</p>

			{/* Legend for the gold overlay — only while fixtures are in the window,
			    so it disappears once the tournament is past. Explains the markers an
			    organiser is about to see across every city + category. */}
			{fixtureEvents.length > 0 && (
				<p className="text-xs text-muted-foreground">
					<span aria-hidden="true">⚽</span>{" "}
					<span className="font-semibold text-navy dark:text-navy-lifted">Portugal's World Cup</span> games and the final
					are marked in gold. The whole country watches, so plan around kickoff.
				</p>
			)}

			{/* key forces a clean re-init of the big calendar's internal event state
			    whenever the scope changes. */}
			<div key={`${city ?? EVERYWHERE}:${category ?? "all"}`}>
				<CalendarWithSkeleton initialEvents={calendarEvents} serverNow={serverNow} />
			</div>
		</div>
	);
}
