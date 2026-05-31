/**
 * Shared design tokens for all Adamastor email templates.
 *
 * The Adamastor Weekly (newsletter-template.tsx) is the canonical reference;
 * every template imports these so the design system stays consistent across the
 * whole email surface. Mirrors the article-page system (docs/typography.md,
 * docs/design-system.md, docs/emails.md → "Visual design system").
 *
 * Email-specific translations live here too — webfont stack with fallbacks,
 * the gold-pill CTA, hairline rule. Underscore-prefixed so the React Email dev
 * server doesn't treat it as a template.
 */

/**
 * Navy family + gold CTA, mirrored from tailwind.config.ts. Cyan is absent —
 * it's phased out in favour of the navy family (navy.tint accents, navy.frame/
 * veil surfaces). See the memory note `project_adamastor_color_phaseout`.
 */
export const C = {
	navy: "#104357", // body, headlines, byline name, event titles
	bright: "#1C6EB4", // links at rest + Weekly pillar kicker
	brightDeep: "#0F5091", // link hover
	tone: "#4D7689", // secondary text: kickers, dateline, descriptions
	tint: "#A7E1FC", // accent: list bullets, blockquote rule, event accent
	frame: "#E8F0F4", // hairlines / borders
	veil: "#E1F2F9", // soft contained surfaces
	canvas: "#EDF3F6", // barely-there navy-tinted email canvas
	gold: "#D4A657", // gold.hue — THE primary CTA fill (design-system.md)
	goldDeep: "#B8893A", // gold.shade — CTA hover / pressed
	goldTint: "#F0D49F", // gold.tint — soft gold, for celebratory glows/fills
	orange: "#E05E00", // orange.hue — inline accent only (arrow tips), never a fill
	white: "#FFFFFF",
};

// Lora is the editorial display serif; Georgia is the universal email fallback.
// Quotes are intentionally omitted: these stacks get interpolated into <style>
// blocks, where React escapes apostrophes (' → &#x27;) and corrupts the CSS.
// Multi-word names ("Times New Roman", "Segoe UI") are valid unquoted CSS.
export const SERIF = "Lora, Georgia, Times New Roman, serif";
// Inter is the body voice; the system sans stack carries it where Inter can't load.
export const SANS = "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

// Variable-axis ranges so true 450 / 475 / 575 weights render where Inter/Lora
// load; clients without webfonts snap to the nearest fallback weight.
export const FONTS_HREF =
	"https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400..700;1,400..600&family=Lora:ital,wght@0,600..700;1,400..500&display=swap";

/**
 * Mobile padding fix for the card-style templates.
 *
 * Every transactional/notification template renders its card as a
 * `<Container>` (a `<table>`) with a fixed inline `padding: 40px`. On desktop
 * the card is 600px wide so the text column is a comfortable ~520px; on a
 * ~375px phone the card shrinks but the 40px padding doesn't, crushing the
 * text column to ~295px (~34 chars/line). This drops the card padding to 24px
 * below 600px, widening mobile lines to ~327px without touching desktop.
 *
 * Targets the card by its inline-style signature (max-width:600px AND
 * padding:40px) so no per-template `className` is needed — the inner content
 * tables (width:100%) and the `<Body>` (not a table) don't match. The
 * newsletter's container has no `padding:40px` (its padding lives on inner
 * sections), so it's intentionally untouched by this rule.
 *
 * Inject via `<style dangerouslySetInnerHTML>` — the attribute selector needs
 * double quotes, which React escapes (→ invalid CSS) inside a `<style>` text
 * child. Outlook desktop ignores @media and keeps the 40px; clean degrade.
 */
export const RESPONSIVE_CSS =
	'@media (max-width:600px){table[style*="max-width:600px"][style*="padding:40px"]{padding:24px!important}}';

