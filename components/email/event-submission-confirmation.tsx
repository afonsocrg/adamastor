/**
 * Event-submission confirmation — to the submitter, right after they submit.
 * Shares the design system via ./_theme. Submitter-facing, so it carries the
 * "Message Malik on WhatsApp" affordance (the events-page pattern: a direct,
 * personal line to Malik), positioned for organiser relationship-building.
 */

import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import { C, DARK_MODE_CSS, FONTS_HREF, hairline, kickerStyle, RESPONSIVE_CSS, SANS, SERIF } from "./_theme";

interface EventSubmissionConfirmationTemplateProps {
	submitterName: string;
	eventTitle: string;
	eventCity: string;
	eventStartTimeLisbon: string;
}

// Malik's piara.li shortener forwards ?text= to wa.me, pre-filling the draft and
// keeping his number out of the email source (same pattern as the events page).
const WHATSAPP_URL = `https://piara.li/wa?text=${encodeURIComponent(
	"Hi Malik, I just submitted an event to Adamastor and have a question.",
)}`;

export const EventSubmissionConfirmationTemplate = ({
	submitterName,
	eventTitle,
	eventCity,
	eventStartTimeLisbon,
}: EventSubmissionConfirmationTemplateProps) => {
	return (
		<Html lang="en" dir="ltr">
			<Head>
				<link rel="stylesheet" href={FONTS_HREF} />
				<meta name="color-scheme" content="light dark" />
				<meta name="supported-color-schemes" content="light dark" />
				<style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />
				<style dangerouslySetInnerHTML={{ __html: DARK_MODE_CSS }} />
			</Head>
			<Preview>We got your event. Review coming up.</Preview>
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
					<Text className="em-muted" style={kickerStyle(C.tone)}>
						Event submission
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
						Thanks, {submitterName}
					</Heading>

					<Hr className="em-rule" style={{ ...hairline, margin: "20px 0 28px 0" }} />

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						We received your event, and the team will review it shortly. You’ll hear from us once it’s live, or with
						feedback if we need anything from you.
					</Text>

					{/* Submission detail — navy-veil aside */}
					<Section
						className="em-aside"
						style={{ backgroundColor: C.veil, borderRadius: "8px", padding: "20px 24px", margin: "24px 0" }}
					>
						<Text className="em-muted" style={{ ...kickerStyle(C.tone), marginBottom: "10px" }}>
							Your submission
						</Text>
						<Text
							className="em-text"
							style={{
								fontFamily: SANS,
								fontSize: "17px",
								fontWeight: 575,
								color: C.navy,
								margin: "0 0 4px 0",
								lineHeight: "1.35",
							}}
						>
							{eventTitle}
						</Text>
						<Text className="em-muted" style={{ fontFamily: SANS, fontSize: "14px", color: C.tone, margin: "0" }}>
							{eventStartTimeLisbon} · {eventCity}
						</Text>
					</Section>

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						We usually reply within a couple of working days.
					</Text>

					{/* WhatsApp — direct line to Malik (events-page pattern). */}
					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0" }}
					>
						Questions in the meantime?{" "}
						<Link
							className="em-link"
							href={WHATSAPP_URL}
							style={{ color: C.bright, textDecoration: "underline", fontWeight: 600 }}
						>
							Message Malik on WhatsApp
						</Link>
						.
					</Text>

					<Hr className="em-rule" style={hairline} />

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "15px", lineHeight: "1.4", color: C.navy, margin: "0" }}
					>
						Até breve,
						<br />
						<span style={{ fontWeight: 575 }}>The Adamastor team</span>
					</Text>

					{/* Footer — minimal (transactional). */}
					<Hr className="em-rule" style={hairline} />
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
				</Container>
			</Body>
		</Html>
	);
};

EventSubmissionConfirmationTemplate.PreviewProps = {
	submitterName: "Ana",
	eventTitle: "Lisbon AI Builders Meetup #12",
	eventCity: "Lisboa",
	eventStartTimeLisbon: "Thu, 28 May 2026, 19:00",
} satisfies EventSubmissionConfirmationTemplateProps;

export default EventSubmissionConfirmationTemplate;
