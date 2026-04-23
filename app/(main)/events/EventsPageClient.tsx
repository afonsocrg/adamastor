"use client";

import { EventCard } from "@/components/EventCard";
import { EventCalendar } from "@/components/event-calendar";
import { Button } from "@/components/tailwind/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
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
}

interface EventsPageProps {
	initialEvents: Event[];
}

function formatCityLabel(city: string) {
	return city.charAt(0).toUpperCase() + city.slice(1);
}

export default function EventsPageClient({ initialEvents }: EventsPageProps) {
	const [events, setEvents] = useState<Event[]>(initialEvents);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [filteredEvents, setFilteredEvents] = useState<Event[]>(initialEvents);
	const [pageLoadTime] = useState(Date.now()); // ADD THIS
	const [hasClickedEvent, setHasClickedEvent] = useState(false); // ADD THIS
	const [hasHydrated, setHasHydrated] = useState(false);
	const router = useRouter();

	// Filter for cities, different styles applied depending on the path.
	// const pathname = usePathname();
	const searchParams = useSearchParams();
	const cityParam = searchParams.get("city") || "all";

	// Extract event dates for the calendar
	const eventDates = events?.map((event) => new Date(event.start_time)) || [];

	useEffect(() => {
		setEvents(initialEvents);
	}, [initialEvents]);

	useEffect(() => {
		setHasHydrated(true);
	}, []);

	// Filter events when selectedDate changes
	useEffect(() => {
		const cityFilteredEvents =
			cityParam === "all" ? events : events.filter((event) => event.city.trim().toLowerCase() === cityParam);

		if (selectedDate) {
			setFilteredEvents(cityFilteredEvents.filter((event) => isSameDay(new Date(event.start_time), selectedDate)));
			return;
		}

		setFilteredEvents(cityFilteredEvents);
	}, [cityParam, selectedDate, events]);

	// Track when events listing is loaded/changed
	useEffect(() => {
		posthog.capture("events_listing_loaded", {
			city_filter: cityParam,
			has_date_filter: !!selectedDate,
			total_events_shown: filteredEvents.length,
			has_results: filteredEvents.length > 0,
		});
	}, [cityParam, selectedDate, filteredEvents.length]);

	// Track zero clicks on page leave
	useEffect(() => {
		const handlePageLeave = () => {
			if (!hasClickedEvent) {
				posthog.capture("events_page_abandoned", {
					city_filter: cityParam,
					had_date_filter: !!selectedDate,
					events_shown_count: filteredEvents.length,
					time_on_page_seconds: Math.round((Date.now() - pageLoadTime) / 1000),
				});
			}
		};

		// Track when user navigates away
		window.addEventListener("beforeunload", handlePageLeave);

		// Cleanup
		return () => {
			window.removeEventListener("beforeunload", handlePageLeave);
			// Important: Also track when component unmounts (SPA navigation)
			handlePageLeave();
		};
	}, [hasClickedEvent, cityParam, selectedDate, filteredEvents.length, pageLoadTime]);

	const handleFilterClick = (city: string) => {
		posthog.capture("city_filter", {
			city: city,
		});
		router.push(city === "all" ? "/events" : `/events?city=${city}`);
	};

	const cityFilterButtonClass = (city: string) =>
		cn(
			"rounded-full border border-transparent bg-neutral-100 text-muted-foreground transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease hover:shadow-sm motion-reduce:transition-none motion-safe:active:scale-[0.98] dark:bg-[rgba(10,46,61,0.78)] dark:text-[rgba(158,210,225,0.82)] dark:hover:bg-[rgba(4,201,216,0.12)] dark:hover:text-[#4ce4f0]",
			cityParam === city
				? "bg-[#dff6f7] text-[#28aeb8] hover:bg-[#dff6f7] hover:text-[#28aeb8] dark:border-[rgba(76,228,240,0.4)] dark:bg-[rgba(4,201,216,0.18)] dark:text-[#4ce4f0] dark:hover:bg-[rgba(4,201,216,0.18)] dark:hover:text-[#4ce4f0]"
				: "text-neutral-600 hover:text-neutral-900",
		);

	// Handle calendar date click
	const handleDateClick = (date: Date) => {
		// Check if the clicked date has events
		const hasEvents = eventDates.some((eventDate) => isSameDay(eventDate, date));

		if (hasEvents) {
			// If clicking the same date, clear the filter
			if (selectedDate && isSameDay(selectedDate, date)) {
				setSelectedDate(null);
			} else {
				setSelectedDate(date);
			}
		}
	};

	// Clear filter function
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

			// Remove the deleted event from the state
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
		<div className="space-y-8 md:p-4 animate-in">
			<div className="flex flex-col gap-3 pb-4 pt-2 sm:flex-row sm:items-start sm:justify-between md:pb-0">
				<h1 className="text-2xl font-extrabold tracking-tight leading-tight text-[#104357] [text-wrap:pretty] dark:text-[#E3F2F7]">
					{selectedDate
						? `Events for ${formatEventDate(selectedDate, hasHydrated)}`
						: cityParam !== "all"
							? `Events in ${formatCityLabel(cityParam)}`
							: "Events"}
				</h1>

				{selectedDate && (
					<Button
						onClick={clearFilter}
						variant="default"
						className="self-start rounded-md transition-[background-color,color,box-shadow,transform] duration-150 ease hover:shadow-sm motion-reduce:transition-none motion-safe:active:scale-[0.98]"
					>
						Show All Events
					</Button>
				)}
			</div>

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
							const showDateHeading = eventDate !== lastDate && !selectedDate; // Don't show date headings when filtering by date
							lastDate = eventDate;

							return (
								<div key={event.id} className="space-y-4">
									{showDateHeading && (
										<>
											<h2 className="mt-6 text-lg font-semibold text-[#104357] dark:text-[#E3F2F7]">
												{formatEventDate(event.start_time, hasHydrated)}
											</h2>
										</>
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
												city_filter: cityParam,
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
								<Button
									asChild
									onClick={(e) => {
										e.preventDefault();
										handleFilterClick("all");
									}}
									variant="outline"
									className={cityFilterButtonClass("all")}
								>
									<Link href="/events">Everything</Link>
								</Button>
								<Button
									asChild
									onClick={(e) => {
										e.preventDefault();
										handleFilterClick("lisboa");
									}}
									variant="outline"
									className={cityFilterButtonClass("lisboa")}
								>
									<Link href="/events?city=lisboa">Lisboa</Link>
								</Button>
								<Button
									asChild
									onClick={(e) => {
										e.preventDefault();
										handleFilterClick("porto");
									}}
									variant="outline"
									className={cityFilterButtonClass("porto")}
								>
									<Link href="/events?city=porto">Porto</Link>
								</Button>
								<Button
									asChild
									onClick={(e) => {
										e.preventDefault();
										handleFilterClick("online");
									}}
									variant="outline"
									className={cityFilterButtonClass("online")}
								>
									<Link href="/events?city=online">Online</Link>
								</Button>
							</div>
						</section>
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
