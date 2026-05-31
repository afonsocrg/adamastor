/**
 * Preferences-link — sent when a visitor requests their tokenized /preferences
 * link. A transactional/utility email (cold register, per the brand doc), so no
 * personal signature or tagline flourish — just a clear action and the
 * frictionless "no password" promise. Shares the design system via ./_theme.
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
import { C, DARK_MODE_CSS, FONTS_HREF, hairline, primaryCtaStyle, RESPONSIVE_CSS, SANS, SERIF } from "./_theme";

interface PreferencesLinkEmailProps {
	preferencesUrl: string;
}

// Malik's piara.li shortener forwards ?text= to wa.me, pre-filling the draft and
// keeping his number out of the email source (same pattern as the events page).
const WHATSAPP_URL = `https://piara.li/wa?text=${encodeURIComponent(
	"Hi Malik, I have a question about my Adamastor subscription.",
)}`;

export const PreferencesLinkEmail = ({ preferencesUrl }: PreferencesLinkEmailProps) => {
	return (
		<Html lang="en" dir="ltr">
			<Head>
				<link rel="stylesheet" href={FONTS_HREF} />
				<meta name="color-scheme" content="light dark" />
				<meta name="supported-color-schemes" content="light dark" />
				<style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />
				<style dangerouslySetInnerHTML={{ __html: DARK_MODE_CSS }} />
			</Head>
			<Preview>Your link to manage which Adamastor emails you get.</Preview>
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
					<Heading
						className="em-text"
						style={{
							fontFamily: SERIF,
							fontWeight: 700,
							fontSize: "30px",
							lineHeight: "1.15",
							letterSpacing: "-0.01em",
							color: C.navy,
							margin: "0",
						}}
					>
						Manage your preferences
					</Heading>

					<Hr className="em-rule" style={{ ...hairline, margin: "20px 0 28px 0" }} />

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						You asked to manage your Adamastor emails. The button below opens your preferences, where you can opt in or
						out of any topic. No password needed.
					</Text>

					{/* Primary CTA — gold pill, centered. */}
					<Section style={{ textAlign: "center", margin: "36px 0 8px 0" }}>
						<Button href={preferencesUrl} className="cta-primary" style={primaryCtaStyle}>
							Open my preferences
						</Button>
					</Section>

					{/* A human path to Malik — the events-page WhatsApp pattern, kept quiet. */}
					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "16px", lineHeight: "1.7", color: C.navy, margin: "16px 0 0 0" }}
					>
						Need a hand?{" "}
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

					{/* Fallback raw link + safety note — quiet utility fine-print. */}
					<Text
						className="em-muted"
						style={{ fontFamily: SANS, fontSize: "14px", lineHeight: "1.6", color: C.tone, margin: "0 0 16px 0" }}
					>
						If the button doesn’t work, copy this link into your browser:
						<br />
						<Link
							className="em-link"
							href={preferencesUrl}
							style={{ color: C.bright, textDecoration: "underline", wordBreak: "break-all" }}
						>
							{preferencesUrl}
						</Link>
					</Text>

					<Text
						className="em-muted"
						style={{ fontFamily: SANS, fontSize: "14px", lineHeight: "1.6", color: C.tone, margin: "0" }}
					>
						Didn’t request this? You can safely ignore this email.
					</Text>

					<Hr className="em-rule" style={hairline} />

					{/* Footer — minimal (transactional). */}
					<Section>
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

PreferencesLinkEmail.PreviewProps = {
	preferencesUrl: "https://adamastor.blog/preferences?token=00000000-0000-0000-0000-000000000000",
} as PreferencesLinkEmailProps;

export default PreferencesLinkEmail;
