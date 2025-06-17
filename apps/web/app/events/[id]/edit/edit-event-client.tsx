"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { format, parseISO } from 'date-fns';
import { toZonedTime, formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { dateTimeStringWithNoTimezoneToTzDateString, isoStringToTimezoneDate, stringToString00, tzDateStringToDateTimeStringWithNoTimezone } from "@/lib/datetime";

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  city: string;
  url: string;
  banner_url?: string;
}

interface EditEventClientProps {
  event: Event;
}

const TIMEZONE = 'Europe/Lisbon';

export default function EditEventClient({ event }: EditEventClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [startTime, setStartTime] = useState(tzDateStringToDateTimeStringWithNoTimezone(event.start_time, TIMEZONE));
  
  const [city, setCity] = useState(event.city);
  const [url, setUrl] = useState(event.url);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('handleSubmit', {startTime});

    try {
      const utcDateTime = dateTimeStringWithNoTimezoneToTzDateString(startTime, TIMEZONE);

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          start_time: utcDateTime,
          city,
          url,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      toast.success('Event updated successfully');
      router.push('/events');
      router.refresh();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="startTime" className="block text-sm font-medium mb-1">
            Start Time (Europe/Lisbon)
          </label>
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-1">
            City
          </label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-1">
            URL
          </label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/events')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
} 