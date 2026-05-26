import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanEventTitle } from "./clean-title";

test("passes through empty input", () => {
	assert.equal(cleanEventTitle(""), "");
});

test("strips bracketed online indicators", () => {
	assert.equal(cleanEventTitle("Event [Online]"), "Event");
	assert.equal(cleanEventTitle("[VIRTUAL] Workshop"), "Workshop");
});

test("strips parenthesised online indicators", () => {
	assert.equal(cleanEventTitle("Event (Online)"), "Event");
	assert.equal(cleanEventTitle("Workshop (virtual)"), "Workshop");
});

test("strips online-indicator emoji", () => {
	assert.equal(cleanEventTitle("🌐 Webinar"), "Webinar");
	assert.equal(cleanEventTitle("💻 Workshop"), "Workshop");
});

test("strips the Luma branding suffix", () => {
	assert.equal(cleanEventTitle("My Event · Luma"), "My Event");
	assert.equal(cleanEventTitle("Hangout #52 · Luma"), "Hangout #52");
});

test("strips the Meetup branding suffix", () => {
	assert.equal(cleanEventTitle("My Event | Meetup"), "My Event");
});

test("strips the Meetup date-tail but preserves qualifying parentheticals (real row 61)", () => {
	// "(NFC Side Event)" stays — it's a real qualifier, not platform noise.
	assert.equal(
		cleanEventTitle(
			"BOB Hybrid & Chill Meetup (NFC Side Event) @ The Block Lisboa, Fri, Jun 6, 2025, 7:00 PM   | Meetup",
		),
		"BOB Hybrid & Chill Meetup (NFC Side Event) @ The Block Lisboa",
	);
});

test("strips Eventbrite branding suffix", () => {
	assert.equal(cleanEventTitle("Workshop - Eventbrite"), "Workshop");
	assert.equal(cleanEventTitle("Conference | Eventbrite"), "Conference");
});

test("de-shouts a SHOUTY title (run of 2+ long-caps)", () => {
	assert.equal(cleanEventTitle("BIG LISBON SUMMIT 2026"), "Big Lisbon Summit 2026");
});

test("leaves a single all-caps word alone", () => {
	assert.equal(cleanEventTitle("OWASP Porto"), "OWASP Porto");
});

test("collapses double spaces left by stripped suffix", () => {
	assert.equal(cleanEventTitle("Event  with  extra  spaces"), "Event with extra spaces");
});

test("preserves a clean title", () => {
	assert.equal(
		cleanEventTitle("AI Meetup: Real-World AI Systems in Action"),
		"AI Meetup: Real-World AI Systems in Action",
	);
});

test("preserves number references like #52", () => {
	assert.equal(cleanEventTitle("Hangout #52 | What About Tech?"), "Hangout #52 | What About Tech?");
});
