"use client";

import { cn } from "@/lib/utils";
import { enGB } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker, type DayProps } from "react-day-picker";
import { buttonVariants } from "./tailwind/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
	eventDates?: Date[];
	onDateClick?: (date: Date) => void;
	selectedDate?: Date | null;
};

// Helper function to check if two dates are on the same day
function isSameDay(date1: Date, date2: Date) {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Mobile-only horizontal date strip. The desktop month grid wastes most of
 * the card width on small screens (7 × 36px cells, ~252px wide); this
 * replaces it with a swipeable day strip from today through the latest
 * event date. Same props as the desktop calendar so the parent doesn't
 * branch — both render, CSS toggles which one shows.
 */
function EventCalendarMobileStrip({
	eventDates,
	onDateClick,
	selectedDate,
}: {
	eventDates: Date[];
	onDateClick?: (date: Date) => void;
	selectedDate?: Date | null;
}) {
	const today = React.useMemo(() => {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	}, []);

	const eventDateStrings = React.useMemo(
		() => new Set(eventDates.map((d) => d.toLocaleDateString("en-CA"))),
		[eventDates],
	);

	// Span today → latest event date (or +14 days if there are no events at
	// all yet). Long ranges scroll horizontally with snap; users only ever
	// see ~6 cells at once on a typical phone.
	const days = React.useMemo(() => {
		const fallbackEnd = today.getTime() + 13 * ONE_DAY_MS;
		const latestEventMs = eventDates.length > 0 ? eventDates.reduce((max, d) => Math.max(max, d.getTime()), 0) : 0;
		const endMs = Math.max(fallbackEnd, latestEventMs);

		const result: Date[] = [];
		for (let t = today.getTime(); t <= endMs; t += ONE_DAY_MS) {
			result.push(new Date(t));
		}
		return result;
	}, [eventDates, today]);

	const headingLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

	// Scroll affordance: the scrollbar is hidden, so we track scroll position
	// and reveal a directional chevron on each side that has more days off
	// screen — right from the start, left once the user has scrolled in.
	const scrollRef = React.useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = React.useState(false);
	const [canScrollRight, setCanScrollRight] = React.useState(false);
	// Month heading follows the days in view. It used to be hard-pinned to
	// today's month, so it never moved when scrolling into (or selecting) a
	// later month — it just read "May 2026" forever.
	const [monthLabel, setMonthLabel] = React.useState(headingLabel);

	const syncScrollState = React.useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		// 1px epsilon absorbs sub-pixel rounding so the right hint actually
		// clears when scrolled to the very end.
		setCanScrollLeft(el.scrollLeft > 1);
		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
		// Heading tracks the day aligned to the left edge. Stride = distance
		// between two adjacent cards (width + gap); scrollLeft / stride gives
		// the index of that leftmost day.
		const first = el.children[0];
		const second = el.children[1];
		if (first) {
			const stride = second
				? second.getBoundingClientRect().left - first.getBoundingClientRect().left
				: first.getBoundingClientRect().width;
			const idx = stride > 0 ? Math.min(days.length - 1, Math.max(0, Math.round(el.scrollLeft / stride))) : 0;
			const d = days[idx];
			if (d) setMonthLabel(d.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
		}
	}, [days]);

	// Tapping a hint pages the strip by ~one viewport (0.8× for a card of
	// overlap so context carries across the jump); snap then settles it onto a
	// card boundary.
	const scrollByPage = React.useCallback((direction: 1 | -1) => {
		const el = scrollRef.current;
		if (!el) return;
		// Brief blur pulse masks the fast paged scroll — the same blur language
		// as the month-grid nav. The strip's own `filter` transition eases it
		// in and out; removing the class after the scroll settles clears it.
		el.classList.add("cal-strip-paging");
		window.setTimeout(() => el.classList.remove("cal-strip-paging"), 240);
		el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
	}, []);

	React.useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		syncScrollState();
		el.addEventListener("scroll", syncScrollState, { passive: true });
		window.addEventListener("resize", syncScrollState);
		return () => {
			el.removeEventListener("scroll", syncScrollState);
			window.removeEventListener("resize", syncScrollState);
		};
		// syncScrollState closes over `days`, so it (and this effect) re-run when
		// the day range changes — recomputing both the hints and the heading.
	}, [syncScrollState]);

	// Selecting a date in another month pulls the heading to that month even
	// without scrolling (the tapped day can sit at the right of the view).
	React.useEffect(() => {
		if (selectedDate) {
			setMonthLabel(selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
		}
	}, [selectedDate]);

	return (
		<div className="lg:hidden p-3 space-y-3">
			<div className="text-base font-bold text-navy dark:text-navy-lifted">{monthLabel}</div>
			<div className="relative -mx-3">
				<div
					ref={scrollRef}
					// scroll-px-3 matches the px-3 inset so snap-mandatory aligns the
					// first card to the padding edge (resting scrollLeft 0) instead of
					// eating the padding and resting at 12px — which would otherwise
					// trip the left scroll hint before any real scrolling.
					className="cal-strip flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory scroll-px-3 pb-1 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				>
					{days.map((day) => {
						const dateString = day.toLocaleDateString("en-CA");
						const hasEvent = eventDateStrings.has(dateString);
						const isToday = isSameDay(day, today);
						const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
						// Selection wins exclusively: once a day is picked, today drops
						// its highlight (matches the desktop grid).
						const isActive = isSelected || (isToday && !selectedDate);
						const weekday = day.toLocaleDateString("en-GB", { weekday: "short" });

						return (
							<button
								key={dateString}
								type="button"
								disabled={!hasEvent}
								onClick={() => hasEvent && onDateClick?.(day)}
								aria-pressed={hasEvent ? isSelected : undefined}
								aria-label={
									hasEvent
										? `Filter events for ${day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`
										: day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
								}
								className={cn(
									"snap-start flex-shrink-0 flex flex-col items-center justify-start min-w-[52px] h-[68px] rounded-md transition-colors duration-150 ease motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pt-2",
									// Active day: the WHOLE card is the highlighted rectangle —
									// weekday cap + numeral together on one navy-tint fill,
									// matching the admin big-calendar's weekly-view header block.
									isActive && "bg-navy-tint dark:bg-navy-tint/[0.18]",
									!isActive && hasEvent && "hover:bg-navy-veil/40 dark:hover:bg-navy-tint/[0.08]",
									!hasEvent && "cursor-default",
								)}
							>
								{/* Weekday cap — muted, letter-spaced kicker; stays navy-tone
								    whether or not the card is highlighted (as in the admin
								    week header). */}
								<span className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] leading-none text-navy-tone dark:text-navy-dim">
									{weekday}
								</span>
								{/* Numeral — Lora Bold on the active day (the emphasis face
								    shared with both other calendars), plain navy on event
								    days, muted otherwise. */}
								<span
									className={cn(
										"mt-1.5 text-lg leading-none tabular-nums transition-colors",
										isActive && "font-bold text-navy [font-family:var(--font-lora-bold)] dark:text-navy-lifted",
										!isActive && hasEvent && "font-semibold text-navy dark:text-navy-lifted",
										!isActive && !hasEvent && "font-semibold text-navy-tone/50 dark:text-navy-dim/45",
									)}
								>
									{day.getDate()}
								</span>
								<span
									aria-hidden="true"
									className={cn(
										"mt-1.5 h-1.5 w-1.5 rounded-full",
										hasEvent ? (isActive ? "bg-navy dark:bg-navy-tint" : "bg-navy dark:bg-navy-lifted") : "bg-transparent",
									)}
								/>
							</button>
						);
					})}
				</div>
				{/* Left scroll hint — appears once the strip has been scrolled in
				    from the start, signalling earlier days are back that way.
				    Tappable: pages the strip back one viewport. */}
				{canScrollLeft && (
					<button
						type="button"
						aria-label="Scroll to earlier days"
						onClick={() => scrollByPage(-1)}
						className="absolute inset-y-0 left-0 flex w-12 items-center justify-start pl-1 bg-gradient-to-r from-background via-background to-transparent text-navy-tone transition-colors hover:text-navy dark:text-navy-dim dark:hover:text-navy-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md"
					>
						<ChevronLeft className="h-5 w-5" aria-hidden="true" />
					</button>
				)}
				{/* Right scroll hint — present whenever more days sit off the right
				    edge, so the horizontal scroll is discoverable without a
				    visible scrollbar. Tappable: pages the strip forward. */}
				{canScrollRight && (
					<button
						type="button"
						aria-label="Scroll to later days"
						onClick={() => scrollByPage(1)}
						className="absolute inset-y-0 right-0 flex w-12 items-center justify-end pr-1 bg-gradient-to-l from-background via-background to-transparent text-navy-tone transition-colors hover:text-navy dark:text-navy-dim dark:hover:text-navy-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md"
					>
						<ChevronRight className="h-5 w-5" aria-hidden="true" />
					</button>
				)}
			</div>
		</div>
	);
}

