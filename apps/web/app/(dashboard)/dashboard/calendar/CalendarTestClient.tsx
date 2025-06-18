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

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

const sampleEvents: CalendarEvent[] = [
  {
    id: 1,
    title: 'Sample Event 1',
    start: new Date(2025, 5, 15, 10, 0),
    end: new Date(2025, 5, 15, 12, 0),
  },
  {
    id: 2,
    title: 'All Day Event',
    start: new Date(2025, 5, 16),
    end: new Date(2025, 5, 16),
    allDay: true,
  },
  {
    id: 3,
    title: 'Multi-day Event',
    start: new Date(2025, 5, 20),
    end: new Date(2025, 5, 22),
  },
];

export default function CalendarTestClient() {
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);
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
    alert(`Event clicked: ${event.title}`);
  }, []);

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      const title = prompt('New Event name');
      if (title) {
        const newEvent: CalendarEvent = {
          id: events.length + 1,
          title,
          start,
          end,
        };
        setEvents([...events, newEvent]);
      }
    },
    [events]
  );

  return (
    <div className="space-y-4">
      <div style={{ height: '600px' }} className="bg-white dark:bg-neutral-900 rounded-lg p-4">
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
          selectable
          style={{ height: '100%' }}
          components={components}
        />
      </div>

      <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current Events ({events.length})</h3>
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="text-sm">
              <span className="font-medium">{event.title}</span> - 
              {moment(event.start).format('MMM DD, YYYY HH:mm')} to 
              {moment(event.end).format('MMM DD, YYYY HH:mm')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}