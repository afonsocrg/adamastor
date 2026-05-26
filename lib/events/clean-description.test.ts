import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanEventDescription } from "./clean-description";

test("passes through undefined and empty inputs", () => {
	assert.equal(cleanEventDescription(undefined), undefined);
	assert.equal(cleanEventDescription(""), "");
});

test("strips markdown heading markers at line start", () => {
	assert.equal(cleanEventDescription("# One"), "One");
	assert.equal(cleanEventDescription("## Two"), "Two");
	assert.equal(cleanEventDescription("### Three"), "Three");
	assert.equal(cleanEventDescription("#### Four"), "Four");
	assert.equal(cleanEventDescription("##### Five"), "Five");
});

test("strips heading marker from the real auto-fill example", () => {
	assert.equal(
		cleanEventDescription("#### Curious how AI is transforming IT? Join us for a fast-paced look."),
		"Curious how AI is transforming IT? Join us for a fast-paced look.",
	);
});

test("preserves #1 / #16 style number references (no space after #)", () => {
	assert.equal(cleanEventDescription("#1 reason to come"), "#1 reason to come");
	assert.equal(cleanEventDescription("Topic #16 today"), "Topic #16 today");
	assert.equal(cleanEventDescription("Panel #1 with three founders"), "Panel #1 with three founders");
});

test("preserves heading-style hash mid-paragraph", () => {
	assert.equal(
		cleanEventDescription("This is fine. ## Not a heading mid-line."),
		"This is fine. ## Not a heading mid-line.",
	);
});

test("transforms a run of 3+ all-caps words to Title Case", () => {
	assert.equal(
		cleanEventDescription("JOIN US FOR LISBON STARTUP WEEK"),
		"Join Us For Lisbon Startup Week",
	);
});

test("transforms a shouty run embedded in normal text", () => {
	assert.equal(
		cleanEventDescription("Save the date: BIG LISBON SUMMIT 2026 is coming!"),
		"Save the date: Big Lisbon Summit 2026 is coming!",
	);
});

test("leaves scattered short acronyms (≤2 chars) alone", () => {
	assert.equal(
		cleanEventDescription("AI and IT are huge in 2026."),
		"AI and IT are huge in 2026.",
	);
	assert.equal(
		cleanEventDescription("Don’t miss it. AI IT JS are cool acronyms."),
		"Don’t miss it. AI IT JS are cool acronyms.",
	);
});

test("leaves 2-acronym sequences alone (under threshold)", () => {
	assert.equal(
		cleanEventDescription("Powered by AWS and GCP. Built in Lisbon."),
		"Powered by AWS and GCP. Built in Lisbon.",
	);
});

test("leaves 2 consecutive shouty words alone (under threshold)", () => {
	assert.equal(cleanEventDescription("HUGE DEAL today"), "HUGE DEAL today");
});

test("combines heading strip and de-shout", () => {
	assert.equal(
		cleanEventDescription("#### JOIN US FOR LISBON STARTUP WEEK"),
		"Join Us For Lisbon Startup Week",
	);
});

test("preserves multi-paragraph structure", () => {
	assert.equal(
		cleanEventDescription("## Welcome\n\nAI and ML are huge in 2026. Come learn."),
		"Welcome\n\nAI and ML are huge in 2026. Come learn.",
	);
});

test("trims surrounding whitespace", () => {
	assert.equal(cleanEventDescription("  hello  "), "hello");
});

test("transforms 3+ caps acronyms in a comma-separated list (known trade-off)", () => {
	// Documents the known edge case: 3+ caps words separated by punctuation+space
	// still count as a run, so acronym lists get Title-Cased. Acceptable per the
	// "more than 2 caps words → transform" rule.
	assert.equal(
		cleanEventDescription("Powered by AWS, GCP, AZURE today."),
		"Powered by Aws, Gcp, Azure today.",
	);
});