function EventCalendar({
	className,
	classNames,
	showOutsideDays = true,
	eventDates = [],
	onDateClick,
	selectedDate,
	...props
}: CalendarProps) {
	// Convert event dates to a Set of date strings for faster lookup
	const eventDateStrings = React.useMemo(() => {
		return new Set(eventDates.map((date) => date.toISOString().split("T")[0]));
	}, [eventDates]);

	// Month-navigation transition: when the chevrons (or keyboard) change the
	// visible month, slide the day grid in from the side it came from — right→
	// left for "next", left→right for "back" — with a crossfade + blur. rdp
	// updates the grid in place (no remount), so we re-fire the CSS animation
	// imperatively via reflow once the new month has committed.
	const desktopCalRef = React.useRef<HTMLDivElement>(null);
	const prevMonthRef = React.useRef<number | null>(null);
	const [monthNav, setMonthNav] = React.useState<{ count: number; dir: 1 | -1 }>({ count: 0, dir: 1 });

	React.useEffect(() => {
		if (prevMonthRef.current === null) {
			const now = new Date();
			prevMonthRef.current = now.getFullYear() * 12 + now.getMonth();
		}
	}, []);

	const handleMonthChange = (newMonth: Date) => {
		const idx = newMonth.getFullYear() * 12 + newMonth.getMonth();
		const prev = prevMonthRef.current;
		prevMonthRef.current = idx;
		if (prev === null || idx === prev) return;
		setMonthNav((s) => ({ count: s.count + 1, dir: idx > prev ? 1 : -1 }));
	};

	React.useLayoutEffect(() => {
		if (monthNav.count === 0) return;
		const grid = desktopCalRef.current?.querySelector<HTMLElement>("table");
		if (!grid) return;
		// New month enters from the right when going forward, from the left when
		// going back; the sign drives the keyframe via a custom property.
		grid.style.setProperty("--cal-nav-from", monthNav.dir === 1 ? "14px" : "-14px");
		grid.classList.remove("cal-nav-enter");
		void grid.offsetWidth; // reflow so the animation re-fires every nav
		grid.classList.add("cal-nav-enter");
	}, [monthNav]);

	// Custom day component that shows dots for events and handles clicks
	const CustomDay = ({ date }: DayProps) => {
		const dateString = date.toLocaleDateString("en-CA"); // 'YYYY-MM-DD' format in local time

		const hasEvent = eventDateStrings.has(dateString);
		const isToday = new Date().toLocaleDateString("en-CA") === dateString;
		const isSelected = selectedDate && isSameDay(date, selectedDate);
		// "Active" = the one highlighted day. Selection wins exclusively: once a
		// day is picked, today drops its highlight and reverts to a plain event
		// day, so the grid never shows two filled cells at once.
		const isActive = Boolean(isSelected) || (isToday && !selectedDate);

		const handleClick = (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (hasEvent && onDateClick) {
				onDateClick(date);
			}
		};

		const handleKeyDown = (e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				e.stopPropagation();
				if (hasEvent && onDateClick) {
					onDateClick(date);
				}
			}
		};

		return (
			<div
				className={cn(
					"relative flex h-9 w-full flex-col items-center justify-center rounded-md transition-colors duration-150 ease",
					// Active day (today-when-nothing-selected, or the selected day):
					// navy-tint rectangle fill + Lora Bold numeral (set on the number
					// span below) — the admin big-calendar's signature today pill.
					isActive && "bg-navy-tint font-bold text-navy dark:bg-navy-tint/[0.18] dark:text-navy-lifted",
					// Event day (not the active day): navy text, navy-veil hover —
					// mirrors the rest of the page's interaction model. Today falls
					// here once another day is selected.
					!isActive &&
						hasEvent &&
						"font-medium text-navy hover:bg-navy-veil/40 dark:text-navy-lifted dark:hover:bg-navy-tint/[0.08]",
					// Non-event day: muted, non-interactive.
					!isActive && !hasEvent && "text-navy-tone/50 dark:text-navy-dim/45",
					hasEvent && "cursor-pointer",
					!hasEvent && "cursor-default",
				)}
				aria-label={hasEvent ? `Filter events for ${date.toLocaleDateString("en-GB")}` : undefined}
				aria-pressed={hasEvent ? Boolean(isSelected) : undefined}
				onClick={hasEvent ? handleClick : undefined}
				onKeyDown={hasEvent ? handleKeyDown : undefined}
				role={hasEvent ? "button" : undefined}
				tabIndex={hasEvent ? 0 : undefined}
			>
				<div
						className={cn(
							"flex h-full w-full items-center justify-center",
							// The active day wears the admin calendar's Lora Bold
							// numeral at text-base — the emphasis face that ties the
							// calendars together, paired with the navy-tint fill above.
							isActive && "text-base leading-none [font-family:var(--font-lora-bold)]",
						)}
					>
						{date.getDate()}
					</div>
				{hasEvent && (
					<div
						className={cn(
							"absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-navy dark:bg-navy-lifted",
							isActive && "bg-navy dark:bg-navy-tint",
						)}
					/>
				)}
			</div>
		);
	};

	return (
		<>
			<EventCalendarMobileStrip eventDates={eventDates} onDateClick={onDateClick} selectedDate={selectedDate} />
			<div ref={desktopCalRef} className={cn("hidden lg:block", className)}>
			<DayPicker
				locale={enGB}
				showOutsideDays={showOutsideDays}
				defaultMonth={new Date()}
				onMonthChange={handleMonthChange}
				// enGB's default weekday abbreviation is 2-char ("Mo", "Tu"). Now
				// that columns flex to fill the wider card there's room for the
				// more legible 3-char form ("Mon", "Tue").
				formatters={{ formatWeekdayName: (day) => day.toLocaleDateString("en-GB", { weekday: "short" }) }}
				className="p-3"
				onDayClick={(day) => {
					if (onDateClick) {
						onDateClick(day);
					}
				}}
				classNames={{
					months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
					month: "space-y-4 w-full",
					caption: "flex justify-center pt-1 relative items-center mb-6",
					caption_label: "font-bold text-base absolute left-2 text-navy dark:text-navy-lifted",
					nav: "space-x-1 flex items-center",
					nav_button: cn(
						buttonVariants({ variant: "ghost" }),
						// Hover uses the same wash as the day cells (navy-veil/40)
						// so the chevrons and the days share one hover language —
						// a background fill, not an opacity fade. Muted-navy resting
						// icon darkens to navy on hover.
						"h-7 w-7 rounded-md p-0 text-navy-tone transition-colors duration-150 ease hover:bg-navy-veil/40 hover:text-navy dark:text-navy-dim dark:hover:bg-navy-tint/[0.08] dark:hover:text-navy-lifted",
					),
					nav_button_previous: "absolute right-8",
					nav_button_next: "absolute right-1",
					table: "w-full border-collapse space-y-1",
					head_row: "flex w-full",
					// Weekday caps mirror the admin big-calendar month header:
					// uppercase, 10px, letter-spaced — the same kicker register the
					// site uses for "UPCOMING" / "SUBSCRIBE". (Formatter still emits
					// "Mon"; `uppercase` renders it "MON".)
					head_cell:
						"flex-1 text-center uppercase tracking-[0.14em] text-navy-tone dark:text-navy-dim rounded-md font-semibold text-[0.625rem]",
					row: "flex w-full mt-2",
					cell: "h-9 flex-1 text-center text-sm p-0 relative rounded-md transition-colors duration-150 ease",
					day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
					day_range_end: "day-range-end",
					day_selected:
						"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
					day_today: "bg-accent text-accent-foreground",
					day_outside:
						"day-outside text-navy-tone/45 aria-selected:bg-accent/50 aria-selected:text-navy-tone dark:text-navy-dim/40",
					day_disabled: "text-navy-tone/45 dark:text-navy-dim/40",
					day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
					day_hidden: "invisible",
					...classNames,
				}}
				components={{
					IconLeft: () => <ChevronLeft className="h-4 w-4" />,
					IconRight: () => <ChevronRight className="h-4 w-4" />,
					Day: CustomDay,
				}}
				{...props}
			/>
			</div>
		</>
	);
}

EventCalendar.displayName = "EventCalendar";

export { EventCalendar };
