import type { MetadataRoute } from "next";

const SITE_URL = "https://adamastor.blog";

const DISALLOWED_PATHS = ["/api/", "/dashboard/", "/login", "/events/*/edit"];

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
				allow: "/",
				disallow: DISALLOWED_PATHS,
			},
			...AI_CRAWLERS.map((userAgent) => ({
				userAgent,
				allow: "/",
				disallow: DISALLOWED_PATHS,
			})),
		],
		sitemap: `${SITE_URL}/sitemap.xml`,
		host: SITE_URL,
	};
}
