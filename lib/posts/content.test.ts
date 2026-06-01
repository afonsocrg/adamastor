import assert from "node:assert/strict";
import { test } from "node:test";
import { stripEmptyLinkMarks } from "./content";

interface Mark {
	type: string;
	attrs?: { href?: string | null };
}
interface Node {
	type: string;
	text?: string;
	marks?: Mark[];
	content?: Node[];
}

const link = (href: string | null): Mark => ({ type: "link", attrs: { href } });

test("strips a link mark with a null href but keeps the text (the live bug)", () => {
	const doc: Node = {
		type: "doc",
		content: [
			{ type: "paragraph", content: [{ type: "text", text: "Country by country review", marks: [link(null)] }] },
		],
	};
	const textNode = stripEmptyLinkMarks(doc).content?.[0]?.content?.[0];
	assert.equal(textNode?.text, "Country by country review");
	assert.deepEqual(textNode?.marks, []);
});

test("strips empty-string and whitespace-only hrefs", () => {
	assert.deepEqual(stripEmptyLinkMarks({ type: "text", text: "x", marks: [link("")] }).marks, []);
	assert.deepEqual(stripEmptyLinkMarks({ type: "text", text: "x", marks: [link("   ")] }).marks, []);
});

test("keeps a link mark with a real href", () => {
	const out = stripEmptyLinkMarks({ type: "text", text: "x", marks: [link("https://example.com")] });
	assert.equal(out.marks?.length, 1);
	assert.equal(out.marks?.[0]?.attrs?.href, "https://example.com");
});

test("preserves non-link marks (bold) while dropping the dead link", () => {
	const out = stripEmptyLinkMarks({ type: "text", text: "x", marks: [{ type: "bold" }, link(null)] });
	assert.deepEqual(out.marks?.map((m) => m.type), ["bold"]);
});

test("does not mutate the input document", () => {
	const doc: Node = { type: "text", text: "x", marks: [link(null)] };
	const out = stripEmptyLinkMarks(doc);
	assert.equal(doc.marks?.length, 1); // original untouched
	assert.equal(out.marks?.length, 0);
});

test("tolerates a link mark with no attrs, and non-object input", () => {
	assert.deepEqual(stripEmptyLinkMarks({ type: "text", text: "x", marks: [{ type: "link" }] }).marks, []);
	assert.equal(stripEmptyLinkMarks(null), null);
	assert.equal(stripEmptyLinkMarks("str"), "str");
});
