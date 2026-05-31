/**
 * Event-submission rejected — to the submitter, when we can't publish an event.
 * Gentle register. The "Message Malik on WhatsApp" line doubles as the human
 * path to talk it through or send another. Shares the design system via ./_theme.
 */

import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import { C, DARK_MODE_CSS, FONTS_HREF, hairline, kickerStyle, RESPONSIVE_CSS, SANS, SERIF } from "./_theme";

interface EventSubmissionRejectedTemplateProps {
	submitterName: string;
	eventTitle: string;
	rejectionReason?: string | null;
}

const WHATSAPP_URL = `https://piara.li/wa?text=${encodeURIComponent(
	"Hi Malik, I’d like to talk about my event submission to Adamastor.",
)}`;

export const EventSubmissionRejectedTemplate = ({
	submitterName,
	eventTitle,
	rejectionReason,
}: EventSubmissionRejectedTemplateProps) => {
	return (
		<Html lang="en" dir="ltr">
			<Head>
				<link rel="stylesheet" href={FONTS_HREF} />
				<meta name="color-scheme" content="light dark" />
				<meta name="supported-color-schemes" content="light dark" />
				<style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />
				<style dangerouslySetInnerHTML={{ __html: DARK_MODE_CSS }} />
			</Head>
			<Preview>An update on your event submission.</Preview>
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
						About your event
					</Heading>

					<Hr className="em-rule" style={{ ...hairline, margin: "20px 0 28px 0" }} />

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						Hi {submitterName}, thanks again for submitting <span style={{ fontWeight: 575 }}>{eventTitle}</span>. After
						reviewing it, we weren’t able to publish this one on Adamastor.
					</Text>

					{rejectionReason ? (
						<Section
							className="em-aside"
							style={{ backgroundColor: C.veil, borderRadius: "8px", padding: "20px 24px", margin: "0 0 24px 0" }}
						>
							<Text className="em-muted" style={{ ...kickerStyle(C.tone), marginBottom: "10px" }}>
								Why
							</Text>
							<Text
								className="em-text"
								style={{
									fontFamily: SANS,
									fontSize: "15px",
									color: C.navy,
									margin: "0",
									lineHeight: "1.6",
									whiteSpace: "pre-wrap",
								}}
							>
								{rejectionReason}
							</Text>
						</Section>
					) : null}

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0" }}
					>
						We’d love to feature future events from you. To talk this one through or send another,{" "}
						<Link
							className="em-link"
							href={WHATSAPP_URL}
							style={{ color: C.bright, textDecoration: "underline", fontWeight: 600 }}
						>
							message Malik on WhatsApp
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

EventSubmissionRejectedTemplate.PreviewProps = {
	submitterName: "Ana",
	eventTitle: "Lisbon AI Builders Meetup #12",
	rejectionReason: "This event is outside the startup and tech focus of Adamastor’s audience. Best of luck with it!",
} satisfies EventSubmissionRejectedTemplateProps;

export default EventSubmissionRejectedTemplate;
