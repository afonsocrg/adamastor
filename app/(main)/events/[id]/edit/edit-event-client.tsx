"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/tailwind/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form";
import { Input } from "@/components/tailwind/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { Separator } from "@/components/tailwind/ui/separator";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import DateTimePickerField from "@/components/date-time-picker-field";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { dateTimeStringWithNoTimezoneToTzDateString, tzDateStringToDateTimeStringWithNoTimezone } from "@/lib/datetime";

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

// Form validation schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  url: z.string().url("Please enter a valid URL"),
  startTime: z.string().min(1, "Start time is required"),
  city: z.string().min(1, "City is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function EditEventClient({ event }: EditEventClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event.title,
      description: event.description,
      startTime: tzDateStringToDateTimeStringWithNoTimezone(event.start_time, TIMEZONE),
      city: event.city,
      url: event.url,
    },
  });

  // Watch for form changes
  const watchedValues = form.watch();
  
  useEffect(() => {
    const hasFormChanges = 
      watchedValues.title !== event.title ||
      watchedValues.description !== event.description ||
      watchedValues.city !== event.city ||
      watchedValues.url !== event.url ||
      watchedValues.startTime !== tzDateStringToDateTimeStringWithNoTimezone(event.start_time, TIMEZONE);
    
    setHasChanges(hasFormChanges);
  }, [watchedValues, event]);

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (values: FormData) => {
    setIsSubmitting(true);

    try {
      const utcDateTime = dateTimeStringWithNoTimezoneToTzDateString(values.startTime, TIMEZONE);

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          start_time: utcDateTime,
          city: values.city,
          url: values.url,
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

  const handleCancel = () => {
    if (hasChanges) {
      const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) return;
    }
    router.push('/events');
  };

  return (
    <div className={cn(
      "w-full mx-auto p-4",
      isInitialLoad ? "opacity-0" : "animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
    )}>
      {/* Header */}
      <div className="mb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="mb-4 hover:bg-transparent hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <h1 className="text-2xl font-bold text-[#104357] dark:text-[#E3F2F7]">Edit Event</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <div className="animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-200">
          <Card className="h-full transition-all duration-200">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Update the event information below</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="space-y-4 stagger-animation">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-100">
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Event Title..." 
                              {...field} 
                              className="transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-200">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Event Description..." 
                              {...field} 
                              className="transition-all duration-200 min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-300">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <DateTimePickerField
                            value={field.value}
                            onChange={field.onChange}
                            label="Start Time (Europe/Lisbon)"
                            placeholder="Select date and time"
                            disabled={field.disabled}
                          />
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="transition-all duration-200">
                                  <SelectValue placeholder="Pick a city" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lisboa">Lisboa</SelectItem>
                                  <SelectItem value="porto">Porto</SelectItem>
                                  <SelectItem value="online">Online</SelectItem>
                                  <Separator/>
                                  <SelectItem value="algarve">Algarve</SelectItem>
                                  <SelectItem value="aveiro">Aveiro</SelectItem>
                                  <SelectItem value="braga">Braga</SelectItem>
                                  <SelectItem value="coimbra">Coimbra</SelectItem>
                                  <SelectItem value="guimaraes">Guimarães</SelectItem>
                                  <SelectItem value="leiria">Leiria</SelectItem>
                                  <SelectItem value="viseu">Viseu</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-400">
                          <FormLabel>Event URL</FormLabel>
                          <FormControl>
                            <Input 
                              type="url"
                              placeholder="https://example.com/event" 
                              {...field} 
                              className="transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2 pt-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-500">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !hasChanges}
                      className="transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </div>

                  {hasChanges && (
                    <p className="text-sm text-muted-foreground animate-in fade-in-0 duration-300">
                      You have unsaved changes
                    </p>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Preview Card */}
        <div className="animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-300">
          <Card className="h-full transition-all duration-200">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>See how your event will appear</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="animate-in fade-in-0 duration-300">
                  <h3 className="text-lg font-semibold">
                    {watchedValues.title || <span className="text-muted-foreground">Event Title</span>}
                  </h3>
                </div>

                <div className="animate-in fade-in-0 duration-300 delay-100">
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.description || "Event description will appear here..."}
                  </p>
                </div>

                {event.banner_url && (
                  <div className="animate-in fade-in-0 zoom-in-95 duration-500 delay-200">
                    <img
                      src={event.banner_url}
                      alt={watchedValues.title}
                      className="rounded-md w-full h-48 object-cover transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-300">
                  <div>
                    <span className="font-medium text-muted-foreground">Date & Time:</span>
                    <p>{watchedValues.startTime ? new Date(watchedValues.startTime).toLocaleString('pt-PT', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }) : 'Not set'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Location:</span>
                    <p className="capitalize">{watchedValues.city || 'Not set'}</p>
                  </div>
                </div>

                {watchedValues.url && (
                  <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-400">
                    <span className="font-medium text-muted-foreground text-sm">Event Link:</span>
                    <p className="text-sm truncate">
                      <a 
                        href={watchedValues.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline transition-colors duration-200"
                      >
                        {watchedValues.url}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}