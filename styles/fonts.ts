import { Inconsolata, Inter, Lora } from "next/font/google";

/**
 * Font loading. For the canonical type system (which fonts get used where,
 * why Lora is rare, the weight-pooling trap), see `docs/typography.md`.
 *
 * Each font has its own CSS variable. The previous setup shared
 * `--font-title` and `--font-default` across multiple fonts, which made
 * the cascade resolve to whichever font's class came last in the bundled
 * stylesheet rather than the intended one.
 *
 * Use the explicit variable names in code:
 *   [font-family:var(--font-lora-bold)]        — Lora Bold 700 (editorial display + headlines)
 *   [font-family:var(--font-lora-italic)]      — Lora Regular 400 italic (blockquote pull-out)
 *   [font-family:var(--font-inter)]            — Inter (body / UI)
 *   [font-family:var(--font-inconsolata)]      — Inconsolata (mono body)
 *   [font-family:var(--font-inconsolata-bold)] — Inconsolata 700 (mono emphasis)
 *
 * Headlines use Lora at weight 700 (its max); pair Tailwind's `font-bold`
 * with the font-family so the weight resolves.
 *
 * Blockquote pull-outs use Lora Regular 400 italic via a separate variable.
 * The two faces are loaded independently so each weight only ships the file
 * it needs — and so a `font-weight: 400` rule against `--font-lora-italic`
 * isn't silently substituted with the 700 weight (the previous shape, when
 * the 400 italic was missing and the browser picked the closest available).
 *
 * CalSans and Crimson Text were both removed when Lora Bold became the
 * canonical display serif (see docs/design-system.md).
 */

export const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

export const loraBold = Lora({
	weight: ["700"],
	style: ["normal", "italic"],
	variable: "--font-lora-bold",
	subsets: ["latin"],
});

export const loraItalic = Lora({
	weight: ["400"],
	style: ["italic"],
	variable: "--font-lora-italic",
	subsets: ["latin"],
});

export const inconsolata = Inconsolata({
	variable: "--font-inconsolata",
	subsets: ["latin"],
});

export const inconsolataBold = Inconsolata({
	weight: "700",
	variable: "--font-inconsolata-bold",
	subsets: ["latin"],
});
