import type { MetadataRoute } from "next";

const SITE_URL = "https://adamastor.blog";

const DISALLOWED_PATHS = ["/api/", "/dashboard/", "/login", "/events/*/edit"];

/**
 * Paths crawlers are explicitly allowed to fetch. "/" opens the site; the
 * `/api/og/` carve-out is load-bearing: our Open Graph preview images are
 * served from `/api/og/...`, which would otherwise be blocked by the
 * `/api/` disallow above. Social crawlers (Twitterbot, LinkedIn, Facebook)
 * obey robots.txt and don't run JS, so a blocked OG route silently strips
 * the preview image — the card renders title + description but no picture.
 * `/api/og/` is a longer (more specific) match than `/api/`, so standards-
 * compliant crawlers let it through while the rest of `/api/` stays blocked.
 */
const ALLOWED_PATHS = ["/", "/api/og/"];

/**
 * AI search/citation crawlers we explicitly want to allow. The wildcard
 * `User-Agent: *` rule below already permits them by default — listing them
 * separately is intentional documentation so future contributors don't
 * silently break AI citation visibility (ChatGPT, Perplexity, Claude,
 * Gemini, Copilot) when adjusting the disallow list.
 *
 * If we ever decide to opt OUT of any of these (e.g. blocking training-only
 * crawlers like CCBot while keeping the search bots), remove them from this
 * list and add an explicit `disallow: ["/"]` rule for them.
 */
const AI_CRAWLERS = [
	"GPTBot", // OpenAI training crawler
	"ChatGPT-User", // OpenAI search-and-cite crawler (used when ChatGPT browses on a user's behalf)
	"PerplexityBot", // Perplexity
	"ClaudeBot", // Anthropic search-and-cite crawler
	"anthropic-ai", // Anthropic training crawler
	"Google-Extended", // Controls inclusion in Google Gemini / AI Overviews (separate from Googlebot)
];

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: ALLOWED_PATHS,
				disallow: DISALLOWED_PATHS,
			},
			...AI_CRAWLERS.map((userAgent) => ({
				userAgent,
				allow: ALLOWED_PATHS,
				disallow: DISALLOWED_PATHS,
			})),
		],
		sitemap: `${SITE_URL}/sitemap.xml`,
		host: SITE_URL,
	};
}
