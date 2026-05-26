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
		const latestEventMs =
			eventDates.length > 0 ? eventDates.reduce((max, d) => Math.max(max, d.getTime()), 0) : 0;
		const endMs = Math.max(fallbackEnd, latestEventMs);

		const result: Date[] = [];
		for (let t = today.getTime(); t <= endMs; t += ONE_DAY_MS) {
			result.push(new Date(t));
		}
		return result;
	}, [eventDates, today]);

	const headingLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

	return (
		<div className="lg:hidden p-3 space-y-3">
			<div className="text-base font-bold text-navy dark:text-cyan-lifted [font-family:var(--font-lora-bold)]">
				{headingLabel}
			</div>
			{/* Affordance: the scrollbar is hidden, so without a visual cue
			    users don't realize the strip scrolls horizontally. A 32px
			    fade-to-background overlay on the right edge signals "more
			    content offscreen" without committing to a JS-based scroll-
			    position detection. Always-on (even at end-of-scroll) is the
			    pragmatic trade-off — matches the iOS / Material pattern. */}
			<div className="relative -mx-3">
			<div
				className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				role="listbox"
				aria-label="Browse events by date"
			>
				{days.map((day) => {
					const dateString = day.toLocaleDateString("en-CA");
					const hasEvent = eventDateStrings.has(dateString);
					const isToday = isSameDay(day, today);
					const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
					const weekday = day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);

					return (
						<button
							key={dateString}
							type="button"
							disabled={!hasEvent}
							onClick={() => hasEvent && onDateClick?.(day)}
							role="option"
							aria-selected={isSelected}
							aria-label={
								hasEvent
									? `Filter events for ${day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`
									: day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
							}
							className={cn(
								"snap-start flex-shrink-0 flex flex-col items-center justify-start min-w-[52px] h-[68px] rounded-lg border transition-colors duration-150 ease motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pt-2",
								isSelected &&
									"border-navy bg-navy-tint text-navy font-bold dark:border-cyan/[0.4] dark:bg-cyan/[0.12] dark:text-cyan-glow",
								!isSelected &&
									isToday &&
									"border-navy text-navy font-bold dark:border-cyan-lifted dark:text-cyan-lifted",
								!isSelected &&
									!isToday &&
									hasEvent &&
									"border-navy-frame text-navy hover:bg-navy-wash dark:border-cyan-glow/[0.18] dark:text-cyan-lifted dark:hover:bg-cyan-glow/[0.08]",
								!isSelected &&
									!isToday &&
									!hasEvent &&
									"border-transparent text-muted-foreground opacity-60 cursor-default",
							)}
						>
							<span className="text-[0.7rem] uppercase tracking-wide leading-none">{weekday}</span>
							<span className={cn("mt-1 text-lg leading-none tabular-nums", isSelected || isToday ? "font-bold" : "font-semibold")}>
								{day.getDate()}
							</span>
							<span
								aria-hidden="true"
								className={cn(
									"mt-1.5 h-1.5 w-1.5 rounded-full",
									hasEvent
										? isSelected
											? "bg-navy dark:bg-cyan"
											: "bg-navy dark:bg-cyan-lifted"
										: "bg-transparent",
								)}
							/>
						</button>
					);
				})}
			</div>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
				/>
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

	// Custom day component that shows dots for events and handles clicks
	const CustomDay = ({ date }: DayProps) => {
		const dateString = date.toLocaleDateString("en-CA"); // 'YYYY-MM-DD' format in local time

		const hasEvent = eventDateStrings.has(dateString);
		const isToday = new Date().toLocaleDateString("en-CA") === dateString;
		const isSelected = selectedDate && isSameDay(date, selectedDate);

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
					"relative flex h-9 w-9 flex-col items-center justify-center rounded-md transition-colors duration-150 ease",
					// Today: subtle bold-navy emphasis, no bg fill — keeps the
					// cyan-wash fill exclusive to the SELECTED state so the
					// signal-vs-context distinction stays readable.
					isToday && !isSelected && "font-bold text-navy dark:text-cyan-lifted",
					// Selected: cyan-wash bg + cyan-shade text. The one cyan
					// moment in the calendar — matches the active category chip
					// pattern in the events column.
					isSelected && "bg-navy-tint text-navy font-bold dark:bg-cyan/[0.12] dark:text-cyan-glow",
					// Event day (not today/selected): navy text, navy-wash hover
					// — mirrors the rest of the page's interaction model.
					hasEvent && !isToday && !isSelected && "font-medium text-navy dark:text-cyan-lifted hover:bg-navy-wash dark:hover:bg-cyan-glow/[0.08]",
					// Non-event day: muted, non-interactive.
					!hasEvent && !isToday && !isSelected && "text-muted-foreground opacity-60",
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
				<div className="flex h-full w-full items-center justify-center">{date.getDate()}</div>
				{hasEvent && (
					<div
						className={cn(
							"absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-navy dark:bg-cyan-lifted",
							isSelected && "bg-navy dark:bg-cyan",
						)}
					/>
				)}
			</div>
		);
	};

	return (
		<>
			<EventCalendarMobileStrip
				eventDates={eventDates}
				onDateClick={onDateClick}
				selectedDate={selectedDate}
			/>
			<DayPicker
				locale={enGB}
				showOutsideDays={showOutsideDays}
				defaultMonth={new Date()}
				className={cn("hidden lg:block p-3", className)}
			onDayClick={(day) => {
				if (onDateClick) {
					onDateClick(day);
				}
			}}
			classNames={{
				months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
				month: "space-y-4",
				caption: "flex justify-center pt-1 relative items-center mb-6",
				caption_label: "font-bold text-base absolute left-2 text-navy dark:text-cyan-lifted [font-family:var(--font-lora-bold)]",
				nav: "space-x-1 flex items-center",
				nav_button: cn(
					buttonVariants({ variant: "outline" }),
					"h-7 w-7 bg-transparent border-0 p-0 opacity-50 transition-opacity duration-150 ease hover:opacity-100",
				),
				nav_button_previous: "absolute right-8",
				nav_button_next: "absolute right-1",
				table: "w-full border-collapse space-y-1",
				head_row: "flex",
				head_cell: "text-navy-tone dark:text-cyan-dim/[0.7] rounded-md w-9 font-semibold text-[0.8rem]",
				row: "flex w-full mt-2",
				cell: "h-9 w-9 text-center text-sm p-0 relative rounded-md transition-colors duration-150 ease",
				day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
				day_range_end: "day-range-end",
				day_selected:
					"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
				day_today: "bg-accent text-accent-foreground",
				day_outside:
					"day-outside text-muted-foreground/50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
				day_disabled: "text-muted-foreground opacity-50",
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
		</>
	);
}

EventCalendar.displayName = "EventCalendar";

export { EventCalendar };
