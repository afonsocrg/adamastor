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

function formatShortDate(date: string | Date) {
	const d = new Date(date);
	return d.toLocaleDateString("en-US", {
		timeZone: "Europe/Lisbon",
		day: "numeric",
		month: "long",
		weekday: "long",
	});
}

// Helper function to check if two dates are on the same day
function isSameDay(date1: Date, date2: Date) {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
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
	city?: string; // Optional city prop
	user?: { id: string; role: string } | null; // Add user prop
}

export default function EventsPageClient({ initialEvents, city, user }: EventsPageProps) {
	const [events, setEvents] = useState<Event[]>(initialEvents);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [filteredEvents, setFilteredEvents] = useState<Event[]>(initialEvents);
	const [pageLoadTime] = useState(Date.now()); // ADD THIS
	const [hasClickedEvent, setHasClickedEvent] = useState(false); // ADD THIS
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

	// Filter events when selectedDate changes
	useEffect(() => {
		if (selectedDate) {
			const eventsForDate = events.filter((event) => isSameDay(new Date(event.start_time), selectedDate));
			setFilteredEvents(eventsForDate);
		} else {
			setFilteredEvents(events);
		}
	}, [selectedDate, events]);

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
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<h1 className="text-2xl font-bold leading-tight [text-wrap:pretty]">
					{selectedDate
						? `Events for ${formatShortDate(selectedDate)}`
						: city
							? `Upcoming Events in ${city.charAt(0).toUpperCase() + city.slice(1)}`
							: "Upcoming Events"}
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
				<div className="space-y-4 lg:col-span-2">
					{filteredEvents.length === 0 ? (
						<div className="rounded-md border border-dashed px-6 py-10 text-center text-base leading-relaxed text-muted-foreground">
							{selectedDate ? `No events found for ${formatShortDate(selectedDate)}` : "No upcoming events found"}
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
											<h2 className="mt-6 text-lg font-semibold text-muted-foreground">
												{formatShortDate(event.start_time)}
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
										isAdmin={user?.role === "admin" || process.env.NEXT_ALLOW_BAD_UI === "true"}
									/>
								</div>
							);
						})
					)}
				</div>

				{/* Calendar Sidebar - Takes up 1/3 of the space on large screens */}
				<div className="lg:col-span-1">
					<div className="sticky top-4 flex flex-col gap-10">
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
									className={cn(
										"rounded-full border-none bg-neutral-100 text-muted-foreground transition-[background-color,color,box-shadow,transform] duration-150 ease hover:shadow-sm motion-reduce:transition-none motion-safe:active:scale-[0.98]",
										cityParam === "all"
											? "bg-[#dff6f7] text-[#28aeb8]  hover:bg-[#dff6f7] hover:text-[#28aeb8]"
											: "text-neutral-600 hover:text-neutral-900",
									)}
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
									className={cn(
										"rounded-full border-none bg-neutral-100 text-muted-foreground transition-[background-color,color,box-shadow,transform] duration-150 ease hover:shadow-sm motion-reduce:transition-none motion-safe:active:scale-[0.98]",
										cityParam === "lisboa" && "bg-[#dff6f7] text-[#28aeb8] hover:bg-[#dff6f7] hover:text-[#28aeb8]",
									)}
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
									className={cn(
										"rounded-full border-none bg-neutral-100 text-muted-foreground transition-[background-color,color,box-shadow,transform] duration-150 ease hover:shadow-sm motion-reduce:transition-none motion-safe:active:scale-[0.98]",
										cityParam === "porto" && "bg-[#dff6f7] text-[#28aeb8]  hover:bg-[#dff6f7] hover:text-[#28aeb8]",
									)}
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
									className={cn(
										"rounded-full border-none bg-neutral-100 text-muted-foreground transition-[background-color,color,box-shadow,transform] duration-150 ease hover:shadow-sm motion-reduce:transition-none motion-safe:active:scale-[0.98]",
										cityParam === "online" && "bg-[#dff6f7] text-[#28aeb8]  hover:bg-[#dff6f7] hover:text-[#28aeb8]",
									)}
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
