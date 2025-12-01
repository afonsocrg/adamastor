'use client';

import { Calendar, momentLocalizer, View, ToolbarProps } from 'react-big-calendar';
import moment from 'moment';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/tailwind/ui/select';
import './calendar-custom.css';

// Configure moment to use Monday as the first day of the week
// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
moment.updateLocale('en', {
  week: {
    dow: 1, // Monday is the first day of the week
    doy: 4  // The week that contains Jan 4th is the first week of the year
  }
});

// Custom time formats for the calendar
const formats = {
  // Time formats for different views
  timeGutterFormat: 'h A', // "1am", "2pm" in the time gutter (left side)
  eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
    `${localizer.format(start, 'h A', culture)} - ${localizer.format(end, 'h A', culture)}`,
  agendaTimeFormat: 'h A', // Time format in agenda view
  agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
    `${localizer.format(start, 'h A', culture)} - ${localizer.format(end, 'h A', culture)}`,
  
  // Keep other formats as default
  dayFormat: 'ddd DD', // "01 Mon"
  dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
    `${localizer.format(start, 'MMMM DD', culture)} - ${localizer.format(end, 'DD, YYYY', culture)}`,
  dayHeaderFormat: 'dddd MMM DD', // "Monday Jan 01"
};

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

  // Add this useEffect to calculate today's position
useEffect(() => {
  if (view === 'week') {
    const calculateTodayPosition = () => {
      // Get today's day of week (0 = Sunday, 6 = Saturday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      // Convert to Monday-first (0 = Monday, 6 = Sunday)
      const mondayFirstDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      // Calculate percentage position (each day is 14.285%)
      const dayWidth = 100 / 7;
      const startPosition = mondayFirstDay * dayWidth;
      const endPosition = (mondayFirstDay + 1) * dayWidth;
      
      // Set CSS variables
      document.documentElement.style.setProperty('--today-start', `${startPosition}%`);
      document.documentElement.style.setProperty('--today-end', `${endPosition}%`);
      document.documentElement.style.setProperty('--indicator-offset', `${mondayFirstDay * 100}%`);
    };

    calculateTodayPosition();
    
    // Recalculate at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const midnightTimer = setTimeout(() => {
      calculateTodayPosition();
      // Then recalculate every 24 hours
      const dailyInterval = setInterval(calculateTodayPosition, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);
    
    return () => clearTimeout(midnightTimer);
  }
}, [view]);

  return (
    <div className="space-y-4">
      <div style={{ height: '800px', width:'100%' }} className="bg-white dark:bg-neutral-900 rounded-lg p-4">
       
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
          selectable={false} // !!user: Only allow selection if user is logged in
          components={components}
          formats={formats}
          scrollToTime={new Date(1970, 0, 1, 8,40)} // 1970 = Unix Epoch. We only care about the time.
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