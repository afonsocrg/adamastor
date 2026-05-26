import type { EventCategorySlug } from "./categories";
import { withUtm } from "./utm";

const PRODID = "-//Adamastor//Events//EN";
const DEFAULT_DURATION_HOURS = 2;

interface CalendarEvent {
	id: number | string;
	title: string;
	description: string;
	start_time: string;
	end_time?: string | null;
	city: string;
	url: string;
	created_at?: string | null;
}

interface BuildEventsIcsOptions {
	events: CalendarEvent[];
	/** Shown by calendar apps as the calendar name (e.g. "Adamastor — Software Engineering events in Lisboa"). */
	calendarName: string;
	/** Shown by calendar apps as the calendar description. */
	calendarDescription: string;
	/** utm_campaign value applied to outbound event links. */
	utmCampaign: string;
}

/**
 * Escape a text-typed property value per RFC 5545 §3.3.11.
 *   \\, ;, ,, newlines  →  \\\\, \\;, \\,, \\n
 */
function escapeIcsText(text: string): string {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Format an ISO string as an iCalendar UTC date-time: YYYYMMDDTHHMMSSZ.
 * All times go out in UTC so calendar apps don't need to negotiate a VTIMEZONE.
 */
function formatIcsDateTime(isoString: string): string {
	const d = new Date(isoString);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/**
 * RFC 5545 §3.1: lines longer than 75 *octets* MUST be folded with CRLF + a
 * leading whitespace character. We fold by character count which is a slight
 * underestimate for multi-byte UTF-8 — acceptable for event titles where the
 * margin to 75 chars is usually ample.
 */
function foldIcsLine(line: string): string {
	if (line.length <= 75) return line;
	const chunks: string[] = [];
	let remaining = line;
	while (remaining.length > 75) {
		chunks.push(remaining.slice(0, 75));
		remaining = remaining.slice(75);
	}
	chunks.push(remaining);
	return chunks.join("\r\n ");
}

/**
 * Build a published-calendar .ics document for a set of events. Each event
 * gets a VEVENT with a stable UID (so calendar apps dedupe on refresh), the
 * event start time, an end time (real when provided, otherwise start + 2h —
 * matches the dashboard calendar's default), and a UTM-decorated URL pointing
 * back to the external RSVP page.
 */
export function buildEventsIcs({
	events,
	calendarName,
	calendarDescription,
	utmCampaign,
}: BuildEventsIcsOptions): string {
	const dtstamp = formatIcsDateTime(new Date().toISOString());

	const vevents = events
		.map((event) => {
			const start = new Date(event.start_time);
			const end = event.end_time
				? new Date(event.end_time)
				: new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
			const outboundUrl = withUtm(event.url, { medium: "ics", campaign: utmCampaign });
			const uid = `event-${event.id}@adamastor.blog`;

			return [
				"BEGIN:VEVENT",
				foldIcsLine(`UID:${uid}`),
				foldIcsLine(`DTSTAMP:${dtstamp}`),
				foldIcsLine(`DTSTART:${formatIcsDateTime(start.toISOString())}`),
				foldIcsLine(`DTEND:${formatIcsDateTime(end.toISOString())}`),
				foldIcsLine(`SUMMARY:${escapeIcsText(event.title)}`),
				foldIcsLine(`DESCRIPTION:${escapeIcsText(event.description ?? "")}`),
				foldIcsLine(`LOCATION:${escapeIcsText(event.city)}`),
				foldIcsLine(`URL:${escapeIcsText(outboundUrl)}`),
				"END:VEVENT",
			].join("\r\n");
		})
		.join("\r\n");

	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		`PRODID:${PRODID}`,
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		foldIcsLine(`X-WR-CALNAME:${escapeIcsText(calendarName)}`),
		foldIcsLine(`X-WR-CALDESC:${escapeIcsText(calendarDescription)}`),
		"X-WR-TIMEZONE:Europe/Lisbon",
	];

	if (vevents) lines.push(vevents);
	lines.push("END:VCALENDAR");

	return `${lines.join("\r\n")}\r\n`;
}

/**
 * UTM campaign value for the route's calendar feed. Mirrors `feedUtmCampaign`
 * in [feed.ts](feed.ts) so analytics can distinguish RSS vs ICS traffic per
 * scope (e.g. `ics_events_lisboa_software-engineering` vs `rss_events_…`).
 */
export function calendarUtmCampaign({
	city,
	category,
}: {
	city?: string | null;
	category?: EventCategorySlug | null;
}): string {
	const parts: string[] = ["ics_events"];
	if (city) parts.push(city);
	if (category) parts.push(category);
	return parts.join("_");
}
