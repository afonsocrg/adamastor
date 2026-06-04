"use client";

// Renders the static MonthSkeleton while the real calendar's JS chunk loads
// and mounts, then cross-fades to the live calendar.
//
// Design choices (each addresses one root cause of the previous "second flash"):
//
// 1. CSS Grid stacking instead of `position: absolute`.
//    Both children share `col-start-1 row-start-1` and overlap in the same
//    grid cell. The real calendar mounts in its FINAL layout context (static
//    flow, sized by content). No `absolute → static` className flip mid-life,
//    which previously made rbc re-measure its container.
//
// 2. Manual `import()` + useState instead of `next/dynamic`.
//    next/dynamic with `ssr: false` runs an internal state machine that can
//    yield null for one render tick even when the chunk is preloaded — a
//    visible white frame. Holding the resolved module ourselves means we
//    only render the live calendar once we definitely have it.
//
// 3. Hidden mount phase + one requestAnimationFrame before fade-start.
//    Lets rbc complete its first measurement + paint before the skeleton's
//    opacity starts dropping. During that mounting frame, the live calendar
//    is rendered at opacity-0 under the skeleton so it cannot pop in early.
//
// 4. `initialDate={serverNow}` passed through.
//    Keeps the live calendar's initial month aligned with the skeleton's
//    so there's no visible "snap to a different month" on mount.
//
// The stylesheet (incl. rbc's base CSS) is imported in page.tsx so it
// arrives in the initial document, not the dynamic chunk.

import { useEffect, useState, type ComponentType } from "react";
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
	serverNow: Date;
}

type LiveCalendar = ComponentType<{
	initialEvents: CalendarEventLike[];
	user?: unknown;
	initialDate?: Date;
}>;

const FADE_MS = 300;

export default function CalendarWithSkeleton({ initialEvents, user, serverNow }: CalendarWithSkeletonProps) {
	const [LiveCalendar, setLiveCalendar] = useState<LiveCalendar | null>(null);
	// "skeleton" — only skeleton visible.
	// "mounting" — live calendar mounted but hidden while rbc measures.
	// "crossfade" — both rendered; skeleton fading to 0 over FADE_MS.
	// "done" — skeleton unmounted; only live calendar.
	const [phase, setPhase] = useState<"skeleton" | "mounting" | "crossfade" | "done">("skeleton");

	// Effect 1: load the live calendar's module, then enter "mounting" so the
	// live calendar can render hidden under the skeleton before the fade starts.
	useEffect(() => {
		let cancelled = false;
		import("./CalendarTestClient")
			.then((mod) => {
				if (cancelled) return;
				setLiveCalendar(() => mod.default as LiveCalendar);
				setPhase("mounting");
			})
			.catch((err) => {
				console.error("Calendar dynamic import failed", err);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	// Effect 2: once the live component is mounted, wait one animation frame
	// (so rbc has a chance to measure + paint), then start the fade.
	useEffect(() => {
		if (!LiveCalendar || phase !== "mounting") return;
		let unmountTimer: ReturnType<typeof setTimeout> | null = null;
		const rafId = requestAnimationFrame(() => {
			setPhase("crossfade");
			unmountTimer = setTimeout(() => setPhase("done"), FADE_MS);
		});
		return () => {
			cancelAnimationFrame(rafId);
			if (unmountTimer) clearTimeout(unmountTimer);
		};
	}, [LiveCalendar, phase]);

	const liveIsVisible = phase === "crossfade" || phase === "done";

	return (
		// grid-cols-1 (== minmax(0, 1fr)) is load-bearing: a bare `grid` gives the
		// single implicit column `auto` sizing, which grows to the calendar's
		// max-content (card padding + rbc intrinsic width ≈ 363px) and overflows
		// the container on narrow phones (~4px of horizontal page scroll). The
		// explicit minmax(0, 1fr) track clamps both stacked children to the
		// container width so the calendar reflows to fit instead. No-op on desktop
		// where the column already fills the width.
		<div className="grid grid-cols-1">
			{phase !== "done" && (
				<div
					className={`relative z-20 col-start-1 row-start-1 transition-opacity duration-300 motion-reduce:transition-none ${
						phase === "crossfade" ? "pointer-events-none opacity-0" : "opacity-100"
					}`}
					aria-hidden={phase === "crossfade" ? "true" : undefined}
				>
					<MonthSkeleton date={serverNow} events={initialEvents} />
				</div>
			)}
			{LiveCalendar && (
				<div
					className={`relative col-start-1 row-start-1 transition-opacity duration-300 motion-reduce:transition-none ${
						liveIsVisible ? "z-30 opacity-100" : "pointer-events-none z-10 opacity-0"
					}`}
					aria-hidden={liveIsVisible ? undefined : "true"}
				>
					<LiveCalendar initialEvents={initialEvents} user={user} initialDate={serverNow} />
				</div>
			)}
		</div>
	);
}
