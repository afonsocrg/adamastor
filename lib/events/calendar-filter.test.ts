import assert from "node:assert/strict";
import { test } from "node:test";
import { filterCalendarEvents, normalizeCitySlug } from "./calendar-filter";

const events: { id: number; city?: string; categorySlugs: string[] }[] = [
	{ id: 1, city: "lisboa", categorySlugs: ["design"] },
	{ id: 2, city: "Porto", categorySlugs: ["software-engineering", "ai"] },
	{ id: 3, city: "lisboa", categorySlugs: ["ai", "design"] },
	{ id: 4, city: "online", categorySlugs: [] },
	{ id: 5, city: undefined, categorySlugs: ["design"] },
];

test("city: null returns every event (Everywhere)", () => {
	const result = filterCalendarEvents([...events], { city: null, category: null });
	assert.equal(result.length, events.length);
});

test("scopes to a single city, matching the stored slug case-insensitively", () => {
	// id 2 is stored as "Porto" (a normalization straggler) — still matches.
	const result = filterCalendarEvents([...events], { city: "porto", category: null });
	assert.deepEqual(
		result.map((e) => e.id),
		[2],
	);
});

test("treats 'online' as its own city scope, not a fallback bucket", () => {
	const result = filterCalendarEvents([...events], { city: "online", category: null });
	assert.deepEqual(
		result.map((e) => e.id),
		[4],
	);
});

test("combines city and category", () => {
	const result = filterCalendarEvents([...events], { city: "lisboa", category: "ai" });
	assert.deepEqual(
		result.map((e) => e.id),
		[3],
	);
});

test("hoists the active category to the front for colour-coding", () => {
	const [event] = filterCalendarEvents([...events], { city: "lisboa", category: "ai" });
	assert.equal(event?.categorySlugs?.[0], "ai");
});

test("does not mutate the input event objects", () => {
	const snapshot = [...events[2].categorySlugs];
	filterCalendarEvents([...events], { city: "lisboa", category: "ai" });
	assert.deepEqual(events[2].categorySlugs, snapshot);
});

test("normalizeCitySlug trims, lowercases, and nulls empties", () => {
	assert.equal(normalizeCitySlug("  Lisboa "), "lisboa");
	assert.equal(normalizeCitySlug(""), null);
	assert.equal(normalizeCitySlug(undefined), null);
	assert.equal(normalizeCitySlug(null), null);
});
