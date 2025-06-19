'use client';

import { Calendar, momentLocalizer, View, ToolbarProps } from 'react-big-calendar';
import moment from 'moment';
import { useState, useCallback, useMemo } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/tailwind/ui/select';

import './calendar-custom.css';

const localizer = momentLocalizer(moment);

// Define the event type based on your database schema
interface CalendarEvent {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  // Additional fields from your database
  city?: string;
  location?: string;
  description?: string;
}

// Define props for the component
interface CalendarTestClientProps {
  initialEvents: CalendarEvent[];
  user?: any; // Replace with your user type
}

export default function CalendarTestClient({ 
  initialEvents = [], 
  user 
}: CalendarTestClientProps) {
  // Initialize state with the events from the server
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // Custom Toolbar Component
  const CustomToolbar = useCallback(
    ({ label, onNavigate, onView }: ToolbarProps) => {
      return (
        <div className="flex items-center justify-between mb-5 mx-5 mt-5">
          {/* Current Date */}
          <h2 className="text-lg font-medium text-[#104357] dark:text-[#E3F2F7] flex gap-2 items-center">
            <CalendarIcon /> {label}
          </h2>

          <section className='flex gap-2'>
            {/* Navigation */}
            <div className="flex items-center gap-1 border rounded-md">
              <button
                onClick={() => onNavigate('PREV')}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => onNavigate('TODAY')}
                className="px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border-l border-r rounded-none"
              >
                Today
              </button>
              
              <button
                onClick={() => onNavigate('NEXT')}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>         

            {/* View Selector */}
            <Select value={view} onValueChange={(value) => onView(value as View)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month View</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </div>
      );
    },
    [view]
  );

  const components = useMemo(
    () => ({
      toolbar: CustomToolbar,
    }),
    [CustomToolbar]
  );

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    // Enhanced event click handler with more details
    console.log('Event clicked:', event);
    
    // You could open a modal or navigate to event details
    // For now, let's show more info in the alert
    const eventInfo = `
Event: ${event.title}
Date: ${moment(event.start).format('MMMM DD, YYYY')}
Time: ${moment(event.start).format('HH:mm')} - ${moment(event.end).format('HH:mm')}
${event.location ? `Location: ${event.location}` : ''}
${event.city ? `City: ${event.city}` : ''}
${event.description ? `\nDescription: ${event.description}` : ''}
    `.trim();
    
    alert(eventInfo);
  }, []);

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      // Only allow authenticated users to create events
      if (!user) {
        alert('Please sign in to create events');
        return;
      }

      const title = prompt('New Event name');
      if (title) {
        // In a real app, you'd save this to the database
        // For now, we'll just add it to local state
        const newEvent: CalendarEvent = {
          id: `temp-${Date.now()}`, // Temporary ID
          title,
          start,
          end,
        };
        setEvents([...events, newEvent]);
        
        // TODO: Add API call to save event to database
        console.log('New event to save:', newEvent);
      }
    },
    [events, user]
  );


  return (
    <div className="space-y-4">
      <div style={{ height: '800px', width:'auto' }} className="bg-white dark:bg-neutral-900 rounded-lg p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={date}
          view={view}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={!!user} // Only allow selection if user is logged in
          style={{ height: '100%' }}
          components={components}
        />
      </div>

      <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">
          Upcoming Events ({events.filter(e => e.start >= new Date()).length})
        </h3>
        <ul className="space-y-2">
          {events
            .filter(event => event.start >= new Date())
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .slice(0, 5)
            .map((event) => (
              <li key={event.id} className="text-sm">
                <span className="font-medium">{event.title}</span> - 
                <span className="text-muted-foreground ml-1">
                  {moment(event.start).format('MMM DD, YYYY HH:mm')}
                  {event.city && ` • ${event.city}`}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}