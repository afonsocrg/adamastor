import { createPublicClient } from "@/lib/supabase/public";
import { tiptapToHtml } from "@/lib/tiptap-to-html";

const SITE_URL = "https://adamastor.blog";
const FEED_URL = `${SITE_URL}/feed.xml`;
const FEED_TITLE = "Adamastor — Weekly Digest";
const FEED_DESCRIPTION =
	"Adamastor is a digital publication for all things startup in Portugal. Weekly reporting and analysis on the Portuguese startup scene.";
const FEED_LANGUAGE = "en";
const MAX_ITEMS = 50;

// 1-hour cache aligns with the site's ISR cadence on posts/events. Feed
// readers typically poll on their own schedule (often every few hours), so
// 1h freshness is plenty.
export const revalidate = 3600;

interface FeedPost {
	id: number | string;
	slug: string | null;
	title: string;
	content: unknown;
	created_at: string;
	updated_at: string | null;
	authors: { name: string } | null;
}

/** XML-escape a string for use inside an element body or attribute. */
function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

/**
 * Wrap HTML in CDATA for safe inclusion in `<content:encoded>`. The only
 * sequence CDATA can't contain is `]]>`; splice it apart if present.
 */
function wrapCdata(html: string): string {
	const safe = html.replace(/\]\]>/g, "]]]]><![CDATA[>");
	return `<![CDATA[${safe}]]>`;
}

/**
 * Strip HTML tags and collapse whitespace, then trim to ~300 chars on a
 * word boundary. Used for `<description>` (plain-text excerpt). The full
 * HTML still ships via `<content:encoded>` for readers that render it.
 */
function htmlToExcerpt(html: string, max = 300): string {
	const text = html
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (text.length <= max) return text;
	const truncated = text.slice(0, max);
	const lastSpace = truncated.lastIndexOf(" ");
	return `${truncated.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}

export async function GET() {
	const supabase = createPublicClient();
	const { data, error } = await supabase
		.from("posts")
		.select(`
			id, slug, title, content, created_at, updated_at,
			authors ( name )
		`)
		.eq("is_public", true)
		.order("created_at", { ascending: false })
		.limit(MAX_ITEMS);

	if (error) {
		console.error("feed.xml: failed to fetch posts", error);
		return new Response("Internal Server Error", { status: 500 });
	}

	const posts = (data ?? []) as unknown as FeedPost[];

	const items = posts
		.map((post) => {
			const path = post.slug ?? String(post.id);
			const url = `${SITE_URL}/posts/${path}`;
			const fullHtml = tiptapToHtml(post.content as never);
			const excerpt = htmlToExcerpt(fullHtml);
			const pubDate = new Date(post.created_at).toUTCString();
			const author = post.authors?.name ?? "Adamastor";

			return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(author)}</dc:creator>
      <description>${escapeXml(excerpt)}</description>
      <content:encoded>${wrapCdata(fullHtml)}</content:encoded>
    </item>`;
		})
		.join("\n");

	const lastBuildDate = posts[0] ? new Date(posts[0].created_at).toUTCString() : new Date().toUTCString();

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>${FEED_LANGUAGE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	});
}
