/**
 * Adamastor Weekly — newsletter broadcast template
 *
 * Visual system mirrors the article page (see `docs/typography.md` +
 * `docs/design-system.md`): navy palette (cyan is phased out), Lora display
 * headline over Inter body, the two-pillar kicker (Weekly = navy-bright),
 * navy-frame hairlines for section breaks, and navy-tint accents.
 *
 * Email-specific translations of the web design system:
 * - Fonts: we attempt to load Inter + Lora via a Google Fonts <link> (works in
 *   Apple Mail, iOS Mail, and other webfont-friendly clients) but ALWAYS fall
 *   back — Lora → Georgia (the universal editorial serif), Inter → the system
 *   sans stack. The brand survives even where webfonts are stripped (Gmail,
 *   Outlook desktop).
 * - The wordmark is rendered as serif text, not the SVG logotype: SVG <img> is
 *   blocked by Gmail/Outlook, and there's no hosted PNG. A hosted PNG logotype
 *   could replace it later (see docs/emails.md).
 * - No bespoke dark scheme: email dark mode is client-controlled and unreliable,
 *   so we ship the canonical light design and let clients invert.
 *
 * Structure:
 * 1. Masthead wordmark
 * 2. Featured article — kicker row + Lora H1 + byline + prose body + CTA
 * 3. Upcoming events — grouped by day, navy-tint accent
 * 4. Footer — tagline, links, unsubscribe
 *
 * The article content arrives as pre-converted HTML from tiptap-to-html.ts and
 * is styled by the .adamastor-prose rules in the <style> block below.
 */

import { withUtm } from "@/lib/events/utm";
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import {
	C,
	C_DARK,
	DARK_MODE_CSS,
	FONTS_HREF,
	hairline,
	kickerStyle,
	primaryCtaStyle,
	RESPONSIVE_CSS,
	SANS,
	SERIF,
} from "./_theme";

// Dark-mode overrides for the article body. The shared DARK_MODE_CSS remaps
// inline-styled elements by hex, but the prose colors live in the .adamastor-prose
// STYLESHEET rules below (not inline), so attribute selectors can't reach them —
// they need explicit dark counterparts here. Mirrors the navy dark palette.
const DARK_PROSE_CSS = `@media (prefers-color-scheme: dark) {
  .adamastor-prose p, .adamastor-prose h2, .adamastor-prose h3, .adamastor-prose li, .adamastor-prose strong { color: ${C_DARK.navy} !important; }
  .adamastor-prose a { color: ${C_DARK.bright} !important; }
  .adamastor-prose h2 { border-top-color: ${C_DARK.frame} !important; }
  .adamastor-prose blockquote { color: ${C_DARK.tone} !important; border-left-color: ${C_DARK.tint} !important; }
}`;
// TEMP preview-only import — real content from post 175. Remove with the fixture.
import { post175 } from "./_fixtures/post-175";

// ============================================
// Design tokens
// ============================================
// Shared tokens (C palette, SERIF/SANS, FONTS_HREF, kickerStyle, hairline,
// primaryCtaStyle) live in ./_theme and are imported above. Only newsletter-
// specific tokens are defined here.

/**
 * Email category chips — hex equivalents of EVENT_CATEGORY_COLORS (light mode)
 * in lib/events/categories.ts (email needs inline hex, not Tailwind classes /
 * CSS vars). The seal-rainbow palette re-assigned by meaning: Design peach
 * (LisboaUX) · Engineering yellow (JS) · Startups green · Product cyan · AI
 * lavender. Light only — the email's dark remap leaves these as light tints,
 * which stay legible (dark text) on the dark card.
 */
const EMAIL_CATEGORY_CHIP: Record<string, { bg: string; text: string; label: string }> = {
	design: { bg: "#ffe1d9", text: "#9a4639", label: "Design" },
	"software-engineering": { bg: "#fcf3d2", text: "#7a5a12", label: "Engineering" },
	"startups-fundraising": { bg: "#def3df", text: "#236929", label: "Startups" },
	product: { bg: "#d6f4f6", text: "#0a6e76", label: "Product" },
	ai: { bg: "#e8e2ff", text: "#4a3c9e", label: "AI" },
};

