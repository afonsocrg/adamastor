"use client";

import type { PostHeading } from "@/lib/posts/headings";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface PostTOCProps {
	headings: PostHeading[];
	className?: string;
	/**
	 * CSS selector for an element the TOC should align with. Two derived
	 * measurements:
	 *   1. The nav's top is pushed down via the container's padding-top so it
	 *      aligns with the target's top (typically the first paragraph).
	 *   2. The sticky container's height is bounded by the target's last
	 *      meaningful content, so position:sticky inside it releases at the
	 *      end of the body — the TOC stops following past the last paragraph.
	 */
	alignTo?: string;
}

/**
 * Floating left-rail table of contents inside the article's 2-col grid.
 * Reads the server-extracted heading list, injects IDs onto rendered h2/h3
 * elements, tracks the active section on scroll, and exposes anchor links
 * for quick navigation.
 *
 * Hidden below `lg:`. On smaller screens the editorial register treats the
 * article as the page — chrome recedes, body leads.
 */
export default function PostTOC({ headings, className, alignTo }: PostTOCProps) {
	const [activeSlug, setActiveSlug] = useState<string | null>(headings[0]?.slug ?? null);
	const navRef = useRef<HTMLElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLOListElement>(null);
	const [activeLine, setActiveLine] = useState({ top: 0, height: 0 });
	const [hasMeasuredActiveLine, setHasMeasuredActiveLine] = useState(false);

	const measureActiveLine = useCallback(() => {
		const list = listRef.current;
		const activeLink = list?.querySelector<HTMLAnchorElement>('a[aria-current="location"]');

		if (!list || !activeLink) return;

		setActiveLine({
			top: activeLink.offsetTop,
			height: activeLink.offsetHeight,
		});
		setHasMeasuredActiveLine(true);
	}, []);

	useEffect(() => {
		if (headings.length === 0) return;

		let cancelled = false;
		let attempts = 0;
		let elements: HTMLElement[] = [];
		let ticking = false;

		const bindHeadings = (): boolean => {
			const nodes = document.querySelectorAll<HTMLElement>(".article-prose h2, .article-prose h3");
			if (nodes.length === 0) return false;
			elements = [];
			nodes.forEach((node, index) => {
				const heading = headings[index];
				if (!heading) return;
				node.id = heading.slug;
				node.style.scrollMarginTop = "6rem";
				elements.push(node);
			});
			return elements.length > 0;
		};

		const recompute = () => {
			ticking = false;
			// Focus line at ~25% of the viewport: above this, a heading counts
			// as "passed" (reader has scrolled into its section); below, the
			// next section hasn't started yet.
			const focusLine = window.innerHeight * 0.25;
			let nextActive = elements[0]?.id ?? null;
			for (const el of elements) {
				if (el.getBoundingClientRect().top <= focusLine) {
					nextActive = el.id;
				} else {
					break;
				}
			}
			if (nextActive) setActiveSlug(nextActive);
		};

		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			queueMicrotask(recompute);
		};

		const tryBind = () => {
			if (cancelled) return;
			if (!bindHeadings()) {
				attempts += 1;
				if (attempts < 30) window.setTimeout(tryBind, 100);
				return;
			}
			window.addEventListener("scroll", onScroll, { passive: true });
			window.addEventListener("resize", onScroll, { passive: true });
			recompute();
		};

		tryBind();

		return () => {
			cancelled = true;
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, [headings]);

	useLayoutEffect(() => {
		measureActiveLine();
	}, [measureActiveLine, activeSlug]);

	useEffect(() => {
		measureActiveLine();

		const list = listRef.current;
		if (!list) return;

		const resizeObserver = new ResizeObserver(measureActiveLine);
		resizeObserver.observe(list);
		for (const link of list.querySelectorAll("a")) {
			resizeObserver.observe(link);
		}

		document.fonts?.ready.then(measureActiveLine).catch(() => {
			// The active border fallback keeps the TOC readable before font
			// metrics settle; this only refines the animated rail.
		});

		return () => resizeObserver.disconnect();
	}, [measureActiveLine]);

	// Align the nav's top with `alignTo`'s top and bound the sticky container
	// to the target's last-content bottom. Padding-top (not margin-top) on
	// the container to avoid margin-collapsing with the nav's first child.
	useEffect(() => {
		if (!alignTo) return;
		const container = containerRef.current;
		const nav = navRef.current;
		if (!container || !nav) return;

		let cancelled = false;
		let attempts = 0;
		let ro: ResizeObserver | null = null;

		const findLastContentBottom = (root: HTMLElement): number => {
			const children = Array.from(root.children) as HTMLElement[];
			for (let i = children.length - 1; i >= 0; i--) {
				const el = children[i];
				const rect = el.getBoundingClientRect();
				if (rect.height > 0 && (el.textContent?.trim().length ?? 0) > 0) {
					return rect.bottom;
				}
			}
			return root.getBoundingClientRect().bottom;
		};

		const align = () => {
			if (cancelled) return;
			const target = document.querySelector<HTMLElement>(alignTo);
			if (!target) {
				attempts += 1;
				if (attempts < 30) window.setTimeout(align, 100);
				return;
			}
			container.style.paddingTop = "0px";
			container.style.height = "auto";

			const containerTop = container.getBoundingClientRect().top;
			const targetTop = target.getBoundingClientRect().top;
			const lastContentBottom = findLastContentBottom(target);

			const paddingTop = Math.max(0, targetTop - containerTop);
			const containerHeight = Math.max(0, lastContentBottom - containerTop);

			container.style.paddingTop = `${paddingTop}px`;
			container.style.height = `${containerHeight}px`;

			if (!ro) {
				ro = new ResizeObserver(() => align());
				ro.observe(target);
			}
		};

		align();
		window.addEventListener("resize", align, { passive: true });
		return () => {
			cancelled = true;
			ro?.disconnect();
			window.removeEventListener("resize", align);
		};
	}, [alignTo]);

	if (headings.length < 2) return null;

	return (
		<div ref={containerRef}>
			<nav ref={navRef} className={cn(className)} aria-label="Article contents">
				{/* Kicker matches the publication-wide kicker scale (text-xs 12px
				    + tracking-0.14em + navy-tone), per docs/typography.md →
				    "Kicker labels". Label is "In this article" rather than
				    "Contents" — reader-addressed editorial register (NYT /
				    WaPo convention), rhymes with the page's other editorial
				    kickers (About the author, Reader notes). The nav's
				    aria-label stays "Article contents" — terser and reads
				    better as a landmark name to screen readers than the
				    visible editorial label would. */}
				<p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-cyan-dim">
					In this article
				</p>
				<ol ref={listRef} className="relative border-l border-navy-frame [&>li+li]:mt-2">
					{headings.map((heading) => {
						const isActive = heading.slug === activeSlug;
						return (
							<li key={heading.slug} className={heading.level === 3 ? "pl-2" : ""}>
								{/* Active item weight matches `.article-prose strong` (575)
								    so the page has one consistent emphasis ladder. At
								    sidebar 14px the perceptual jump from 400 → 575 is
								    plenty pre-attentive; the previous 600 (font-semibold)
								    matched H3 weight, which read as overcommitted for a
								    passive scroll indicator. */}
								<a
									href={`#${heading.slug}`}
									aria-current={isActive ? "location" : undefined}
									className={cn(
										"-ml-px block border-l py-0.5 pl-3 text-sm leading-snug transition-colors",
										isActive && !hasMeasuredActiveLine
											? "border-navy font-[575] text-navy dark:border-cyan-lifted dark:text-cyan-lifted"
											: isActive
												? "border-transparent font-[575] text-navy dark:text-cyan-lifted"
												: "border-transparent text-navy-tone hover:text-navy dark:text-cyan-dim dark:hover:text-cyan-lifted",
									)}
								>
									{heading.text}
								</a>
							</li>
						);
					})}
					<span
						aria-hidden="true"
						className={cn(
							"pointer-events-none absolute left-0 top-0 h-px w-px origin-top bg-navy dark:bg-cyan-lifted [transition:transform_220ms_cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none",
							hasMeasuredActiveLine ? "opacity-100" : "opacity-0",
						)}
						style={{
							transform: `translateY(${activeLine.top}px) scaleY(${activeLine.height})`,
						}}
					/>
				</ol>
			</nav>
		</div>
	);
}
