"use client";

import { CategoryNewsletterCta } from "@/components/category-newsletter-cta";
import { EventCard } from "@/components/EventCard";
import { EventCalendar } from "@/components/event-calendar";
import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";
import { buildEventsRoutePath } from "@/lib/events/route-slugs";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

const EVENTS_TIMEZONE = "Europe/Lisbon";
const SELECTABLE_CITIES = ["lisboa", "porto", "braga", "coimbra", "online"] as const;

function getDayKey(date: string | Date) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: EVENTS_TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date(date));
}

function getRelativeDayLabel(date: string | Date) {
	const targetKey = getDayKey(date);
	const now = new Date();
	const todayKey = getDayKey(now);
	const tomorrowKey = getDayKey(new Date(now.getTime() + 24 * 60 * 60 * 1000));

	if (targetKey === todayKey) {
		return "Today";
	}

	if (targetKey === tomorrowKey) {
		return "Tomorrow";
	}

	return null;
}

function formatAbsoluteEventDate(date: string | Date) {
	const d = new Date(date);
	return d.toLocaleDateString("en-US", {
		timeZone: EVENTS_TIMEZONE,
		day: "numeric",
		month: "long",
		weekday: "long",
	});
}

function formatEventDate(date: string | Date, withRelativeLabels = true) {
	if (!withRelativeLabels) {
		return formatAbsoluteEventDate(date);
	}

	const relativeDayLabel = getRelativeDayLabel(date);

	if (relativeDayLabel) {
		return relativeDayLabel;
	}

	return formatAbsoluteEventDate(date);
}

/**
 * Two-tone day header (Luma-style): primary label leads ("Today" /
 * "Tomorrow" / "26 May") with the weekday following in a quieter color
 * ("Monday"). On the server (pre-hydration) we skip the relative label so
 * the day still renders before JS runs, but skip the weekday split to
 * avoid mismatch — both parts collapse into one.
 */
function getEventDateParts(
	date: string | Date,
	withRelativeLabels: boolean,
): { primary: string; secondary: string | null } {
	const d = new Date(date);

	if (!withRelativeLabels) {
		// Pre-hydration: keep it single-part to dodge hydration drift.
		return { primary: formatAbsoluteEventDate(d), secondary: null };
	}

	const relativeDayLabel = getRelativeDayLabel(d);
	const weekday = d.toLocaleDateString("en-US", { timeZone: EVENTS_TIMEZONE, weekday: "long" });

	if (relativeDayLabel) {
		return { primary: relativeDayLabel, secondary: weekday };
	}

	const dayMonth = d.toLocaleDateString("en-GB", { timeZone: EVENTS_TIMEZONE, day: "numeric", month: "long" });
	return { primary: dayMonth, secondary: weekday };
}

// Helper function to check if two dates are on the same day
function isSameDay(date1: Date, date2: Date) {
	return getDayKey(date1) === getDayKey(date2);
}

interface Event {
	id: string;
	title: string;
	description: string;
	start_time: string;
	city: string;
	url: string;
	banner_url?: string;
	event_category_assignments?: {
		category_slug: string;
	}[];
}

export interface EventsPageLockedFilter {
	city?: string | null;
	category?: EventCategorySlug | null;
}

interface EventsPageProps {
	/** Events already pre-filtered server-side to match `lockedFilter`. */
	initialEvents: Event[];
	categoryFilteringEnabled: boolean;
	/** Filter dimensions baked into the current route. */
	lockedFilter?: EventsPageLockedFilter;
	/**
	 * Per-route intro paragraph (rendered as a lead under the h1). Gives
	 * each programmatic route distinguishing content beyond the events list,
	 * which programmatic-SEO best practice requires to avoid thin-content
	 * penalties across the route matrix.
	 */
	intro?: string;
}

function formatCityLabel(city: string) {
	return city.charAt(0).toUpperCase() + city.slice(1);
}

function formatCategoryLabel(categorySlug: EventCategorySlug) {
	return EVENT_CATEGORIES.find((category) => category.slug === categorySlug)?.name ?? categorySlug;
}

