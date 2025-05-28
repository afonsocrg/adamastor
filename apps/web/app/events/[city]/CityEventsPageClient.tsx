"use client";

import { EventCalendar } from "@/components/event-calendar";
import { MapPinIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function formatShortDate(date: string | Date) {
  const d = new Date(date);
  const day = d.toLocaleDateString("en-US", { day: "numeric" });
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  return `${month} ${day}, ${weekday}`;
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

interface CityEventsPageProps {
  initialEvents: Event[];
  city: string;
}

export default function CityEventsPageClient({ initialEvents, city }: CityEventsPageProps) {
  const [events] = useState<Event[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(initialEvents);

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

  // Handle calendar date click
  const handleDateClick = (date: Date) => {
    console.log("handleDateClick called with:", date);
    // Check if the clicked date has events
    const hasEvents = eventDates.some((eventDate) => isSameDay(eventDate, date));
    console.log("Date has events:", hasEvents);

    if (hasEvents) {
      // If clicking the same date, clear the filter
      if (selectedDate && isSameDay(selectedDate, date)) {
        console.log("Clearing filter");
        setSelectedDate(null);
      } else {
        console.log("Setting selected date to:", date);
        setSelectedDate(date);
      }
    }
  };

  // Clear filter function
  const clearFilter = () => {
    setSelectedDate(null);
  };

  let lastDate: string | null = null;

  return (
    <div className="space-y-4 md:p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold capitalize">
          {selectedDate ? `${city} Events for ${formatShortDate(selectedDate)}` : `Startup Events in ${city}`}
        </h1>
        {selectedDate && (
          <button
            type="button"
            onClick={clearFilter}
            className="px-4 py-2 text-sm bg-accent hover:bg-accent/80 rounded-md transition-colors"
          >
            Show All Events
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Events List - Takes up 2/3 of the space on large screens */}
        <div className="lg:col-span-2 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedDate
                ? `No events found for ${formatShortDate(selectedDate)}`
                : `No upcoming events found in ${city}`}
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
                      className="flex flex-col sm:px-4 py-4 rounded-lg hover:bg-accent/50 transition-all animate-in border-l-4 border-[#04C9D8] rounded-l"
                    >
                      <div className="flex gap-8 align-top ml-1">
                        <section className="space-y-3 mb-3">
                          <h3 className="text-xl font-bold group-hover:text-[#24acb5] [font-family:var(--font-default)]">
                            {event.title}
                          </h3>
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
          <div className="sticky top-4">
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
