// Server-renderable month-view skeleton. Renders the calendar's outer shell
// + Lora toolbar label + visible month-week grid in plain HTML/CSS — no react-big-
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
	// Match the live calendar's Monday-first month grid. Do not use
	// startOf("week") here: MonthSkeleton renders before CalendarTestClient's
	// moment.updateLocale call runs, so Moment would still default to
	// Sunday-first and shift every cell by one column.
	const gridStart = monthStart.clone().startOf("isoWeek");
	const gridEnd = monthEnd.clone().endOf("isoWeek");

	const days: moment.Moment[] = [];
	for (let cur = gridStart.clone(); cur.isSameOrBefore(gridEnd); cur.add(1, "day")) {
		days.push(cur.clone());
	}
	const weekCount = days.length / 7;
	const weeks = Array.from({ length: weekCount }, (_, weekIndex) => days.slice(weekIndex * 7, weekIndex * 7 + 7));
	const weekdayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
	// rbc measures a per-row `rowLimit`, then subtracts one row when a week
	// needs a "+N more" control. So a 5-week month can show 4 events in a
	// quiet week, but only 3 events + "+N more" in an overflowing week.
	const measuredRowLimit = weekCount <= 5 ? 4 : 3;

	// Count events per day for ghost bars so the skeleton's vertical rhythm
	// matches what the live calendar will produce once rbc mounts.
	const countsByDay = new Map<string, number>();
	for (const ev of events) {
		const key = moment(ev.start).format("YYYY-MM-DD");
		countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
	}

	const label = anchor.format("MMMM YYYY");

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-navy-frame bg-white p-5 dark:border-navy-edge dark:bg-background">
				{/* Toolbar shape — non-interactive. The live CalendarToolbar
				    re-renders this exact layout once hydration completes, so
				    the swap is visually identical. */}
				<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
					<h2 className="flex items-center gap-2.5 text-xl font-bold text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)]">
						<CalendarIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
						<span>{label}</span>
					</h2>
					<div className="flex gap-2">
						<div
							aria-hidden="true"
							className="flex items-center gap-1 rounded-md border border-navy-frame dark:border-navy-edge"
						>
							<div className="p-2">
								<ChevronLeft className="h-4 w-4 opacity-40" />
							</div>
							<div className="border-l border-r border-navy-frame px-3 py-1.5 text-sm opacity-40 dark:border-navy-edge">
								Today
							</div>
							<div className="p-2">
								<ChevronRight className="h-4 w-4 opacity-40" />
							</div>
						</div>
						<div
							aria-hidden="true"
							className="flex h-10 w-[140px] items-center justify-between rounded-md border border-navy-frame px-3 text-sm opacity-60 dark:border-navy-edge"
						>
							<span>Month</span>
						</div>
					</div>
				</div>

				{/* Match the live Calendar wrapper and rbc month-view DOM shape.
				    The screenshot showed the two faded layers using different row
				    geometry, so the skeleton now leans on rbc's own flex classes
				    instead of approximating the month grid with CSS Grid. */}
				<div style={{ height: "740px", width: "100%" }}>
					<div className="rbc-calendar" aria-hidden="true">
						<div className="rbc-month-view">
							<div className="rbc-row rbc-month-header">
								{weekdayLabels.map((dayLabel) => (
									<div key={dayLabel} className="rbc-header">
										<span className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-navy-dim">
											{dayLabel}
										</span>
									</div>
								))}
							</div>

							{weeks.map((week, weekIndex) => {
								const rowKey = `week-${week[0]?.format("YYYY-MM-DD") ?? weekIndex}`;
								const eventCounts = week.map((day) => countsByDay.get(day.format("YYYY-MM-DD")) ?? 0);
								const weekHasOverflow = eventCounts.some((count) => count > measuredRowLimit);
								const visibleRowsForWeek = weekHasOverflow ? Math.max(measuredRowLimit - 1, 1) : measuredRowLimit;
								const maxVisibleGhostRows = Math.min(Math.max(...eventCounts), visibleRowsForWeek);
								const hasOverflowRow = eventCounts.some((count) => count > visibleRowsForWeek);

								return (
									<div key={rowKey} className="rbc-month-row">
										<div className="rbc-row-bg">
											{week.map((day) => {
												const dateKey = day.format("YYYY-MM-DD");
												const isPast = day.isBefore(today);
												const bgStyle: React.CSSProperties | undefined = isPast
													? { backgroundColor: "rgba(232, 240, 244, 0.6)" }
													: undefined;

												return (
													<div
														key={`${dateKey}-bg`}
														className={`rbc-day-bg${isPast ? " rbc-day--past" : ""}`}
														style={bgStyle}
													/>
												);
											})}
										</div>

										<div className="rbc-row-content">
											<div className="rbc-row">
												{week.map((day) => {
													const dateKey = day.format("YYYY-MM-DD");
													const isToday = day.isSame(today, "day");
													const isOffRange = !day.isSame(anchor, "month");
													const dateCellClass = [
														"rbc-date-cell",
														isToday ? "rbc-now" : "",
														isOffRange ? "rbc-off-range" : "",
													]
														.filter(Boolean)
														.join(" ");

													return (
														<div key={`${dateKey}-date`} className={dateCellClass}>
															<span className="rbc-button-link">{day.format("DD")}</span>
														</div>
													);
												})}
											</div>

											{Array.from({ length: maxVisibleGhostRows }, (_, ghostIndex) => (
												<div key={`${rowKey}-ghost-row-${ghostIndex + 1}`} className="rbc-row">
													{week.map((day) => {
														const dateKey = day.format("YYYY-MM-DD");
														const eventCount = countsByDay.get(dateKey) ?? 0;
														const visibleEventCount = Math.min(eventCount, visibleRowsForWeek);

														return (
															<div
																key={`${dateKey}-ghost-${ghostIndex + 1}`}
																className="rbc-row-segment"
																style={{ flexBasis: "14.285714%", maxWidth: "14.285714%" }}
															>
																{visibleEventCount > ghostIndex ? (
																	<>
																		{/* These ghost rows mirror the live month-event baseline in
																		    calendar-custom.css. If the live row geometry changes, change
																		    this skeleton and row-limit assumptions in the same patch; see
																		    docs/react-big-calendar-loading-stability.md. */}
																		<div className="rbc-event pointer-events-none">
																			<div className="h-4 rounded-sm bg-navy-frame/80 dark:bg-navy-tint/[0.12]" />
																		</div>
																	</>
																) : (
																	" "
																)}
															</div>
														);
													})}
												</div>
											))}

											{hasOverflowRow && (
												<div className="rbc-row">
													{week.map((day) => {
														const dateKey = day.format("YYYY-MM-DD");
														const overflow = (countsByDay.get(dateKey) ?? 0) - visibleRowsForWeek;

														return (
															<div
																key={`${dateKey}-overflow`}
																className="rbc-row-segment"
																style={{ flexBasis: "14.285714%", maxWidth: "14.285714%" }}
															>
																{overflow > 0 ? (
																	<button
																		type="button"
																		tabIndex={-1}
																		className="rbc-button-link rbc-show-more pointer-events-none"
																	>
																		+{overflow} more
																	</button>
																) : (
																	" "
																)}
															</div>
														);
													})}
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
