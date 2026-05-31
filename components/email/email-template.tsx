/**
 * Welcome email — sent to every new newsletter subscriber (a personal note
 * from Carlos). Shares the design system with the Adamastor Weekly via
 * ./_theme: navy palette, Lora display + Inter body with fallbacks, the
 * two-pillar kicker, gold-pill CTA, navy-frame hairlines. See docs/emails.md.
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

interface EmailTemplateProps {
	firstName: string;
	/**
	 * Tokenized /preferences URL. Optional only so existing PreviewProps and
	 * any old callers keep compiling — every real send should pass it so the
	 * footer "Manage preferences" link works.
	 */
	preferencesUrl?: string;
	/**
	 * URL of the most recent Adamastor Weekly — the "Read the latest edition"
	 * gift. The send route should fetch the latest published weekly and pass it;
	 * falls back to the homepage (which features the latest) when absent.
	 */
	latestEditionUrl?: string;
}

const CARLOS_IMAGE = "https://adamastor.blog/carlos.jpeg";

// What lands in the inbox each Tuesday — concrete, mirrors the Weekly's sections.
const BENEFITS = [
	"Fundraises and founder interviews.",
	"Who to congratulate this week.",
	"Reads, listens, and watches worth your time.",
	"Events worth showing up to.",
];

export const EmailTemplate = ({ firstName, preferencesUrl, latestEditionUrl }: EmailTemplateProps) => {
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
            a.body-link {
              color: ${C.bright};
              text-decoration: underline;
              text-decoration-color: ${C.bright};
              text-decoration-thickness: 1.5px;
              text-underline-offset: 2px;
            }
          `}
				</style>
			</Head>
			<Preview>You’re in. Start with the latest edition.</Preview>
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
					{/* Kicker + Lora welcome headline */}
					<Text className="em-link" style={kickerStyle(C.bright)}>
						Adamastor Weekly
					</Text>
					<Heading
						className="em-text"
						style={{
							fontFamily: SERIF,
							fontWeight: 700,
							fontSize: "32px",
							lineHeight: "1.15",
							letterSpacing: "-0.01em",
							color: C.navy,
							margin: "10px 0 0 0",
						}}
					>
						Welcome, {firstName}
					</Heading>

					<Hr className="em-rule" style={{ ...hairline, margin: "20px 0 28px 0" }} />

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						You’ve joined the Adamastor Weekly, a weekly read on Portugal’s startup scene. Every Tuesday I cover what
						mattered across the ecosystem, and leave out the rest.
					</Text>

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						I’ve curated this read since 2017. It exists so you don’t have to read the newspapers, scan LinkedIn, and
						follow a dozen pages to keep up with the scene.
					</Text>

					{/* What you'll get — navy-veil aside */}
					<Section
						className="em-aside"
						style={{
							backgroundColor: C.veil,
							borderRadius: "8px",
							padding: "20px 24px",
							margin: "24px 0",
						}}
					>
						<Text className="em-muted" style={{ ...kickerStyle(C.tone), marginBottom: "12px" }}>
							What arrives each Tuesday
						</Text>
						{BENEFITS.map((benefit) => (
							<Text
								key={benefit}
								className="em-text"
								style={{ fontFamily: SANS, fontSize: "15px", lineHeight: "1.5", color: C.navy, margin: "0 0 8px 0" }}
							>
								<span style={{ color: C.tint, fontWeight: 700 }}>•</span>
								{`  ${benefit}`}
							</Text>
						))}
					</Section>

					<Text
						className="em-text"
						style={{ fontFamily: SANS, fontSize: "17px", lineHeight: "1.7", color: C.navy, margin: "0 0 18px 0" }}
					>
						The next edition arrives Tuesday. Until then, start with the most recent:
					</Text>

					{/* Primary CTA — gold pill. Reciprocity-first: give the latest edition
					    before any ask. Falls back to the homepage (features the latest). */}
					<Section style={{ textAlign: "center", margin: "36px 0 24px 0" }}>
						<Button href={latestEditionUrl ?? "https://adamastor.blog"} className="cta-primary" style={primaryCtaStyle}>
							Read the latest edition
						</Button>
					</Section>

					{/* Signature — Carlos. Centered sign-off: portrait on top, then the
					    close. Forms a unified centered wind-down with the CTA + footer. */}
					<Section style={{ textAlign: "center", marginTop: "32px" }}>
						<img
							src={CARLOS_IMAGE}
							alt="Carlos Resende"
							width={56}
							height={56}
							style={{ borderRadius: "50%", display: "inline-block" }}
						/>
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
							Carlos Resende
						</Text>
					</Section>

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
							style={{ fontFamily: SANS, fontSize: "12px", color: C.tone, textAlign: "center", margin: "0 0 8px 0" }}
						>
							© {new Date().getFullYear()} Adamastor. All rights reserved.
						</Text>

						<Text
							className="em-muted"
							style={{ fontFamily: SANS, fontSize: "12px", color: C.tone, textAlign: "center", margin: "0" }}
						>
							<Link
								className="em-muted"
								href="https://adamastor.blog"
								style={{ color: C.tone, textDecoration: "underline" }}
							>
								adamastor.blog
							</Link>
							{preferencesUrl && (
								<>
									{" · "}
									<Link
										className="em-muted"
										href={preferencesUrl}
										style={{ color: C.tone, textDecoration: "underline" }}
									>
										Manage preferences
									</Link>
								</>
							)}
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

EmailTemplate.PreviewProps = {
	firstName: "João",
	latestEditionUrl: "https://adamastor.blog/posts/founder-vs-reality-fit-week-21",
} as EmailTemplateProps;

export default EmailTemplate;