/**
 * Dark-mode palette — a hand-designed dark counterpart to `C`, NOT a mechanical
 * inversion. Derived in OKLCH holding the navy hue (~220–230) constant and
 * flipping lightness, so the dark theme reads as the same brand (per Malik's
 * color principles: OKLCH for shared character, tints-over-shades intuition).
 *
 * Surfaces step UP from the page: canvas (darkest) → card → veil (asides) →
 * frame (hairline). Text flips to light navy-tints; links lift so they stay
 * legible on dark (the light `bright` #1C6EB4 is too dark on a dark card). Gold
 * is unchanged — it pops on dark and keeps its white label (the hard brand
 * rule). Contrast ratios (WCAG, against the intended surface) in docs/emails.md.
 *
 * Note `card` is a NEW token: in light mode the card background is `C.white`,
 * which ALSO serves as the on-gold CTA text. Those two roles split in dark —
 * the card goes dark, the CTA label stays white — so dark mode overrides the
 * card *surface* by class (`.em-card`) and never remaps white, keeping the gold
 * button's white text intact.
 */
export const C_DARK = {
	navy: "#CFE4EF", // primary text / headlines on the dark card  (11.2:1 on card)
	bright: "#6DB7EA", // links at rest, lifted for dark           (6.7:1 on card)
	brightDeep: "#8FCBF2", // link hover — lifts further on dark
	tone: "#8FB3C2", // secondary text: kickers, dateline          (6.6:1 on card)
	tint: "#A7E1FC", // accent (bullets / left rule) — pops on dark, unchanged
	frame: "#2C4F5E", // hairlines / borders on dark               (1.67:1 — subtle)
	veil: "#15323F", // soft aside surface, a step above the card
	card: "#102B38", // THE card surface (replaces white in dark)
	canvas: "#0A1C24", // page background, darkest layer
	gold: "#D4A657", // unchanged — THE CTA fill, white label always
	goldDeep: "#E0B56A", // CTA hover — lifts on dark (vs. darkening in light)
	goldTint: "#6E5532", // dim warm halo for the milestone glow on dark
	orange: "#F4742A", // inline accent, lifted so it reads on dark
};

/**
 * Dark-mode override block, injected per template via
 * `<style dangerouslySetInnerHTML>` (same reason as RESPONSIVE_CSS — attribute
 * selectors / quotes don't survive a `<style>` text child). `!important` is
 * required to beat the inline `style` colors React Email emits.
 *
 * TWO layers, on purpose:
 *  1. `.em-*` class rules — explicit, readable surface roles on the big blocks
 *     (page / card / aside / hairline) the templates tag directly.
 *  2. `[style*="color:#…"]` attribute rules — keyed on the BRAND HEX itself, so
 *     they catch every inline-styled element automatically, including nested
 *     `<span>`s and buttons that can't easily carry a class (the category name
 *     span, the ghost "Manage preferences" button, the subscribe-alert labels).
 *     This is what makes a template's dark mode self-maintaining: a new element
 *     using a `C.*` token is remapped without anyone remembering to tag it. It's
 *     also why the newsletter gets dark mode just by injecting this block.
 *
 * Safe because the brand hexes don't collide across roles: navy (#104357) is
 * only ever text/border, never a fill; white (#FFFFFF) is the card fill and is
 * remapped ONLY as a background — `color:#FFFFFF` (the gold-CTA label) is never
 * matched, so the gold button keeps its white text (the hard brand rule).
 *
 * Reaches clients that honor the media query (Apple Mail macOS/iOS, Outlook
 * Mac/iOS — the majority of opens). Gmail / Outlook-Windows ignore it and run
 * their own inversion; the `color-scheme` <meta> tags make that inversion
 * behave. Outlook-Windows ignores both → keeps light.
 */
