export const EVENT_CATEGORIES = [
	{
		slug: "startups-fundraising",
		name: "Startups & Fundraising",
		description: "Startup building, founders, pitching, accelerators, investment, demo days, and fundraising.",
	},
	{
		slug: "product",
		name: "Product Management",
		description: "Product management, product strategy, discovery, product operations, and product-led growth.",
	},
	{
		slug: "design",
		name: "Design",
		description: "UX, UI, product design, design research, Figma, prototyping, and creative technology.",
	},
	{
		slug: "software-engineering",
		name: "Software Engineering",
		description: "Developer events, programming, web engineering, cloud, security, DevOps, QA, and tooling.",
	},
	{
		slug: "ai",
		name: "AI",
		description: "Artificial intelligence, machine learning, agents, LLMs, automation, and data science.",
	},
] as const;

export type EventCategorySlug = (typeof EVENT_CATEGORIES)[number]["slug"];

const EVENT_CATEGORY_SLUG_SET = new Set<string>(EVENT_CATEGORIES.map((category) => category.slug));

const ALL_FIELDS = ["title", "description", "url"] as const;
const TITLE_AND_URL_FIELDS = ["title", "url"] as const;

type CategoryField = (typeof ALL_FIELDS)[number];
type CategoryRule = {
	fields: readonly CategoryField[];
	pattern: RegExp;
};

const CATEGORY_RULES: Record<EventCategorySlug, CategoryRule[]> = {
	ai: [
		{ fields: TITLE_AND_URL_FIELDS, pattern: /\b(ai|agents?|automation(s)?)\b/i },
		{
			fields: ALL_FIELDS,
			pattern:
				/\b(artificial intelligence|machine learning|ml|llm(s)?|genai|generative ai|agentic|ai agents?|chatgpt|cursor|lovable|data science)\b/i,
		},
	],
	"software-engineering": [
		{
			fields: TITLE_AND_URL_FIELDS,
			pattern:
				/\b(software|developer(s)?|devs?|programming|coding|code|javascript|typescript|react|frontend|backend|fullstack|devops|cloud|cybersecurity|security|api|open source|github|qa|testing)\b/i,
		},
		{
			fields: ALL_FIELDS,
			pattern:
				/\b(software engineering|developer tools|cloud native|cybersecurity|javascript|typescript|react|frontend|backend|fullstack|devops|open source|github|qa|testing|ai systems|ai agents?|autonomous agents?|building ai products|ai products|data engineering)\b/i,
		},
	],
	design: [
		{ fields: TITLE_AND_URL_FIELDS, pattern: /\b(design|designer(s)?|lisboaux|opo\.?design)\b/i },
		{
			fields: ALL_FIELDS,
			pattern: /\b(ux|ui|figma|user research|design research|prototype|prototyping|branding|product design)\b/i,
		},
	],
	product: [
		{ fields: TITLE_AND_URL_FIELDS, pattern: /\b(productized|producttank)\b/i },
		{
			fields: ALL_FIELDS,
			pattern:
				/\b(product management|product manager(s)?|product strategy|product ops|product operations|product-led|plg)\b/i,
		},
	],
	"startups-fundraising": [
		{
			fields: TITLE_AND_URL_FIELDS,
			pattern:
				/\b(startup(s)?|founder(s)?|founder institute|startup grind|entrepreneur(s|ship)?|fundraising|funding|investor(s)?|investment|venture capital|vc|angel(s)?|pitch|demo\s?day|accelerator|techstars|search funds?|valuation)\b/i,
		},
		{
			fields: ALL_FIELDS,
			pattern:
				/\b(founder institute|startup grind|fundraising|funding|investor(s)?|venture capital|angel(s)?|demo\s?day|accelerator|techstars|search funds?|startup valuation)\b/i,
		},
	],
};

export function isEventCategorySlug(value: string): value is EventCategorySlug {
	return EVENT_CATEGORY_SLUG_SET.has(value);
}

export function sanitizeEventCategorySlugs(values: unknown): EventCategorySlug[] {
	if (!Array.isArray(values)) return [];

	return [
		...new Set(
			values.filter((value): value is EventCategorySlug => typeof value === "string" && isEventCategorySlug(value)),
		),
	];
}

export function inferEventCategorySlugs(input: {
	title?: string | null;
	description?: string | null;
	url?: string | null;
}): EventCategorySlug[] {
	const textByField: Record<CategoryField, string> = {
		title: input.title ?? "",
		description: input.description ?? "",
		url: input.url ?? "",
	};

	return EVENT_CATEGORIES.filter((category) =>
		CATEGORY_RULES[category.slug].some((rule) =>
			rule.pattern.test(rule.fields.map((field) => textByField[field]).join(" ")),
		),
	).map((category) => category.slug);
}

/**
 * Category colour mapping for the 5 event categories. Each category owns one
 * tint drawn from the footer seal rainbow, re-assigned by MEANING — not by the
 * functional brand families (gold/green/orange already mean CTA / success /
 * accent, so reusing them muddied the design language). The concrete colours
 * live as `--cat-*` CSS custom properties in styles/globals.css (light + dark
 * in one place); these class strings reference them, and the calendar grid does
 * the same via `.cat-*` rules.
 *
 *   design               → peach blush  (LisboaUX peach)
 *   software-engineering → yellow        (JavaScript / LisboaJS yellow)
 *   startups-fundraising → green         (money / funding / growth)
 *   product              → cyan          (digital / tool)
 *   ai                   → lavender      (intelligence / future)
 *
 * Rose from the seal is intentionally reserved for a future 6th category.
 * Email carries its own hex copy (components/email/newsletter-template.tsx).
 * See docs/design-system.md → "Event categories".
 */
export const EVENT_CATEGORY_COLORS: Record<EventCategorySlug, { chip: string; dot: string; label: string }> = {
	design: {
		chip: "bg-[var(--cat-design-fill)] text-[var(--cat-design-ink)]",
		dot: "bg-[var(--cat-design-dot)]",
		label: "Design",
	},
	"software-engineering": {
		chip: "bg-[var(--cat-engineering-fill)] text-[var(--cat-engineering-ink)]",
		dot: "bg-[var(--cat-engineering-dot)]",
		label: "Engineering",
	},
	"startups-fundraising": {
		chip: "bg-[var(--cat-startups-fill)] text-[var(--cat-startups-ink)]",
		dot: "bg-[var(--cat-startups-dot)]",
		label: "Startups",
	},
	product: {
		chip: "bg-[var(--cat-product-fill)] text-[var(--cat-product-ink)]",
		dot: "bg-[var(--cat-product-dot)]",
		label: "Product",
	},
	ai: {
		chip: "bg-[var(--cat-ai-fill)] text-[var(--cat-ai-ink)]",
		dot: "bg-[var(--cat-ai-dot)]",
		label: "AI",
	},
};
