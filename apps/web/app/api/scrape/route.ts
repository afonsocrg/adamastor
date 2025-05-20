import type { MetadataResult } from "@/app/types";
import { load } from "cheerio";
import { type NextRequest, NextResponse } from "next/server";

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

    // Parse the HTML with cheerio
    const $ = load(html);

    // Extract metadata
    const metadata: MetadataResult = {
      requestUrl: url,
      success: true,
      ogImage: [],
    };

    // Extract Open Graph metadata
    $('meta[property^="og:"]').each((_, element) => {
      const property = $(element).attr("property");
      const content = $(element).attr("content");

      if (property && content) {
        const key = property.replace("og:", "og");

        if (property === "og:image") {
          metadata.ogImage = metadata.ogImage || [];
          metadata.ogImage.push({ url: content });
        } else {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (metadata as any)[key] = content;
        }
      }
    });

    // Extract Twitter Card metadata
    $('meta[name^="twitter:"]').each((_, element) => {
      const name = $(element).attr("name");
      const content = $(element).attr("content");

      if (name && content) {
        const key = name.replace("twitter:", "twitter");

        if (name === "twitter:image") {
          metadata.twitterImage = metadata.twitterImage || [];
          metadata.twitterImage.push({ url: content });
        } else {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (metadata as any)[key] = content;
        }
      }
    });

    // Extract title as fallback
    if (!metadata.ogTitle) {
      metadata.ogTitle = $("title").text();
    }

    // Extract description as fallback
    if (!metadata.ogDescription) {
      const metaDescription = $('meta[name="description"]').attr("content");
      if (metaDescription) {
        metadata.ogDescription = metaDescription;
      }
    }

    return NextResponse.json({ data: metadata });
  } catch (error) {
    console.error("Error in scrape API:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
