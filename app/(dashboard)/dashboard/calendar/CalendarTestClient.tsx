"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { EVENT_CATEGORY_COLORS, type EventCategorySlug, isEventCategorySlug } from "@/lib/events/categories";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";
import {
	cloneElement,
	isValidElement,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type KeyboardEvent,
	type ReactNode,
} from "react";
import { Calendar, type View, momentLocalizer } from "react-big-calendar";
import AgendaList from "./AgendaList";
// calendar-custom.css is imported at the page-level (page.tsx) so the rbc base
// stylesheet ships with the initial document instead of the dynamic chunk.

const AGENDA_LENGTH_DAYS = 30;

// Configure moment to use Monday as the first day of the week
// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
moment.updateLocale("en", {
	week: {
		dow: 1, // Monday is the first day of the week
		doy: 4, // The week that contains Jan 4th is the first week of the year
	},
});

// Custom time formats for the calendar
const formats = {
	// Time formats for different views
	timeGutterFormat: "h A", // "1am", "2pm" in the time gutter (left side)
	eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
		`${localizer.format(start, "h A", culture)} - ${localizer.format(end, "h A", culture)}`,
	agendaTimeFormat: "h A", // Time format in agenda view
	agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
		`${localizer.format(start, "h A", culture)} - ${localizer.format(end, "h A", culture)}`,

	// Keep other formats as default
	dayFormat: "ddd DD", // "01 Mon"
	dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
		`${localizer.format(start, "MMMM DD", culture)} - ${localizer.format(end, "DD, YYYY", culture)}`,
	dayHeaderFormat: "dddd MMM DD", // "Monday Jan 01"
};

const localizer = momentLocalizer(moment);

// Persisted view preference. We only ever render this component in the browser
// (parent uses a dynamic import inside useEffect), so reading localStorage in
// the lazy useState initializer is safe and avoids a post-mount "snap to the
// user's preferred view" flash.
const VIEW_STORAGE_KEY = "calendar-view";
const ALLOWED_VIEWS: readonly View[] = ["month", "week", "day", "agenda"] as const;

function readStoredView(): View | null {
	if (typeof window === "undefined") return null;
	try {
		const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
		if (stored && (ALLOWED_VIEWS as readonly string[]).includes(stored)) {
			return stored as View;
		}
	} catch {
		// localStorage can throw in private-mode Safari etc. — ignore.
	}
	return null;
}

// Define the event type based on your database schema
interface CalendarEvent {
	id: number | string;
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	city?: string;
	url?: string;
	categorySlugs?: string[];
	// A fixed national marker (a World Cup fixture) rather than a community
	// submission — rendered in the gold ⚽ register. See world-cup-fixtures.ts.
	external?: boolean;
	// Venue context for fixtures ("Houston", "New York"), surfaced in agenda view.
	venue?: string;
}

// Define props for the component
interface CalendarTestClientProps {
	initialEvents: CalendarEvent[];
	user?: unknown;
	// Anchor `date` state to the server-resolved "now" so the live calendar's
	// initial month matches the skeleton's. Without this, rbc re-anchors to
	// `new Date()` on mount, which can disagree with serverNow across midnight
	// or just spend a render landing on the right month.
	initialDate?: Date;
}

function formatToolbarLabel(view: View, date: Date): string {
	const m = moment(date);
	if (view === "month") {
		return m.format("MMMM YYYY");
	}
	if (view === "week") {
		const start = m.clone().startOf("week");
		const end = start.clone().endOf("week");
		const sameMonth = start.month() === end.month();
		const sameYear = start.year() === end.year();
		if (sameMonth) {
			return `${start.format("MMM D")} – ${end.format("D, YYYY")}`;
		}
		if (sameYear) {
			return `${start.format("MMM D")} – ${end.format("MMM D, YYYY")}`;
		}
		return `${start.format("MMM D, YYYY")} – ${end.format("MMM D, YYYY")}`;
	}
	if (view === "day") {
		return m.format("dddd, MMM D, YYYY");
	}
	// agenda
	const end = m.clone().add(AGENDA_LENGTH_DAYS - 1, "days");
	const sameYear = m.year() === end.year();
	if (sameYear) {
		return `${m.format("MMM D")} – ${end.format("MMM D, YYYY")}`;
	}
	return `${m.format("MMM D, YYYY")} – ${end.format("MMM D, YYYY")}`;
}

interface CalendarToolbarProps {
	view: View;
	date: Date;
	onNavigate: (direction: "PREV" | "NEXT" | "TODAY") => void;
	onView: (view: View) => void;
}

