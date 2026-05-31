/**
 * Event same-day alert — to organiser A, when admins approve a new event
 * (organiser B's) that lands in the same category on the same day as A's event.
 *
 * Purpose is informational, not promotional: organisers often don't realise a
 * similar event is sharing their date, which quietly splits attendance and adds
 * effort. We surface it early so A has the full picture and can decide for
 * themselves (adjust, coordinate, or cross-promote). Warm, peer-to-peer register.
 *
 * Only fires for a genuine clash: same category, same day, AND same city. Online
 * events are excluded (no physical-attendance overlap), so the city is a single
 * shared attribute here, surfaced once as the shared frame rather than per event.
 *
 * No colored category chip: the AI category maps to cyan, which email otherwise
 * drops (see docs/emails.md → palette). The category is named in prose instead.
 *
 * Shares the design system via ./_theme. This is the dark-mode PROTOTYPE
 * template: `em-*` classes + DARK_MODE_CSS drive a hand-designed dark variant
 * for clients that honor `prefers-color-scheme` (Apple Mail etc.). Once approved
 * here, the same classes propagate to the other templates.
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
	RESPONSIVE_CSS,
	hairline,
	kickerStyle,
	primaryCtaStyle,
	SANS,
	SERIF,
} from "./_theme";

interface EventSameDayAlertTemplateProps {
	/** Recipient — the organiser whose event was already on the calendar. */
	organiserName: string;
	/** Display name of the shared category, e.g. "Design". */
	categoryName: string;
	/** The shared day, human-formatted, e.g. "Thursday, 28 May 2026". */
	eventDate: string;
	/** The shared city — both events are in-person here (online is never alerted). */
	city: string;
	/** Recipient's existing event (the anchor). */
	yourEventTitle: string;
	yourEventTime: string;
	/** The newly approved event sharing the day. */
	newEventTitle: string;
	newEventTime: string;
	/** Direct link to the new event on Adamastor (optional). */
	newEventUrl?: string | null;
	/** Primary CTA — that day's full lineup on the calendar. */
	lineupUrl: string;
	/** Optional manage/opt-out link for these alerts. */
	manageUrl?: string | null;
}

// (WhatsApp line intentionally omitted on this template — see session notes.)

// Small section label inside the comparison card ("Your event" / "Just added").
const rowLabelStyle = {
	fontFamily: SANS,
	fontSize: "11px",
	fontWeight: 600,
	letterSpacing: "0.1em",
	textTransform: "uppercase" as const,
	color: C.tone,
	margin: "0 0 6px 0",
};

export const EventSameDayAlertTemplate = ({
	organiserName,
	categoryName,
	eventDate,
	city,
	yourEventTitle,
	yourEventTime,
	newEventTitle,
	newEventTime,
	newEventUrl,
	lineupUrl,
	manageUrl,
}: EventSameDayAlertTemplateProps) => {
	return (
		<Html lang="en" dir="ltr">
			<Head>
				{/* Opt into both schemes so auto-inverting clients (Gmail, Outlook
				    Windows) invert gracefully instead of mangling fixed colors. */}
				<meta name="color-scheme" content="light dark" />
				<meta name="supported-color-schemes" content="light dark" />
				<link rel="stylesheet" href={FONTS_HREF} />
				<style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />
				<style dangerouslySetInnerHTML={{ __html: DARK_MODE_CSS }} />
			</Head>
			<Preview>A new {categoryName} event lands on the same day as yours.</Preview>
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
						A heads-up
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
						Another event shares your day
					</Heading>

					<Hr className="em-rule" style={{ ...hairline, margin: "20px 0 28px 0" }} />

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						Hi {organiserName}, a new {categoryName} event was just added in {city} for {eventDate}, the same day as
						your event, <span style={{ fontWeight: 575 }}>{yourEventTitle}</span>.
					</Text>

					{/* Same-day comparison — navy-veil aside, anchored on the shared
					    day + city (both events are in-person in the same city). */}
					<Section
						className="em-aside"
						style={{ backgroundColor: C.veil, borderRadius: "8px", padding: "20px 24px", margin: "24px 0" }}
					>
						<Text
							className="em-text"
							style={{ fontFamily: SANS, fontSize: "13px", fontWeight: 575, color: C.navy, margin: "0 0 16px 0" }}
						>
							{eventDate} · {city}
						</Text>

						<Text className="em-muted" style={rowLabelStyle}>
							Your event
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
							{yourEventTitle}
						</Text>
						<Text className="em-muted" style={{ fontFamily: SANS, fontSize: "14px", color: C.tone, margin: "0" }}>
							{yourEventTime}
						</Text>

						<Hr className="em-rule" style={{ ...hairline, margin: "16px 0" }} />

						<Text className="em-muted" style={rowLabelStyle}>
							Just added
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
							{newEventUrl ? (
								<Link className="em-text" href={newEventUrl} style={{ color: C.navy, textDecoration: "underline" }}>
									{newEventTitle}
								</Link>
							) : (
								newEventTitle
							)}
						</Text>
						<Text className="em-muted" style={{ fontFamily: SANS, fontSize: "14px", color: C.tone, margin: "0" }}>
							{newEventTime}
						</Text>
					</Section>

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 24px 0" }}
					>
						Two events for a similar crowd, same day and city, can split attendance. Worth flagging early, while there's
						still time to adjust, coordinate, or cross-promote. The call is yours.
					</Text>

					<Section style={{ margin: "0 0 8px 0" }}>
						<Button href={lineupUrl} className="cta-primary" style={primaryCtaStyle}>
							See that day's lineup
						</Button>
					</Section>

					<Hr className="em-rule" style={hairline} />

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "15px", lineHeight: "1.4", color: C.navy, margin: "0" }}
					>
						Até breve,
						<br />
						<span style={{ fontWeight: 575 }}>The Adamastor team</span>
					</Text>

					{/* Footer — explains the opt-in + optional manage link. */}
					<Hr className="em-rule" style={hairline} />
					<Text
						className="em-muted"
						style={{
							fontFamily: SANS,
							fontSize: "12px",
							color: C.tone,
							textAlign: "center",
							margin: "0 0 6px 0",
							lineHeight: "1.5",
						}}
					>
						You're receiving this because you asked us to flag events scheduled near yours.
						{manageUrl ? (
							<>
								{" "}
								<Link className="em-muted" href={manageUrl} style={{ color: C.tone, textDecoration: "underline" }}>
									Manage these alerts
								</Link>
								.
							</>
						) : null}
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
				</Container>
			</Body>
		</Html>
	);
};

EventSameDayAlertTemplate.PreviewProps = {
	organiserName: "Sofia",
	categoryName: "Design",
	eventDate: "Thursday, 28 May 2026",
	city: "Lisboa",
	yourEventTitle: "Lisbon Product Design Drinks",
	yourEventTime: "18:30",
	newEventTitle: "UX Research Night #4",
	newEventTime: "19:00",
	newEventUrl: "https://adamastor.blog/events",
	lineupUrl: "https://adamastor.blog/events?date=2026-05-28",
	manageUrl: "https://adamastor.blog/preferences/abc123",
} satisfies EventSameDayAlertTemplateProps;

export default EventSameDayAlertTemplate;
