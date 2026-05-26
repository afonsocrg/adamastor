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

test("strips blockquote markers at line start", () => {
	assert.equal(cleanEventDescription("> Quoted line"), "Quoted line");
	assert.equal(cleanEventDescription("> One\n> Two"), "One\nTwo");
});

test("strips bold markers (** and __)", () => {
	assert.equal(cleanEventDescription("**Bold here**"), "Bold here");
	assert.equal(cleanEventDescription("Read **this** carefully"), "Read this carefully");
	assert.equal(cleanEventDescription("__Also bold__"), "Also bold");
});

test("strips italic markers (* and _) without eating bullets or snake_case", () => {
	assert.equal(cleanEventDescription("Read *this* word"), "Read this word");
	assert.equal(cleanEventDescription("A _quiet_ note"), "A quiet note");
	// Bullet list — must not be stripped
	assert.equal(cleanEventDescription("* item one"), "* item one");
	// snake_case — underscores stay
	assert.equal(cleanEventDescription("Variable foo_bar_baz here"), "Variable foo_bar_baz here");
});

test("strips bold wrapping italic with shouty content (real row 126 pattern)", () => {
	assert.equal(
		cleanEventDescription("**DO NOT FORGET TO REGISTER *ONLY* ON OUR OFFICIAL WEBSITE:**"),
		"Do Not Forget To Register Only On Our Official Website:",
	);
});

test("flattens markdown links to label only", () => {
	assert.equal(cleanEventDescription("Sign up [here](https://example.com) today"), "Sign up here today");
	// "REGISTER FOR FREE HERE" — 4 long-caps in a row → transforms.
	assert.equal(
		cleanEventDescription("[REGISTER FOR FREE HERE](https://events.ironhack.com/r/x)"),
		"Register For Free Here",
	);
});

test("unescapes backslash-escaped punctuation from table sources", () => {
	assert.equal(
		cleanEventDescription("Tech Meetup Aveiro \\| Continuidade no Negócio\\, Qualidade"),
		"Tech Meetup Aveiro | Continuidade no Negócio, Qualidade",
	);
});

test("transforms a run of 3+ long-caps words to Title Case", () => {
	assert.equal(cleanEventDescription("JOIN LISBON STARTUP WEEK"), "Join Lisbon Startup Week");
});

test("leaves 2-word long-caps phrases alone (under threshold)", () => {
	// "HUGE DEAL" has 2 long-caps — under the ≥3 threshold. Same for
	// "YOUTH ENTREPRENEURSHIP", "SOCIAL INNOVATION", etc. Trade-off accepted
	// to preserve real acronym pairs like "AWS GCP" / "AI ACT".
	assert.equal(cleanEventDescription("HUGE DEAL today"), "HUGE DEAL today");
	assert.equal(cleanEventDescription("YOUTH ENTREPRENEURSHIP rules"), "YOUTH ENTREPRENEURSHIP rules");
});

test("transforms a shouty run embedded in normal text", () => {
	assert.equal(
		cleanEventDescription("Save the date: BIG LISBON SUMMIT 2026 is coming!"),
		"Save the date: Big Lisbon Summit 2026 is coming!",
	);
});

test("leaves scattered short acronyms alone", () => {
	assert.equal(cleanEventDescription("AI and IT are huge in 2026."), "AI and IT are huge in 2026.");
	assert.equal(
		cleanEventDescription("Don’t miss it. AI IT JS are cool acronyms."),
		"Don’t miss it. AI IT JS are cool acronyms.",
	);
});

test("leaves common acronym PAIRS alone (no long-cap run of 3)", () => {
	// "AWS GCP" / "AI ACT" / "NFC SUMMIT" / "CNCF KCD" — 2 long-caps each.
	// Threshold is ≥3 long, so these stay untouched.
	assert.equal(cleanEventDescription("Powered by AWS GCP today."), "Powered by AWS GCP today.");
	assert.equal(cleanEventDescription("One Year of AI ACT"), "One Year of AI ACT");
	assert.equal(cleanEventDescription("NFC SUMMIT is back"), "NFC SUMMIT is back");
	assert.equal(cleanEventDescription("CNCF KCD Porto"), "CNCF KCD Porto");
});

test("handles Unicode uppercase (Portuguese diacritics)", () => {
	// "O EVENTO QUE UNE OS PONTOS ESTÁ DE VOLTA" — many long-caps, threshold met.
	assert.equal(
		cleanEventDescription("O EVENTO QUE UNE OS PONTOS ESTÁ DE VOLTA!"),
		"O Evento Que Une Os Pontos Está De Volta!",
	);
});

test("handles a run that starts with a short-caps word", () => {
	assert.equal(
		cleanEventDescription("DO NOT FORGET TO REGISTER ONLY ON OUR OFFICIAL WEBSITE"),
		"Do Not Forget To Register Only On Our Official Website",
	);
});

test("handles apostrophes inside all-caps words (DON'T)", () => {
	// "DON'T BRING A BACKLOG TO A GUNFIGHT" — 4 long-caps once apostrophe is
	// accounted for; single-letter "A" extends the run rather than breaking it.
	assert.equal(cleanEventDescription("DON'T BRING A BACKLOG TO A GUNFIGHT!"), "Don't Bring A Backlog To A Gunfight!");
});

test("does NOT cross paragraph breaks when extending a run", () => {
	// "1PM" and "LACS" sit on consecutive paragraphs; they're two separate
	// caps tokens, and the \n\n between should break any in-progress run so
	// they don't get merged and demoted together.
	assert.equal(
		cleanEventDescription("Registration opens at 1PM\n\nLACS is a great venue"),
		"Registration opens at 1PM\n\nLACS is a great venue",
	);
});

test("preserves multi-paragraph structure", () => {
	assert.equal(
		cleanEventDescription("## Welcome\n\nAI and ML are huge in 2026. Come learn."),
		"Welcome\n\nAI and ML are huge in 2026. Come learn.",
	);
});

test("collapses runs of 3+ blank lines to 2", () => {
	assert.equal(cleanEventDescription("Para 1\n\n\n\n\nPara 2"), "Para 1\n\nPara 2");
});

test("trims surrounding whitespace", () => {
	assert.equal(cleanEventDescription("  hello  "), "hello");
});

test("transforms 3+ long-caps acronyms in a comma-separated list (known trade-off)", () => {
	// Three long-caps acronyms separated only by commas/spaces still satisfy
	// the ≥3 threshold and get Title-Cased. Acceptable — bare comma-separated
	// acronym lists are rare in real descriptions.
	assert.equal(cleanEventDescription("Powered by AWS, GCP, AZURE today."), "Powered by Aws, Gcp, Azure today.");
});
