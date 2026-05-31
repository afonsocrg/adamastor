/**
 * Category-welcome — sent on a first per-category event subscribe (no Weekly
 * opt-in). Confirms the topic alerts and gives one-click control. Shares the
 * design system via ./_theme. This is the EVENTS product, not the Weekly read,
 * so the voice is the publication "we" (not Carlos first-person) and the kicker
 * is "Adamastor Events", not the Weekly pillar. See docs/emails.md.
 */

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
	Text,
} from "@react-email/components";
import {
	C,
	DARK_MODE_CSS,
	FONTS_HREF,
	ghostCtaStyle,
	hairline,
	kickerStyle,
	primaryCtaStyle,
	RESPONSIVE_CSS,
	SANS,
	SERIF,
} from "./_theme";

interface CategoryWelcomeEmailProps {
	firstName?: string | null;
	/** Display names of categories the subscriber just opted into, e.g. ["Design", "AI"]. */
	categoryNames: string[];
	/** Tokenized URL to /preferences — included on every category subscribe. */
	preferencesUrl: string;
}

function joinList(items: string[]): string {
	if (items.length === 0) return "";
	if (items.length === 1) return items[0];
	if (items.length === 2) return `${items[0]} and ${items[1]}`;
	return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

const PEOPLE: Record<string, { name: string; image: string }> = {
	malik: { name: "Malik Piara", image: "https://adamastor.blog/malik.jpeg" },
	afonso: { name: "Afonso Gonçalves", image: "https://adamastor.blog/afonso.jpeg" },
	carlos: { name: "Carlos Resende", image: "https://adamastor.blog/carlos.jpeg" },
};

/**
 * Who curates each topic — they sign the welcome (a face on the alerts, the
 * way Carlos signs the Weekly). Keyed by EVENT_CATEGORIES display name. For a
 * multi-topic subscribe, the signers are the union across topics.
 */
const SIGNERS_BY_CATEGORY: Record<string, string[]> = {
	Design: ["malik"],
	"Software Engineering": ["malik", "afonso"],
	"Startups & Fundraising": ["carlos", "afonso"],
	AI: ["malik", "afonso"],
	"Product Management": ["malik"],
};

export const CategoryWelcomeEmail = ({ firstName, categoryNames, preferencesUrl }: CategoryWelcomeEmailProps) => {
	const single = categoryNames.length === 1;
	const categoryList = joinList(categoryNames);
	const topicPhrase = `${categoryList} events`;
	const greeting = firstName ? `You’re on the list, ${firstName}` : "You’re on the list";
	const previewText = `You’re on the list for ${topicPhrase}.`;

	// Signers = the curators of the subscribed topics, deduped (union across topics).
	const signers = Array.from(new Set(categoryNames.flatMap((name) => SIGNERS_BY_CATEGORY[name] ?? [])))
		.map((key) => PEOPLE[key])
		.filter(Boolean);
	const signerNames = joinList(signers.map((person) => person.name));

	return (
		<Html lang="en" dir="ltr">
			<Head>
				<link rel="stylesheet" href={FONTS_HREF} />
				<meta name="color-scheme" content="light dark" />
				<meta name="supported-color-schemes" content="light dark" />
				<style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />
				<style dangerouslySetInnerHTML={{ __html: DARK_MODE_CSS }} />
				<style>
					{`
            .cta-primary:hover { background-color: ${C.goldDeep} !important; }
            .cta-ghost:hover { background-color: ${C.veil} !important; }
          `}
				</style>
			</Head>
			<Preview>{previewText}</Preview>
			<Body className="em-page" style={{ backgroundColor: C.canvas, fontFamily: SANS, padding: "40px 0" }}>
				<Container
					className="em-card"
					style={{
						backgroundColor: C.white,
						borderRadius: "8px",
						padding: "40px",
						maxWidth: "600px",
						margin: "0 auto",
					}}
				>
					<Text className="em-link" style={kickerStyle(C.bright)}>
						Adamastor Events
					</Text>
					<Heading
						className="em-text"
						style={{
							fontFamily: SERIF,
							fontWeight: 700,
							fontSize: "30px",
							lineHeight: "1.15",
							letterSpacing: "-0.01em",
							color: C.navy,
							margin: "10px 0 0 0",
						}}
					>
						{greeting}
					</Heading>

					<Hr className="em-rule" style={{ ...hairline, margin: "20px 0 28px 0" }} />

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						You’re set for <span style={{ fontWeight: 575, color: C.navy }}>{categoryList}</span> events across
						Portugal: every meetup, conference, and workshop worth showing up to. We’ll send the upcoming ones each
						week, and nothing outside {single ? "this topic" : "these topics"}.
					</Text>

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						Here’s what’s coming up:
					</Text>

					{/* Primary CTA — gold pill (centered close). 36px above (the table's
					    margin wins the collapse with the lead-in's) so the focal action
					    breathes more than the 32px hairline rhythm. */}
					<Section style={{ textAlign: "center", margin: "36px 0 8px 0" }}>
						<Button href="https://adamastor.blog/events" className="cta-primary" style={primaryCtaStyle}>
							Browse upcoming events
						</Button>
					</Section>

					{/* Organiser nudge — tertiary: quiet text + link, below the gold CTA. */}
					<Text
						className="em-muted"
						style={{
							fontFamily: SANS,
							fontSize: "14px",
							lineHeight: "1.6",
							color: C.tone,
							textAlign: "center",
							margin: "14px 0 0 0",
						}}
					>
						Run events yourself?{" "}
						<Link
							className="em-link"
							href="https://adamastor.blog/events/submit"
							style={{ color: C.bright, textDecoration: "underline" }}
						>
							Submit yours
						</Link>
						.
					</Text>

					<Hr className="em-rule" style={hairline} />

					{/* Reader agency — change topics any time. Secondary, outlined. */}
					<Text
						className="em-text"
						style={{
							fontFamily: SANS,
							fontSize: "15px",
							lineHeight: "1.6",
							color: C.navy,
							textAlign: "center",
							margin: "0 0 4px 0",
						}}
					>
						Want more, or less?
					</Text>
					<Section style={{ textAlign: "center", margin: "0 0 8px 0" }}>
						<Button href={preferencesUrl} className="cta-ghost" style={ghostCtaStyle}>
							Manage preferences
						</Button>
					</Section>

					{/* Signature — the curator(s) of the subscribed topic(s). */}
					{signers.length > 0 && (
						<>
							<Hr className="em-rule" style={hairline} />
							<Section style={{ textAlign: "center" }}>
								{signers.map((person, i) => (
									<img
										key={person.name}
										src={person.image}
										alt={person.name}
										width={52}
										height={52}
										style={{
											borderRadius: "50%",
											display: "inline-block",
											verticalAlign: "middle",
											marginLeft: i === 0 ? "0" : "8px",
										}}
									/>
								))}
								<Text
									className="em-muted"
									style={{ fontFamily: SANS, fontSize: "13px", color: C.tone, margin: "10px 0 0 0", lineHeight: "1.3" }}
								>
									Até breve,
								</Text>
								<Text
									className="em-text"
									style={{
										fontFamily: SANS,
										fontSize: "15px",
										fontWeight: 575,
										color: C.navy,
										margin: "2px 0 0 0",
										lineHeight: "1.3",
									}}
								>
									{signerNames}
								</Text>
							</Section>
						</>
					)}

					<Hr className="em-rule" style={hairline} />

					{/* Footer */}
					<Section>
						<Text
							className="em-text"
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
							className="em-muted"
							style={{ fontFamily: SANS, fontSize: "12px", color: C.tone, textAlign: "center", margin: "0" }}
						>
							© {new Date().getFullYear()} Adamastor ·{" "}
							<Link
								className="em-muted"
								href="https://adamastor.blog"
								style={{ color: C.tone, textDecoration: "underline" }}
							>
								adamastor.blog
							</Link>
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

CategoryWelcomeEmail.PreviewProps = {
	firstName: "Malik",
	// Two topics → union of signers (Design = Malik, AI = Malik + Afonso) → both,
	// and the plural "these topics" copy path. Swap to a single topic to compare.
	categoryNames: ["Design", "AI"],
	preferencesUrl: "https://adamastor.blog/preferences?token=00000000-0000-0000-0000-000000000000",
} as CategoryWelcomeEmailProps;

export default CategoryWelcomeEmail;