export default function EventsPageClient({
	initialEvents,
	categoryFilteringEnabled,
	lockedFilter,
	intro,
}: EventsPageProps) {
	const [events, setEvents] = useState<Event[]>(initialEvents);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [pageLoadTime] = useState(Date.now());
	const [hasClickedEvent, setHasClickedEvent] = useState(false);
	const [hasHydrated, setHasHydrated] = useState(false);
	const router = useRouter();

	const lockedCity = lockedFilter?.city ?? null;
	const lockedCategory = lockedFilter?.category ?? null;

	// Wrapping the filter-chip navigation in a transition lets React keep the
	// current page interactive while the new route loads, and lets us paint
	// optimistic feedback (the clicked chip flips to active immediately even
	// though `lockedFilter` won't reflect the new route until the transition
	// completes).
	const [isPending, startTransition] = useTransition();
	const [pendingHref, setPendingHref] = useState<string | null>(null);

	useEffect(() => {
		if (!isPending) setPendingHref(null);
	}, [isPending]);

	useEffect(() => {
		setEvents(initialEvents);
	}, [initialEvents]);

	useEffect(() => {
		setHasHydrated(true);
	}, []);

	// Date filtering is the only client-side dimension; city/category come
	// from the route segment and are already applied server-side.
	const filteredEvents = useMemo(() => {
		if (!selectedDate) return events;
		return events.filter((event) => isSameDay(new Date(event.start_time), selectedDate));
	}, [events, selectedDate]);

	const eventDates = useMemo(() => events.map((event) => new Date(event.start_time)), [events]);

	// Group filtered events by their local day key so each day's events can
	// share a single sticky `<h2>` (the date header). Previously every event
	// was its own wrapper and the conditional date heading only stuck for
	// the first event of the day — making "sticky" effectively useless past
	// the first card.
	const eventsByDay = useMemo(() => {
		const groups = new Map<string, Event[]>();
		for (const event of filteredEvents) {
			const dateKey = new Date(event.start_time).toISOString().split("T")[0];
			const bucket = groups.get(dateKey);
			if (bucket) bucket.push(event);
			else groups.set(dateKey, [event]);
		}
		return [...groups.entries()];
	}, [filteredEvents]);

	// Track when events listing is loaded/changed
	useEffect(() => {
		posthog.capture("events_listing_loaded", {
			city_filter: lockedCity ?? "all",
			category_filter: lockedCategory ?? "all",
			has_date_filter: !!selectedDate,
			total_events_shown: filteredEvents.length,
			has_results: filteredEvents.length > 0,
		});
	}, [lockedCity, lockedCategory, selectedDate, filteredEvents.length]);

	// Track zero clicks on page leave
	useEffect(() => {
		const handlePageLeave = () => {
			if (!hasClickedEvent) {
				posthog.capture("events_page_abandoned", {
					city_filter: lockedCity ?? "all",
					category_filter: lockedCategory ?? "all",
					had_date_filter: !!selectedDate,
					events_shown_count: filteredEvents.length,
					time_on_page_seconds: Math.round((Date.now() - pageLoadTime) / 1000),
				});
			}
		};

		window.addEventListener("beforeunload", handlePageLeave);

		return () => {
			window.removeEventListener("beforeunload", handlePageLeave);
			handlePageLeave();
		};
	}, [hasClickedEvent, lockedCity, lockedCategory, selectedDate, filteredEvents.length, pageLoadTime]);

	const cityHref = (city: string | null) => buildEventsRoutePath({ city, category: lockedCategory });
	const categoryHref = (category: EventCategorySlug | null) => buildEventsRoutePath({ city: lockedCity, category });

	const currentHref = buildEventsRoutePath({ city: lockedCity, category: lockedCategory });

	// While a navigation is in flight, treat the destination chip as active.
	// This produces an instant visual flip on click instead of waiting for the
	// route to load and lockedFilter to update.
	const activeHref = pendingHref ?? currentHref;

	// Intercept plain clicks so navigation runs inside startTransition (keeps
	// the current page interactive). Modifier-key clicks (cmd/ctrl/shift,
	// middle-button) fall through to the browser's default link handling so
	// "open in new tab" keeps working.
	const handleChipClick =
		(href: string, captureAnalytics: () => void) => (event: ReactMouseEvent<HTMLAnchorElement>) => {
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			if (event.button !== 0) return;

			event.preventDefault();
			captureAnalytics();
			setPendingHref(href);
			startTransition(() => {
				router.replace(href, { scroll: false });
			});
		};

	const cityClickHandler = (city: string | "all") => {
		const href = cityHref(city === "all" ? null : city);
		return handleChipClick(href, () => posthog.capture("city_filter", { city, category: lockedCategory ?? "all" }));
	};

	const categoryClickHandler = (category: EventCategorySlug | "all") => {
		const href = categoryHref(category === "all" ? null : category);
		return handleChipClick(href, () => posthog.capture("category_filter", { city: lockedCity ?? "all", category }));
	};

	// City tab: edition-level scope switcher (Lisboa / Porto / Online).
	// Active = navy-bold with a navy underline — architectural, NOT cyan.
	// The single cyan moment per fold belongs to the active category chip
	// below, per docs/design-system.md "one highlight per fold."
	const cityTabClass = (isActive: boolean) =>
		cn(
			"inline-flex items-center text-sm leading-6 pb-1 transition-colors duration-150 ease motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded",
			isActive
				? "font-semibold text-navy dark:text-[#E3F2F7] border-b-2 border-navy dark:border-[#E3F2F7]"
				: "text-navy-pastel hover:text-navy dark:text-[rgba(158,210,225,0.7)] dark:hover:text-[#E3F2F7] border-b-2 border-transparent",
		);

	// Category pill chip: browseable lens, active state is THE cyan moment.
	// Inactive = outlined navy-faded with muted text. Active = filled
	// cyan-faded with cyan-darker text. See docs/design-system.md.
	const categoryChipClass = (isActive: boolean) =>
		cn(
			"inline-flex items-center rounded-full border px-4 py-2 text-sm leading-none transition-colors duration-150 ease motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			isActive
				? "border-cyan bg-cyan-faded text-cyan-darker font-semibold dark:border-[rgba(4,201,216,0.4)] dark:bg-[rgba(4,201,216,0.12)] dark:text-[#4ce4f0]"
				: "border-navy-faded text-navy-pastel hover:text-navy hover:border-navy-pastel dark:border-[rgba(76,228,240,0.15)] dark:text-[rgba(158,210,225,0.7)] dark:hover:text-[#E3F2F7]",
		);

	// Handle calendar date click
	const handleDateClick = (date: Date) => {
		const hasEvents = eventDates.some((eventDate) => isSameDay(eventDate, date));

		if (hasEvents) {
			if (selectedDate && isSameDay(selectedDate, date)) {
				setSelectedDate(null);
			} else {
				setSelectedDate(date);
			}
		}
	};

	const clearFilter = () => {
		setSelectedDate(null);
	};

	const handleDeleteEvent = async (eventId: string) => {
		try {
			const response = await fetch(`/api/events/${eventId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete event");
			}

			setEvents(events.filter((event) => event.id !== eventId));
			toast.success("Event deleted successfully");
			router.refresh();
		} catch (error) {
			console.error("Error deleting event:", error);
			toast.error("Failed to delete event");
		}
	};

	return (
		<div className="space-y-10 md:p-4">
			{/* City scope — small edition-style tab row above the H1. City is a
			    persistent context (you're in Lisboa, you stay there) and is
			    already reflected in the URL + H1; treating it as a tab row
			    rather than a sidebar filter matches that role. The H1 changes
			    based on the active city. */}
			<nav
				aria-label="City"
				className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-navy-faded dark:border-[rgba(76,228,240,0.12)]"
			>
				<Link
					href={cityHref(null)}
					replace
					scroll={false}
					onClick={cityClickHandler("all")}
					className={cityTabClass(activeHref === cityHref(null))}
				>
					Everywhere
				</Link>
				{SELECTABLE_CITIES.map((city) => (
					<Link
						key={city}
						href={cityHref(city)}
						replace
						scroll={false}
						onClick={cityClickHandler(city)}
						className={cityTabClass(activeHref === cityHref(city))}
					>
						{formatCityLabel(city)}
					</Link>
				))}
			</nav>

			{/* 5:3 ratio (8-col grid) so the sidebar has room for the
			    calendar's 7-day grid. Gap is lg:gap-20 (80px) for editorial
			    breathing room. Header (H1 + dek) lives INSIDE the events
			    column so the sidebar top aligns with the H1 baseline —
			    pulls calendar + subscribe above the fold and frames the
			    page as one composition. */}
			<div className="grid grid-cols-1 lg:grid-cols-8 gap-8 lg:gap-20">
				{/* Events column. Header + category chips + events list. The
				    navy-faded rail runs down the left edge of the events
				    list below the chips — chips and header sit outside the
				    rail. */}
				<div className="order-2 lg:order-1 lg:col-span-5 space-y-8">
					{/* Header: title + intro as one "headline + dek" block.
					    No CTA — subscribe lives in the sidebar; submit-your-
					    event lives in the editorial coda at the end of the
					    list. Keeping the header pure lets the H1 actually
					    act as a page title. */}
					<header className="space-y-3">
						<h1 className="text-3xl font-bold tracking-tight leading-tight text-[#104357] [text-wrap:pretty] dark:text-[#E3F2F7] [font-family:var(--font-lora-bold)]">
							{selectedDate
								? `Events for ${formatEventDate(selectedDate, hasHydrated)}`
								: lockedCategory && lockedCity
									? `${formatCategoryLabel(lockedCategory)} Events in ${formatCityLabel(lockedCity)}`
									: lockedCategory
										? `${formatCategoryLabel(lockedCategory)} Events`
										: lockedCity
											? `Events in ${formatCityLabel(lockedCity)}`
											: "Events"}
						</h1>

						{intro && !selectedDate ? (
							<p className="max-w-[70ch] text-base leading-relaxed text-muted-foreground [text-wrap:pretty]">
								{intro}
							</p>
						) : null}
					</header>
					{categoryFilteringEnabled ? (
						<nav aria-label="Categories" className="flex flex-wrap gap-2">
							<Link
								href={categoryHref(null)}
								replace
								scroll={false}
								onClick={categoryClickHandler("all")}
								className={categoryChipClass(activeHref === categoryHref(null))}
							>
								All
							</Link>
							{EVENT_CATEGORIES.map((category) => (
								<Link
									key={category.slug}
									href={categoryHref(category.slug)}
									replace
									scroll={false}
									onClick={categoryClickHandler(category.slug)}
									className={categoryChipClass(activeHref === categoryHref(category.slug))}
								>
									{category.name}
								</Link>
							))}
						</nav>
					) : null}

					{selectedDate ? (
						<div className="flex items-center justify-between rounded-md bg-navy-faded dark:bg-[rgba(76,228,240,0.06)] px-4 py-2 text-sm">
							<span className="text-navy dark:text-[#E3F2F7]">
								Filtering by <span className="font-semibold">{formatEventDate(selectedDate, hasHydrated)}</span>
							</span>
							<button
								type="button"
								onClick={clearFilter}
								className="text-navy-pastel hover:text-navy dark:text-[rgba(158,210,225,0.7)] dark:hover:text-[#E3F2F7] transition-colors"
							>
								Clear
							</button>
						</div>
					) : null}

					<div className="border-l border-navy-faded dark:border-[rgba(76,228,240,0.12)] pl-8 space-y-10">
					{filteredEvents.length === 0 ? (
						selectedDate ? (
							// Date-filter empty state: user has applied a filter,
							// just needs to clear it. Dashed border = "transient
							// filter result" not "the page is empty."
							<div className="rounded-md border border-dashed border-navy-faded dark:border-[rgba(76,228,240,0.18)] px-6 py-10 text-center text-base leading-relaxed text-muted-foreground">
								No events found for {formatEventDate(selectedDate, hasHydrated)}
							</div>
						) : (
							// Content-gap empty state: no events scheduled for this
							// city/category at all. High-intent moment — visitors
							// here are either looking for events OR are potential
							// organisers. Turn the gap into an organiser-acquisition
							// prompt instead of a dead "no results" message.
							<div className="rounded-lg border border-navy-faded bg-navy-faded/40 dark:border-[rgba(76,228,240,0.12)] dark:bg-[rgba(76,228,240,0.04)] px-6 py-10 text-center">
								<h2 className="text-xl font-bold text-navy dark:text-[#E3F2F7] [font-family:var(--font-lora-bold)]">
									{lockedCategory && lockedCity
										? `No upcoming ${formatCategoryLabel(lockedCategory)} events in ${formatCityLabel(lockedCity)}`
										: lockedCategory
											? `No upcoming ${formatCategoryLabel(lockedCategory)} events`
											: lockedCity
												? `No upcoming events in ${formatCityLabel(lockedCity)}`
												: "No upcoming events"}
								</h2>
								<p className="mt-3 text-base leading-relaxed text-muted-foreground">
									Organising one?{" "}
									<Link
										href="/events/submit"
										className="font-medium text-navy underline underline-offset-4 decoration-cyan decoration-2 hover:text-cyan-darker dark:text-[#E3F2F7] dark:hover:text-cyan transition-colors"
									>
										Submit it
									</Link>{" "}
									— it'll show up here.
								</p>
							</div>
						)
					) : (
						eventsByDay.map(([dateKey, dayEvents]) => {
							// Two-tone day header — primary lead ("Tomorrow" /
							// "26 May") in navy weight, weekday secondary in
							// muted text. See getEventDateParts above.
							const dateParts = getEventDateParts(dayEvents[0].start_time, hasHydrated);
							return (
								<section key={dateKey} className="space-y-4">
									{!selectedDate && (
										// `relative` so the cyan dot can anchor onto
										// the parent column's navy-faded rail. Dot
										// lives on the day header, not on every
										// event — matches Luma's pattern of marking
										// day transitions visually.
										<h2 className="sticky top-0 z-10 bg-background py-3 text-base flex gap-2 items-baseline relative">
											<span
												aria-hidden="true"
												className="absolute left-[-2rem] top-[1.25rem] h-2 w-2 -translate-x-1/2 rounded-full bg-cyan"
											/>
											<time dateTime={dateKey} className="font-semibold text-navy dark:text-[#E3F2F7]">
												{dateParts.primary}
											</time>
											{dateParts.secondary ? (
												<span className="text-navy-pastel dark:text-[rgba(158,210,225,0.7)]">{dateParts.secondary}</span>
											) : null}
										</h2>
									)}

									{dayEvents.map((event) => (
										<EventCard
											key={event.id}
											event={event}
											onEventClick={() => {
												setHasClickedEvent(true);
												posthog.capture("event_clicked", {
													event_id: event.id,
													event_title: event.title,
													event_city: event.city,
													event_date: event.start_time,
													position_in_list: filteredEvents.indexOf(event),
													has_date_filter: !!selectedDate,
													city_filter: lockedCity ?? "all",
													category_filter: lockedCategory ?? "all",
												});
											}}
											onDelete={handleDeleteEvent}
										/>
									))}
								</section>
							);
						})
					)}

					{/* Editorial contribution prompt — sits at the END of the
					    events list as a natural "you just browsed, now
					    contribute" moment. Hidden when filtering by date
					    (less contextual). */}
					{!selectedDate && filteredEvents.length > 0 ? (
						<div className="pt-6 border-t border-navy-faded dark:border-[rgba(76,228,240,0.12)]">
							<p className="text-base leading-relaxed text-muted-foreground">
								Don't see your event?{" "}
								<Link
									href="/events/submit"
									className="font-medium text-navy underline underline-offset-4 decoration-cyan decoration-2 hover:text-cyan-darker dark:text-[#E3F2F7] dark:hover:text-cyan transition-colors"
								>
									Submit it
								</Link>
							</p>
						</div>
					) : null}
					</div>
				</div>

				{/* Sidebar — calendar + a quiet outlined subscribe block.
				    Both filter sections moved out (city → tabs above H1,
				    category → chips above events list). What's left is
				    atmosphere + the one editorial "ask." */}
				<div className="order-1 lg:order-2 lg:col-span-3">
					<aside className="flex flex-col gap-6 lg:sticky lg:top-4">
						{/* Calendar gets the same outlined-card treatment as the
						    subscribe block below so the sidebar reads as a stack
						    of twin editorial modules, not two unrelated things.
						    Legend sits inside the card so dot-meaning stays
						    paired with the calendar that owns it. */}
						<div className="rounded-lg border border-navy-faded dark:border-[rgba(76,228,240,0.18)] p-2">
							<EventCalendar eventDates={eventDates} onDateClick={handleDateClick} selectedDate={selectedDate} />
							<div className="px-2 pb-2 space-y-2 text-xs leading-5 text-muted-foreground">
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-navy dark:bg-[#E3F2F7]" />
									<span>Days with events (click to filter)</span>
								</div>
								{selectedDate && (
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-cyan-darker" />
										<span>Selected date</span>
									</div>
								)}
							</div>
						</div>

						{/* Subscribe block: when browsing a specific category, offer
						    an inline single-step subscribe to JUST that category
						    (CategoryNewsletterCta). Otherwise, link to /preferences
						    where visitors pick multiple categories. Either way:
						    outlined navy block, orange reserved for the arrow tip
						    as the warmth accent. Never competes with H1 or active
						    chip for attention. */}
						{lockedCategory ? (
							<CategoryNewsletterCta
								categorySlug={lockedCategory}
								categoryName={formatCategoryLabel(lockedCategory)}
							/>
						) : (
							<div className="rounded-lg border border-navy-faded p-5 dark:border-[rgba(76,228,240,0.18)]">
								<h2 className="text-lg font-bold text-navy dark:text-[#E3F2F7] [font-family:var(--font-lora-bold)]">
									Events in your inbox
								</h2>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
									Pick the categories you care about — we'll send you a weekly digest.
								</p>
								<Link
									href="/preferences"
									className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-cyan-darker dark:text-[#E3F2F7] dark:hover:text-cyan transition-colors"
								>
									Subscribe
									<ArrowRightIcon className="h-4 w-4 text-orange-main" aria-hidden="true" />
								</Link>
							</div>
						)}
					</aside>
				</div>
			</div>
		</div>
	);
}
