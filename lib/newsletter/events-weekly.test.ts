import assert from "node:assert/strict";
import { test } from "node:test";
import {
	type DigestEvent,
	buildEventDigests,
	buildEventsWeeklySubject,
	formatCategoryList,
	spreadAcrossDays,
} from "./events-weekly";

function event(id: string, start: string, categorySlugs: string[]): DigestEvent {
	return { id, title: id, description: "", start_time: start, city: "lisboa", url: "", categorySlugs };
}

const EVENTS = [
	event("ai-mon", "2026-10-05T18:00:00Z", ["ai"]),
	event("ai-design-tue", "2026-10-06T18:00:00Z", ["ai", "design"]),
	event("design-wed", "2026-10-07T18:00:00Z", ["design"]),
	event("product-thu", "2026-10-08T18:00:00Z", ["product"]),
];

const sub = (email: string, categories: string[]) => ({ email, categories, preference_token: `tok-${email}` });

test("one digest per reader, covering the union of their categories", () => {
	const [digest] = buildEventDigests({
		subscribers: [sub("a@x.io", ["ai", "design"])],
		events: EVENTS,
		eligibleEmails: new Set(["a@x.io"]),
	});
	assert.deepEqual(
		digest.events.map((e) => e.id),
		["ai-mon", "ai-design-tue", "design-wed"],
	);
});

test("an event in two of the reader's categories appears once", () => {
	const [digest] = buildEventDigests({
		subscribers: [sub("a@x.io", ["ai", "design"])],
		events: EVENTS,
		eligibleEmails: new Set(["a@x.io"]),
	});
	assert.equal(digest.events.filter((e) => e.id === "ai-design-tue").length, 1);
	assert.equal(digest.totalCount, 3);
});

test("skips readers who aren't eligible in Resend (unsubscribed or no contact)", () => {
	const digests = buildEventDigests({
		subscribers: [sub("gone@x.io", ["ai"]), sub("here@x.io", ["ai"])],
		events: EVENTS,
		eligibleEmails: new Set(["here@x.io"]),
	});
	assert.deepEqual(
		digests.map((d) => d.email),
		["here@x.io"],
	);
});

test("never sends an empty email", () => {
	const digests = buildEventDigests({
		subscribers: [sub("a@x.io", ["software-engineering"]), sub("b@x.io", [])],
		events: EVENTS,
		eligibleEmails: new Set(["a@x.io", "b@x.io"]),
	});
	assert.equal(digests.length, 0);
});

test("matchedCategories lists only categories that had events, in canonical order", () => {
	const [digest] = buildEventDigests({
		subscribers: [sub("a@x.io", ["software-engineering", "design", "startups-fundraising"])],
		events: EVENTS,
		eligibleEmails: new Set(["a@x.io"]),
	});
	assert.deepEqual(digest.matchedCategories, ["design"]);
});

test("the cap spreads picks across days instead of filling the first day", () => {
	const monday = Array.from({ length: 8 }, (_, i) => event(`mon-${i}`, `2026-10-05T${10 + i}:00:00Z`, ["ai"]));
	const later = [event("wed", "2026-10-07T18:00:00Z", ["ai"]), event("fri", "2026-10-09T18:00:00Z", ["ai"])];
	const picked = spreadAcrossDays([...monday, ...later], 4);
	assert.equal(picked.length, 4);
	assert.ok(picked.some((e) => e.id === "wed"));
	assert.ok(picked.some((e) => e.id === "fri"));
	// Still chronological.
	assert.deepEqual(
		picked.map((e) => e.start_time),
		[...picked.map((e) => e.start_time)].sort(),
	);
});

test("doesn't cap when it would only hide one or two events", () => {
	const many = (n: number) =>
		Array.from({ length: n }, (_, i) => event(`e${i}`, `2026-10-0${5 + (i % 5)}T1${i % 10}:00:00Z`, ["ai"]));
	const run = (n: number) =>
		buildEventDigests({
			subscribers: [sub("a@x.io", ["ai"])],
			events: many(n),
			eligibleEmails: new Set(["a@x.io"]),
			cap: 10,
		})[0];
	assert.equal(run(12).events.length, 12);
	assert.equal(run(13).events.length, 10);
	assert.equal(run(13).totalCount, 13);
});

test("under the cap, every event is kept", () => {
	assert.equal(spreadAcrossDays(EVENTS, 10).length, EVENTS.length);
});

test("category list reads naturally at every length", () => {
	assert.equal(formatCategoryList(["ai"]), "AI");
	assert.equal(formatCategoryList(["design", "ai"]), "Design and AI");
	assert.equal(formatCategoryList(["design", "product", "ai"]), "Design, Product Management and AI");
	assert.equal(
		formatCategoryList(["startups-fundraising", "product", "design", "ai"]),
		"Startups & Fundraising, Product Management and 2 more",
	);
});

test("subject uses the full count, not the capped count", () => {
	assert.equal(
		buildEventsWeeklySubject({ totalCount: 14, matchedCategories: ["ai", "design"] }),
		"14 events this week in AI and Design",
	);
	assert.equal(buildEventsWeeklySubject({ totalCount: 1, matchedCategories: ["ai"] }), "1 event this week in AI");
});
