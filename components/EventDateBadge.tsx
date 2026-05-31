import { cn } from "@/lib/utils";

interface EventDateBadgeProps {
	/** Short weekday, e.g. "Tue" — rendered uppercased. */
	weekday: string;
	/** Day of month, e.g. "2". */
	day: string | number;
	/** ISO timestamp for the <time> element's machine-readable value. */
	dateTime?: string;
	/**
	 * Fill tone, per the tint-vs-veil rule (see the events date-block language):
	 * - "surface" → navy-veil, for always-on date plaques (the homepage upcoming
	 *   list, email event rows). The default.
	 * - "highlight" → navy-tint, for an active / selected day.
	 */
	tone?: "surface" | "highlight";
	className?: string;
}

const TONE_FILL: Record<NonNullable<EventDateBadgeProps["tone"]>, string> = {
	surface: "bg-navy-veil dark:bg-cyan-glow/[0.06]",
	highlight: "bg-navy-tint dark:bg-cyan-glow/[0.18]",
};

/**
 * Shared event date block — a letter-spaced weekday cap over a Lora Bold day
 * numeral, sized to match the events calendar day cells (min-w-[52px] h-[68px]).
 * This is the single date-block grammar used across the calendars and date
 * plaques; route new date surfaces through here so they don't drift.
 *
 * Presentational only — wrap in a link/button for interactivity. The
 * interactive calendar day cell stays separate by design: it adds an event dot,
 * three selection states, and scroll-snap that don't belong in a static badge.
 */
export function EventDateBadge({ weekday, day, dateTime, tone = "surface", className }: EventDateBadgeProps) {
	return (
		<time
			dateTime={dateTime}
			className={cn(
				"flex h-[68px] min-w-[52px] shrink-0 flex-col items-center justify-center rounded-md px-1.5 text-center leading-none",
				TONE_FILL[tone],
				className,
			)}
		>
			<span className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-cyan-dim">
				{weekday}
			</span>
			<span className="mt-1 text-lg font-bold text-navy [font-family:var(--font-lora-bold)] [font-variant-numeric:tabular-nums] dark:text-cyan-lifted">
				{day}
			</span>
		</time>
	);
}
