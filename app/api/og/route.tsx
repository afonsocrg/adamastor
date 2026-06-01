import { ImageResponse } from "next/og";

// Dynamic OG image for posts. Shares the visual system with the events card
// (app/api/og/events/route.tsx) so posts and events read as one family in a
// shared feed: navy.veil canvas, navy ink, "ADAMASTOR" kicker, Lora serif
// title, footer URL, logo bottom-right. The only intentional difference is the
// left accent rail — gold here (Adamastor's editorial brand accent) vs. the
// per-category colours on events.
//
// Consumed by app/(main)/posts/[id]/page.tsx via og:image + twitter:image
// (card=summary_large_image), so it drives both the link unfurl and the X card.

const WIDTH = 1200;
const HEIGHT = 630;

const NAVY = "#104357"; // navy.shade — ink
const NAVY_TONE = "#4D7689"; // navy.tone — secondary
const VEIL = "#E1F2F9"; // navy.veil — canvas
const GOLD = "#D4A657"; // gold.hue — editorial accent rail

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
		// Font CDN hiccup must not 500 the image (which would blank the unfurl /
		// X card). Satori falls back to a default face and the card still renders.
		return null;
	}
}

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);

	// Drop the "| Week N" editorial suffix for a friendlier preview, null-safe.
	const raw = searchParams.get("title") ?? "";
	const title = (raw.split("|")[0].trim() || "Adamastor").slice(0, 120);
	const kicker = "ADAMASTOR";

	const glyphs = `${title}${kicker}adamastor.blog`;
	const [serif, sans] = await Promise.all([loadGoogleFont("Lora", 700, glyphs), loadGoogleFont("Inter", 600, glyphs)]);
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
			{/* Gold editorial accent rail down the left edge. */}
			<div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: GOLD }} />

			{/* Kicker */}
			<div style={{ display: "flex", color: NAVY_TONE, fontSize: 28, fontWeight: 600, letterSpacing: 4 }}>{kicker}</div>

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

			{/* Footer URL */}
			<div style={{ position: "absolute", left: 80, bottom: 64, color: NAVY_TONE, fontSize: 30, fontWeight: 600 }}>
				adamastor.blog
			</div>

			{/* Logo mark, bottom-right — same asset/placement as the events card. */}
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
