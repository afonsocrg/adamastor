import assert from "node:assert/strict";
import { test } from "node:test";
import type { JSONContent } from "novel";
import { normalizeTypography } from "./normalize-typography";

// Helpers — build a doc with a single paragraph containing one text node, then
// pull the normalised text back out for assertion.
const wrap = (text: string): JSONContent => ({
	type: "doc",
	content: [
		{
			type: "paragraph",
			content: [{ type: "text", text }],
		},
	],
});

const firstText = (doc: JSONContent): string =>
	(doc.content?.[0]?.content?.[0]?.text as string) ?? "";

const run = (input: string): string => firstText(normalizeTypography(wrap(input)));

test("em-dash: two hyphens become em-dash", () => {
	assert.equal(run("Hello -- world"), "Hello — world");
});

test("em-dash: three or more hyphens collapse to one em-dash", () => {
	assert.equal(run("a---b"), "a—b");
	assert.equal(run("a----b"), "a—b");
});

test("em-dash: single hyphen untouched", () => {
	assert.equal(run("well-known"), "well-known");
	assert.equal(run("1-10"), "1-10");
});

test("ellipsis: exactly three dots become ellipsis", () => {
	assert.equal(run("wait..."), "wait…");
	assert.equal(run("Hello...world"), "Hello…world");
});

test("ellipsis: four dots untouched (sentence-ending ellipsis is intentional)", () => {
	assert.equal(run("wait...."), "wait....");
});

test("ellipsis: two dots untouched", () => {
	assert.equal(run("a..b"), "a..b");
});

test("double quotes: opening at start of string, closing after comma", () => {
	assert.equal(run('"Hello," she said.'), "“Hello,” she said.");
});

test("double quotes: opening after whitespace, closing after word", () => {
	assert.equal(run('She said "hi" to me.'), "She said “hi” to me.");
});

test("double quotes: opening after opening paren", () => {
	assert.equal(run('See ("note")'), "See (“note”)");
});

test("apostrophe: contraction", () => {
	assert.equal(run("don't"), "don’t");
	assert.equal(run("they're"), "they’re");
});

test("apostrophe: possessive (including s-ending)", () => {
	assert.equal(run("Carlos's"), "Carlos’s");
	assert.equal(run("Adamastor's mission"), "Adamastor’s mission");
});

test("apostrophe: decade abbreviation at start of word", () => {
	assert.equal(run("the '90s"), "the ’90s");
	assert.equal(run("'08 was a year"), "’08 was a year");
});

test("mixed: em-dash + smart quotes + apostrophe in one sentence", () => {
	assert.equal(
		run('Carlos said "it\'s fine" -- but it wasn\'t.'),
		"Carlos said “it’s fine” — but it wasn’t.",
	);
});

test("inline code mark: text is left untouched", () => {
	const doc: JSONContent = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				content: [
					{ type: "text", text: 'use ' },
					{
						type: "text",
						text: '--no-verify',
						marks: [{ type: "code" }],
					},
					{ type: "text", text: ' carefully.' },
				],
			},
		],
	};
	const out = normalizeTypography(doc);
	const para = out.content?.[0];
	assert.equal(para?.content?.[0]?.text, "use ");
	assert.equal(para?.content?.[1]?.text, "--no-verify"); // unchanged
	assert.equal(para?.content?.[2]?.text, " carefully.");
});

test("code block: skipped entirely", () => {
	const doc: JSONContent = {
		type: "doc",
		content: [
			{
				type: "codeBlock",
				content: [{ type: "text", text: 'echo "hello" -- world...' }],
			},
		],
	};
	const out = normalizeTypography(doc);
	assert.equal(
		out.content?.[0]?.content?.[0]?.text,
		'echo "hello" -- world...',
	);
});

test("marks on text are preserved", () => {
	const doc: JSONContent = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				content: [
					{
						type: "text",
						text: '"hello"',
						marks: [{ type: "bold" }],
					},
				],
			},
		],
	};
	const out = normalizeTypography(doc);
	const node = out.content?.[0]?.content?.[0];
	assert.equal(node?.text, "“hello”");
	assert.deepEqual(node?.marks, [{ type: "bold" }]);
});

test("nested lists: walker recurses into listItem > paragraph > text", () => {
	const doc: JSONContent = {
		type: "doc",
		content: [
			{
				type: "bulletList",
				content: [
					{
						type: "listItem",
						content: [
							{
								type: "paragraph",
								content: [{ type: "text", text: "can't stop -- won't stop" }],
							},
						],
					},
				],
			},
		],
	};
	const out = normalizeTypography(doc);
	const text = out.content?.[0]?.content?.[0]?.content?.[0]?.content?.[0]?.text;
	assert.equal(text, "can’t stop — won’t stop");
});

test("empty doc: passes through", () => {
	assert.deepEqual(normalizeTypography({ type: "doc", content: [] }), {
		type: "doc",
		content: [],
	});
});