// ============================================
// Types
// ============================================

interface Event {
	id: string;
	title: string;
	description: string;
	start_time: string;
	city: string;
	url: string;
	banner_url?: string;
	categorySlugs?: string[];
}

/**
 * Article data structure for the newsletter.
 * `htmlContent` is pre-converted from TipTap JSON. `date` is optional so older
 * callers keep compiling; pass it to render the byline dateline.
 */
interface Article {
	id: string;
	title: string;
	htmlContent: string;
	authorName: string;
	url: string;
	date?: string;
	authorImageUrl?: string;
}

/**
 * When set, the template renders in per-category mode: a focused heading,
 * an events-only body (the article section is suppressed), and a CTA that
 * deep-links to the category's listing page rather than the all-events page.
 */
interface CategoryContext {
	slug: string;
	name: string;
}

interface NewsletterTemplateProps {
	events: Event[];
	article?: Article;
	category?: CategoryContext;
	/**
	 * Page where subscribers can manage which newsletters they receive.
	 * Bare URL (no per-recipient token) because Resend broadcasts can't
	 * personalize per recipient — the page accepts an email and re-sends
	 * a tokenized link.
	 */
	preferencesUrl?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Splits a stored title of the form "Real title | Week 42" into its display
 * title and the week marker. Carlos titles Weekly posts this way; the design
 * system renders the week marker separately, in the kicker-row right gutter.
 */
function splitTitle(raw: string): { title: string; week?: string } {
	const m = raw.match(/^(.*?)\s*[|·–—-]\s*(week\s*\d+)\s*$/i);
	if (m) {
		const week = m[2].replace(/week/i, "Week").replace(/\s+/, " ");
		return { title: m[1].trim(), week };
	}
	return { title: raw.trim() };
}

/**
 * Length-responsive display size for the Lora H1, mirroring PostHero's tiering
 * (scaled down for the ~520px email column). Computed server-side from length.
 */
function headlineSize(title: string): number {
	if (title.length <= 45) return 36;
	if (title.length <= 70) return 30;
	return 26;
}

/**
 * Formats a date for the day group header. Example: "Thursday, January 8"
 */
function formatDayHeader(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		timeZone: "Europe/Lisbon",
	});
}

/**
 * Europe/Lisbon HH:MM (24-hour, locale-agnostic), matching the events-page
 * card. The events-page leads its metadata with time — most scannable for
 * "what's happening tonight".
 */
