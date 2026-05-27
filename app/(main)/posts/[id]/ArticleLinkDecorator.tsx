"use client";

import { useEffect } from "react";

interface ArticleLinkDecoratorProps {
	/** Stable identifier for the article — used as `utm_campaign` so click data
	 *  attributes back to a specific post in destination analytics. */
	postSlug: string;
}

const SITE_HOSTNAME = "adamastor.blog";

/**
 * Decorates every external link inside `.article-prose` with `utm_*` params
 * after mount, so a click from a Carlos-cited Substack post (or any other
 * outbound link in the body) attributes back to Adamastor — and to the
 * specific article that drove the click — on the destination's analytics.
 *
 * Why client-side rather than baked into the TipTap content:
 *   - The article body is editor-authored (`novel`/TipTap); rewriting URLs
 *     at write-time would mutate the canonical content in the DB and
 *     conflict with future edits.
 *   - SSR'd HTML stays as a clean canonical link so search crawlers and
 *     AI bots see the original destination. `useEffect` runs only after
 *     hydration → no SSR/hydration mismatch.
 *
 * Skip rules:
 *   - Same-domain links (internal navigation) — UTMs would pollute our own
 *     analytics + appear in shared URLs.
 *   - `mailto:` / `tel:` / other non-http(s) protocols.
 *   - Anything that already carries a `utm_*` param — admin may have set
 *     a partner-specific campaign on purpose.
 *
 * Side effect: ensures every decorated outbound link opens in a new tab
 * with `rel="noopener noreferrer"` for the tabnabbing safety guarantee.
 */
function decorateAnchor(anchor: HTMLAnchorElement, postSlug: string): void {
	const href = anchor.getAttribute("href");
	if (!href) return;

	let url: URL;
	try {
		url = new URL(href, window.location.origin);
	} catch {
		return;
	}

	if (url.protocol !== "http:" && url.protocol !== "https:") return;

	const isSameDomain =
		url.hostname === window.location.hostname || url.hostname === SITE_HOSTNAME;
	if (isSameDomain) return;

	const alreadyTagged =
		url.searchParams.has("utm_source") ||
		url.searchParams.has("utm_medium") ||
		url.searchParams.has("utm_campaign");
	if (!alreadyTagged) {
		url.searchParams.set("utm_source", SITE_HOSTNAME);
		url.searchParams.set("utm_medium", "post");
		url.searchParams.set("utm_campaign", postSlug);
		const decorated = url.toString();
		if (decorated !== href) anchor.setAttribute("href", decorated);
	}

	if (!anchor.getAttribute("target")) anchor.setAttribute("target", "_blank");
	const rel = anchor.getAttribute("rel") ?? "";
	if (!rel.includes("noopener")) {
		anchor.setAttribute("rel", `${rel} noopener noreferrer`.trim());
	}
}

function isInsideArticleProse(node: Element): boolean {
	return Boolean(node.closest(".article-prose"));
}

export default function ArticleLinkDecorator({ postSlug }: ArticleLinkDecoratorProps) {
	useEffect(() => {
		const decorateInside = (root: ParentNode) => {
			for (const anchor of root.querySelectorAll<HTMLAnchorElement>(".article-prose a[href]")) {
				decorateAnchor(anchor, postSlug);
			}
		};

		// Eager pass — handles the warm case where TipTap (novel) has already
		// rendered before this effect runs (HMR, back-button restore).
		decorateInside(document);

		// Cold case: TipTap mounts and renders article content AFTER this
		// effect, so the eager pass above sees no anchors. Observe the whole
		// document body so the `.article-prose` subtree's appearance — and
		// any later additions inside it — get caught. The observer filters
		// by ancestry rather than being scoped to a node that may not exist
		// at mount time.
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (!(node instanceof Element)) continue;

					if (node instanceof HTMLAnchorElement && node.hasAttribute("href") && isInsideArticleProse(node)) {
						decorateAnchor(node, postSlug);
						continue;
					}

					// Either the .article-prose root itself or a wrapper containing
					// it just landed — sweep its descendants.
					for (const anchor of node.querySelectorAll<HTMLAnchorElement>(".article-prose a[href], a[href]")) {
						if (isInsideArticleProse(anchor)) decorateAnchor(anchor, postSlug);
					}
				}
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });

		return () => observer.disconnect();
	}, [postSlug]);

	return null;
}
