"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Calendar } from "@/components/tailwind/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/tailwind/ui/card";
import { Input } from "@/components/tailwind/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/tailwind/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { cn } from "@/lib/utils";
import { Label } from "@radix-ui/react-dropdown-menu";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { MetadataResult } from "../types";

// Server action for scraping URLs
async function scrapeUrl(url: string): Promise<{ data?: MetadataResult; error?: string }> {
  try {
    if (!url.match(/^https?:\/\/.+\..+/)) {
      return { error: "Please enter a valid URL including http:// or https://" };
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
      return { error: errorData.error || `Failed to fetch URL: ${response.statusText}` };
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
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedMetadata, setHasLoadedMetadata] = useState(false);

  const [urlToScrape, setUrlToScrape] = useState<string>("");

  // [afonsocrg] This url is the link to the event itself.
  // It's a good practice to keep this separate from the scrape URL
  // because the scrape URL may not be the "official" event URL that 
  // will be returned by our backend.
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [city, setCity] = useState<string>("");

  const handleUrlSubmit = async (formData: FormData) => {
    const url = formData.get("url") as string;

    if (!url || !url.trim()) {
      return;
    }

    setIsScraping(true);
    try {
      const result = await scrapeUrl(urlToScrape);

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        const { title, description, url, bannerUrl, startTime } = result.data;
        setTitle(title);
        setDescription(description);
        setUrl(url);
        setBannerUrl(bannerUrl);
        setDate(startTime ? new Date(startTime) : undefined);
        setHasLoadedMetadata(true);
      }
    } catch (error) {
      setError("Failed to scrape URL");
    }
    setIsScraping(false);
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          date: date?.toISOString(),
          city,
          url,
          bannerUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      // Reset form after successful submission
      setDate(undefined);
      setCity('');
      setUrl('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Add Event to the Agenda</h1>
      <div className="mx-auto">
        <form action={handleUrlSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2 w-8/12 self-center">
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com"
                value={urlToScrape}
                onChange={(e) => setUrlToScrape(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={isScraping}>
                {isScraping ? "Scraping..." : "Scrape URL"}
              </Button>
            </div>
          </div>
        </form>

        {hasLoadedMetadata && (
          <form onSubmit={handleEventSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="w-full">
              <Card className="p-4 gap-4 flex flex-col h-full">
                <section>
                  <Label>Title</Label>
                  <Input 
                    id="meta-title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    required 
                  />
                </section>
                <section>
                  <Label>Description</Label>
                  <Textarea
                    id="meta-description"
                    value={description}
                    className="h-32"
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </section>
                <section>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="w-5 h-5" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </section>
                <section>
                  <Label>City</Label>
                  <Select value={city} onValueChange={setCity} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lisboa">Lisboa</SelectItem>
                      <SelectItem value="porto">Porto</SelectItem>
                      <SelectItem value="aveiro">Aveiro</SelectItem>
                    </SelectContent>
                  </Select>
                </section>
                {error && (
                  <div className="text-red-500 text-sm mt-2">
                    {error}
                  </div>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Event..." : "Create Event"}
                </Button>
              </Card>
            </div>
            <div className="w-full">
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
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
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
            </div>
          </form>
        )}
      </div>
    </main>
  );
} 