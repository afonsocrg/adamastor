"use client";

// Persistent chrome for the /events filter routes. Lives in the layout so it
// is NOT torn down when you navigate between filter routes (/events ->
// /events/lisboa -> /events/lisboa/design). Previously the city tab row lived
// inside EventsPageClient (the page), so every chip click crossed a route-
// segment boundary and React remounted the whole subtree — the "jarring flash."
// Hosting the tab row here keeps it mounted across navigations: the active
// underline now slides between cities instead of blinking, and the row never
// re-measures or re-centres its scroll on each click.
//
// The shell ALSO wraps every /events/* route (calendar, submit, an event's
// edit screen), so it renders the filter chrome only on genuine filter routes
// (isEventsFilterRoute) and passes siblings through untouched.

import {
	SELECTABLE_CITIES,
	buildEventsRoutePath,
	formatCityLabel,
	isEventsFilterRoute,
	parseEventsSegments,
} from "@/lib/events/route-slugs";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSelectedLayoutSegments } from "next/navigation";
import posthog from "posthog-js";
import {
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	useTransition,
} from "react";

export default function EventsLayoutShell({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const segments = useSelectedLayoutSegments();
	const { city: activeCity, category: activeCategory } = parseEventsSegments(segments);
	const showFilterChrome = isEventsFilterRoute(segments);

	// Fade the page body in on each filter swap — but NOT on the first paint
	// (initial load shouldn't animate). The shell persists across filter
	// navigations, so this ref reliably tracks "have we navigated since mount."
	const hasNavigated = useRef(false);
	useEffect(() => {
		hasNavigated.current = true;
	}, []);

	// Optimistic navigation: clicking a tab flips it active immediately and runs
	// the route change inside a transition (keeps the current view interactive
	// while the next route streams in — no loading.tsx fallback flash).
	const [isPending, startTransition] = useTransition();
	const [pendingHref, setPendingHref] = useState<string | null>(null);

	const cityNavRef = useRef<HTMLElement>(null);
	const cityTrackRef = useRef<HTMLDivElement>(null);
	const [cityUnderline, setCityUnderline] = useState({ left: 0, width: 0 });
	const [hasMeasuredCityUnderline, setHasMeasuredCityUnderline] = useState(false);

	// City hrefs preserve the active category — switching city keeps your lens
	// (e.g. on /events/lisboa/design, clicking Porto -> /events/porto/design).
	const cityHref = (city: string | null) => buildEventsRoutePath({ city, category: activeCategory });
	const currentHref = buildEventsRoutePath({ city: activeCity, category: activeCategory });
	const activeHref = pendingHref ?? currentHref;

	useEffect(() => {
		if (!isPending) setPendingHref(null);
	}, [isPending]);

	const measureCityUnderline = useCallback(() => {
		const track = cityTrackRef.current;
		const active = track?.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
		if (!track || !active) return;
		setCityUnderline({ left: active.offsetLeft, width: active.offsetWidth });
		setHasMeasuredCityUnderline(true);
	}, []);

	// Re-measure (and thus slide) the underline whenever the active route
	// changes. Because the shell persists, this is a smooth transform tween
	// between tabs rather than a remount.
	useLayoutEffect(() => {
		measureCityUnderline();
	}, [measureCityUnderline, activeHref]);

	// Centre the active chip inside its scroll container when the active route
	// changes (deep-links can land the active tab off-screen on mobile).
	useEffect(() => {
		const nav = cityNavRef.current;
		if (!nav) return;
		const active = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
		if (!active) return;
		const target = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
		nav.scrollLeft = Math.max(0, target);
	}, [activeHref]);

	useEffect(() => {
		measureCityUnderline();
		const track = cityTrackRef.current;
		if (!track) return;
		const resizeObserver = new ResizeObserver(measureCityUnderline);
		resizeObserver.observe(track);
		for (const link of track.querySelectorAll("a")) resizeObserver.observe(link);
		document.fonts?.ready.then(measureCityUnderline).catch(() => {
			// Font readiness only refines the measured underline; the fallback
			// active border keeps the row legible before this resolves.
		});
		return () => resizeObserver.disconnect();
	}, [measureCityUnderline]);

	const handleChipClick =
		(href: string, captureAnalytics: () => void) => (event: ReactMouseEvent<HTMLAnchorElement>) => {
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			if (event.button !== 0) return;
			event.preventDefault();
			captureAnalytics();
			setPendingHref(href);
			startTransition(() => {
				router.replace(href, { scroll: false });
			});
		};

	const cityClickHandler = (city: string | "all") => {
		const href = cityHref(city === "all" ? null : city);
		return handleChipClick(href, () => posthog.capture("city_filter", { city, category: activeCategory ?? "all" }));
	};

	const cityTabClass = (isActive: boolean) =>
		cn(
			"inline-flex items-center text-sm leading-6 pb-1 shrink-0 whitespace-nowrap transition-colors duration-150 ease motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded",
			isActive && !hasMeasuredCityUnderline
				? "font-semibold text-navy dark:text-navy-lifted border-b-2 border-navy dark:border-navy-lifted"
				: isActive
					? "font-semibold text-navy dark:text-navy-lifted border-b-2 border-transparent"
					: "text-navy-tone hover:text-navy dark:text-navy-dim/[0.7] dark:hover:text-navy-lifted border-b-2 border-transparent",
		);

	// Sibling /events pages (calendar, submit, edit) share this layout but not
	// the filter chrome — pass them through bare.
	if (!showFilterChrome) return <>{children}</>;

	return (
		<div className="space-y-8 md:space-y-10 md:p-4" aria-busy={isPending}>
			{/* City scope — small edition-style tab row above the page H1. See the
			    original placement note in EventsPageClient git history: the row is
			    persistent context (you're in Lisboa, you stay there) and is mirrored
			    in the URL + H1, so it reads as a tab row, not a sidebar filter. */}
			<nav
				ref={cityNavRef}
				aria-label="City"
				className="overflow-x-auto -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-x-visible sm:-mx-0 sm:px-0 border-b border-navy-frame dark:border-navy-edge"
			>
				<div
					ref={cityTrackRef}
					className="relative flex min-w-full w-max items-center gap-x-6 gap-y-1 sm:w-auto sm:flex-wrap"
				>
					<Link
						href={cityHref(null)}
						replace
						scroll={false}
						onClick={cityClickHandler("all")}
						aria-current={activeHref === cityHref(null) ? "page" : undefined}
						className={cityTabClass(activeHref === cityHref(null))}
					>
						Everywhere
					</Link>
					{SELECTABLE_CITIES.map((city) => {
						const isActive = activeHref === cityHref(city);
						return (
							<Link
								key={city}
								href={cityHref(city)}
								replace
								scroll={false}
								onClick={cityClickHandler(city)}
								aria-current={isActive ? "page" : undefined}
								className={cityTabClass(isActive)}
							>
								{formatCityLabel(city)}
							</Link>
						);
					})}

					<span
						aria-hidden="true"
						className={cn(
							"pointer-events-none absolute bottom-[-1px] left-0 h-0.5 w-px origin-left bg-navy dark:bg-navy-lifted [transition:transform_220ms_cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none",
							hasMeasuredCityUnderline ? "opacity-100" : "opacity-0",
						)}
						style={{
							transform: `translateX(${cityUnderline.left}px) scaleX(${cityUnderline.width})`,
						}}
					/>
				</div>
			</nav>

			{/* The page body still remounts on navigation (it carries the per-route
			    SSR content + events data) — that's the legitimate content change.
			    Key it by pathname and crossfade each swap with `events-body-enter`
			    (a fade from half-opacity, so there's no blank "flash" frame) so the
			    change settles instead of hard-cutting. The page header animates its
			    own height across the swap (see EventsPageClient) so the chip row +
			    list slide rather than snap when the intro length changes. The
			    persistent city row above never enters this fade. */}
			<div key={pathname} className={hasNavigated.current ? "events-body-enter" : undefined}>
				{children}
			</div>
		</div>
	);
}