function formatTime(dateString: string): string {
	return new Date(dateString).toLocaleTimeString("en-GB", {
		timeZone: "Europe/Lisbon",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

/** Europe/Lisbon weekday abbreviation, uppercased — e.g. "TUE". */
function formatWeekday(dateString: string): string {
	return new Date(dateString)
		.toLocaleDateString("en-US", { weekday: "short", timeZone: "Europe/Lisbon" })
		.toUpperCase();
}

/** Europe/Lisbon day-of-month number — e.g. "2". */
function formatDayNum(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		day: "numeric",
		timeZone: "Europe/Lisbon",
	});
}

/**
 * Capitalizes city name properly
 */
function formatCity(city: string): string {
	return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
}

/**
 * Groups events by their date (ignoring time)
 * Returns an array of [dateKey, events[]] pairs, sorted chronologically
 *
 * We use en-CA locale because it produces YYYY-MM-DD format,
 * which sorts correctly as strings.
 */
function groupEventsByDay(events: Event[]): [string, Event[]][] {
	const grouped = new Map<string, Event[]>();

	for (const event of events) {
		const date = new Date(event.start_time);
		const dateKey = date.toLocaleDateString("en-CA", {
			timeZone: "Europe/Lisbon",
		});

		if (!grouped.has(dateKey)) {
			grouped.set(dateKey, []);
		}
		grouped.get(dateKey)?.push(event);
	}

	return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
}

// ============================================
// Sub-components
// ============================================

/**
 * Individual event card with a navy-tint left accent.
 *
 * Uses a table layout for the left accent because CSS border-left
 * is unreliable across email clients (especially Outlook).
 */
function EventItem({ event }: { event: Event }) {
	return (
		<Section className="mb-[16px]">
			<table cellPadding="0" cellSpacing="0" border={0} style={{ width: "100%" }}>
				<tbody>
					<tr>
						{/* Navy-tint left accent (matches list bullets / blockquote rule) */}
						<td
							style={{
								width: "4px",
								backgroundColor: C.tint,
								borderRadius: "2px",
							}}
						/>
						{/* Content */}
						<td style={{ paddingLeft: "16px" }}>
							<Link
								href={withUtm(event.url, { medium: "email", campaign: "newsletter" })}
								style={{
									fontFamily: SANS,
									fontSize: "16px",
									fontWeight: 575,
									color: C.navy,
									textDecoration: "none",
									lineHeight: "1.35",
								}}
							>
								{event.title}
							</Link>

							{event.description && (
								<Text
									style={{
										fontFamily: SANS,
										fontSize: "14px",
										color: C.tone,
										margin: "4px 0 0 0",
										lineHeight: "20px",
									}}
								>
									{event.description.length > 120 ? `${event.description.substring(0, 120)}…` : event.description}
								</Text>
							)}

							<Text
								style={{
									...kickerStyle(C.tone),
									fontSize: "11px",
									letterSpacing: "0.1em",
									margin: "8px 0 0 0",
								}}
							>
								{formatCity(event.city)}
							</Text>
						</td>
					</tr>
				</tbody>
			</table>
		</Section>
	);
}

/**
 * VARIANT (comparison) — an event styled after the new events-page card
 * (components/EventCard.tsx): no left accent bar, time-leads metadata, a bold
 * Inter title with a navy-tint hover underline, and scan-gray secondary text
 * (the events-listing register, not the email's navy-tone). Clean at rest,
 * navy-frame outline on hover. Applied to the first event only, for side-by-side
 * comparison against the current EventItem treatment.
 */
function EventItemNew({ event }: { event: Event }) {
	const scanGray = "#737373"; // events-page muted-foreground (scan register)
	return (
		<Section className="mb-[16px]">
			<table
				cellPadding="0"
				cellSpacing="0"
				border={0}
				className="event-card-new"
				style={{ width: "100%", borderRadius: "8px", border: "1px solid transparent" }}
			>
				<tbody>
					<tr>
						<td style={{ padding: "16px" }}>
							<Link
								href={withUtm(event.url, { medium: "email", campaign: "newsletter" })}
								className="event-card-new-title"
								style={{
									fontFamily: SANS,
									fontSize: "19px",
									fontWeight: 700,
									color: C.navy,
									textDecoration: "none",
									lineHeight: "1.3",
								}}
							>
								{event.title}
							</Link>

							{/* Metadata strip — time leads (tabular-nums), then city */}
							<Text
								style={{
									fontFamily: SANS,
									fontSize: "14px",
									color: scanGray,
									margin: "6px 0 0 0",
									lineHeight: "20px",
								}}
							>
								<span style={{ fontVariantNumeric: "tabular-nums" }}>{formatTime(event.start_time)}</span>
								{" · "}
								{formatCity(event.city)}
							</Text>

							{event.description && (
								<Text
									style={{
										fontFamily: SANS,
										fontSize: "14px",
										color: scanGray,
										margin: "6px 0 0 0",
										lineHeight: "20px",
									}}
								>
									{event.description.length > 120 ? `${event.description.substring(0, 120)}…` : event.description}
								</Text>
							)}
						</td>
					</tr>
				</tbody>
			</table>
		</Section>
	);
}

/** A category chip — rounded pill, category-coloured (ported from the calendar's CategoryPill). */
function CategoryChip({ slug }: { slug: string }) {
	const c = EMAIL_CATEGORY_CHIP[slug];
	if (!c) return null;
	return (
		<span
			style={{
				display: "inline-block",
				borderRadius: "9999px",
				padding: "2px 8px",
				marginRight: "6px",
				fontFamily: SANS,
				fontSize: "10px",
				fontWeight: 600,
				letterSpacing: "0.06em",
				textTransform: "uppercase",
				backgroundColor: c.bg,
				color: c.text,
			}}
		>
			{c.label}
		</span>
	);
}

/**
 * VARIANT (comparison) — event styled after the admin react-big-calendar:
 * a calendar date-block (weekday over day-number) on the left, then title,
 * category chip(s), and city. Visualises the day of the week as a tile, the
 * way calendar UIs do, and surfaces the category system.
 */
function EventItemCalendar({ event }: { event: Event }) {
	const cats = event.categorySlugs ?? [];
	return (
		<Section className="mb-[12px]">
			<table cellPadding="0" cellSpacing="0" border={0} style={{ width: "100%" }}>
				<tbody>
					<tr>
						{/* Date block — weekday over day-number */}
						<td style={{ width: "56px", verticalAlign: "top" }}>
							<table
								cellPadding="0"
								cellSpacing="0"
								border={0}
								style={{ width: "56px", backgroundColor: C.veil, borderRadius: "8px" }}
							>
								<tbody>
									<tr>
										<td style={{ textAlign: "center", padding: "8px 0 0 0" }}>
											<Text
												style={{
													fontFamily: SANS,
													fontSize: "10px",
													fontWeight: 600,
													letterSpacing: "0.1em",
													textTransform: "uppercase",
													color: C.tone,
													margin: "0",
													lineHeight: "1",
												}}
											>
												{formatWeekday(event.start_time)}
											</Text>
										</td>
									</tr>
									<tr>
										<td style={{ textAlign: "center", padding: "2px 0 8px 0" }}>
											<Text
												style={{
													fontFamily: SANS,
													fontSize: "24px",
													fontWeight: 700,
													color: C.navy,
													margin: "0",
													lineHeight: "1.1",
												}}
											>
												{formatDayNum(event.start_time)}
											</Text>
										</td>
									</tr>
								</tbody>
							</table>
						</td>

						{/* Content — title, category chips, city */}
						<td style={{ paddingLeft: "16px", verticalAlign: "top" }}>
							<Link
								href={withUtm(event.url, { medium: "email", campaign: "newsletter" })}
								style={{
									fontFamily: SANS,
									fontSize: "16px",
									fontWeight: 575,
									color: C.navy,
									textDecoration: "none",
									lineHeight: "1.35",
								}}
							>
								{event.title}
							</Link>

							{cats.length > 0 && (
								<Text style={{ margin: "8px 0 0 0", lineHeight: "1.6" }}>
									{cats.map((slug) => (
										<CategoryChip key={slug} slug={slug} />
									))}
								</Text>
							)}

							<Text style={{ fontFamily: SANS, fontSize: "13px", color: C.tone, margin: "6px 0 0 0" }}>
								{formatCity(event.city)}
							</Text>
						</td>
					</tr>
				</tbody>
			</table>
		</Section>
	);
}

/** A group of events for a single day. */
function DayGroup({ events, groupIndex }: { dateKey: string; events: Event[]; groupIndex: number }) {
	const headerDate = formatDayHeader(events[0].start_time);

	return (
		<Section className="mb-[24px]">
			<Text
				style={{
					fontFamily: SANS,
					fontSize: "14px",
					fontWeight: 600,
					color: C.navy,
					margin: "0 0 12px 0",
				}}
			>
				{headerDate}
			</Text>

			{events.map((event, i) =>
				groupIndex === 0 && i === 0 ? (
					<EventItemNew key={event.id} event={event} />
				) : (
					<EventItem key={event.id} event={event} />
				),
			)}
		</Section>
	);
}

/** Featured article — kicker row, Lora H1, byline, prose body, CTA. */
function ArticleSection({ article }: { article: Article }) {
	const { title, week } = splitTitle(article.title);

	return (
		<Section className="mb-[8px]">
			{/* Kicker row: [Adamastor Weekly pillar] ←→ [Week N gutter] */}
			<table cellPadding="0" cellSpacing="0" border={0} style={{ width: "100%" }}>
				<tbody>
					<tr>
						<td style={{ textAlign: "left" }}>
							<Text style={kickerStyle(C.bright)}>Adamastor Weekly</Text>
						</td>
						{week && (
							<td style={{ textAlign: "right" }}>
								<Text style={{ fontFamily: SANS, fontSize: "12px", color: C.tone, margin: "0" }}>{week}</Text>
							</td>
						)}
					</tr>
				</tbody>
			</table>

			{/* Lora display headline */}
			<Link href={article.url} className="heading-link" style={{ textDecoration: "none" }}>
				<Heading
					style={{
						fontFamily: SERIF,
						fontWeight: 700,
						fontSize: `${headlineSize(title)}px`,
						lineHeight: "1.15",
						letterSpacing: "-0.01em",
						color: C.navy,
						margin: "10px 0 0 0",
					}}
				>
					{title}
				</Heading>
			</Link>

			{/* Byline — avatar + name (navy 575) + dateline (navy-tone). Mirrors the
			    article page's Zone A (avatar + identity). Table layout because email
			    clients can't be trusted with flexbox alignment. */}
			<table cellPadding="0" cellSpacing="0" border={0} style={{ marginTop: "16px" }}>
				<tbody>
					<tr>
						{article.authorImageUrl && (
							<td style={{ verticalAlign: "middle", paddingRight: "12px", width: "48px" }}>
								<img
									src={article.authorImageUrl}
									alt={article.authorName}
									width={48}
									height={48}
									style={{ borderRadius: "50%", display: "block" }}
								/>
							</td>
						)}
						<td style={{ verticalAlign: "middle" }}>
							<Text
								style={{
									fontFamily: SANS,
									fontSize: "15px",
									fontWeight: 575,
									color: C.navy,
									lineHeight: "1.3",
									margin: "0",
								}}
							>
								{article.authorName}
							</Text>
							{article.date && (
								<Text
									style={{
										fontFamily: SANS,
										fontSize: "13px",
										color: C.tone,
										lineHeight: "1.4",
										margin: "2px 0 0 0",
									}}
								>
									{article.date}
								</Text>
							)}
						</td>
					</tr>
				</tbody>
			</table>

			<Hr style={{ ...hairline, margin: "20px 0 28px 0" }} />

			{/* Article body — styled by .adamastor-prose in the <style> block */}
			<div
				className="adamastor-prose"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Content from trusted source (our own Supabase DB)
				dangerouslySetInnerHTML={{ __html: article.htmlContent }}
			/>

			{/* Primary CTA */}
			<Section style={{ marginTop: "28px" }}>
				<Button href={article.url} className="cta-primary" style={primaryCtaStyle}>
					Read full article
				</Button>
			</Section>
		</Section>
	);
}

// ============================================
// Main Template
// ============================================

export const NewsletterTemplate = ({ events, article, category, preferencesUrl }: NewsletterTemplateProps) => {
	const eventCount = events.length;
	// Per-category sends are events-only — the article slot is hidden even if
	// one is passed by accident, so the email matches what the subscriber
	// opted in to receive.
	const showArticle = !!article && !category;
	const eventsHeading = category ? `Upcoming ${category.name} Events` : "Upcoming Events";
	const eventsCtaUrl = category ? `https://adamastor.blog/events/${category.slug}` : "https://adamastor.blog/events";
	const eventsCtaLabel = category ? `View all ${category.name} events` : "View all events";
	// When there's no article above, the events CTA is the email's primary
	// action and earns the solid button; otherwise it's a quieter text link.
	const eventsCtaIsPrimary = !showArticle;

	const previewText = category
		? `${eventCount} upcoming ${category.name.toLowerCase()} events in Portugal`
		: article
			? `${splitTitle(article.title).title} + ${eventCount} upcoming events`
			: `${eventCount} upcoming events in Portugal’s startup scene`;

	return (
		<Html lang="en" dir="ltr">
			<Tailwind>
				<Head>
					<link rel="stylesheet" href={FONTS_HREF} />
					<meta name="color-scheme" content="light dark" />
					<meta name="supported-color-schemes" content="light dark" />
					<style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />
					<style dangerouslySetInnerHTML={{ __html: DARK_MODE_CSS }} />
					<style dangerouslySetInnerHTML={{ __html: DARK_PROSE_CSS }} />
					{/* Email-safe styles for the article HTML content — mirrors .article-prose */}
					<style>
						{`
              .adamastor-prose p {
                font-family: ${SANS};
                font-size: 17px;
                line-height: 1.7;
                color: ${C.navy};
                margin: 0 0 18px 0;
              }

              /* Section breaks: top hairline + generous margin (matches body H2) */
              .adamastor-prose h2 {
                font-family: ${SANS};
                font-weight: 700;
                font-size: 24px;
                line-height: 1.25;
                color: ${C.navy};
                margin: 48px 0 16px 0;
                padding-top: 32px;
                border-top: 1px solid ${C.frame};
              }
              .adamastor-prose h3 {
                font-family: ${SANS};
                font-weight: 600;
                font-size: 19px;
                line-height: 1.35;
                color: ${C.navy};
                margin: 28px 0 12px 0;
              }
              /* First heading shouldn't carry the rule or top gap */
              .adamastor-prose h1:first-child,
              .adamastor-prose h2:first-child,
              .adamastor-prose h3:first-child {
                margin-top: 0;
                padding-top: 0;
                border-top: none;
              }
              /* Body H1 is a paste artifact — collapse to H2 styling */
              .adamastor-prose h1 {
                font-family: ${SANS};
                font-weight: 700;
                font-size: 24px;
                line-height: 1.25;
                color: ${C.navy};
                margin: 48px 0 16px 0;
              }
              /* Inline emphasis inside a heading inherits the heading weight */
              .adamastor-prose h1 strong,
              .adamastor-prose h2 strong,
              .adamastor-prose h3 strong { font-weight: inherit; }

              /* Inline emphasis — single-axis from body */
              .adamastor-prose strong { font-weight: 575; color: ${C.navy}; }
              .adamastor-prose em { font-style: italic; font-weight: 450; }

              /* Links — navy.bright, the interactive register */
              .adamastor-prose a {
                color: ${C.bright};
                text-decoration: underline;
                text-decoration-color: ${C.bright};
                text-decoration-thickness: 1.5px;
                text-underline-offset: 2px;
              }
              .adamastor-prose a:hover { color: ${C.brightDeep} !important; }
              .heading-link * { text-decoration: none !important; }

              /* Primary CTA hover — gold deepens to gold.shade (white text stays) */
              .cta-primary:hover { background-color: ${C.goldDeep} !important; }

              /* Comparison variant — events-page card hover (border + title underline) */
              .event-card-new:hover { border-color: ${C.frame} !important; }
              .event-card-new:hover .event-card-new-title {
                text-decoration: underline;
                text-decoration-color: ${C.tint};
                text-decoration-thickness: 2px;
                text-underline-offset: 4px;
              }

              /* Lists — navy-tint markers, items tighter than paragraphs */
              .adamastor-prose ul,
              .adamastor-prose ol {
                margin: 18px 0;
                padding-left: 24px;
                color: ${C.navy};
              }
              .adamastor-prose li {
                font-family: ${SANS};
                font-size: 17px;
                line-height: 1.625;
                color: ${C.navy};
                margin-bottom: 8px;
              }
              .adamastor-prose li::marker { color: ${C.tint}; }

              /* Blockquote — Lora italic 475 with a navy-tint left rule */
              .adamastor-prose blockquote {
                margin: 28px 0;
                padding: 2px 0 2px 20px;
                border-left: 4px solid ${C.tint};
              }
              .adamastor-prose blockquote p {
                font-family: ${SERIF};
                font-style: italic;
                font-weight: 475;
                font-size: 20px;
                line-height: 1.45;
                color: ${C.navy};
                margin: 0 0 8px 0;
              }
              /* Attribution: source carries its own em-dash (don't inject one) */
              .adamastor-prose blockquote p:last-child {
                font-family: ${SANS};
                font-style: normal;
                font-weight: 600;
                font-size: 13px;
                letter-spacing: 0.04em;
                color: ${C.tone};
                margin: 0;
              }

              /* Images */
              .adamastor-prose img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                margin: 20px 0;
              }

              /* Code — quiet monospace on a navy-tinted chip */
              .adamastor-prose code {
                font-family: Inconsolata, ui-monospace, SFMono-Regular, Menlo, monospace;
                background-color: ${C.veil};
                color: ${C.navy};
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 14px;
              }
              .adamastor-prose pre {
                background-color: ${C.navy};
                color: ${C.white};
                padding: 16px;
                border-radius: 8px;
                overflow-x: auto;
                margin: 20px 0;
              }
            `}
					</style>
				</Head>
				<Preview>{previewText}</Preview>
				<Body style={{ backgroundColor: C.canvas, fontFamily: SANS, padding: "40px 0" }}>
					<Container
						style={{
							backgroundColor: C.white,
							borderRadius: "8px",
							padding: "40px",
							maxWidth: "600px",
							margin: "0 auto",
						}}
					>
						{/* ============================================ */}
						{/* Featured Article Section (if provided) */}
						{/* ============================================ */}
						{showArticle && article && (
							<>
								<ArticleSection article={article} />
								<Hr style={hairline} />
							</>
						)}

						{/* ============================================ */}
						{/* Events Section */}
						{/* ============================================ */}
						<Section>
							<Text style={kickerStyle(C.tone)}>{eventsHeading}</Text>

							{/* Context line for per-category sends — reduces spam-flagging
							    and reminds recipients why they're getting this. */}
							{category ? (
								<Text
									style={{
										fontFamily: SANS,
										fontSize: "13px",
										color: C.tone,
										margin: "8px 0 16px 0",
										lineHeight: "18px",
									}}
								>
									You’re getting this because you subscribed to {category.name} events on adamastor.blog.
								</Text>
							) : (
								<div style={{ height: "16px" }} />
							)}

							{eventCount > 0 ? (
								<>
									{groupEventsByDay(events).map(([dateKey, dayEvents], gi) => (
										<DayGroup key={dateKey} dateKey={dateKey} events={dayEvents} groupIndex={gi} />
									))}
								</>
							) : (
								<Text
									style={{
										fontFamily: SANS,
										fontSize: "16px",
										color: C.tone,
										textAlign: "center",
										padding: "32px 0",
									}}
								>
									No events scheduled for this period. Check back soon!
								</Text>
							)}
						</Section>

						{/* ============================================ */}
						{/* Calendar-inspired section (comparison) — date blocks + category chips */}
						{/* ============================================ */}
						{eventCount > 0 && (
							<>
								<Hr style={hairline} />
								<Section>
									<Text style={kickerStyle(C.tone)}>On the calendar</Text>
									<div style={{ height: "16px" }} />
									{events.slice(0, 2).map((event) => (
										<EventItemCalendar key={event.id} event={event} />
									))}
								</Section>
							</>
						)}

						{/* Events CTA — solid button when primary, text link otherwise */}
						<Section style={{ textAlign: "center", margin: "8px 0 4px 0" }}>
							{eventsCtaIsPrimary ? (
								<Button href={eventsCtaUrl} className="cta-primary" style={primaryCtaStyle}>
									{eventsCtaLabel}
								</Button>
							) : (
								<Link
									href={eventsCtaUrl}
									style={{
										fontFamily: SANS,
										fontSize: "14px",
										fontWeight: 600,
										color: C.bright,
										textDecoration: "none",
									}}
								>
									{eventsCtaLabel} →
								</Link>
							)}
						</Section>

						<Hr style={hairline} />

						{/* ============================================ */}
						{/* Footer Section */}
						{/* ============================================ */}
						<Section>
							{/* Brand tagline — the footer voice from the website */}
							<Text
								style={{
									fontFamily: SERIF,
									fontStyle: "italic",
									fontWeight: 700,
									fontSize: "16px",
									color: C.navy,
									textAlign: "center",
									margin: "0 0 16px 0",
								}}
							>
								Only You Know Who You Can Be
							</Text>

							<Text
								style={{
									fontFamily: SANS,
									fontSize: "12px",
									color: C.tone,
									textAlign: "center",
									margin: "0 0 8px 0",
								}}
							>
								©{" "}
								{new Date().getFullYear()} Adamastor. All rights reserved.
							</Text>

							<Text
								style={{
									fontFamily: SANS,
									fontSize: "12px",
									color: C.tone,
									textAlign: "center",
									margin: "0",
								}}
							>
								<Link href="https://adamastor.blog" style={{ color: C.tone, textDecoration: "underline" }}>
									adamastor.blog
								</Link>
								{preferencesUrl && (
									<>
										{" · "}
										<Link href={preferencesUrl} style={{ color: C.tone, textDecoration: "underline" }}>
											Manage preferences
										</Link>
									</>
								)}
								{" · "}
								<Link href="{{{RESEND_UNSUBSCRIBE_URL}}}" style={{ color: C.tone, textDecoration: "underline" }}>
									Unsubscribe
								</Link>
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

// ============================================
// Preview Props for Development
// ============================================

NewsletterTemplate.PreviewProps = {
	// TEMP — real content from post 175 via the fixture. Restore the synthetic
	// article object (or drop `date`) once the real-content review is done.
	article: { ...post175, date: "May 27, 2026" },
	events: [
		{
			id: "1",
			title: "Startup Taxes in Portugal: The Basics Founders Need to Know",
			description:
				"Presented by FiO Legal, this workshop aims to showcase, in a practical and accessible way, the main tax aspects that founders and startups need to understand.",
			start_time: "2026-06-02T18:30:00.000Z",
			city: "online",
			url: "https://adamastor.blog/events/startup-taxes-portugal",
			categorySlugs: ["startups-fundraising"],
		},
		{
			id: "2",
			title: "Starbase @ Subvisual: 2026 Trends & Opportunities",
			description:
				"Join us to get the New Year started with something special. Starbase is landing in Braga to bring together builders, innovators, and thinkers.",
			start_time: "2026-06-03T09:00:00.000Z",
			city: "braga",
			url: "https://adamastor.blog/events/starbase-subvisual",
			categorySlugs: ["ai"],
		},
		{
			id: "3",
			title: "Open Source AI Summit Lisbon",
			description:
				"Open Source AI Summit is coming to Lisbon! Hosted by KryptoPlanet and NEAR Protocol, this will be the 8th Open Source AI Summit.",
			start_time: "2026-06-03T14:00:00.000Z",
			city: "lisboa",
			url: "https://adamastor.blog/events/open-source-ai-summit",
			categorySlugs: ["ai", "software-engineering"],
		},
		{
			id: "4",
			title: "Porto Tech Hub Monthly Meetup",
			description: "Monthly gathering of Porto's tech community. Networking, talks, and drinks.",
			start_time: "2026-06-04T18:00:00.000Z",
			city: "porto",
			url: "https://adamastor.blog/events/porto-tech-hub",
			categorySlugs: ["software-engineering"],
		},
	],
} as NewsletterTemplateProps;

export default NewsletterTemplate;
