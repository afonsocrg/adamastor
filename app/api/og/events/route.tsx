import { EVENT_CATEGORIES, isEventCategorySlug } from "@/lib/events/categories";
import { ImageResponse } from "next/og";

// Dynamic OG image for the /events route family (the all / city / category /
// city+category listing pages). One renderer, parameterised by query string,
// so every events URL gets a tailored social card instead of the single static
// /socialPreview2.jpg. Wired from lib/events/seo.ts → buildEventsRouteMetadata.
//
// Params:
//   title    — the route's human title, e.g. "Design Events in Lisboa"
//   category — optional category slug; drives a coloured accent + label
//   count    — optional integer; "12 upcoming events" sub-line when present
//
// Brand match: navy.veil canvas + navy ink, mirroring app/api/og/route.tsx
// (the post card) so posts and events read as one system in a shared feed.

const WIDTH = 1200;
const HEIGHT = 630;

const NAVY = "#104357"; // navy.shade — ink
const NAVY_TONE = "#4D7689"; // navy.tone — secondary
const VEIL = "#E1F2F9"; // navy.veil — canvas
const FRAME = "#C9DEE8"; // a touch deeper than navy.frame for a visible hairline

// Category dot colours as concrete hex. The grid/email use CSS custom props
// (--cat-*-dot), but Satori (next/og) can't resolve CSS vars or oklch(), so
// the design dot's oklch(0.75 0.11 31) is converted to its hex equivalent here.
const CATEGORY_HEX: Record<string, string> = {
	design: "#E2966E", // peach (oklch 0.75 0.11 31 → hex)
	"software-engineering": "#E0BE34", // yellow
	"startups-fundraising": "#4FB255", // green
	product: "#1FB7C1", // cyan
	ai: "#8470E8", // lavender
};

function categoryName(slug: string): string {
	return EVENT_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
	try {
		const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
			family,
		)}:wght@${weight}&text=${encodeURIComponent(text)}`;
		const css = await (await fetch(url)).text();
		const resource = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
		if (!resource) return null;
		const res = await fetch(resource[1]);
		if (res.status !== 200) return null;
		return await res.arrayBuffer();
	} catch {
		// Font CDN hiccup must not 500 the whole image — Satori falls back to a
		// default face and the card still renders.
		return null;
	}
}

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);

	const title = (searchParams.get("title") || "Startup Events in Portugal").slice(0, 120);
	const categoryParam = searchParams.get("category");
	const category = categoryParam && isEventCategorySlug(categoryParam) ? categoryParam : null;
	const countRaw = searchParams.get("count");
	const count = countRaw && /^\d+$/.test(countRaw) ? Number.parseInt(countRaw, 10) : null;

	const accent = category ? (CATEGORY_HEX[category] ?? NAVY_TONE) : NAVY_TONE;
	const kicker = "ADAMASTOR · EVENTS";
	const subline =
		count !== null && count > 0
			? `${count} upcoming ${count === 1 ? "event" : "events"}`
			: "Upcoming events across Portugal";

	// Subset only the glyphs we actually draw so the font fetch stays tiny.
	const titleGlyphs = `${title}${kicker}${subline}adamastor.blog/events${category ? categoryName(category) : ""}`;
	const [serif, sans] = await Promise.all([
		loadGoogleFont("Lora", 700, titleGlyphs),
		loadGoogleFont("Inter", 600, titleGlyphs),
	]);

	const fonts = [
		...(serif ? [{ name: "Lora", data: serif, weight: 700 as const, style: "normal" as const }] : []),
		...(sans ? [{ name: "Inter", data: sans, weight: 600 as const, style: "normal" as const }] : []),
	];

	return new ImageResponse(
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				background: VEIL,
				padding: "72px 80px",
				position: "relative",
				fontFamily: fonts.length ? "Inter" : undefined,
			}}
		>
			{/* Category accent rail down the left edge — colour-codes the card at a
			    glance; quiet navy-tone for city/all routes. */}
			<div
				style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: accent }}
			/>

			{/* Kicker */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 14,
					color: NAVY_TONE,
					fontSize: 28,
					fontWeight: 600,
					letterSpacing: 4,
				}}
			>
				{kicker}
			</div>

			{/* Title */}
			<div
				style={{
					display: "flex",
					marginTop: 28,
					color: NAVY,
					fontSize: title.length > 42 ? 76 : 92,
					fontFamily: fonts.find((f) => f.name === "Lora") ? "Lora" : undefined,
					fontWeight: 700,
					lineHeight: 1.05,
					letterSpacing: -1,
				}}
			>
				{title}
			</div>

			{/* Category chip + subline */}
			<div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 32 }}>
				{category ? (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 12,
							background: "#FFFFFF",
							border: `1px solid ${FRAME}`,
							borderRadius: 999,
							padding: "10px 20px",
						}}
					>
						<div style={{ width: 16, height: 16, borderRadius: 999, background: accent }} />
						<div style={{ color: NAVY, fontSize: 28, fontWeight: 600 }}>{categoryName(category)}</div>
					</div>
				) : null}
				<div style={{ color: NAVY_TONE, fontSize: 30 }}>{subline}</div>
			</div>

			{/* Footer URL */}
			<div
				style={{
					position: "absolute",
					left: 80,
					bottom: 64,
					color: NAVY_TONE,
					fontSize: 30,
					fontWeight: 600,
				}}
			>
				adamastor.blog/events
			</div>

			{/* Logo mark, bottom-right — same asset/placement as the post card. */}
			<img
				width="84"
				height="84"
				src={`${origin}/icon4.png`}
				alt="Adamastor"
				style={{ position: "absolute", right: 64, bottom: 56 }}
			/>
		</div>,
		{ width: WIDTH, height: HEIGHT, ...(fonts.length ? { fonts } : {}) },
	);
}
