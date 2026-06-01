"use client";

import { EventCard } from "@/components/EventCard";
import { CategoryNewsletterCta } from "@/components/category-newsletter-cta";
import { EventCalendar } from "@/components/event-calendar";
import { EVENT_CATEGORIES, EVENT_CATEGORY_COLORS, type EventCategorySlug } from "@/lib/events/categories";
import { buildEventsRoutePath } from "@/lib/events/route-slugs";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, CalendarDays, Check, Copy, Mail, MessageCircle, Rss } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

const EVENTS_TIMEZONE = "Europe/Lisbon";

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

	// Wrapping the category-chip navigation in a transition lets React keep the
	// current page interactive while the new route loads, and lets us paint
	// optimistic feedback (the clicked chip flips to active immediately even
	// though `lockedFilter` won't reflect the new route until the transition
	// completes). The city tab row lives in the layout shell now and owns its
	// own transition; this one drives the category chips below.
	const [isPending, startTransition] = useTransition();
	const [pendingHref, setPendingHref] = useState<string | null>(null);
	const [copiedFeedUrl, setCopiedFeedUrl] = useState(false);
	const [copiedSlackCmd, setCopiedSlackCmd] = useState(false);

	// The category chip row scrolls horizontally on mobile; on deep-links the
	// active chip can land off-screen, so we auto-centre it whenever the active
	// route changes (manual scrollLeft, not scrollIntoView, to avoid shifting
	// the whole page).
	const categoryNavRef = useRef<HTMLElement>(null);

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

	const categoryHref = (category: EventCategorySlug | null) => buildEventsRoutePath({ city: lockedCity, category });

	const currentHref = buildEventsRoutePath({ city: lockedCity, category: lockedCategory });

	// While a navigation is in flight, treat the destination chip as active.
	// This produces an instant visual flip on click instead of waiting for the
	// route to load and lockedFilter to update.
	const activeHref = pendingHref ?? currentHref;

	useEffect(() => {
		const nav = categoryNavRef.current;
		if (!nav) return;
		const active = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
		if (!active) return;
		const target = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
		nav.scrollLeft = Math.max(0, target);
	}, [activeHref]);

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

	const categoryClickHandler = (category: EventCategorySlug | "all") => {
		const href = categoryHref(category === "all" ? null : category);
		return handleChipClick(href, () => posthog.capture("category_filter", { city: lockedCity ?? "all", category }));
	};

	// Category pill chip: the browseable topic lens, and the primary action on
	// this page. Colour-coded to match the public calendar (EVENT_CATEGORY_COLORS):
	// every chip carries its topic dot, and the active chip fills with the topic
	// colour. Bigger tap target (py-2.5) than the city tabs because selecting a
	// topic is the action we most want users to take.
	const categoryChipClass = (isActive: boolean, activeColor: string) =>
		cn(
			"inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm leading-none shrink-0 whitespace-nowrap transition-colors duration-150 ease motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			isActive
				? `border-transparent font-semibold ${activeColor}`
				: "border-navy-frame text-navy-tone hover:text-navy hover:border-navy-tone dark:border-navy-edge dark:text-navy-dim/[0.7] dark:hover:text-navy-lifted",
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

	// Calendar card — rendered twice for responsive placement: inline above
	// the events list on mobile (so the date filter is found before the long
	// scroll), and in the desktop right rail. The visibility class keeps only
	// the breakpoint-appropriate copy shown; EventCalendar hides its own
	// non-matching half (strip vs month grid) internally.
	const renderCalendarCard = (visibilityClass?: string) => (
		<div className={cn("rounded-md border border-navy-frame p-2 dark:border-navy-edge", visibilityClass)}>
			<EventCalendar eventDates={eventDates} onDateClick={handleDateClick} selectedDate={selectedDate} />
			<div className="px-2 pb-2 space-y-2 text-xs leading-5 text-navy-tone dark:text-navy-dim">
				<div className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-navy dark:bg-navy-lifted" />
					<span>Days with events (click to filter)</span>
				</div>
				{selectedDate && (
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-navy-tint border border-navy" />
						<span>Selected date</span>
					</div>
				)}
			</div>
		</div>
	);

	// 5:3 ratio (8-col grid) so the sidebar has room for the calendar's 7-day
	// grid; lg:gap-20 (80px) for editorial breathing room. The H1 + dek live
	// INSIDE the events column so the sidebar top aligns with the H1 baseline,
	// framing the page as one composition. The city tab row that used to sit
	// above this grid now lives in the layout shell (EventsLayoutShell) so it
	// persists across filter navigations instead of remounting.
	return (
		<div className="grid grid-cols-1 lg:grid-cols-8 gap-8 lg:gap-20" aria-busy={isPending}>
			{/* Events column. Header + category chips + events list. The
				    navy-wash rail runs down the left edge of the events
				    list below the chips — chips and header sit outside the
				    rail. Mobile: order-1 so the H1 "Events" lands above
				    the fold; the sidebar (calendar + subscribe) becomes a
				    coda below the list. Desktop: order-1 keeps the events
				    in the left 5-column slot. */}
			<div className="order-1 lg:col-span-5 space-y-6 md:space-y-8">
				{/* Header: title + intro as one "headline + dek" block.
					    No CTA — subscribe lives in the sidebar; submit-your-
					    event lives in the editorial coda at the end of the
					    list. Keeping the header pure lets the H1 actually
					    act as a page title. */}
				<header className="space-y-3 pb-2 pt-2">
					<h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight text-navy [text-wrap:balance] dark:text-navy-lifted [font-family:var(--font-lora-bold)]">
						{selectedDate
							? `Events for ${formatEventDate(selectedDate, hasHydrated)}`
							: lockedCategory && lockedCity
								? lockedCity === "online"
									? `Online ${formatCategoryLabel(lockedCategory)} Events`
									: `${formatCategoryLabel(lockedCategory)} Events in ${formatCityLabel(lockedCity)}`
								: lockedCategory
									? `${formatCategoryLabel(lockedCategory)} Events`
									: lockedCity
										? lockedCity === "online"
											? "Online Events"
											: `Events in ${formatCityLabel(lockedCity)}`
										: "Events"}
					</h1>

					{intro && !selectedDate ? (
						<p className="max-w-[60ch] text-sm md:text-base leading-snug md:leading-relaxed text-navy-tone [text-wrap:pretty] dark:text-navy-dim">
							{intro}
						</p>
					) : null}
				</header>
				{categoryFilteringEnabled ? (
					// Topic band: a labelled, colour-coded control surface that reads
					// as the page's primary action rather than quiet pills under the
					// title. Stays below the H1 so the page title still leads (the
					// editorial register), but its label + topic colours give it
					// clear presence in the hierarchy.
					<div className="space-y-2.5">
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-navy-dim">
							Browse by topic
						</p>
						{/* Scroll breakout: on mobile the row scrolls edge-to-edge with a
						    right-edge fade hinting at more topics off-screen; at sm+ it
						    wraps and the fade is hidden. */}
						<div className="relative -mx-4 sm:mx-0">
							<nav
								ref={categoryNavRef}
								aria-label="Categories"
								className="flex gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-x-visible sm:px-0"
							>
								{EVENT_CATEGORIES.map((category) => {
									const isActive = activeHref === categoryHref(category.slug);
									const colors = EVENT_CATEGORY_COLORS[category.slug];
									return (
										<Link
											key={category.slug}
											href={isActive ? categoryHref(null) : categoryHref(category.slug)}
											replace
											scroll={false}
											onClick={categoryClickHandler(isActive ? "all" : category.slug)}
											aria-current={isActive ? "page" : undefined}
											className={categoryChipClass(isActive, colors.chip)}
										>
											<span className={cn("h-2 w-2 rounded-full", colors.dot)} aria-hidden="true" />
											{category.name}
										</Link>
									);
								})}
							</nav>
							<div
								className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent sm:hidden"
								aria-hidden="true"
							/>
						</div>
					</div>
				) : null}

				{/* Mobile: the calendar lives here, above the list, so the date
					    filter is actually discovered (on desktop it sits in the
					    right rail instead — see renderCalendarCard). */}
				{renderCalendarCard("lg:hidden")}

				{selectedDate ? (
					<div className="flex items-center justify-between rounded-md bg-navy-veil/40 dark:bg-navy-tint/[0.06] px-4 py-2 text-sm">
						<span className="text-navy dark:text-navy-lifted">
							Filtering by <span className="font-semibold">{formatEventDate(selectedDate, hasHydrated)}</span>
						</span>
						<button
							type="button"
							onClick={clearFilter}
							className="-mx-2 -my-1 rounded-md px-2 py-1 text-navy-tone transition-colors hover:bg-navy-veil/40 hover:text-navy dark:text-navy-dim/[0.7] dark:hover:bg-navy-tint/[0.04] dark:hover:text-navy-lifted"
						>
							Clear
						</button>
					</div>
				) : null}

				<div className="border-l border-navy-frame dark:border-navy-edge pl-4 md:pl-8 space-y-6 md:space-y-10">
					{filteredEvents.length === 0 ? (
						selectedDate ? (
							// Date-filter empty state: user has applied a filter,
							// just needs to clear it. Dashed border = "transient
							// filter result" not "the page is empty."
							<div className="rounded-md border border-dashed border-navy-frame dark:border-navy-edge px-6 py-10 text-center text-base leading-relaxed text-navy-tone dark:text-navy-dim">
								No events found for {formatEventDate(selectedDate, hasHydrated)}
							</div>
						) : (
							// Content-gap empty state: no events scheduled for this
							// city/category at all. High-intent moment — visitors
							// here are either looking for events OR are potential
							// organisers. Turn the gap into an organiser-acquisition
							// prompt instead of a dead "no results" message.
							<div className="rounded-md border border-navy-frame bg-navy-veil/40 dark:border-navy-edge dark:bg-navy-tint/[0.04] px-6 py-10 text-center">
								<h2 className="text-lg font-bold tracking-tight text-navy dark:text-navy-lifted">
									{lockedCategory && lockedCity
										? `No upcoming ${formatCategoryLabel(lockedCategory)} events in ${formatCityLabel(lockedCity)}`
										: lockedCategory
											? `No upcoming ${formatCategoryLabel(lockedCategory)} events`
											: lockedCity
												? `No upcoming events in ${formatCityLabel(lockedCity)}`
												: "No upcoming events"}
								</h2>
								<p className="mt-3 text-base leading-relaxed text-navy-tone dark:text-navy-dim">
									Organising one?{" "}
									<Link
										href="/events/submit"
										className="font-medium text-navy underline underline-offset-4 decoration-navy-tint decoration-2 hover:decoration-navy dark:text-navy-lifted dark:decoration-navy-tint/[0.4] dark:hover:decoration-navy-tint transition-colors"
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
								<section key={dateKey} className="space-y-0 md:space-y-4">
									{!selectedDate && (
										// `relative` so the navy-tint dot can anchor onto
										// the parent column's navy-frame rail. Dot
										// lives on the day header, not on every
										// event — matches Luma's pattern of marking
										// day transitions visually.
										<h2 className="sticky top-0 z-10 bg-background py-3 text-base flex gap-2 items-baseline relative">
											<span
												aria-hidden="true"
												className="absolute left-[-1rem] md:left-[-2rem] top-[1.25rem] h-2 w-2 -translate-x-1/2 rounded-full bg-navy-tint"
											/>
											<time dateTime={dateKey} className="font-semibold text-navy dark:text-navy-lifted">
												{dateParts.primary}
											</time>
											{dateParts.secondary ? (
												<span className="text-navy-tone dark:text-navy-dim">{dateParts.secondary}</span>
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

					{/* Editorial coda — sits at the END of the events list as a
					    "you just browsed, now subscribe" moment. The RSS link
					    AND its label both re-point based on the active city +
					    category filter, so it's explicit about what scope is
					    being subscribed to (e.g. "Software Engineering events
					    in Coimbra" vs "all our events"). Hidden when filtering
					    by a single date (a date filter is transient — subscribing
					    to it makes no sense) and when the list is empty. */}
					{!selectedDate && filteredEvents.length > 0
						? (() => {
								const scopeLabel =
									lockedCategory && lockedCity
										? `${formatCategoryLabel(lockedCategory)} events in ${formatCityLabel(lockedCity)}`
										: lockedCategory
											? `${formatCategoryLabel(lockedCategory)} events`
											: lockedCity
												? `events in ${formatCityLabel(lockedCity)}`
												: "all our events";
								const rssHref = `${activeHref}/feed.xml`;
								const icsHref = `${activeHref}/calendar.ics`;
								// Absolute URLs are needed for (a) Google Calendar's render?cid= deep-link,
								// which Google's servers fetch directly, and (b) the in-prose Slack snippet.
								// We hardcode the production domain rather than reading window.location.origin
								// so the link works the same in SSR, dev, and prod — Google needs a publicly
								// reachable feed URL either way; localhost would never resolve.
								const SITE_URL = "https://adamastor.blog";
								const absoluteIcsUrl = `${SITE_URL}${icsHref}`;
								const googleCalUrl = `https://www.google.com/calendar/render?cid=${encodeURIComponent(absoluteIcsUrl)}`;
								// Uses Malik's piara.li URL shortener (Cloudflare Worker, KV-backed) so
								// the real phone number isn't exposed in page source. The `eos` worker
								// forwards inbound query params to the destination, so appending
								// `?text=<encoded message>` here pre-fills the WhatsApp draft message
								// once the redirect lands on wa.me.
								const whatsAppMessage = encodeURIComponent(
									`Hi Malik — I run a community / site and want to talk about sharing Adamastor events (${scopeLabel}).`,
								);
								const whatsAppUrl = `https://piara.li/wa?text=${whatsAppMessage}`;

								const handleCopyFeedUrl = async () => {
									try {
										await navigator.clipboard.writeText(`${window.location.origin}${rssHref}`);
										setCopiedFeedUrl(true);
										setTimeout(() => setCopiedFeedUrl(false), 2000);
									} catch {
										// Clipboard API can fail in older browsers / non-secure contexts;
										// silent fail is fine — the link is still visible via the RSS feed link.
									}
								};

								const slackCommand = `/feed subscribe ${SITE_URL}${rssHref}`;
								const handleCopySlackCmd = async () => {
									try {
										await navigator.clipboard.writeText(slackCommand);
										setCopiedSlackCmd(true);
										setTimeout(() => setCopiedSlackCmd(false), 2000);
									} catch {
										// silent fail
									}
								};

								// Quieter secondary-action treatment — small, muted text links sit
								// beneath the primary Google Calendar affordance. The visual demotion
								// signals "alternatives if Google Cal isn't your tool" without burying
								// them so deep that RSS power-users can't find them.
								const quietActionClass =
									"inline-flex items-center gap-1.5 text-xs font-medium text-navy-tone hover:text-navy hover:underline underline-offset-4 dark:text-navy-dim dark:hover:text-navy-lifted transition-colors";

								return (
									<div className="pt-6 border-t border-navy-frame dark:border-navy-edge space-y-8">
										{/* Block 1: personal subscription. The primary affordance is
										    "Add to Google Calendar" — calendars are where events live,
										    one-click subscribe is the broadest UX win, and the
										    secondary-button shape (outlined navy pill per design
										    system) gives it visual weight without claiming the page's
										    one gold-pill moment (still owned by the navbar Subscribe
										    for logged-out visitors). RSS / .ics / Copy URL stay as
										    quiet text links below for the niche cases. */}
										<div>
											<p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-navy-dim">
												Subscribe to {scopeLabel}
											</p>
											<a
												href={googleCalUrl}
												target="_blank"
												rel="noreferrer noopener"
												className="mt-4 inline-flex items-center gap-2 rounded-full border border-navy px-5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy-veil/40 dark:border-navy-lifted dark:text-navy-lifted dark:hover:bg-navy-tint/[0.06]"
											>
												<CalendarDays className="h-4 w-4" aria-hidden="true" />
												Add to Google Calendar
												<ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
											</a>
											<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
												<Link href={rssHref} className={quietActionClass}>
													<Rss className="h-3.5 w-3.5" aria-hidden="true" />
													RSS feed
												</Link>
												<Link href={icsHref} className={quietActionClass}>
													<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
													Other calendars (.ics)
												</Link>
												<button type="button" onClick={handleCopyFeedUrl} className={quietActionClass}>
													<span
														key={copiedFeedUrl ? "copied" : "idle"}
														className="state-crossfade inline-flex items-center gap-1.5"
													>
														{copiedFeedUrl ? (
															<Check className="h-3.5 w-3.5" aria-hidden="true" />
														) : (
															<Copy className="h-3.5 w-3.5" aria-hidden="true" />
														)}
														{copiedFeedUrl ? "Copied" : "Copy feed URL"}
													</span>
												</button>
											</div>
										</div>

										{/* Block 2: distribution ask for community leaders and niche
										    builders. Different audience, different mental mode — they're
										    not subscribing for themselves, they're considering syndicating
										    Adamastor content into their own surface. Lead with the benefit
										    framing ("your members get …"), close with a direct path to
										    Malik and a self-serve "how to add to Slack or Telegram"
										    disclosure for the channel admins who want to set it up
										    themselves without a 1:1 conversation. */}
										<div className="pt-6 border-t border-navy-frame dark:border-navy-edge">
											<p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-navy-dim">
												Run a community or building something?
											</p>
											<p className="mt-3 max-w-[60ch] text-sm md:text-base leading-snug md:leading-relaxed text-navy-tone dark:text-navy-dim">
												Add this feed to your Slack or Telegram channel and your members get curated {scopeLabel}{" "}
												delivered to the channel — no extra work for you, just the relevant ones. Embedding on your own
												site or want a custom feed? Send Malik a message.
											</p>
											<a
												href={whatsAppUrl}
												target="_blank"
												rel="noreferrer noopener"
												className="-mx-2 -my-1 mt-2 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-navy transition-colors hover:bg-navy-veil/40 dark:text-navy-lifted dark:hover:bg-navy-tint/[0.06]"
											>
												<MessageCircle className="h-4 w-4" aria-hidden="true" />
												Message Malik on WhatsApp
												<ArrowRightIcon className="h-4 w-4 text-orange-hue" aria-hidden="true" />
											</a>
											<details className="mt-4 group">
												<summary className="cursor-pointer text-sm text-navy-tone transition-colors hover:text-navy dark:text-navy-dim dark:hover:text-navy-lifted">
													How to add this feed to Slack or Telegram
												</summary>
												<div className="mt-3 space-y-3 text-sm leading-relaxed text-navy-tone dark:text-navy-dim">
													<p>
														<span className="font-semibold text-navy dark:text-navy-lifted">In Slack —</span> type{" "}
														<button
															type="button"
															onClick={handleCopySlackCmd}
															aria-label={
																copiedSlackCmd ? "Copied to clipboard" : "Click to copy Slack subscribe command"
															}
															className="inline-flex items-center gap-1.5 rounded bg-navy-veil/60 px-1.5 py-0.5 text-[0.85em] text-navy transition-colors hover:bg-navy-veil dark:bg-navy-tint/[0.08] dark:text-navy-lifted dark:hover:bg-navy-tint/[0.14]"
														>
															<code className="font-mono">{slackCommand}</code>
															<span key={copiedSlackCmd ? "copied" : "idle"} className="state-crossfade inline-flex">
																{copiedSlackCmd ? (
																	<Check className="h-3 w-3 text-green-hue" aria-hidden="true" />
																) : (
																	<Copy className="h-3 w-3 opacity-60" aria-hidden="true" />
																)}
															</span>
														</button>{" "}
														in any channel and new events post automatically.
													</p>
													<p>
														<span className="font-semibold text-navy dark:text-navy-lifted">In Telegram —</span> add an
														RSS bot (e.g. <em>@RssBot</em>, <em>@feedreaderbot</em>) to your channel, then subscribe to
														the RSS URL above.
													</p>
												</div>
											</details>
										</div>
									</div>
								);
							})()
						: null}
				</div>
			</div>

			{/* Sidebar — calendar + a quiet outlined subscribe block.
				    Both filter sections moved out (city → tabs above H1,
				    category → chips above events list). What's left is
				    atmosphere + the one editorial "ask." Mobile: order-2
				    so this stack reads as a coda below the events list
				    (events first; calendar + newsletter ask after). */}
			<div className="order-2 lg:col-span-3">
				<aside className="flex flex-col gap-6 lg:sticky lg:top-4">
					{/* Calendar gets the same outlined-card treatment as the
						    subscribe block below so the sidebar reads as a stack
						    of twin editorial modules. Desktop-only here: the mobile
						    copy is rendered inline above the events list. */}
					{renderCalendarCard("hidden lg:block")}

					{/* Subscribe block: when browsing a specific category, offer
						    an inline single-step subscribe to JUST that category
						    (CategoryNewsletterCta). Otherwise, link to /preferences
						    where visitors pick multiple categories. Either way:
						    outlined navy block, orange reserved for the arrow tip
						    as the warmth accent. Never competes with H1 or active
						    chip for attention. */}
					{lockedCategory ? (
						<CategoryNewsletterCta categorySlug={lockedCategory} categoryName={formatCategoryLabel(lockedCategory)} />
					) : (
						<div className="rounded-md border border-navy-frame p-5 dark:border-navy-edge">
							<Mail className="h-6 w-6 text-navy dark:text-navy-lifted" aria-hidden="true" />
							<h2 className="mt-3 text-[1.0625rem] font-bold tracking-tight text-navy [text-wrap:balance] dark:text-navy-lifted">
								Never miss an event again
							</h2>
							<p className="mt-2 text-sm leading-relaxed text-navy-tone dark:text-navy-dim">
								The events worth showing up to in Portugal. Sent weekly, in the topics you pick.
							</p>
							<Link
								href="/subscribe"
								className="-mx-2 -my-1 mt-4 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-navy transition-colors hover:bg-navy-veil/40 dark:text-navy-lifted dark:hover:bg-navy-tint/[0.06]"
							>
								Get the picks
								<ArrowRightIcon className="h-4 w-4 text-orange-hue" aria-hidden="true" />
							</Link>
						</div>
					)}
				</aside>
			</div>
		</div>
	);
}
