"use client";
//import { assertAuthenticated } from "@/lib/supabase/authentication";
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
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import React from "react";
import { useFormStatus } from "react-dom";
import type { MetadataResult } from "../types";

// Create a context for metadata
interface MetadataContextType {
  metadata: MetadataResult | null;
  setMetadata: (metadata: MetadataResult | null) => void;
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

function MetadataProvider({ children }: { children: ReactNode }) {
  const [metadata, setMetadata] = useState<MetadataResult | null>(null);

  useEffect(() => {
    // Listen for custom event with metadata
    const handleMetadataUpdate = (event: CustomEvent) => {
      setMetadata(event.detail);
    };

    window.addEventListener("metadata-updated", handleMetadataUpdate as EventListener);

    return () => {
      window.removeEventListener("metadata-updated", handleMetadataUpdate as EventListener);
    };
  }, []);

  return <MetadataContext.Provider value={{ metadata, setMetadata }}>{children}</MetadataContext.Provider>;
}

function useMetadata() {
  const context = useContext(MetadataContext);
  if (context === undefined) {
    throw new Error("useMetadata must be used within a MetadataProvider");
  }
  return context;
}

// Server action for scraping URLs
async function scrapeUrl(url: string): Promise<{ data?: MetadataResult; error?: string }> {
  try {
    // Validate URL format
    if (!url.match(/^https?:\/\/.+\..+/)) {
      return { error: "Please enter a valid URL including http:// or https://" };
    }

    // Call the API route instead of implementing the scraping logic here
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

// Form submit button with loading state
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Scraping..." : "Add Event"}
    </Button>
  );
}

// Link form component
function LinkForm() {
  const [url, setUrl] = useState("");
  //const { toast } = useToast();
  const { setMetadata } = useMetadata();

  async function handleSubmit(formData: FormData) {
    const url = formData.get("url") as string;

    if (!url || !url.trim()) {
      /* toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      }); */
      return;
    }

    try {
      const result = await scrapeUrl(url);

      if (result.error) {
        /* toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        }); */
      } else if (result.data) {
        // Update the context
        setMetadata(result.data);
      }
    } catch (error) {
      /* toast({
        title: "Error",
        description: "Failed to scrape URL",
        variant: "destructive",
      }); */
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2 w-8/12 self-center">
          <Input
            id="url"
            name="url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="flex-1"
          />
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}

// Metadata display component
function MetadataDisplay() {
  const { metadata } = useMetadata();
  // Move useState BEFORE the conditional return
  const [editableMetadata, setEditableMetadata] = useState({
    title: "",
    description: "",
  });
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  // Use useEffect to update state when metadata changes
  useEffect(() => {
    if (metadata) {
      setEditableMetadata({
        title: metadata.ogTitle || metadata.twitterTitle || "Metadata Results",
        description: metadata.ogDescription || "",
      });
    }
  }, [metadata]);

  // Now we can conditionally return if no metadata
  if (!metadata) {
    return null;
  }

  // Handle changes to form inputs
  const handleTitleChange = (e) => {
    setEditableMetadata({
      ...editableMetadata,
      title: e.target.value,
    });
  };

  const handleDescriptionChange = (e) => {
    setEditableMetadata({
      ...editableMetadata,
      description: e.target.value,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="w-full">
        <Card className="p-4 gap-4 flex flex-col h-full">
          <section>
            <Label>Title</Label>
            <Input id="meta-title" value={editableMetadata.title} onChange={handleTitleChange} />
          </section>
          <section>
            <Label>Description</Label>
            <Textarea
              id="meta-description"
              value={editableMetadata.description}
              className="h-32"
              onChange={handleDescriptionChange}
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
            <Select>
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
        </Card>
      </div>
      <div className="w-full">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{editableMetadata.title}</CardTitle>
            <CardDescription className="line-clamp-2">{editableMetadata.description}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {metadata.ogImage && metadata.ogImage.length > 0 && (
              <div className="mb-4">
                <img
                  src={metadata.ogImage[0].url || "/placeholder.svg"}
                  alt={metadata.ogTitle || "Preview image"}
                  className="rounded-md max-h-64 object-contain"
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metadata.ogUrl && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">URL</h3>
                  <p className="text-sm truncate">
                    <a
                      href={metadata.ogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {metadata.ogUrl}
                    </a>
                  </p>
                </div>
              )}

              {metadata.ogSiteName && (
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
              )}
            </div>
            {/* <pre className="bg-muted p-4 rounded-md overflow-auto text-xs text-primary">
              {JSON.stringify(metadata, null, 2)}
            </pre> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main page component
export default function Home() {
  return (
    <MetadataProvider>
      <main className="container mx-auto  px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Add Event to the Agenda</h1>
        <div className="mx-auto">
          <LinkForm />

          <div className="mt-8">
            <MetadataDisplay />
          </div>
        </div>
      </main>
    </MetadataProvider>
  );
}
