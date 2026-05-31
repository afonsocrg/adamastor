/**
 * Team subscribe-alert — internal FYI to the team on a new newsletter signup.
 * Staff-only and light. Two render modes, switched purely on the existing
 * `total_subscribers` prop (no send-logic change):
 *   - regular: a modest gold count badge + "{name} just subscribed"
 *   - milestone: when the total lands on a round number, a festive centered
 *     badge ("basic shapes" — a gold circle with a soft gold-tint glow) and
 *     a celebratory headline. Inspired by the Search Console milestone badges.
 * Shares the design system via ../_theme.
 */

import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import {
	C,
	DARK_MODE_CSS,
	FONTS_HREF,
	hairline,
	kickerStyle,
	RESPONSIVE_CSS,
	SANS,
	secondaryCtaStyle,
	SERIF,
} from "../_theme";

interface SubscribeEmailAlertTemplateProps {
	subscriber_name: string;
	subscriber_email: string;
	subscription_date?: string;
	total_subscribers?: number;
	/** Display names of categories the subscriber opted into (e.g. ["Design"]). Empty if none. */
	category_names?: string[];
	digest_subscribed?: boolean;
}

const SUBSCRIBERS_URL = "https://adamastor.blog/dashboard/subscribers";

// Round-number milestones worth a festive email. Dense early (growth feels
// big when you're small), tapering as it scales. Edit freely — purely presentational.
const MILESTONES = [
	50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000, 20000,
	25000, 50000, 75000, 100000,
];
const isMilestone = (n: number | undefined): n is number => typeof n === "number" && MILESTONES.includes(n);

/**
 * Gold count badge — a circle (basic shape, email-safe via border-radius) with
 * the number in white. `glow` adds a soft gold-tint ring (box-shadow; degrades
 * to a plain circle in Outlook). White-on-gold per the brand rule.
 */
function CountBadge({
	count,
	size,
	fontSize,
	glow,
}: {
	count: number;
	size: number;
	fontSize: number;
	glow?: boolean;
}) {
	return (
		<div
			style={{
				display: "inline-block",
				width: `${size}px`,
				height: `${size}px`,
				lineHeight: `${size}px`,
				borderRadius: "50%",
				backgroundColor: C.gold,
				color: C.white,
				fontFamily: SANS,
				fontWeight: 700,
				fontSize: `${fontSize}px`,
				letterSpacing: "-0.01em",
				textAlign: "center",
				...(glow ? { boxShadow: `0 0 0 8px ${C.goldTint}` } : {}),
			}}
		>
			{count.toLocaleString()}
		</div>
	);
}

export const SubscribeEmailAlertTemplate = ({
	subscriber_name,
	subscriber_email,
	total_subscribers,
	category_names = [],
	digest_subscribed = false,
}: SubscribeEmailAlertTemplateProps) => {
	const subscribedTo = [
		// Canonical publication name (never "Weekly digest" — see the lexicon canon).
		digest_subscribed ? "Adamastor Weekly" : null,
		...category_names.map((name) => `${name} events`),
	].filter(Boolean) as string[];
	const milestone = isMilestone(total_subscribers);

	const labelStyle = { fontWeight: 575 as const, color: C.navy };
	const rowStyle = { fontFamily: SANS, fontSize: "15px", lineHeight: "1.6", color: C.navy, margin: "0 0 8px 0" };

	return (
		<Html lang="en" dir="ltr">
			<Head>
				<link rel="stylesheet" href={FONTS_HREF} />
				<meta name="color-scheme" content="light dark" />
				<meta name="supported-color-schemes" content="light dark" />
				<style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />
				{/* Light hover BEFORE the dark block so the dark @media hover wins by
				    source order in dark mode (equal specificity → last declared wins). */}
				<style>{`.cta-outline:hover { background-color: ${C.veil} !important; }`}</style>
				<style dangerouslySetInnerHTML={{ __html: DARK_MODE_CSS }} />
			</Head>
			<Preview>
				{milestone
					? `Milestone: ${total_subscribers?.toLocaleString()} subscribers on Adamastor.`
					: `${subscriber_name} just subscribed to Adamastor.`}
			</Preview>
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
					{milestone ? (
						/* Festive milestone — centered badge + celebratory headline */
						<Section style={{ textAlign: "center" }}>
							<div style={{ marginBottom: "20px" }}>
								<CountBadge count={total_subscribers} size={116} fontSize={32} glow />
							</div>
							<Text className="em-muted" style={{ ...kickerStyle(C.tone), textAlign: "center" }}>
								Milestone
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
								We just hit {total_subscribers.toLocaleString()} subscribers
							</Heading>
							<Text
								className="em-text"
								style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "12px 0 0 0" }}
							>
								{subscriber_name} pushed us over the line.
							</Text>
						</Section>
					) : (
						/* Regular — modest count badge + new-subscriber line */
						<>
							{typeof total_subscribers === "number" && (
								<div style={{ marginBottom: "16px" }}>
									<CountBadge count={total_subscribers} size={64} fontSize={18} />
								</div>
							)}
							<Text className="em-muted" style={kickerStyle(C.tone)}>
								New subscriber
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
								{subscriber_name} just subscribed
							</Heading>
						</>
					)}

					<Hr className="em-rule" style={{ ...hairline, margin: "28px 0" }} />

					{/* Details — navy-veil aside. Total lives in the badge, not repeated here. */}
					<Section
						className="em-aside"
						style={{ backgroundColor: C.veil, borderRadius: "8px", padding: "20px 24px", margin: "0 0 28px 0" }}
					>
						<Text className="em-muted" style={{ ...kickerStyle(C.tone), marginBottom: "12px" }}>
							Details
						</Text>
						<Text className="em-text" style={rowStyle}>
							<span style={labelStyle}>Name:</span> {subscriber_name}
						</Text>
						<Text className="em-text" style={{ ...rowStyle, margin: "0" }}>
							<span style={labelStyle}>Email:</span> {subscriber_email}
						</Text>
						<Text className="em-text" style={{ ...rowStyle, margin: "8px 0 0 0" }}>
							<span style={labelStyle}>Subscribed to:</span>{" "}
							{subscribedTo.length > 0 ? subscribedTo.join(", ") : "Nothing yet"}
						</Text>
					</Section>

					<Section style={{ textAlign: milestone ? "center" : "left", margin: "0 0 8px 0" }}>
						<Button href={SUBSCRIBERS_URL} className="cta-outline" style={secondaryCtaStyle}>
							View subscribers
						</Button>
					</Section>

					<Hr className="em-rule" style={hairline} />

					<Text
						className="em-muted"
						style={{ fontFamily: SANS, fontSize: "12px", color: C.tone, margin: "0", lineHeight: "1.5" }}
					>
						Sent to the Adamastor team.
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

SubscribeEmailAlertTemplate.PreviewProps = {
	subscriber_name: "João Silva",
	subscriber_email: "joao.silva@startup.pt",
	// A milestone value (1000) so the preview shows the festive variant.
	// Change to a non-round number (e.g. 1432) to see the regular alert.
	total_subscribers: 1000,
	category_names: ["Design"],
	digest_subscribed: true,
} satisfies SubscribeEmailAlertTemplateProps;

export default SubscribeEmailAlertTemplate;
