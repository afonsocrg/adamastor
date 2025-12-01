import type { MetadataResult } from "@/app/types";
import { load, type CheerioAPI } from "cheerio";
import { type NextRequest, NextResponse } from "next/server";

interface Event {
  title: string;
  description?: string;
  url?: string;
  bannerUrl?: string;
  startTime?: Date;
  city?: string;
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function snakeCaseToCamelCase(str: string) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function getPropertyKey(property: string) {
  const parts = property.split(":").map(part => capitalizeFirstLetter(snakeCaseToCamelCase(part)));

  // first letter lowercase
  return parts.join("").charAt(0).toLowerCase() + parts.join("").slice(1);
}

function extractOGMetadata($: CheerioAPI) {
  const metadata: MetadataResult = {};

  $('meta[property^="og:"]').each((_, element) => {
    const property = $(element).attr("property");
    const content = $(element).attr("content");

    if (property && content) {
      const key = getPropertyKey(property);
      if (property === "og:image") {
        metadata.ogImage = metadata.ogImage || [];
        metadata.ogImage.push({ url: content });
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (metadata as any)[key] = content;
      }
    }
  });
  return metadata;
  
}

function extractTwitterMetadata($: CheerioAPI) {
    const metadata: MetadataResult = {};
    $('meta[name^="twitter:"]').each((_, element) => {
        const name = $(element).attr("name");
        const content = $(element).attr("content");

        if (name && content) {
          const key = getPropertyKey(name);

          if (name === "twitter:image") {
            metadata.twitterImage = metadata.twitterImage || [];
            metadata.twitterImage.push({ url: content });
          } else {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            (metadata as any)[key] = content;
          }
        }
    });
    return metadata;
}

function extractMetadata(html: string): MetadataResult {
    // Parse the HTML with cheerio
    const $ = load(html);

    // Some sites (eventbrite) return this metadata tag
    const eventStartTime = $('meta[property="event:start_time"]').attr("content") || undefined;
    const eventEndTime = $('meta[property="event:end_time"]').attr("content") || undefined;

    // Extract metadata
    const metadata: MetadataResult = {
      title: $("title")?.text()?.trim(),
      description: $('meta[name="description"]').attr("content")?.trim(),
      eventStartTime: eventStartTime,
      eventEndTime: eventEndTime,
      ...extractOGMetadata($),
      ...extractTwitterMetadata($),
    };
  return metadata;
}

function extractDefaultEventData(html: string): Event {
    const metadata = extractMetadata(html);
    return {
        title: metadata.title,
        description: metadata.description,
        url: metadata.ogUrl,
        bannerUrl: metadata.ogImage?.[0]?.url || metadata.twitterImage?.[0]?.url,
    }
}


function extractEventbriteData(html: string): Event {
    const metadata = extractMetadata(html);

    const eventStartTime = metadata.eventStartTime ? new Date(metadata.eventStartTime) : undefined;

    return {
        title: metadata.ogTitle || metadata.title,
        description: metadata.ogDescription || metadata.description,
        url: metadata.ogUrl,
        bannerUrl: metadata.ogImage?.[0]?.url || metadata.twitterImage?.[0]?.url,
        startTime: eventStartTime,
    }
}

function extractLumaData(html: string): Event {
    const metadata = extractMetadata(html);
    return {
        title: metadata.title.replace(" · Luma", ""),
        description: metadata.description,
        url: metadata.ogUrl,
        bannerUrl: metadata.ogImage?.[0]?.url || metadata.twitterImage?.[0]?.url,
        startTime: metadata.eventStartTime,
    }
}


export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MetadataScraper/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: 500 });
    }

    const html = await response.text();

    let metadata: Event;
    if (url.includes("eventbrite.")) {
        console.log("Detected Eventbrite URL. Scraping Eventbrite data...")
        metadata = extractEventbriteData(html);
    } else if (url.includes("lu.ma")) {
        console.log("Detected Lu.ma URL. Scraping Lu.ma data...")
        metadata = extractLumaData(html);
    } else {
        console.log("Did not detect any special event URL. Using default metadata extraction...")
        metadata = extractDefaultEventData(html);
    }

    return NextResponse.json({ data: metadata });
  } catch (error) {
    console.error("Error in scrape API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
