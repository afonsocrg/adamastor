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
 * Brand-family color mapping for the 5 event categories. Each category gets
 * one tint from the design-system palette. Used by the dashboard calendar
 * agenda + grid views to tag events visually; reusable anywhere we render an
 * event chip.
 *
 * Assignments are intuitive 1:1 with the brand families:
 *   software-engineering → navy   (architectural / dev register)
 *   ai                   → cyan   (tech-modern, the brand-cyan moment)
 *   design               → orange (editorial creative warmth)
 *   product              → gold   (strategy / considered)
 *   startups-fundraising → green  (growth / momentum)
 *
 * Note: `navy-tint` is also the design-system "today / selected" highlight
 * color in light mode. In the calendar that overlap is fine because the two
 * roles live on different layers (cell background vs event chip on top).
 */
export const EVENT_CATEGORY_COLORS: Record<EventCategorySlug, { chip: string; dot: string; label: string }> = {
	"startups-fundraising": {
		chip: "bg-green-tint text-green-shade dark:bg-green-hue/20 dark:text-green-tint",
		dot: "bg-green-shade dark:bg-green-tint",
		label: "Startups",
	},
	product: {
		chip: "bg-gold-tint text-gold-shade dark:bg-gold-hue/20 dark:text-gold-tint",
		dot: "bg-gold-shade dark:bg-gold-tint",
		label: "Product",
	},
	design: {
		chip: "bg-orange-tint text-orange-shade dark:bg-orange-hue/20 dark:text-orange-tint",
		dot: "bg-orange-shade dark:bg-orange-tint",
		label: "Design",
	},
	"software-engineering": {
		chip: "bg-navy-tint text-navy dark:bg-cyan-glow/[0.18] dark:text-cyan-lifted",
		dot: "bg-navy dark:bg-cyan-glow",
		label: "Engineering",
	},
	ai: {
		chip: "bg-cyan-tint text-cyan-shade dark:bg-cyan-glow/[0.18] dark:text-cyan-lifted",
		dot: "bg-cyan-shade dark:bg-cyan-glow",
		label: "AI",
	},
};
