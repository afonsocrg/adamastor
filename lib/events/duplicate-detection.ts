export type EventDuplicateSeverity = "block" | "warning";

export interface EventDuplicateInput {
	id?: string | number;
	title: string;
	description?: string | null;
	start_time: string;
	city: string;
	url?: string | null;
}

export interface EventDuplicateCandidate {
	event: {
		id: string | number;
		title: string;
		start_time: string;
		city: string;
		url?: string | null;
	};
	severity: EventDuplicateSeverity;
	reason: string;
	score: number;
}

const GENERIC_TITLE_WORDS = new Set([
	"a",
	"an",
	"and",
	"at",
	"by",
	"event",
	"events",
	"eventbrite",
	"for",
	"from",
	"grind",
	"in",
	"lisboa",
	"lisbon",
	"luma",
	"meetup",
	"of",
	"on",
	"online",
	"or",
	"porto",
	"portugal",
	"see",
	"startup",
	"the",
	"to",
	"with",
]);

function getEventDay(value: string) {
	return new Date(value).toISOString().slice(0, 10);
}

function getMinutesBetween(left: string, right: string) {
	return Math.abs(new Date(left).getTime() - new Date(right).getTime()) / 60000;
}

function normalizeCity(value: string) {
	return value.trim().toLowerCase();
}

export function normalizeEventUrl(value?: string | null) {
	if (!value) return "";

	try {
		const url = new URL(value);
		url.hash = "";
		for (const key of Array.from(url.searchParams.keys())) {
			if (/^(utm_|fbclid|gclid|mc_cid|mc_eid)/i.test(key)) {
				url.searchParams.delete(key);
			}
		}

		url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
		if (url.hostname === "lu.ma") {
			url.hostname = "luma.com";
		}

		return url.toString().replace(/\/$/, "");
	} catch {
		return value.trim().toLowerCase();
	}
}

export function normalizeEventTitle(value: string) {
	return value
		.normalize("NFKD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.replace(/&amp;/g, " and ")
		.replace(/[|:–—-]/g, " ")
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

function getTitleTokens(value: string) {
	return normalizeEventTitle(value)
		.split(/\s+/)
		.filter((token) => token.length > 2 && !GENERIC_TITLE_WORDS.has(token));
}

function getTokenSimilarity(left: string, right: string) {
	const leftTokens = new Set(getTitleTokens(left));
	const rightTokens = new Set(getTitleTokens(right));

	if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

	let shared = 0;
	for (const token of leftTokens) {
		if (rightTokens.has(token)) shared += 1;
	}

	return shared / new Set([...leftTokens, ...rightTokens]).size;
}

function toCandidate(
	event: EventDuplicateInput,
	severity: EventDuplicateSeverity,
	reason: string,
	score: number,
): EventDuplicateCandidate {
	return {
		event: {
			id: event.id ?? "",
			title: event.title,
			start_time: event.start_time,
			city: event.city,
			url: event.url,
		},
		reason,
		score,
		severity,
	};
}

function compareEventDuplicateCandidate(left: EventDuplicateCandidate, right: EventDuplicateCandidate) {
	if (left.severity !== right.severity) {
		return left.severity === "block" ? -1 : 1;
	}

	if (left.score !== right.score) {
		return right.score - left.score;
	}

	return left.event.title.localeCompare(right.event.title);
}

export function findEventDuplicateCandidates(
	newEvent: EventDuplicateInput,
	visibleEvents: EventDuplicateInput[],
): EventDuplicateCandidate[] {
	const newUrl = normalizeEventUrl(newEvent.url);
	const newTitle = normalizeEventTitle(newEvent.title);
	const newCity = normalizeCity(newEvent.city);
	const newDay = getEventDay(newEvent.start_time);
	const candidates = new Map<string, EventDuplicateCandidate>();

	for (const event of visibleEvents) {
		if (event.id && newEvent.id && String(event.id) === String(newEvent.id)) continue;

		const eventUrl = normalizeEventUrl(event.url);
		const eventTitle = normalizeEventTitle(event.title);
		const eventCity = normalizeCity(event.city);
		const eventDay = getEventDay(event.start_time);
		const minutesBetween = getMinutesBetween(newEvent.start_time, event.start_time);
		const isSameDay = newDay === eventDay;
		const isSameCity = newCity === eventCity;
		const candidateKey = String(event.id ?? `${event.title}-${event.start_time}-${event.url}`);

		let candidate: EventDuplicateCandidate | null = null;

		if (newUrl && eventUrl && newUrl === eventUrl && isSameDay && minutesBetween <= 360) {
			candidate = toCandidate(event, "block", "Same event URL on the same day.", 1);
		} else if (newTitle && eventTitle && newTitle === eventTitle && isSameCity && minutesBetween <= 45) {
			candidate = toCandidate(event, "block", "Same title, city, and start time.", 0.96);
		} else if (newUrl && eventUrl && newUrl === eventUrl && isSameDay) {
			candidate = toCandidate(event, "warning", "Same event URL on the same day, but the times differ.", 0.86);
		} else if (newTitle && eventTitle && newTitle === eventTitle && isSameCity && isSameDay) {
			candidate = toCandidate(event, "warning", "Same title, city, and day.", 0.82);
		} else if (isSameCity && isSameDay && minutesBetween <= 180) {
			const titleScore = getTokenSimilarity(newEvent.title, event.title);
			const contextScore = getTokenSimilarity(
				`${newEvent.title} ${newEvent.description ?? ""}`,
				`${event.title} ${event.description ?? ""}`,
			);
			const score = Math.max(titleScore, contextScore);

			if (score >= 0.42) {
				candidate = toCandidate(event, "warning", "Similar title or description on the same day.", score);
			}
		}

		if (!candidate) continue;

		const existingCandidate = candidates.get(candidateKey);
		if (!existingCandidate || compareEventDuplicateCandidate(candidate, existingCandidate) < 0) {
			candidates.set(candidateKey, candidate);
		}
	}

	return [...candidates.values()].sort(compareEventDuplicateCandidate).slice(0, 5);
}

export function hasBlockingEventDuplicate(candidates: EventDuplicateCandidate[]) {
	return candidates.some((candidate) => candidate.severity === "block");
}
