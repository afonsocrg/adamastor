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
 *   [font-family:var(--font-lora-bold)]        — Lora Bold 700 (normal + italic, editorial display + headlines)
 *   [font-family:var(--font-lora-italic)]      — Lora italic (variable axis 400–700, used at 475 for blockquote)
 *   [font-family:var(--font-inter)]            — Inter (body / UI)
 *   [font-family:var(--font-inconsolata)]      — Inconsolata (mono body)
 *   [font-family:var(--font-inconsolata-bold)] — Inconsolata 700 (mono emphasis)
 *
 * Each weight × style combination loads as its own face so the @font-face
 * pooling never silently substitutes a different weight. Any element using
 * any of the Lora variables MUST declare `font-weight` and `font-style`
 * explicitly — see the "Lora weight pooling" section in docs/typography.md.
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

// Loaded as variable font (weight omitted) so we can fine-tune the italic
// weight per-element — e.g. blockquote uses 475, between the default 400 and
// 500. Lora's variable axis is 400–700.
export const loraItalic = Lora({
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
