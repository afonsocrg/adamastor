"use server";

import { load } from "cheerio";
import type { MetadataResult } from "./types";

export async function scrapeUrl(url: string): Promise<{ data?: MetadataResult; error?: string }> {
  try {
    // Validate URL format
    if (!url.match(/^https?:\/\/.+\..+/)) {
      return { error: "Please enter a valid URL including http:// or https://" };
    }

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MetadataScraper/1.0)",
      },
    });

    if (!response.ok) {
      return { error: `Failed to fetch URL: ${response.statusText}` };
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

    // Send the result to the client via a custom event
    const script = `
      window.dispatchEvent(new CustomEvent('metadata-updated', { 
        detail: ${JSON.stringify(metadata)}
      }))
    `;

    // Execute the script on the client
    console.log(script);

    return { data: metadata };
  } catch (error) {
    console.error("Error in scrapeUrl:", error);
    return { error: "An unexpected error occurred" };
  }
}
