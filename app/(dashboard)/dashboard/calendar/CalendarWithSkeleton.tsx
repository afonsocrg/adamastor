"use client";

// Renders the static MonthSkeleton until React hydrates + the dynamic
// CalendarTestClient chunk has loaded; then swaps to the live calendar.
//
// The skeleton is server-rendered via this component's first render
// (hydrated=false). After hydration, useEffect flips state, triggering
// a re-render that mounts the dynamic-imported CalendarTestClient. The
// dynamic chunk preloads in parallel via the module-level `import()`
// statement below, so by the time the user could click anything the JS
// is usually already in cache.
//
// Why not just put MonthSkeleton in dynamic({ loading: ... })?
// `next/dynamic`'s `loading` callback doesn't receive props — we'd lose
// access to events/date needed to render an accurate skeleton. Doing the
// swap in a stateful wrapper keeps both branches prop-aware.

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MonthSkeleton from "./MonthSkeleton";

interface CalendarEventLike {
	id: number | string;
	title: string;
	start: Date;
	end: Date;
	city?: string;
	url?: string;
	categorySlugs?: string[];
}

interface CalendarWithSkeletonProps {
	initialEvents: CalendarEventLike[];
	user?: unknown;
	// `now` from the server so the skeleton's "today" / past-day math
	// resolves to the same date on server + client; prevents a rare
	// hydration mismatch when SSR + hydration straddle midnight.
	serverNow: Date;
}

// Dynamic-imported live calendar. `ssr: false` skips server rendering
// (which would otherwise produce an empty pre-hydration HTML that flashes
// after the skeleton). The dynamic chunk loads in parallel with the
// initial page payload because Next.js inlines the import as a module
// preload link in the SSR response.
const CalendarTestClient = dynamic(() => import("./CalendarTestClient"), {
	ssr: false,
	// Render nothing during the dynamic load — the wrapper's hydrated
	// branch handles the visible state below. Without `loading: () => null`
	// next/dynamic would briefly inject its own (empty) fallback over our
	// skeleton.
	loading: () => null,
});

// Cross-fade duration in ms. Kept in JS so the post-fade unmount timer
// matches the CSS transition exactly.
const FADE_MS = 300;

export default function CalendarWithSkeleton({ initialEvents, user, serverNow }: CalendarWithSkeletonProps) {
	// Three phases:
	//   "skeleton" — only MonthSkeleton rendered (initial paint + SSR).
	//   "crossfade" — chunk loaded, real calendar rendered ON TOP of
	//     skeleton via absolute positioning; both visible during a 300ms
	//     opacity transition.
	//   "done" — skeleton unmounted; real calendar switched to static
	//     positioning so it can grow naturally for views with variable
	//     height (Agenda especially).
	const [phase, setPhase] = useState<"skeleton" | "crossfade" | "done">("skeleton");

	useEffect(() => {
		// Preload the dynamic chunk before showing the real calendar so the
		// fade-in animation runs against an already-mounted component (no
		// gap between flip and chunk-arrival).
		let cancelled = false;
		let unmountTimer: ReturnType<typeof setTimeout> | null = null;
		import("./CalendarTestClient")
			.then(() => {
				if (cancelled) return;
				setPhase("crossfade");
				unmountTimer = setTimeout(() => {
					if (!cancelled) setPhase("done");
				}, FADE_MS);
			})
			.catch((err) => {
				console.error("Calendar dynamic import failed", err);
			});
		return () => {
			cancelled = true;
			if (unmountTimer) clearTimeout(unmountTimer);
		};
	}, []);

	const realIsAbsolute = phase === "crossfade";
	const realIsVisible = phase !== "skeleton";

	return (
		<div className="relative">
			{phase !== "done" && (
				<div
					className={`transition-opacity duration-300 ${
						phase === "crossfade" ? "pointer-events-none opacity-0" : "opacity-100"
					}`}
					aria-hidden={phase === "crossfade" ? "true" : undefined}
				>
					<MonthSkeleton date={serverNow} events={initialEvents} />
				</div>
			)}
			{realIsVisible && (
				<div
					className={`motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 ${
						realIsAbsolute ? "absolute inset-0" : ""
					}`}
				>
					<CalendarTestClient initialEvents={initialEvents} user={user} />
				</div>
			)}
		</div>
	);
}
