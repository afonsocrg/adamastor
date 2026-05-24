/**
 * Newsletter Template with Article + Events
 *
 * Structure:
 * 1. Header with greeting
 * 2. Featured Article - The blog post content
 * 3. Upcoming Events - Grouped by day, matching website design
 * 4. CTA and Footer
 *
 * The article content comes as pre-converted HTML from tiptap-to-html.ts
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
}

/**
 * Article data structure for the newsletter
 * The htmlContent is pre-converted from TipTap JSON
 */
interface Article {
	id: string;
	title: string;
	htmlContent: string;
	authorName: string;
	url: string;
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
 * Formats a date for the day group header
 * Example: "Thursday, January 8"
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
 * Individual event card with left border accent
 *
 * Uses a table layout for the left border because CSS border-left
 * is unreliable across email clients (especially Outlook).
 */
function EventItem({ event }: { event: Event }) {
	return (
		<Section className="mb-[16px]">
			<table cellPadding="0" cellSpacing="0" border={0} style={{ width: "100%" }}>
				<tbody>
					<tr>
						{/* Cyan left border */}
						<td
							style={{
								width: "4px",
								backgroundColor: "#04c9d8",
								borderRadius: "2px",
							}}
						/>
						{/* Content */}
						<td style={{ paddingLeft: "16px" }}>
							<Link
								href={withUtm(event.url, { medium: "email", campaign: "newsletter" })}
								style={{
									fontSize: "16px",
									fontWeight: "600",
									color: "#104357",
									textDecoration: "none",
								}}
							>
								{event.title}
							</Link>

							{event.description && (
								<Text className="text-[14px] text-[#6b7280] m-0 mt-[4px] leading-[20px]">
									{event.description.length > 120 ? `${event.description.substring(0, 120)}...` : event.description}
								</Text>
							)}

							<Text className="text-[13px] text-[#9ca3af] m-0 mt-[8px]">{formatCity(event.city)}</Text>
						</td>
					</tr>
				</tbody>
			</table>
		</Section>
	);
}

/**
 * A group of events for a single day
 */
function DayGroup({ events }: { dateKey: string; events: Event[] }) {
	const headerDate = formatDayHeader(events[0].start_time);

	return (
		<Section className="mb-[24px]">
			{/* Date Header */}
			<Text className="text-[14px] font-semibold text-[#374151] m-0 mb-[12px]">{headerDate}</Text>

			{/* Events for this day */}
			{events.map((event) => (
				<EventItem key={event.id} event={event} />
			))}
		</Section>
	);
}

/**
 * Featured Article Section
 */
function ArticleSection({ article }: { article: Article }) {
	return (
		<Section className="mb-[32px]">
			{/* Article Header */}
			<Link href={article.url} className="heading-link" style={{ textDecoration: "none" }}>
				<Heading className="text-[24px] font-bold text-[#104357] mb-[8px]">{article.title}</Heading>
			</Link>

			<Text className="text-[14px] text-gray-500 m-0 mb-[16px]">By {article.authorName}</Text>

			{/* Article Content */}
			<div
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Content from trusted source (our own Supabase DB)
				dangerouslySetInnerHTML={{ __html: article.htmlContent }}
				style={{
					fontSize: "16px",
					lineHeight: "1.6",
					color: "#374151",
				}}
			/>

			{/* Read More CTA */}
			<Section className="mt-[24px]">
				<Button
					href={article.url}
					className="bg-[#104357] text-white px-[24px] py-[12px] rounded-[6px] text-[14px] font-semibold no-underline"
				>
					Read full article
				</Button>
			</Section>
		</Section>
	);
}

// ============================================
// Main Template
// ============================================

export const NewsletterTemplate = ({
	events,
	article,
	category,
	preferencesUrl,
}: NewsletterTemplateProps) => {
	const eventCount = events.length;
	// Per-category sends are events-only — the article slot is hidden even if
	// one is passed by accident, so the email matches what the subscriber
	// opted in to receive.
	const showArticle = !!article && !category;
	const eventsHeading = category ? `Upcoming ${category.name} Events` : "Upcoming Events";
	const eventsCtaUrl = category
		? `https://adamastor.blog/events/${category.slug}`
		: "https://adamastor.blog/events";
	const eventsCtaLabel = category ? `View all ${category.name} events` : "View All Events";

	const previewText = category
		? `${eventCount} upcoming ${category.name.toLowerCase()} events in Portugal`
		: article
			? `${article.title} + ${eventCount} upcoming events`
			: `${eventCount} upcoming events in Portugal's startup scene`;

	return (
		<Html lang="en" dir="ltr">
			<Tailwind>
				<Head>
					{/* Email-safe styles for the article HTML content */}
					<style>
						{`
              /* ================================
                 Section Headers (h1, h2, h3)
                 More breathing room between sections
                 ================================ */
              h1, h2, h3 {
                color: #104357;
                margin-top: 36px;
                margin-bottom: 16px;
                line-height: 1.3;
              }
              h1 { font-size: 28px; }
              h2 { font-size: 20px; }
              h3 { font-size: 18px; }

              /* First heading shouldn't have top margin */
              h1:first-child, h2:first-child, h3:first-child {
                margin-top: 0;
              }

              /* ================================
                 Paragraphs
                 ================================ */
              p {
                margin: 0 0 16px 0;
                line-height: 1.7;
                color: #374151;
              }

              /* ================================
                 Links
                 ================================ */
              a {
                color: #41ACB5;
                text-decoration: underline;
              }
              a:hover {
                color: #039aa8 !important;
              }
							.heading-link * {
						  	text-decoration: none !important;
							}

              /* ================================
                 Lists
                 ================================ */
              ul, ol {
                margin: 16px 0;
                padding-left: 24px;
              }
              li {
                margin-bottom: 8px;
                line-height: 1.6;
              }

              /* ================================
                 Blockquotes
                 ================================ */
              blockquote {
  text-align: center;        /* Center everything */
  border: none;              /* Remove the left border */
  background: none;          /* No background */
  margin: 32px 0;            /* Generous vertical space */
  padding: 0 24px;
}

/* Large decorative quotation mark */
blockquote::before {
  content: '"';
  font-size: 48px;
  color: #d1d5db;            /* Light gray */
  font-family: Georgia, serif;
}

/* Quote text - italic */
blockquote p {
  font-style: italic;
  font-size: 17px;
}

/* Author - bold, with auto-prepended dash */
blockquote p:last-child {
  font-style: normal;
  font-weight: 600;
}
blockquote p:last-child::before {
  content: '— ';             /* Adds the em dash automatically */
}

              /* ================================
                 Images
                 ================================ */
              img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                margin: 20px 0;
              }

              /* ================================
                 Code blocks
                 ================================ */
              code {
                background-color: #f3f4f6;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 14px;
                font-family: monospace;
              }
              pre {
                background-color: #1f2937;
                color: #f9fafb;
                padding: 16px;
                border-radius: 8px;
                overflow-x: auto;
                margin: 20px 0;
              }

              /* ================================
                 Strong/Bold text
                 ================================ */
              strong {
                color: #104357;
                font-weight: 600;
              }
            `}
					</style>
				</Head>
				<Preview>{previewText}</Preview>
				<Body className="bg-gray-100 font-sans py-[40px]">
					<Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
						{/* ============================================ */}
						{/* Featured Article Section (if provided) */}
						{/* ============================================ */}
						{showArticle && article && (
							<>
								<ArticleSection article={article} />
								<Hr className="border-gray-200 my-[32px]" />
							</>
						)}

						{/* ============================================ */}
						{/* Events Section */}
						{/* ============================================ */}
						<Section>
							<Heading className="text-[22px] font-bold text-[#104357]">{eventsHeading}</Heading>

							{/* Context line for per-category sends — reduces spam-flagging
							    and reminds recipients why they're getting this. Only
							    shown when this is a per-category newsletter; the digest
							    has its own preview/identity. */}
							{category ? (
								<Text className="text-[13px] text-gray-500 m-0 mb-[16px] leading-[18px]">
									You're getting this because you subscribed to {category.name} events on adamastor.blog.
								</Text>
							) : null}

							{eventCount > 0 ? (
								<>
									{groupEventsByDay(events).map(([dateKey, dayEvents]) => (
										<DayGroup key={dateKey} dateKey={dateKey} events={dayEvents} />
									))}
								</>
							) : (
								<Text className="text-[16px] text-[#374151] text-center py-[32px]">
									No events scheduled for this period. Check back soon!
								</Text>
							)}
						</Section>

						{/* Events CTA */}
						<Section className="text-center my-[16px]">
							<Button
								href={eventsCtaUrl}
								className="bg-[#04c9d8] text-white px-[32px] py-[16px] rounded-[6px] text-[14px] font-semibold no-underline box-border inline-block"
							>
								{eventsCtaLabel}
							</Button>
						</Section>

						<Hr className="border-gray-200 my-[24px]" />

						{/* ============================================ */}
						{/* Footer Section */}
						{/* ============================================ */}
						<Section className="pt-[8px]">
							<Text className="text-[12px] text-gray-500 text-center m-0 mb-[8px]">
								© {new Date().getFullYear()} Adamastor. All rights reserved.
							</Text>

							<Text className="text-[12px] text-gray-500 text-center m-0">
								<Link href="https://adamastor.blog" className="text-gray-500 underline">
									adamastor.blog
								</Link>
								{preferencesUrl && (
									<>
										{" • "}
										<Link href={preferencesUrl} className="text-gray-500 underline">
											Manage preferences
										</Link>
									</>
								)}
								{" • "}
								<Link href="{{{RESEND_UNSUBSCRIBE_URL}}}" className="text-gray-500 underline">
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
	article: {
		id: "147",
		title: "Sweet as a Pastel de Nata | Week 42",
		htmlContent: `
      <p>This week in Portugal's startup scene, we're seeing exciting developments across the ecosystem.</p>
      <h2>Funding Highlights</h2>
      <p>Several Portuguese startups announced new funding rounds, with a focus on <strong>sustainability</strong> and <strong>AI applications</strong>.</p>
      <blockquote>
        <p>"The Portuguese startup ecosystem has never been stronger." — Local VC</p>
      </blockquote>
      <h2>What's Next</h2>
      <p>Looking ahead, we expect continued growth in the following sectors:</p>
      <ul>
        <li>Climate tech and sustainability</li>
        <li>AI and machine learning applications</li>
        <li>Remote work infrastructure</li>
      </ul>
    `,
		authorName: "Carlos Resende",
		url: "https://adamastor.blog/posts/147",
	},
	events: [
		{
			id: "1",
			title: "Startup Taxes in Portugal: The Basics Founders Need to Know",
			description:
				"Presented by FiO Legal, this workshop aims to showcase, in a practical and accessible way, the main tax aspects that founders and startups need to understand.",
			start_time: "2025-01-08T18:30:00.000Z",
			city: "online",
			url: "https://example.com/event-1",
		},
		{
			id: "2",
			title: "Starbase @ Subvisual: 2026 Trends & Opportunities",
			description:
				"Join us to get the New Year started with something special. Starbase is landing in Braga to bring together builders, innovators, and thinkers.",
			start_time: "2025-01-09T09:00:00.000Z",
			city: "braga",
			url: "https://example.com/event-2",
		},
		{
			id: "3",
			title: "Open Source AI Summit Lisbon",
			description:
				"Open Source AI Summit is coming to Lisbon on January 9th! Hosted by KryptoPlanet and NEAR Protocol, this will be the 8th Open Source AI Summit.",
			start_time: "2025-01-09T14:00:00.000Z",
			city: "lisboa",
			url: "https://example.com/event-3",
		},
		{
			id: "4",
			title: "Porto Tech Hub Monthly Meetup",
			description: "Monthly gathering of Porto's tech community. Networking, talks, and drinks.",
			start_time: "2025-01-10T18:00:00.000Z",
			city: "porto",
			url: "https://example.com/event-4",
		},
	],
} as NewsletterTemplateProps;

export default NewsletterTemplate;
