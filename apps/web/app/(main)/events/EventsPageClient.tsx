"use client";

import { EventCalendar } from "@/components/event-calendar";
import { Button } from "@/components/tailwind/ui/button";
import { cn } from "@/lib/utils";
import { MapPinIcon, PencilIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import posthog from "posthog-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/tailwind/ui/alert-dialog";
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
  const router = useRouter();

  // Filter for cities, different styles applied depending on the path.
  // const pathname = usePathname();
  const searchParams = useSearchParams();
  const cityParam = searchParams.get('city') || 'all';

  // Extract event dates for the calendar
  const eventDates = events?.map((event) => new Date(event.start_time)) || [];

  // Filter events when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const eventsForDate = events.filter((event) => isSameDay(new Date(event.start_time), selectedDate));
      setFilteredEvents(eventsForDate);
    } else {
      setFilteredEvents(events);
    }
  }, [selectedDate, events]);

  const handleFilterClick = (city: string) => {
    posthog.capture('city_filter', {
      city: city
    });
    window.location.href = city === 'all' ? '/events' : `/events?city=${city}`;
  }

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
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Remove the deleted event from the state
      setEvents(events.filter(event => event.id !== eventId));
      toast.success('Event deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  let lastDate: string | null = null;

  return (
    <div className="space-y-4 md:p-4">
      <div className="flex  justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {selectedDate
            ? `Events for ${formatShortDate(selectedDate)}`
            : city
              ? `Upcoming Events in ${city.charAt(0).toUpperCase() + city.slice(1)}`
              : "Upcoming Events"}
        </h1>

        {selectedDate && (
          <Button onClick={clearFilter} variant="default" className="transition-all animate-in rounded-lg">
            Show All Events
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Events List - Takes up 2/3 of the space on large screens */}
        <div className="lg:col-span-2 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
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
                      <h2 className="text-lg font-semibold text-muted-foreground mt-6">
                        {formatShortDate(event.start_time)}
                      </h2>
                    </>
                  )}

                  <article className="group">
                    <Link
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col px-4 py-4 rounded-lg hover:bg-accent/50 transition-all animate-in border-l-4 border-[#04C9D8] rounded-l"
                    >
                      <div className="flex gap-8 align-top ml-1">
                        <section className="space-y-3 mb-3 w-full">
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold group-hover:text-[#24acb5] [font-family:var(--font-default)]">
                              {event.title}
                            </h3>
                            {(user?.role === "admin" || process.env.NEXT_ALLOW_BAD_UI === "true") && (
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={(e) => {
                                  e.preventDefault();
                                  router.push(`/events/${event.id}/edit`);
                                }}>
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the event
                                        "{event.title}".
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteEvent(event.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground prose line-clamp-2">{event.description}</p>

                          <div className="text-muted-foreground flex items-center gap-1">
                            <MapPinIcon className="h-5 w-5" />
                            {event.city.charAt(0).toUpperCase() + event.city.slice(1)}
                          </div>
                        </section>
                        {/* {event.banner_url && (
                          <img
                            src={event.banner_url || "/placeholder.svg"}
                            alt={event.title}
                            className="w-65 h-40 object-cover rounded-lg hidden sm:block"
                          />
                        )} */}
                      </div>
                    </Link>
                  </article>
                </div>
              );
            })
          )}
        </div>

        {/* Calendar Sidebar - Takes up 1/3 of the space on large screens */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 flex flex-col gap-10">
            <section id="city_filters" className="space-y-2 flex flex-col gap-2">
              <h6 className="block font-medium text-[#104357] dark:text-[#E3F2F7]">Events by City</h6>

              <div className="flex gap-2">
                <Button
                  asChild
                  onClick={(e) => {
                    e.preventDefault();
                    handleFilterClick('all');
                  }}
                  variant="outline"
                  className={cn(
                    "rounded-full bg-neutral-100 border-none text-muted-foreground transition-colors",
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
                    handleFilterClick('lisboa');
                  }}
                  variant="outline"
                  className={cn(
                    "rounded-full bg-neutral-100 border-none text-muted-foreground transition-colors",
                    cityParam === "lisboa" &&
                      "bg-[#dff6f7] text-[#28aeb8] hover:bg-[#dff6f7] hover:text-[#28aeb8]",
                  )}
                >
                  <Link href="/events?city=lisboa">Lisboa</Link>
                </Button>
                <Button
                  asChild
                  onClick={(e) => {
                    e.preventDefault();
                    handleFilterClick('porto');
                  }}
                  variant="outline"
                  className={cn(
                    "rounded-full bg-neutral-100 border-none text-muted-foreground transition-colors",
                    cityParam === "porto" &&
                      "bg-[#dff6f7] text-[#28aeb8]  hover:bg-[#dff6f7] hover:text-[#28aeb8]",
                  )}
                >
                  <Link href="/events?city=porto">Porto</Link>
                </Button>
              </div>
            </section>
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <EventCalendar eventDates={eventDates} onDateClick={handleDateClick} selectedDate={selectedDate} />
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
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
