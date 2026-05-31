/**
 * Event-submission received — to admins, when someone submits an event.
 * Internal/utility, so no WhatsApp affordance (admins are the team) and no
 * warm signature — just the submission and a review CTA. Shares the design
 * system via ./_theme.
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

interface EventSubmissionReceivedTemplateProps {
	eventTitle: string;
	eventDescription: string;
	eventCity: string;
	eventStartTimeLisbon: string;
	eventUrl?: string | null;
	submitterName: string;
	submitterEmail: string;
	reviewUrl: string;
}

export const EventSubmissionReceivedTemplate = ({
	eventTitle,
	eventDescription,
	eventCity,
	eventStartTimeLisbon,
	eventUrl,
	submitterName,
	submitterEmail,
	reviewUrl,
}: EventSubmissionReceivedTemplateProps) => {
	return (
		<Html lang="en" dir="ltr">
			<Head>
				<link rel="stylesheet" href={FONTS_HREF} />
				<meta name="color-scheme" content="light dark" />
				<meta name="supported-color-schemes" content="light dark" />
				<style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />
				<style dangerouslySetInnerHTML={{ __html: DARK_MODE_CSS }} />
			</Head>
			<Preview>New event submission: {eventTitle}</Preview>
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
						New event submission
					</Heading>
					<Text
						className="em-muted"
						style={{ fontFamily: SANS, fontSize: "14px", color: C.tone, margin: "8px 0 0 0", lineHeight: "1.5" }}
					>
						{submitterName} ({submitterEmail}) submitted an event for review.
					</Text>

					<Hr className="em-rule" style={{ ...hairline, margin: "20px 0 28px 0" }} />

					{/* Submission detail — navy-veil aside */}
					<Section
						className="em-aside"
						style={{ backgroundColor: C.veil, borderRadius: "8px", padding: "20px 24px", margin: "0 0 28px 0" }}
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
						<Text
							className="em-muted"
							style={{ fontFamily: SANS, fontSize: "14px", color: C.tone, margin: "0 0 12px 0" }}
						>
							{eventStartTimeLisbon} · {eventCity}
						</Text>
						<Text
							className="em-text"
							style={{
								fontFamily: SANS,
								fontSize: "14px",
								color: C.navy,
								margin: "0",
								lineHeight: "1.6",
								whiteSpace: "pre-wrap",
							}}
						>
							{eventDescription}
						</Text>
						{eventUrl ? (
							<Text style={{ fontFamily: SANS, fontSize: "14px", margin: "12px 0 0 0", lineHeight: "1.5" }}>
								<Link
									className="em-link"
									href={eventUrl}
									style={{ color: C.bright, textDecoration: "underline", wordBreak: "break-all" }}
								>
									{eventUrl}
								</Link>
							</Text>
						) : null}
					</Section>

					<Section style={{ margin: "0 0 8px 0" }}>
						<Button href={reviewUrl} className="cta-primary" style={primaryCtaStyle}>
							Review submission
						</Button>
					</Section>

					<Hr className="em-rule" style={hairline} />

					<Text
						className="em-muted"
						style={{ fontFamily: SANS, fontSize: "12px", color: C.tone, margin: "0", lineHeight: "1.5" }}
					>
						You’re receiving this because you’re an admin on Adamastor.
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

EventSubmissionReceivedTemplate.PreviewProps = {
	eventTitle: "Lisbon AI Builders Meetup #12",
	eventDescription:
		"Monthly gathering of AI engineers and founders building agents, RAG systems, and LLM-powered products. Lightning talks + open networking.",
	eventCity: "Lisboa",
	eventStartTimeLisbon: "Thu, 28 May 2026, 19:00",
	eventUrl: "https://lu.ma/lisbon-ai-builders-12",
	submitterName: "Ana Martins",
	submitterEmail: "ana@yourstartup.pt",
	reviewUrl: "https://adamastor.blog/dashboard/event-submissions",
} satisfies EventSubmissionReceivedTemplateProps;

export default EventSubmissionReceivedTemplate;
