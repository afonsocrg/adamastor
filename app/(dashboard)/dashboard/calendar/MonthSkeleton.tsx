// Server-renderable month-view skeleton. Renders the calendar's outer shell
// + Lora toolbar label + 7×6 day grid in plain HTML/CSS — no react-big-
// calendar, no "use client", no JS needed. Painted from the SSR HTML, so
// the calendar's visual shape (past wash, today pill, day labels, even
// per-cell event-count "ghosts") is on screen the moment the user's
// browser parses the response.
//
// The live `CalendarTestClient` then dynamic-loads and replaces this
// skeleton via `CalendarWithSkeleton`. Same outer wrapper + same grid
// shape so the swap is visually seamless.

import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";

interface SkeletonEvent {
	start: Date;
	end: Date;
}

interface MonthSkeletonProps {
	date: Date;
	events: SkeletonEvent[];
}

export default function MonthSkeleton({ date, events }: MonthSkeletonProps) {
	// Use the passed `date` (= serverNow) for the today calculation, not
	// `moment()`. `moment()` returns a different timestamp on server vs
	// client hydration — that mismatch makes React tear down + re-render
	// the skeleton, producing a visible blank flash.
	const anchor = moment(date);
	const today = anchor.clone().startOf("day");
	const monthStart = anchor.clone().startOf("month");
	const monthEnd = anchor.clone().endOf("month");
	// Match the live calendar's Monday-first locale (rbc + moment configured
	// to dow=1 in CalendarTestClient).
	const gridStart = monthStart.clone().startOf("week");
	const gridEnd = monthEnd.clone().endOf("week");

	const days: moment.Moment[] = [];
	for (let cur = gridStart.clone(); cur.isSameOrBefore(gridEnd); cur.add(1, "day")) {
		days.push(cur.clone());
	}

	// Count events per day for ghost bars. Cap at 3 visible + "+N more" so
	// the skeleton's vertical rhythm matches what the live calendar will
	// produce once rbc mounts.
	const countsByDay = new Map<string, number>();
	for (const ev of events) {
		const key = moment(ev.start).format("YYYY-MM-DD");
		countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
	}

	const label = anchor.format("MMMM YYYY");

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-navy-frame bg-white p-5 dark:border-cyan-glow/[0.18] dark:bg-background">
				{/* Toolbar shape — non-interactive. The live CalendarToolbar
				    re-renders this exact layout once hydration completes, so
				    the swap is visually identical. */}
				<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
					<h2 className="flex items-center gap-2.5 text-xl font-bold text-navy dark:text-cyan-lifted [font-family:var(--font-lora-bold)]">
						<CalendarIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
						<span>{label}</span>
					</h2>
					<div className="flex gap-2">
						<div
							aria-hidden="true"
							className="flex items-center gap-1 rounded-md border border-navy-frame dark:border-cyan-glow/[0.18]"
						>
							<div className="p-2">
								<ChevronLeft className="h-4 w-4 opacity-40" />
							</div>
							<div className="border-l border-r border-navy-frame px-3 py-1.5 text-sm opacity-40 dark:border-cyan-glow/[0.18]">
								Today
							</div>
							<div className="p-2">
								<ChevronRight className="h-4 w-4 opacity-40" />
							</div>
						</div>
						<div
							aria-hidden="true"
							className="flex h-9 w-[140px] items-center justify-between rounded-md border border-navy-frame px-3 text-sm opacity-60 dark:border-cyan-glow/[0.18]"
						>
							<span>Month</span>
						</div>
					</div>
				</div>

				{/* 7-column day header row — matches the live month.header
				    component (caps + tracking, navy-tone, right-aligned). */}
				<div className="grid grid-cols-7">
					{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
						<div
							key={d}
							className="px-2 py-2 pr-3 text-right text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-cyan-dim"
						>
							{d}
						</div>
					))}
				</div>

				{/* 6×7 grid. minHeight matches the live calendar's 740px
				    height (740 - ~80 toolbar = ~660 grid). */}
				<div className="grid grid-cols-7" style={{ minHeight: "660px" }}>
					{days.map((day) => {
						const dateKey = day.format("YYYY-MM-DD");
						const isPast = day.isBefore(today);
						const isToday = day.isSame(today, "day");
						const isOffRange = !day.isSame(anchor, "month");
						const eventCount = countsByDay.get(dateKey) ?? 0;
						const visibleGhosts = Math.min(eventCount, 3);
						const overflow = eventCount - visibleGhosts;

						// Background: past wash applies (matches live propGetter
						// inline style); off-range has no fill (per design call
						// — only muted text differentiates).
						const bgStyle: React.CSSProperties | undefined = isPast
							? { backgroundColor: "rgba(232, 240, 244, 0.6)" }
							: undefined;

						return (
							<div
								key={dateKey}
								className="border-t border-navy-frame/60 px-1 py-1 dark:border-cyan-glow/[0.18]"
								style={bgStyle}
							>
								{/* Date numeral — right-aligned to match live
								    .rbc-date-cell { text-align: right; p-3 }. */}
								<div className="flex justify-end p-2">
									{isToday ? (
										<span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-navy-tint px-1 text-sm font-bold leading-none text-navy dark:bg-cyan-glow/[0.18] dark:text-cyan-lifted [font-family:var(--font-lora-bold)]">
											{day.format("D")}
										</span>
									) : (
										<span
											className={`text-sm font-medium ${
												isOffRange
													? "text-navy-tone/70 dark:text-cyan-dim/60"
													: "text-navy dark:text-cyan-lifted"
											}`}
										>
											{day.format("D")}
										</span>
									)}
								</div>

								{/* Event ghosts — gray bars sized per actual
								    event count. The live calendar will replace
								    these with real dot+time+title rows. Same
								    vertical rhythm so the swap is seamless. */}
								{visibleGhosts > 0 && (
									<div className="space-y-1 px-1">
										{Array.from({ length: visibleGhosts }).map((_, i) => (
											<div
												key={i}
												aria-hidden="true"
												className="h-3 rounded-sm bg-navy-frame/80 dark:bg-cyan-glow/[0.12]"
											/>
										))}
										{overflow > 0 && (
											<div className="px-1 text-xs font-medium text-navy-tone dark:text-cyan-dim">
												+{overflow} more
											</div>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
