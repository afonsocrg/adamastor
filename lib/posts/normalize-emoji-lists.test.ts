import assert from "node:assert/strict";
import { test } from "node:test";
import type { JSONContent } from "novel";
import { normalizeEmojiLists } from "./normalize-emoji-lists";

// Build a doc from a list of top-level paragraph texts.
const doc = (...texts: string[]): JSONContent => ({
	type: "doc",
	content: texts.map((text) => ({
		type: "paragraph",
		content: [{ type: "text", text }],
	})),
});

// Pull the first text node of the Nth list item out of a transformed doc.
const itemText = (out: JSONContent, ulIndex: number, liIndex: number): string =>
	(out.content?.[ulIndex]?.content?.[liIndex]?.content?.[0]?.content?.[0]
		?.text as string) ?? "";

test("groups consecutive emoji paragraphs into one emoji-list <ul>", () => {
	const out = normalizeEmojiLists(doc("🔷 First", "🔷 Second"));
	assert.equal(out.content?.length, 1);
	assert.equal(out.content?.[0]?.type, "bulletList");
	assert.equal(out.content?.[0]?.attrs?.class, "emoji-list");
	assert.equal(out.content?.[0]?.content?.length, 2);
});

test("non-emoji paragraphs pass through and break the run", () => {
	const out = normalizeEmojiLists(doc("🔷 A", "plain", "🔷 B"));
	assert.equal(out.content?.length, 3);
	assert.equal(out.content?.[0]?.type, "bulletList");
	assert.equal(out.content?.[1]?.type, "paragraph");
	assert.equal(out.content?.[2]?.type, "bulletList");
});

test("collapses double space after emoji to a single space (🎥)", () => {
	const out = normalizeEmojiLists(doc("🎥  Improving padel skills"));
	assert.equal(itemText(out, 0, 0), "🎥 Improving padel skills");
});

test("collapses triple space after emoji to a single space (👏)", () => {
	const out = normalizeEmojiLists(doc("👏   Congrats to the team"));
	assert.equal(itemText(out, 0, 0), "👏 Congrats to the team");
});

test("single space after emoji is left unchanged", () => {
	const out = normalizeEmojiLists(doc("💡 Already tidy"));
	assert.equal(itemText(out, 0, 0), "💡 Already tidy");
});

test("collapse only touches the emoji prefix, not later double spaces", () => {
	const out = normalizeEmojiLists(doc("🔷  Title with  inner  spaces"));
	assert.equal(itemText(out, 0, 0), "🔷 Title with  inner  spaces");
});

test("collapse preserves marks on the prefix text node", () => {
	const input: JSONContent = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				content: [{ type: "text", text: "🎥  Bold lead", marks: [{ type: "bold" }] }],
			},
		],
	};
	const out = normalizeEmojiLists(input);
	const node = out.content?.[0]?.content?.[0]?.content?.[0]?.content?.[0];
	assert.equal(node?.text, "🎥 Bold lead");
	assert.deepEqual(node?.marks, [{ type: "bold" }]);
});

test("collapse handles emoji-only prefix node (text follows in a sibling node)", () => {
	const input: JSONContent = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				content: [
					{ type: "text", text: "🎥  " },
					{ type: "text", text: "Linked title", marks: [{ type: "bold" }] },
				],
			},
		],
	};
	const out = normalizeEmojiLists(input);
	const li = out.content?.[0]?.content?.[0]?.content?.[0];
	assert.equal(li?.content?.[0]?.text, "🎥 ");
	assert.equal(li?.content?.[1]?.text, "Linked title");
});

test("empty doc passes through", () => {
	assert.deepEqual(normalizeEmojiLists({ type: "doc", content: [] }), {
		type: "doc",
		content: [],
	});
});
