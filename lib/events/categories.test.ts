import assert from "node:assert/strict";
import { test } from "node:test";
import { inferEventCategorySlugs, isEventCategorySlug, sanitizeEventCategorySlugs } from "./categories";

// inferEventCategorySlugs powers the form's category *suggestions* only — the
// human accepts or clears them, and we deliberately never auto-apply it
// server-side (a wrong tag is worse than no tag). These lock the rules so a
// regression can't start suggesting the wrong category — and assert that
// no-signal text correctly suggests nothing (untagged is a valid outcome).

test("infers AI from an AI-titled event", () => {
	assert.deepEqual(inferEventCategorySlugs({ title: "Lisbon AI Builders #12" }), ["ai"]);
});

test("infers software-engineering from a React meetup", () => {
	assert.ok(inferEventCategorySlugs({ title: "React Lisbon Meetup" }).includes("software-engineering"));
});

test("treats 'Product Design' as design, not product management", () => {
	const slugs = inferEventCategorySlugs({ title: "Lisbon Product Design Drinks" });
	assert.ok(slugs.includes("design"));
	assert.ok(!slugs.includes("product"));
});

test("infers product from ProductTank", () => {
	assert.ok(inferEventCategorySlugs({ title: "ProductTank Lisbon" }).includes("product"));
});

test("infers startups-fundraising from a demo day", () => {
	assert.ok(inferEventCategorySlugs({ title: "Founder Institute Demo Day" }).includes("startups-fundraising"));
});

test("matches description and url fields, not just the title", () => {
	const slugs = inferEventCategorySlugs({
		title: "Evening meetup",
		description: "A night about figma and user research",
		url: "https://lu.ma/ux-night",
	});
	assert.ok(slugs.includes("design"));
});

test("can return multiple categories for cross-discipline events", () => {
	const slugs = inferEventCategorySlugs({ title: "AI for Designers", description: "Using LLMs in your design workflow" });
	assert.ok(slugs.includes("ai"));
	assert.ok(slugs.includes("design"));
});

test("returns the canonical category order", () => {
	// EVENT_CATEGORIES order: startups-fundraising, product, design, software-engineering, ai
	const slugs = inferEventCategorySlugs({ title: "Startup pitch + AI demo", description: "founders and machine learning" });
	assert.deepEqual(slugs, ["startups-fundraising", "ai"]);
});

test("returns empty for text with no category signal", () => {
	assert.deepEqual(inferEventCategorySlugs({ title: "Friday social drinks", description: "Come hang out" }), []);
});

test("tolerates null/undefined fields", () => {
	assert.deepEqual(inferEventCategorySlugs({ title: null, description: undefined, url: null }), []);
});

test("sanitize keeps only known slugs and dedupes, preserving order", () => {
	assert.deepEqual(sanitizeEventCategorySlugs(["design", "design", "nonsense", "ai"]), ["design", "ai"]);
});

test("sanitize returns [] for non-array input", () => {
	assert.deepEqual(sanitizeEventCategorySlugs("design"), []);
	assert.deepEqual(sanitizeEventCategorySlugs(null), []);
	assert.deepEqual(sanitizeEventCategorySlugs(undefined), []);
});

test("isEventCategorySlug guards correctly", () => {
	assert.equal(isEventCategorySlug("ai"), true);
	assert.equal(isEventCategorySlug("software-engineering"), true);
	assert.equal(isEventCategorySlug("nope"), false);
});