function CalendarEventWrapper({ children, event }: { children: ReactNode; event?: CalendarEvent }) {
	if (!isValidElement<Record<string, unknown>>(children)) return <>{children}</>;

	const label = event?.title ? `${event.url ? "Open" : "Preview"} event: ${event.title}` : "Calendar event";

	return cloneElement(children, {
		tabIndex: 0,
		role: event?.url ? "link" : "group",
		"aria-label": label,
	});
}

// Custom rbc slot renderers — defined at module level (not in a useMemo
// inside the component) because they close over no state and reference only
// imported helpers. Hoisting saves a per-render useMemo and a stable ref
// allocation for `components`.
const calendarComponents = {
	eventWrapper: CalendarEventWrapper,
	week: {
		// Stacked Week header — weekday caps (architectural register, matches
		// site-level section nav) above the date numeral in Lora Bold. Today's
		// numeral wears the navy-tint pill we use across the brand for
		// 'current item.' Every numeral uses a fixed h-7 w-7 box so the row
		// has predictable vertical geometry.
		header: ({ date: cellDate }: { date: Date }) => {
			const m = moment(cellDate);
			const isToday = m.clone().startOf("day").isSame(moment().startOf("day"));
			const day = m.format("ddd").toUpperCase();
			const num = m.format("D");
			return (
				<div className="flex min-h-[3.25rem] flex-col items-center justify-center gap-1">
					<span className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] leading-none text-navy-tone dark:text-navy-dim">
						{day}
					</span>
					<span
						className={`flex h-7 w-7 items-center justify-center rounded-full text-base font-bold leading-none [font-family:var(--font-lora-bold)] ${
							isToday
								? "bg-navy-tint text-navy dark:bg-navy-tint/[0.18] dark:text-navy-lifted"
								: "text-navy dark:text-navy-lifted"
						}`}
					>
						{num}
					</span>
				</div>
			);
		},
	},
	month: {
		header: ({ date: cellDate }: { date: Date }) => {
			const day = moment(cellDate).format("ddd").toUpperCase();
			return (
				<span className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-navy-dim">
					{day}
				</span>
			);
		},
		// Month-view events render as inline rows (dot · time · title) for
		// scannability at high density. Category colour moves from the block
		// background to the leading dot. Background / border is stripped by
		// `.rbc-month-view .rbc-event` CSS overrides.
		event: ({ event }: { event: CalendarEvent }) => {
			const slug = event.categorySlugs?.[0];
			const dotClass =
				slug && isEventCategorySlug(slug)
					? EVENT_CATEGORY_COLORS[slug as EventCategorySlug].dot
					: "bg-navy-tone dark:bg-navy-dim";
			const start = moment(event.start);
			const time = start.minutes() === 0 ? start.format("ha") : start.format("h:mma");
			const renderEventRow = (kind: "base" | "preview") => (
				<span
					className={`rbc-month-event-row rbc-month-event-row--${kind} flex w-full min-w-0 items-center gap-1.5 overflow-hidden text-xs`}
					aria-hidden={kind === "preview"}
				>
					{/* A World Cup fixture swaps the category dot for a ⚽ — the gold
					    chip fill is stripped in month view, so the emoji is what
					    flags a match day at a scan. */}
					{event.external ? (
						<span className="rbc-month-event-dot shrink-0 text-[0.8125rem] leading-none" aria-hidden="true">
							⚽
						</span>
					) : (
						<span className={`rbc-month-event-dot h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
					)}
					<span className="rbc-month-event-time shrink-0 text-muted-foreground">{time}</span>
					{/* min-w-0 is the load-bearing bit: without it the title's
					    flex min-width defaults to its content width (=full
					    string), so truncate can't kick in. */}
					<span
						className={`rbc-month-event-title min-w-0 flex-1 truncate text-navy dark:text-navy-lifted ${
							event.external ? "font-semibold" : "font-medium"
						}`}
					>
						{event.title}
					</span>
				</span>
			);

			return (
				<>
					{renderEventRow("base")}
					{renderEventRow("preview")}
				</>
			);
		},
	},
};

function CalendarToolbar({ view, date, onNavigate, onView }: CalendarToolbarProps) {
	const label = formatToolbarLabel(view, date);
	return (
		<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
			<h2 className="flex items-center gap-2.5 text-xl font-bold text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)]">
				<CalendarIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
				<span>{label}</span>
			</h2>

			<div className="flex gap-2">
				<div className="flex items-center gap-1 rounded-md border border-navy-frame dark:border-navy-edge">
					<button
						type="button"
						onClick={() => onNavigate("PREV")}
						className="rounded-md p-2 transition-colors hover:bg-navy-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-tint dark:hover:bg-navy-tint/[0.12]"
						aria-label="Previous"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>

					<button
						type="button"
						onClick={() => onNavigate("TODAY")}
						className="border-l border-r border-navy-frame px-3 py-1.5 text-sm transition-colors hover:bg-navy-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-tint dark:border-navy-edge dark:hover:bg-navy-tint/[0.12]"
					>
						Today
					</button>

					<button
						type="button"
						onClick={() => onNavigate("NEXT")}
						className="rounded-md p-2 transition-colors hover:bg-navy-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-tint dark:hover:bg-navy-tint/[0.12]"
						aria-label="Next"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>

				<Select value={view} onValueChange={(value) => onView(value as View)}>
					<SelectTrigger className="w-[140px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="month">Month</SelectItem>
						<SelectItem value="week">Week</SelectItem>
						<SelectItem value="day">Day</SelectItem>
						<SelectItem value="agenda">Agenda</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}

export default function CalendarTestClient({ initialEvents = [], user, initialDate }: CalendarTestClientProps) {
	// Initialize state with the events from the server
	const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
	const [view, setView] = useState<View>(() => readStoredView() ?? "month");
	const [date, setDate] = useState(() => initialDate ?? new Date());

	// Range-navigation transition: slide the calendar grid in from the side it
	// came from (right→left for "Next", left→right for "Back", straight crossfade
	// for "Today") with a blur, matching the events calendars. rbc swaps the grid
	// in place, so we re-fire the CSS animation imperatively via reflow.
	const calViewportRef = useRef<HTMLDivElement>(null);
	// Wraps the toolbar + the calendar view together. The view switch reflows
	// BOTH (the toolbar tracks the card's content width; the day-header reflows
	// when rbc reserves its scrollbar gutter), so the fade has to cover the whole
	// card content, not just the calendar viewport.
	const cardContentRef = useRef<HTMLDivElement>(null);
	const [calNav, setCalNav] = useState<{ count: number; dir: -1 | 0 | 1 }>({ count: 0, dir: 0 });
	// Bumped on every view switch (month/week/day/agenda). Drives a hold-then-fade
	// that masks react-big-calendar's late scrollbar-gutter reflow — the day-header
	// (and the toolbar's width) otherwise visibly resize a frame after the switch.
	const [viewNav, setViewNav] = useState(0);

	useLayoutEffect(() => {
		if (calNav.count === 0) return;
		const root = calViewportRef.current;
		if (!root) return;
		// Anchor the motion to the DATA, not the whole viewport. In month view the
		// weekday-name header (`.rbc-month-header`) is identical every month, so
		// sliding it read as noise and made the data look like it started from the
		// wrong place. We animate only the week rows (month) and the time grid body
		// + day headers (week/day); the static header stays put and acts as a fixed
		// reference, which makes even a modest slide read clearly as directional.
		// Agenda view has none of those nodes, so fall back to the whole list.
		const dataEls = root.querySelectorAll<HTMLElement>(".rbc-month-row, .rbc-time-content, .rbc-time-header");
		const targets = dataEls.length > 0 ? Array.from(dataEls) : [root];
		const from = calNav.dir === 0 ? "0px" : calNav.dir === 1 ? "20px" : "-20px";
		for (const el of targets) {
			el.style.setProperty("--cal-nav-from", from);
			el.classList.remove("cal-nav-enter");
			void el.offsetWidth; // reflow so the animation re-fires every nav
			el.classList.add("cal-nav-enter");
		}
	}, [calNav]);

	useLayoutEffect(() => {
		if (viewNav === 0) return;
		const el = cardContentRef.current;
		if (!el) return;
		// Set opacity:0 (via the animation's backwards fill) before the browser
		// paints the new view, so rbc's scrollbar-gutter reflow — and any toolbar
		// width change — happen under the hold rather than as a visible jump.
		el.classList.remove("cal-view-enter");
		void el.offsetWidth;
		el.classList.add("cal-view-enter");
	}, [viewNav]);

	const handleNavigate = useCallback((newDate: Date) => {
		setDate(newDate);
	}, []);

	const handleViewChange = useCallback((newView: View) => {
		setView(newView);
		setViewNav((c) => c + 1);
		try {
			window.localStorage.setItem(VIEW_STORAGE_KEY, newView);
		} catch {
			// ignore quota / private-mode errors
		}
	}, []);

	// Used by our own toolbar (we render outside react-big-calendar so we
	// drive prev/next/today ourselves; rbc's internal toolbar is hidden).
	const handleToolbarNavigate = useCallback(
		(direction: "PREV" | "NEXT" | "TODAY") => {
			if (direction === "TODAY") {
				setDate(new Date());
				setCalNav((s) => ({ count: s.count + 1, dir: 0 }));
				return;
			}
			const sign = direction === "PREV" ? -1 : 1;
			const next = moment(date);
			if (view === "month") next.add(sign, "month");
			else if (view === "week") next.add(sign, "week");
			else if (view === "day") next.add(sign, "day");
			else next.add(sign * AGENDA_LENGTH_DAYS, "days");
			setDate(next.toDate());
			setCalNav((s) => ({ count: s.count + 1, dir: sign }));
		},
		[date, view],
	);

	// Map each event to a `cat-{slug}` className so the calendar CSS can
	// tint the block by category. Events with no assigned category fall
	// through to `cat-none` (a quiet navy-veil block). Events whose end is
	// before now also pick up `rbc-event--past` for a faded treatment.
	//
	// Past events also get an inline `opacity` style alongside the class.
	// Why both: the className is what the .rbc-event--dimmed hover rule
	// needs to override (via !important); the inline style guarantees the
	// faded opacity is present in the SSR HTML so first-paint is correct
	// even before our custom CSS rule has applied. Without it the calendar
	// briefly renders past events at full strength on initial paint, then
	// snaps to the faded state once CSS loads.
	const eventPropGetter = useCallback((event: CalendarEvent) => {
		const slug = event.categorySlugs?.[0];
		// A World Cup fixture takes the gold register regardless of category
		// (it carries none); community events colour by their primary category.
		const category = event.external ? "cat-worldcup" : slug && isEventCategorySlug(slug) ? `cat-${slug}` : "cat-none";
		const edge = moment(event.start).isoWeekday() === 7 ? " rbc-event--edge-right" : "";
		const isPast = event.end.getTime() < Date.now();
		if (!isPast) return { className: `${category}${edge}` };
		return {
			className: `${category}${edge} rbc-event--past`,
			style: { opacity: 0.42 },
		};
	}, []);

	// Tag day cells whose date is before today's midnight as `rbc-day--past`
	// so the CSS can wash the cell background. Applied across Month / Week /
	// Day via rbc's dayPropGetter API. (Today is excluded — current.)
	//
	// Inline `backgroundColor` mirrors the CSS rule so SSR HTML carries
	// the wash, avoiding a first-paint flash where past cells render white
	// before our custom CSS loads.
	const dayPropGetter = useCallback((date: Date) => {
		const isPast = moment(date).startOf("day").isBefore(moment().startOf("day"));
		if (!isPast) return {};
		return {
			className: "rbc-day--past",
			style: { backgroundColor: "rgba(232, 240, 244, 0.6)" },
		};
	}, []);

	const handleSelectEvent = useCallback((event: CalendarEvent) => {
		// Match the Agenda view: clicking an event opens its source URL
		// (Luma / Eventbrite / Meetup) in a new tab. Falls through silently
		// for events without a URL (e.g. admin-created stubs).
		if (event.url) {
			window.open(event.url, "_blank", "noopener,noreferrer");
		}
	}, []);

	const handleKeyPressEvent = useCallback(
		(event: CalendarEvent, keyboardEvent: KeyboardEvent<HTMLElement>) => {
			if (keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ") return;
			keyboardEvent.preventDefault();
			handleSelectEvent(event);
		},
		[handleSelectEvent],
	);

	const handleSelectSlot = useCallback(
		({ start, end }: { start: Date; end: Date }) => {
			// Only allow authenticated users to create events
			if (!user) {
				alert("Please sign in to create events");
				return;
			}

			const title = prompt("New Event name");
			if (title) {
				// Functional setState — drops `events` from the deps array so this
				// callback's reference stays stable across event-list updates.
				const newEvent: CalendarEvent = {
					id: `temp-${Date.now()}`,
					title,
					start,
					end,
				};
				setEvents((prev) => [...prev, newEvent]);

				// TODO: Add API call to save event to database
				console.log("New event to save:", newEvent);
			}
		},
		[user],
	);

	// JS-driven sibling fade. The CSS-only `:has(.rbc-event:hover)` rule
	// works in modern browsers, but :has re-evaluation on :hover has had
	// flaky timing in some Chromium builds — this listener guarantees the
	// dim-other-events behaviour fires reliably on every hover. Only mounts
	// when a time-grid view is active (Day, Week); month doesn't need it.
	useEffect(() => {
		if (view !== "day" && view !== "week") return;
		const root = document.querySelector<HTMLElement>(".rbc-time-view");
		if (!root) return;

		const DIM_CLASS = "rbc-event--dimmed";

		const handleOver = (e: Event) => {
			const target = (e.target as Element).closest(".rbc-event");
			if (!target) return;
			const slot = target.closest(".rbc-day-slot");
			if (!slot) return;
			slot.querySelectorAll(".rbc-event").forEach((ev) => {
				if (ev === target) ev.classList.remove(DIM_CLASS);
				else ev.classList.add(DIM_CLASS);
			});
		};

		const handleOut = (e: Event) => {
			const out = (e as MouseEvent).target as Element;
			const leaving = out.closest?.(".rbc-event");
			if (!leaving) return;
			const related = (e as MouseEvent).relatedTarget as Element | null;
			// If the pointer is moving to another event inside the same slot,
			// let handleOver re-paint. Otherwise clear all dimmed in this slot.
			const stayingInsideEvent = related?.closest?.(".rbc-event");
			if (stayingInsideEvent) return;
			const slot = leaving.closest(".rbc-day-slot");
			slot?.querySelectorAll(`.${DIM_CLASS}`).forEach((ev) => ev.classList.remove(DIM_CLASS));
		};

		root.addEventListener("mouseover", handleOver);
		root.addEventListener("mouseout", handleOut);
		return () => {
			root.removeEventListener("mouseover", handleOver);
			root.removeEventListener("mouseout", handleOut);
		};
	}, [view, events]);

	// Recalculate the `--today-start` / `--today-end` / `--indicator-offset`
	// CSS variables that position the week-view current-time gradient. Runs
	// once on mount + at the next midnight + every 24h thereafter so the
	// 'today' anchor moves cleanly across day boundaries without a page
	// reload.
	useEffect(() => {
		if (view !== "week") return;

		const calculateTodayPosition = () => {
			const today = new Date();
			const dayOfWeek = today.getDay();
			const mondayFirstDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

			const dayWidth = 100 / 7;
			const startPosition = mondayFirstDay * dayWidth;
			const endPosition = (mondayFirstDay + 1) * dayWidth;

			document.documentElement.style.setProperty("--today-start", `${startPosition}%`);
			document.documentElement.style.setProperty("--today-end", `${endPosition}%`);
			document.documentElement.style.setProperty("--indicator-offset", `${mondayFirstDay * 100}%`);
		};

		calculateTodayPosition();

		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);
		const timeUntilMidnight = tomorrow.getTime() - now.getTime();

		// Hoist `dailyInterval` so cleanup can clear it. (Previously the
		// `clearInterval` return was nested inside the setTimeout callback,
		// which is ignored — meaning the interval leaked on unmount.)
		let dailyInterval: ReturnType<typeof setInterval> | null = null;
		const midnightTimer = setTimeout(() => {
			calculateTodayPosition();
			dailyInterval = setInterval(calculateTodayPosition, 24 * 60 * 60 * 1000);
		}, timeUntilMidnight);

		return () => {
			clearTimeout(midnightTimer);
			if (dailyInterval) clearInterval(dailyInterval);
		};
	}, [view]);

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-navy-frame bg-white p-5 dark:border-navy-edge dark:bg-background">
				<div ref={cardContentRef}>
				<CalendarToolbar view={view} date={date} onNavigate={handleToolbarNavigate} onView={handleViewChange} />

				<div ref={calViewportRef}>
				{view === "agenda" ? (
					<AgendaList events={events} date={date} length={AGENDA_LENGTH_DAYS} />
				) : (
					<div style={{ height: "740px", width: "100%" }}>
						<Calendar
							localizer={localizer}
							events={events}
							startAccessor="start"
							endAccessor="end"
							date={date}
							view={view}
							onNavigate={handleNavigate}
							onView={handleViewChange}
							onSelectEvent={handleSelectEvent}
							onKeyPressEvent={handleKeyPressEvent}
							onSelectSlot={handleSelectSlot}
							selectable={false} // !!user: Only allow selection if user is logged in
							toolbar={false}
							formats={formats}
							eventPropGetter={eventPropGetter}
							dayPropGetter={dayPropGetter}
							components={calendarComponents}
							scrollToTime={new Date(1970, 0, 1, 8, 40)} // 1970 = Unix Epoch. We only care about the time.
							tooltipAccessor={() => ""}
						/>
					</div>
				)}
				</div>
				</div>
			</div>
		</div>
	);
}
