/**
 * Event-submission approved — to the submitter, when their event goes live.
 * Submitter-facing, so it carries the "Message Malik on WhatsApp" contact line.
 * Shares the design system via ./_theme.
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
	hairline,
	kickerStyle,
	primaryCtaStyle,
	RESPONSIVE_CSS,
	SANS,
	SERIF,
} from "./_theme";

interface EventSubmissionApprovedTemplateProps {
	submitterName: string;
	eventTitle: string;
	eventCity: string;
	eventStartTimeLisbon: string;
	eventPageUrl: string;
}

const WHATSAPP_URL = `https://piara.li/wa?text=${encodeURIComponent(
	"Hi Malik, my event is live on Adamastor and I have a question.",
)}`;

export const EventSubmissionApprovedTemplate = ({
	submitterName,
	eventTitle,
	eventCity,
	eventStartTimeLisbon,
	eventPageUrl,
}: EventSubmissionApprovedTemplateProps) => {
	return (
		<Html lang="en" dir="ltr">
			<Head>
				<link rel="stylesheet" href={FONTS_HREF} />
				<meta name="color-scheme" content="light dark" />
				<meta name="supported-color-schemes" content="light dark" />
				<style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />
				<style dangerouslySetInnerHTML={{ __html: DARK_MODE_CSS }} />
			</Head>
			<Preview>Your event is live on Adamastor.</Preview>
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
						Your event is live, {submitterName}
					</Heading>

					<Hr className="em-rule" style={{ ...hairline, margin: "20px 0 28px 0" }} />

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						It’s on Adamastor now. Thanks for sharing it with the community.
					</Text>

					{/* Event detail — navy-veil aside */}
					<Section
						className="em-aside"
						style={{ backgroundColor: C.veil, borderRadius: "8px", padding: "20px 24px", margin: "24px 0" }}
					>
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

					<Section style={{ margin: "0 0 24px 0" }}>
						<Button href={eventPageUrl} className="cta-primary" style={primaryCtaStyle}>
							See it on Adamastor
						</Button>
					</Section>

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						Got more coming up? Submit them anytime at{" "}
						<Link
							className="em-link"
							href="https://adamastor.blog/events/submit"
							style={{ color: C.bright, textDecoration: "underline" }}
						>
							adamastor.blog/events/submit
						</Link>
						.
					</Text>

					{/* WhatsApp — direct line to Malik. */}
					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0" }}
					>
						Questions?{" "}
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

EventSubmissionApprovedTemplate.PreviewProps = {
	submitterName: "Ana",
	eventTitle: "Lisbon AI Builders Meetup #12",
	eventCity: "Lisboa",
	eventStartTimeLisbon: "Thu, 28 May 2026, 19:00",
	eventPageUrl: "https://adamastor.blog/events",
} satisfies EventSubmissionApprovedTemplateProps;

export default EventSubmissionApprovedTemplate;
