"use client";

import { EventCard } from "@/components/EventCard";
import { EventCalendar } from "@/components/event-calendar";
import { Button } from "@/components/tailwind/ui/button";
import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";
import { buildEventsRoutePath } from "@/lib/events/route-slugs";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

const EVENTS_TIMEZONE = "Europe/Lisbon";
const SELECTABLE_CITIES = ["lisboa", "porto", "online"] as const;

/**
 * Module-level flag for "have we ever mounted EventsPageClient in this
 * browser session?". Persists across component remounts (route navigation
 * within the events tree) because the module stays loaded, but resets on a
 * full page reload — which is when the entry animation should actually play.
 *
 * Lives outside the component intentionally: per-mount useState would reset
 * on every navigation, defeating the point.
 */
let hasMountedBefore = false;

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

	// Play the entry animation only on the very first mount in this browser
	// session. Subsequent route navigations (which re-mount this component)
	// skip the animation, which otherwise creates a visible flash on every
	// filter-chip click.
	const [shouldAnimate] = useState(!hasMountedBefore);
	useEffect(() => {
		hasMountedBefore = true;
	}, []);

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

	const filterButtonClass = (isActive: boolean) =>
		cn(
			"rounded-full border border-transparent bg-neutral-100 text-muted-foreground transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease hover:shadow-sm motion-reduce:transition-none motion-safe:active:scale-[0.98] dark:bg-[rgba(10,46,61,0.78)] dark:text-[rgba(158,210,225,0.82)] dark:hover:bg-[rgba(4,201,216,0.12)] dark:hover:text-[#4ce4f0]",
			isActive
				? "bg-[#dff6f7] text-[#28aeb8] hover:bg-[#dff6f7] hover:text-[#28aeb8] dark:border-[rgba(76,228,240,0.4)] dark:bg-[rgba(4,201,216,0.18)] dark:text-[#4ce4f0] dark:hover:bg-[rgba(4,201,216,0.18)] dark:hover:text-[#4ce4f0]"
				: "text-neutral-600 hover:text-neutral-900",
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

	let lastDate: string | null = null;

	return (
		<div className={cn("space-y-8 md:p-4", shouldAnimate && "animate-in")}>
			<div className="flex flex-col gap-3 pb-4 pt-2 sm:flex-row sm:items-start sm:justify-between md:pb-0">
				<h1 className="text-2xl font-extrabold tracking-tight leading-tight text-[#104357] [text-wrap:pretty] dark:text-[#E3F2F7]">
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

				<div className="flex flex-wrap items-center gap-2 self-start">
					<Button
						asChild
						variant="outline"
						className="rounded-md border-[#04C9D8] text-[#104357] hover:bg-[#DFF6F8] dark:border-[#04C9D8]/50 dark:text-[#E3F2F7] dark:hover:bg-[#04C9D8]/10"
					>
						<Link href="/events/submit">Submit your event</Link>
					</Button>
					{selectedDate && (
						<Button
							onClick={clearFilter}
							variant="default"
							className="rounded-md transition-[background-color,color,box-shadow,transform] duration-150 ease hover:shadow-sm motion-reduce:transition-none motion-safe:active:scale-[0.98]"
						>
							Show All Events
						</Button>
					)}
				</div>
			</div>

			{intro && !selectedDate ? (
				<p className="max-w-[70ch] text-base leading-relaxed text-muted-foreground [text-wrap:pretty]">{intro}</p>
			) : null}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Events List - Takes up 2/3 of the space on large screens */}
				<div className="order-2 space-y-4 lg:order-1 lg:col-span-2">
					{filteredEvents.length === 0 ? (
						<div className="rounded-md border border-dashed px-6 py-10 text-center text-base leading-relaxed text-muted-foreground">
							{selectedDate
								? `No events found for ${formatEventDate(selectedDate, hasHydrated)}`
								: "No upcoming events found"}
						</div>
					) : (
						filteredEvents?.map((event) => {
							const eventDate = new Date(event.start_time).toISOString().split("T")[0];
							const showDateHeading = eventDate !== lastDate && !selectedDate;
							lastDate = eventDate;

							return (
								<div key={event.id} className="space-y-4">
									{showDateHeading && (
										<h2 className="mt-6 text-lg font-semibold text-[#104357] dark:text-[#E3F2F7]">
											<time dateTime={new Date(event.start_time).toISOString().split("T")[0]}>
												{formatEventDate(event.start_time, hasHydrated)}
											</time>
										</h2>
									)}

									<EventCard
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
								</div>
							);
						})
					)}
				</div>

				{/* Calendar Sidebar - Takes up 1/3 of the space on large screens */}
				<div className="order-1 lg:order-2 lg:col-span-1">
					<div className="flex flex-col gap-6 lg:sticky lg:top-4 lg:gap-10">
						<section id="city_filters" className="flex flex-col gap-3">
							<h2 className="text-sm font-semibold leading-5 text-[#104357] dark:text-[#E3F2F7]">Events by City</h2>

							<div className="flex flex-wrap gap-2">
								<Button asChild variant="outline" className={filterButtonClass(activeHref === cityHref(null))}>
									<Link href={cityHref(null)} replace scroll={false} onClick={cityClickHandler("all")}>
										Everything
									</Link>
								</Button>
								{SELECTABLE_CITIES.map((city) => (
									<Button
										key={city}
										asChild
										variant="outline"
										className={filterButtonClass(activeHref === cityHref(city))}
									>
										<Link href={cityHref(city)} replace scroll={false} onClick={cityClickHandler(city)}>
											{formatCityLabel(city)}
										</Link>
									</Button>
								))}
							</div>
						</section>
						{categoryFilteringEnabled ? (
							<section id="category_filters" className="flex flex-col gap-3">
								<h2 className="text-sm font-semibold leading-5 text-[#104357] dark:text-[#E3F2F7]">
									Events by Category
								</h2>

								<div className="flex flex-wrap gap-2">
									<Button asChild variant="outline" className={filterButtonClass(activeHref === categoryHref(null))}>
										<Link href={categoryHref(null)} replace scroll={false} onClick={categoryClickHandler("all")}>
											Everything
										</Link>
									</Button>
									{EVENT_CATEGORIES.map((category) => (
										<Button
											key={category.slug}
											asChild
											variant="outline"
											className={filterButtonClass(activeHref === categoryHref(category.slug))}
										>
											<Link
												href={categoryHref(category.slug)}
												replace
												scroll={false}
												onClick={categoryClickHandler(category.slug)}
											>
												{category.name}
											</Link>
										</Button>
									))}
								</div>
							</section>
						) : null}
						<div className="rounded-lg border bg-card p-3 shadow-sm">
							<EventCalendar eventDates={eventDates} onDateClick={handleDateClick} selectedDate={selectedDate} />
							<div className="mt-4 space-y-2 text-xs leading-5 text-muted-foreground">
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-[#04C9D8]" />
									<span>Days with events (click to filter)</span>
								</div>
								{selectedDate && (
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-accent" />
										<span>Selected date</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
