"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Calendar } from "@/components/tailwind/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/tailwind/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form";
import { Input } from "@/components/tailwind/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/tailwind/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { MetadataResult } from "@/app/types";
import { dateTimeStringWithNoTimezoneToTzDateString, tzDateStringToDateTimeStringWithNoTimezone } from "@/lib/datetime";

const TIMEZONE = 'Europe/Lisbon';

const urlFormSchema = z.object({
  url: z.string().min(1),
});

// [afonsocrg] This url is the link to the event itself.
// It's a good practice to keep this separate from the scrape URL
// because the scrape URL may not be the "official" event URL that
// will be returned by our backend.
const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  url: z.string().min(1),
  bannerUrl: z.string().min(1),
  startTime: z.string().min(1),
  city: z.string().min(1),
});

const defaultEventFormValues = {
  title: "",
  description: "",
  url: "",
  bannerUrl: "",
  startTime: "",
  city: "",
};

// Server action for scraping URLs
async function scrapeUrl(url: string): Promise<{ data?: MetadataResult; error?: string }> {
  try {
    if (!url.match(/^https?:\/\/.+\..+/)) {
      return {
        error: "Please enter a valid URL including http:// or https://",
      };
    }

    const response = await fetch("/api/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: errorData.error || `Failed to fetch URL: ${response.statusText}`,
      };
    }

    const result = await response.json();
    return { data: result.data };
  } catch (error) {
    console.error("Error in scrapeUrl:", error);
    return { error: "An unexpected error occurred" };
  }
}

export default function AddEventForm() {
  const [isScraping, setIsScraping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoadedMetadata, setHasLoadedMetadata] = useState(false);

  const [urlToScrape, setUrlToScrape] = useState<string>("");

  const eventForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultEventFormValues,
  });

  const urlForm = useForm<z.infer<typeof urlFormSchema>>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: { url: "" },
  });

  const title = eventForm.watch("title");
  const description = eventForm.watch("description");
  const url = eventForm.watch("url");
  const bannerUrl = eventForm.watch("bannerUrl");
  const startTime = eventForm.watch("startTime");
  const city = eventForm.watch("city");

  const handleUrlSubmit = async (values: { url: string }) => {
    const url = values.url;

    if (!url || !url.trim()) {
      return;
    }

    setIsScraping(true);
    try {
      const result = await scrapeUrl(url);

      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        const { title, description, url, bannerUrl, startTime, city } = result.data;
        eventForm.setValue("title", title);
        eventForm.setValue("description", description);
        eventForm.setValue("url", url);
        eventForm.setValue("bannerUrl", bannerUrl);
        eventForm.setValue("startTime", startTime ? tzDateStringToDateTimeStringWithNoTimezone(startTime, TIMEZONE) : "");
        eventForm.setValue("city", city ?? "");
        setHasLoadedMetadata(true);
      }
    } catch (error) {
      toast.error("Failed to scrape URL");
    }
    setIsScraping(false);
  };

  const handleEventSubmit = async (values: z.infer<typeof formSchema>) => {
    const { title, description, startTime, city, url, bannerUrl } = values;

    setIsSubmitting(true);

    try {
      const utcDateTime = dateTimeStringWithNoTimezoneToTzDateString(startTime, TIMEZONE);

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          start_time: utcDateTime,
          city,
          url,
          bannerUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      // Reset form after successful submission
      eventForm.reset();
      urlForm.reset();
      setHasLoadedMetadata(false);
      toast.success("Event created successfully");
    } catch (err) {
      toast.error("Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container px-4 animate-in">
      
      <h2 className="text-lg font-medium text-[#104357] dark:text-[#E3F2F7] flex gap-2 items-center">Add Event to the Agenda</h2>
      <div className="">
        <UrlForm form={urlForm} isScraping={isScraping} handleUrlSubmit={handleUrlSubmit} />

        {hasLoadedMetadata && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="w-full">
              <Card className="p-4 gap-4 flex flex-col h-full">
                <EventDetailsForm form={eventForm} isSubmitting={isSubmitting} handleEventSubmit={handleEventSubmit} />
              </Card>
            </div>
            <div className="w-full">
              <EventPreview title={title} description={description} url={url} bannerUrl={bannerUrl} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

interface UrlFormProps {
  form: any;
  isScraping: boolean;
  handleUrlSubmit: (values: z.infer<typeof urlFormSchema>) => void;
}
function UrlForm({ form, isScraping, handleUrlSubmit }: UrlFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleUrlSubmit)} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2 w-8/12">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="https://link-to-event-page.com" {...field} required />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isScraping}>
              {isScraping ? "Scraping..." : "Scrape URL"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

interface EventDetailsFormProps {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  form: any;
  isSubmitting: boolean;
  handleEventSubmit: (values: z.infer<typeof formSchema>) => void;
}
function EventDetailsForm({ form, isSubmitting, handleEventSubmit }: EventDetailsFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleEventSubmit)} className="space-y-4">
        <section>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Event Title..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>
        <section>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Event Description..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Time (Europe/Lisbon)</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lisboa">Lisboa</SelectItem>
                      <SelectItem value="porto">Porto</SelectItem>
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
        </section>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Event..." : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface EventPreviewProps {
  title: string;
  description: string;
  url: string;
  bannerUrl: string;
}

function EventPreview({ title, description, url, bannerUrl }: EventPreviewProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden">
        {bannerUrl && (
          <div className="mb-4">
            <img
              src={bannerUrl || "/placeholder.svg"}
              alt={title || "Preview image"}
              className="rounded-md max-h-64 object-contain"
            />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {url && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">URL</h3>
              <p className="text-sm truncate">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {url}
                </a>
              </p>
            </div>
          )}

          {/* {metadata.ogSiteName && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Site Name</h3>
                        <p className="text-sm">{metadata.ogSiteName}</p>
                      </div>
                    )}

                    {metadata.ogType && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                        <p className="text-sm">{metadata.ogType}</p>
                      </div>
                    )}

                    {metadata.twitterCard && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Twitter Card</h3>
                        <p className="text-sm">{metadata.twitterCard}</p>
                      </div>
                    )} */}
        </div>
      </CardContent>
    </Card>
  );
}