export const DARK_MODE_CSS = `@media (prefers-color-scheme: dark) {
  .em-page { background-color: ${C_DARK.canvas} !important; }
  .em-card { background-color: ${C_DARK.card} !important; }
  .em-aside { background-color: ${C_DARK.veil} !important; }
  .em-rule { border-color: ${C_DARK.frame} !important; }
  [style*="background-color:${C.canvas}"] { background-color: ${C_DARK.canvas} !important; }
  [style*="background-color:${C.white}"] { background-color: ${C_DARK.card} !important; }
  [style*="background-color:${C.veil}"] { background-color: ${C_DARK.veil} !important; }
  [style*="border-color:${C.frame}"] { border-color: ${C_DARK.frame} !important; }
  [style*="solid ${C.navy}"] { border-color: ${C_DARK.tone} !important; }
  [style*="color:${C.navy}"] { color: ${C_DARK.navy} !important; }
  [style*="color:${C.tone}"] { color: ${C_DARK.tone} !important; }
  [style*="color:${C.bright}"] { color: ${C_DARK.bright} !important; }
  [style*="color:${C.brightDeep}"] { color: ${C_DARK.brightDeep} !important; }
  a.body-link { color: ${C_DARK.bright} !important; }
  .cta-primary:hover { background-color: ${C_DARK.goldDeep} !important; }
  /* Outlined secondary CTA — the generic white→card remap would make its fill
     identical to the card (it blends, losing its button-ness). Lift the fill to
     veil and give it a visible tone border so it still reads as a button.
     After the attribute rules so it wins on equal specificity. */
  .cta-outline { background-color: ${C_DARK.veil} !important; border-color: ${C_DARK.tone} !important; color: ${C_DARK.navy} !important; }
  .cta-outline:hover { background-color: ${C_DARK.frame} !important; }
}`;

/** Small-caps tracked label — the publication kicker (Inter 600, 0.14em). */
export const kickerStyle = (color: string) => ({
	fontFamily: SANS,
	fontSize: "12px",
	fontWeight: 600,
	letterSpacing: "0.14em",
	textTransform: "uppercase" as const,
	color,
	margin: "0",
});

/** Navy-frame hairline rule (top border only). */
export const hairline = {
	borderColor: C.frame,
	borderStyle: "solid" as const,
	borderTopWidth: "1px",
	borderBottomWidth: "0",
	borderLeftWidth: "0",
	borderRightWidth: "0",
	margin: "32px 0",
};

/**
 * Primary CTA — the brand's gold pill (design-system.md: "Gold is THE action
 * color … one gold pill per page, max"). Text is ALWAYS white on gold — never
 * navy on gold (a hard brand rule). Pair with className="cta-primary" + a
 * `.cta-primary:hover { background-color: ${C.goldDeep} }` rule for hover.
 */
export const primaryCtaStyle = {
	fontFamily: SANS,
	fontSize: "15px",
	fontWeight: 600,
	color: C.white,
	backgroundColor: C.gold,
	padding: "14px 32px",
	borderRadius: "9999px",
	textDecoration: "none",
	display: "inline-block",
};

/**
 * Secondary CTA — outlined navy pill. For utility actions that shouldn't pull
 * focus from the gold primary (manage preferences, send note). The brand doc's
 * "outlined-navy secondary" convention. Padding is 1px short of the primary so
 * the 1px border keeps the outer box the same size.
 */
export const secondaryCtaStyle = {
	fontFamily: SANS,
	fontSize: "15px",
	fontWeight: 600,
	color: C.navy,
	backgroundColor: C.white,
	border: `1px solid ${C.navy}`,
	padding: "13px 31px",
	borderRadius: "9999px",
	textDecoration: "none",
	display: "inline-block",
};

/**
 * Ghost CTA — transparent pill, navy text, no border. The quietest button tier,
 * below the outlined secondary. For low-priority utility actions that shouldn't
 * read as a real button at rest (e.g. manage-preferences in a fresh welcome).
 * Pair with className="cta-ghost" for a soft navy-veil hover.
 */
export const ghostCtaStyle = {
	fontFamily: SANS,
	fontSize: "15px",
	fontWeight: 600,
	color: C.navy,
	backgroundColor: "transparent",
	padding: "14px 28px",
	borderRadius: "9999px",
	textDecoration: "none",
	display: "inline-block",
};
