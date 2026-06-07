// Fixed, external reference markers overlaid on the public events calendar:
// Portugal's 2026 World Cup group games + the final. These are NOT community
// events — they live nowhere in the database, never enter the submission /
// approval / newsletter / .ics pipelines, and exist only as collision-planning
// context on the calendar grid. An organiser shouldn't book a room against a
// Portugal kickoff, so the calendar shows the kickoffs in a distinct gold ⚽
// register that ignores the city + category filters: a national fixture clashes
// with an audience *everywhere*, in *every* category.
//
// Times are stored as absolute UTC instants (the official kickoff converted to
// UTC), so every viewer sees their own local kickoff — a Lisbon organiser reads
// 18:00, the same instant a browser in Madrid renders as 19:00. The calendar
// (react-big-calendar via moment) renders Dates in the browser's local zone, so
// no per-fixture timezone field is needed.
//
// Source: FIFA / Wikipedia — 2026 World Cup Group K (Portugal, DR Congo,
// Uzbekistan, Colombia) + the final. Verified 2026-06-07. Kickoff conversions:
//   Houston (NRG)  noon CDT  (UTC−5) → 17:00 UTC → 18:00 Lisbon (WEST)
//   Miami (Hard Rock) 19:30 EDT (UTC−4) → 23:30 UTC → 00:30 Lisbon next day
//   New York (MetLife) 15:00 EDT (UTC−4) → 19:00 UTC → 20:00 Lisbon

export interface WorldCupFixture {
	id: string;
	/** Led with Portugal for scannability by a Portuguese audience, even where
	 *  Portugal is the official away side (the venue is neutral; who's "home"
	 *  is irrelevant to a planner). */
	title: string;
	/** ISO-8601 with Z — the official kickoff, in UTC. */
	startUtc: string;
	durationMinutes: number;
	/** Human venue context for the agenda/hover ("Houston", "New York"). */
	venue: string;
	/** FIFA reference page (opens on click, same as a community event's source). */
	url: string;
}

const PORTUGAL_FIXTURES_URL =
	"https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/teams/portugal/fixtures";
const SCHEDULE_URL = "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures";

// 90' + half-time + stoppage ≈ 2h of "the audience is occupied". The final can
// run to extra time + penalties, so it blocks a little longer.
const GROUP_DURATION_MIN = 120;
const FINAL_DURATION_MIN = 150;

export const WORLD_CUP_FIXTURES: WorldCupFixture[] = [
	{
		id: "wc-2026-pt-drc",
		title: "Portugal v DR Congo",
		startUtc: "2026-06-17T17:00:00Z", // 18:00 Lisbon · 12:00 Houston (CDT)
		durationMinutes: GROUP_DURATION_MIN,
		venue: "Houston",
		url: PORTUGAL_FIXTURES_URL,
	},
	{
		id: "wc-2026-pt-uzb",
		title: "Portugal v Uzbekistan",
		startUtc: "2026-06-23T17:00:00Z", // 18:00 Lisbon · 12:00 Houston (CDT)
		durationMinutes: GROUP_DURATION_MIN,
		venue: "Houston",
		url: PORTUGAL_FIXTURES_URL,
	},
	{
		id: "wc-2026-pt-col",
		title: "Portugal v Colombia",
		startUtc: "2026-06-27T23:30:00Z", // 00:30 Lisbon (28 Jun) · 19:30 Miami (EDT)
		durationMinutes: GROUP_DURATION_MIN,
		venue: "Miami",
		url: PORTUGAL_FIXTURES_URL,
	},
	{
		id: "wc-2026-final",
		title: "World Cup Final",
		startUtc: "2026-07-19T19:00:00Z", // 20:00 Lisbon · 15:00 New York (EDT)
		durationMinutes: FINAL_DURATION_MIN,
		venue: "New York",
		url: SCHEDULE_URL,
	},
];

export interface WorldCupCalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	url: string;
	venue: string;
	/** Discriminates a fixed national marker from a community submission. The
	 *  calendar branches on this for the gold ⚽ treatment and to skip filtering. */
	external: true;
}

/**
 * Build calendar-ready fixture events, scoped to the calendar's visible window.
 * Windowing means the fixtures fall out of view naturally once the tournament
 * is ~a month past (the calendar's 30-day look-back) — no code change needed to
 * retire them, they just stop matching.
 */
export function getWorldCupFixtureEvents(windowStart: Date, windowEnd: Date): WorldCupCalendarEvent[] {
	return WORLD_CUP_FIXTURES.flatMap((fixture) => {
		const start = new Date(fixture.startUtc);
		if (start < windowStart || start > windowEnd) return [];
		return [
			{
				id: fixture.id,
				title: fixture.title,
				start,
				end: new Date(start.getTime() + fixture.durationMinutes * 60 * 1000),
				url: fixture.url,
				venue: fixture.venue,
				external: true as const,
			},
		];
	});
}
