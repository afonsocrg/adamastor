import { buildBreadcrumbListJsonLd } from "@/lib/events/seo";
import { LinkedInIcon, TwitterIcon } from "@/public/social";
import { ArrowRightIcon, Globe, Moon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const SITE_URL = "https://adamastor.blog";
const EDITORIAL_EMAIL = "carlos@adamastor.blog";

const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
	{ name: "Home", pathname: "/" },
	{ name: "About", pathname: "/about" },
]);

// AboutPage + nested Organization schema. Targets AI extractability ("who runs
// Adamastor", "what does Adamastor cover", "how do I contact Adamastor") and
// helps Google connect the publication entity to its social presence via
// sameAs. knowsAbout maps the beats so LLMs can categorise the publication
// without parsing the page body.
const aboutPageJsonLd = {
	"@context": "https://schema.org",
	"@type": "AboutPage",
	name: "About Adamastor",
	url: `${SITE_URL}/about`,
	description:
		"Since 2017, Carlos Resende has written a weekly read on Portugal’s startup scene, originally as the Techstars StartUp Digest Portugal and now as Adamastor Weekly. Plus opinion from contributors across the ecosystem like Productized, Fx2 Group, and Startup Portugal.",
	mainEntity: {
		"@type": "Organization",
		"@id": `${SITE_URL}/#organization`,
		name: "Adamastor",
		alternateName: "Adamastor Magazine",
		url: SITE_URL,
		logo: `${SITE_URL}/adamastorLogotype.svg`,
		foundingDate: "2025-01-14",
		description:
			"A weekly read on Portugal’s startup scene by Carlos Resende, who has curated it every week since 2017, originally for the Techstars StartUp Digest Portugal. Plus opinion pieces by named voices in the ecosystem.",
		knowsAbout: [
			"Portuguese startup ecosystem",
			"Startups",
			"Fundraising",
			"Product Management",
			"Design",
			"Software Engineering",
			"Artificial Intelligence",
		],
		sameAs: ["https://x.com/meetAdamastor", "https://www.linkedin.com/company/adamastor-magazine/"],
		founder: [
			{
				"@type": "Person",
				name: "Carlos Resende",
				url: "https://www.linkedin.com/in/carlosresende47/",
				description:
					"Co-founder of Adamastor and author of Adamastor Weekly, which Carlos has curated since 2017, originally as the Techstars StartUp Digest Portugal. Co-founder of Founder Institute Portugal. Expert Evaluator for the European Commission. Two decades of work in startup funding and finance.",
			},
			{
				"@type": "Person",
				name: "Afonso Gonçalves",
				url: "https://www.linkedin.com/in/afonsocrg/",
				sameAs: [
					"https://www.linkedin.com/in/afonsocrg/",
					"https://x.com/afonsocrg",
					"https://github.com/afonsocrg",
				],
				affiliation: [{ "@type": "Organization", name: "Hackaboa", url: "https://hackaboa.com/" }],
				description:
					"Co-founder of Adamastor. Chapter Director at Startup Grind Lisbon. Founder of Hackaboa, the local chapter of the global Hacker Network for indie builders. Data engineer at Jounce Media. Master’s in Computer Engineering from Instituto Superior Técnico.",
			},
			{
				"@type": "Person",
				name: "Malik Piara",
				url: "https://moonwith.com/",
				sameAs: [
					"https://moonwith.com/",
					"https://x.com/casapiara",
					"https://www.linkedin.com/in/malikpiara/",
				],
				description:
					"Co-founder of Adamastor. Product manager with a software and design engineering background. Builds products that foster connection, enable learning, and create more access to opportunities. His work has helped people start companies (Upframe, which connected 1000+ first-time founders with mentors worldwide), get employment at meaningful places (the LisboaUX Job Board, which matches Portuguese designers with companies and places junior designers with NGOs through its social-impact stream), and find a safe harbour amidst a war (Fuzzboard). Currently building LogiCola 3 (https://logicola.org/), an open-source logic platform that modernised a 40-year-old logic textbook into a cross-platform PWA, now used at universities worldwide.",
			},
		],
		contactPoint: {
			"@type": "ContactPoint",
			email: EDITORIAL_EMAIL,
			contactType: "editorial",
		},
	},
};

export const metadata: Metadata = {
	title: "About Adamastor — Stories from Portugal’s Startup Scene",
	description:
		"Carlos Resende has written a weekly read on Portugal’s startup scene since 2017, now as Adamastor Weekly. Plus opinion from contributors across the ecosystem like Productized, Fx2 Group, and Startup Portugal.",
	alternates: { canonical: "/about" },
	openGraph: {
		title: "About Adamastor — Stories from Portugal’s Startup Scene",
		description:
			"A weekly read on Portugal’s startup scene by Carlos Resende, every week since 2017. Plus opinion from contributors across the ecosystem.",
		url: `${SITE_URL}/about`,
		siteName: "Adamastor",
		type: "website",
		images: [{ url: "/socialPreview2.jpg", width: 1200, height: 630, alt: "Adamastor" }],
	},
	twitter: {
		card: "summary_large_image",
		title: "About Adamastor",
		description:
			"A weekly read on Portugal’s startup scene by Carlos Resende, every week since 2017. Plus opinion from contributors across the ecosystem.",
		images: ["/socialPreview2.jpg"],
	},
};

const sectionLabel = "text-xs font-semibold uppercase tracking-[0.14em] text-navy-tone";
const sectionHeading =
	"text-2xl font-bold text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)] md:text-3xl [text-wrap:balance]";
const editorialLink =
	"font-medium text-navy underline underline-offset-4 decoration-navy-tint decoration-2 hover:decoration-navy dark:text-navy-lifted dark:decoration-navy-tint/40 dark:hover:decoration-navy-lifted";

// Muted reference link — for quiet inline URLs inside small-text contexts
// (masthead bios, author straps, captions). Editorial-print convention: a
// dotted underline reads as "this is a reference" rather than "click me",
// and the navy-tone resting color recedes from navy body text so the link
// doesn't dominate. Hover deepens to navy via colour transition; the dotted
// underline tracks text colour, so no explicit decoration colour is needed.
const mutedLink =
	"text-navy-tone underline decoration-dotted decoration-2 underline-offset-4 transition-colors hover:text-navy dark:text-navy-dim dark:hover:text-navy-lifted";

// Co-founders, masthead-style. Each person gets a role list plus a short bio
// that surfaces the credibility the role lines can't quite carry — Carlos's
// 9-year Techstars Digest lineage, Afonso's technical depth at Jounce Media
// and IST, Malik's broader community-building track record. The bios feed
// per-Person description in JSON-LD for AI citation.
//
// All three portraits run through the SVG duotone filter defined inline at
// the top of the page, giving the masthead one editorial monotone in the
// brand palette. Malik's photo is already B&W; the duotone filter
// desaturates first so all three start from the same tonal source.
type MastheadLinkKind = "linkedin" | "twitter" | "site" | "moon";

type MastheadLink = {
	kind: MastheadLinkKind;
	href: string;
	label: string;
};

type MastheadEntry = {
	name: string;
	img: string;
	bio: ReactNode;
	links: readonly MastheadLink[];
};

// Icon mapping for masthead social links. Keeps the founder data declarative
// (kind: "twitter" instead of importing a component into the data layer),
// and centralises icon choices so adding a future surface (e.g. GitHub for
// engineers, Mastodon) is a one-line addition here + a new kind in the
// union type above.
const linkIconMap = {
	linkedin: LinkedInIcon,
	twitter: TwitterIcon,
	site: Globe,
	moon: Moon,
};

const masthead: readonly MastheadEntry[] = [
	{
		name: "Carlos Resende",
		img: "/carlos.jpeg",
		bio: "Carlos has curated Portugal’s weekly startup read since 2017, originally for Techstars StartUp Digest. He’s co-founder of Founder Institute Portugal and an Expert Evaluator for the European Commission, with two decades in startup funding and finance.",
		links: [
			{
				kind: "linkedin",
				href: "https://www.linkedin.com/in/carlosresende47/",
				label: "Carlos Resende on LinkedIn",
			},
		],
	},
	{
		name: "Afonso Gonçalves",
		img: "/afonso.jpeg",
		bio: (
			<>
				Afonso is Chapter Director of Startup Grind Lisbon and runs{" "}
				<Link href="https://hackaboa.com/?utm_source=adamastor.blog&utm_medium=about&utm_campaign=cross_link" rel="noopener noreferrer" target="_blank" className={mutedLink}>
					Hackaboa
				</Link>
				, the local chapter of the global Hacker Network for indie builders. By day he’s a data engineer at Jounce
				Media, with a Master’s in Computer Engineering from Instituto Superior Técnico.
			</>
		),
		links: [
			{ kind: "linkedin", href: "https://www.linkedin.com/in/afonsocrg/", label: "Afonso Gonçalves on LinkedIn" },
			{ kind: "twitter", href: "https://x.com/afonsocrg", label: "Afonso Gonçalves on X" },
		],
	},
	{
		name: "Malik Piara",
		img: "/malik.jpeg",
		bio: "Malik builds products that foster connection, enable learning, and create more access to opportunities. His work has helped people start companies, get employment at meaningful places, and find a safe harbour amidst a war.",
		links: [
			{
				kind: "moon",
				href: "https://moonwith.com/?utm_source=adamastor.blog&utm_medium=about&utm_campaign=cross_link",
				label: "Malik Piara’s site",
			},
			{ kind: "linkedin", href: "https://www.linkedin.com/in/malikpiara/", label: "Malik Piara on LinkedIn" },
			{ kind: "twitter", href: "https://x.com/casapiara", label: "Malik Piara on X" },
		],
	},
];

export default function About() {
	return (
		// Constrained to screen-lg — narrower than /events because this is
		// text-heavy editorial copy. Reads more comfortably at publication line
		// lengths.
		<div className="mx-auto max-w-screen-lg space-y-16 md:p-4">
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema markup
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema markup
				dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }}
			/>

			{/*
				Inline SVG duotone filter for the masthead portraits. Two-step:
				(1) feColorMatrix desaturates the image to grayscale using Rec. 709
				luminance weights (perceptually accurate B&W).
				(2) feComponentTransfer remaps the gray range to a two-stop gradient
				per channel — darks → #02101A (near-black navy, an extra-deep
				extension of the navy family beyond navy.deep, picked for shadow
				crush), lights → navy.frame (#E8F0F4 = 0.910, 0.941, 0.957). The
				wider stop range gives more contrast AND a darker midpoint than
				the original navy.shade → navy.frame mapping, matching the
				punchy editorial duotone register of the inspiration. Hidden via
				width/height 0 so the SVG occupies no layout space.
			*/}
			<svg
				aria-hidden="true"
				focusable="false"
				className="absolute h-0 w-0"
				style={{ position: "absolute", width: 0, height: 0 }}
			>
				<defs>
					<filter id="duotone-navy-portrait" colorInterpolationFilters="sRGB">
						<feColorMatrix
							type="matrix"
							values="0.2126 0.7152 0.0722 0 0
							        0.2126 0.7152 0.0722 0 0
							        0.2126 0.7152 0.0722 0 0
							        0      0      0      1 0"
						/>
						<feComponentTransfer>
							<feFuncR type="table" tableValues="0.008 0.910" />
							<feFuncG type="table" tableValues="0.063 0.941" />
							<feFuncB type="table" tableValues="0.102 0.957" />
						</feComponentTransfer>
					</filter>
				</defs>
			</svg>

			{/*
				Hero / manifesto. Direct H1 (SEO keyword + reads as a real
				about-page heading), followed by a Lora Bold italic strapline that
				mirrors the masthead-tagline pattern from docs/design-system.md —
				one editorial flourish, no decorative-only flourishes. The strapline
				doubles as the AI-extractable one-sentence definition of Adamastor
				(answers "what is Adamastor"), so LLMs can cite a clean sentence
				before the mythological metaphor unfolds.
			*/}
			<section className="space-y-5">
				<h1 className="text-4xl font-bold tracking-tight leading-tight text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)] md:text-5xl [text-wrap:balance]">
					About Adamastor
				</h1>
				<p className="max-w-[44ch] text-xl font-bold italic leading-snug text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)] [text-wrap:balance] md:text-2xl">
					A weekly read on Portugal’s startup scene.
				</p>
				<div className="space-y-5 pt-3 text-base leading-relaxed text-foreground md:text-lg [&_p]:max-w-[65ch]">
					<p>
						The Adamastor ethos personifies the Cape of Good Hope, once feared as the Cape of Storms. It represents
						the overcoming of fear by venturers and seafarers as they struggled to find a maritime way to India.
					</p>
					<p>
						We follow the founders, operators, investors, researchers, universities, public programs, and regional
						communities turning Portuguese ambition into companies. Part digest, part commentary, part ecosystem
						memory.
					</p>
					<p>
						Adamastor exists because ecosystems need memory, visibility, critique, and connection.
					</p>
				</div>
			</section>

			{/*
				What we publish. The main editorial highlight on the page — two
				streams that define Adamastor's output. Adamastor Weekly is
				Carlos's column (running weekly since 2017, originally the
				Techstars StartUp Digest Portugal); Opinion brings named voices
				in from the ecosystem. Sits between hero and beats so it's the
				first substantive section after the manifesto. Modular cards per the
				Guardian-inspired pattern in the design system — each card sized
				to its content. Subscribe link uses the editorial inline-link
				style; the Opinion block intentionally has no link (no public
				pitch surface yet — the existing carlos@adamastor.blog in "Get in
				touch" handles guest-piece inbound).
			*/}
			<section className="space-y-8 border-t border-navy-frame dark:border-navy-edge pt-12">
				<header className="space-y-2">
					<p className={sectionLabel}>Editorial</p>
					<h2 className={sectionHeading}>What We Publish</h2>
				</header>
				<div className="grid gap-10 md:grid-cols-2">
					<article className="space-y-3">
						<h3 className="text-xl font-bold text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)] [text-wrap:balance]">
							Adamastor Weekly
						</h3>
						<p className="max-w-[55ch] text-base leading-relaxed text-foreground">
							Since 2017, Carlos Resende has curated a weekly read on Portugal’s startup scene, originally as the
							Techstars StartUp Digest Portugal. In 2025, that work evolved into Adamastor Weekly. The raises,
							the launches, the hires, and the stories behind them.
						</p>
						<Link href="/subscribe" className={`${editorialLink} inline-flex items-center gap-2 pt-1`}>
							Subscribe to the Weekly
							<ArrowRightIcon className="h-4 w-4 text-orange-hue" aria-hidden="true" />
						</Link>
					</article>
					<article className="space-y-3">
						<h3 className="text-xl font-bold text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)] [text-wrap:balance]">
							Opinion
						</h3>
						<p className="max-w-[55ch] text-base leading-relaxed text-foreground">
							Occasional guest pieces from named voices in the ecosystem. Past contributors include André Marquet (
							<Link href="https://productized.co/?utm_source=adamastor.blog&utm_medium=about&utm_campaign=cross_link" rel="noopener noreferrer" target="_blank" className={mutedLink}>
								Productized
							</Link>
							), Fernando Fraga (
							<Link href="https://www.fx2group.com/?utm_source=adamastor.blog&utm_medium=about&utm_campaign=cross_link" rel="noopener noreferrer" target="_blank" className={mutedLink}>
								Fx2 Group
							</Link>
							), and João Silva (
							<Link href="https://startupportugal.com/?utm_source=adamastor.blog&utm_medium=about&utm_campaign=cross_link" rel="noopener noreferrer" target="_blank" className={mutedLink}>
								Startup Portugal
							</Link>
							).
						</p>
					</article>
				</div>
			</section>

			{/*
				What we cover. These are the editorial THEMES that run through the
				corpus, not the event categories (those live in
				lib/events/categories.ts and serve /events). The themes are
				distilled from docs/editorial-synthesis.md, which analysed all 76
				public articles. Editorial scope is broader than the 5 event
				beats: it includes decentralization, founder craft, public policy,
				European scale, universities, and capital — none of which are
				event categories but all of which are recurring article themes.
				Hardcoded here because it's editorial positioning, not a
				machine-shared list.
			*/}
			<section className="space-y-6 border-t border-navy-frame dark:border-navy-edge pt-12">
				<header className="space-y-2">
					<p className={sectionLabel}>Our Beats</p>
					<h2 className={sectionHeading}>What We Cover</h2>
				</header>
				<p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground">
					Six recurring threads across the Weekly and Opinion.
				</p>
				<dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
					<div className="space-y-1">
						<dt className="text-lg font-semibold text-navy dark:text-navy-lifted [text-wrap:balance]">
							The ecosystem as a living community
						</dt>
						<dd className="text-base leading-relaxed text-muted-foreground">
							Events, programs, regional builders, and the rituals that make Portuguese entrepreneurship visible
							week to week.
						</dd>
					</div>
					<div className="space-y-1">
						<dt className="text-lg font-semibold text-navy dark:text-navy-lifted [text-wrap:balance]">Decentralization</dt>
						<dd className="text-base leading-relaxed text-muted-foreground">
							Guimarães, Fundão, Algarve, Braga, Coimbra, Aveiro. The regional ecosystems building distributed
							innovation beyond Lisbon and Porto.
						</dd>
					</div>
					<div className="space-y-1">
						<dt className="text-lg font-semibold text-navy dark:text-navy-lifted [text-wrap:balance]">Founder craft</dt>
						<dd className="text-base leading-relaxed text-muted-foreground">
							Resilience, honest feedback, co-founder selection, and the work of building under pressure.
						</dd>
					</div>
					<div className="space-y-1">
						<dt className="text-lg font-semibold text-navy dark:text-navy-lifted [text-wrap:balance]">
							Capital, research, and early-stage support
						</dt>
						<dd className="text-base leading-relaxed text-muted-foreground">
							Angels, venture studios, Startup Voucher, spin-offs, and the bridges from university research to
							market.
						</dd>
					</div>
					<div className="space-y-1">
						<dt className="text-lg font-semibold text-navy dark:text-navy-lifted [text-wrap:balance]">Policy and European scale</dt>
						<dd className="text-base leading-relaxed text-muted-foreground">
							EU Inc, the Digital Enterprise Wallet, defense tech, immigration. The institutional work that lets
							Portuguese companies grow beyond their borders.
						</dd>
					</div>
					<div className="space-y-1">
						<dt className="text-lg font-semibold text-navy dark:text-navy-lifted [text-wrap:balance]">
							AI and digital transformation
						</dt>
						<dd className="text-base leading-relaxed text-muted-foreground">
							Practical AI in healthcare, operations, and the public sector. Moving beyond demo culture into real
							business impact.
						</dd>
					</div>
				</dl>
			</section>

			{/*
				The masthead. Three co-founders. Square headshots in the
				newspaper-publication register (rounded-md, object-cover, navy-frame
				ring). All three portraits run through the SVG duotone filter
				defined inline at the top of the page, mapping luminance to a
				deep-navy → navy-frame gradient so they read as one editorial
				monotone in the brand palette. The Person nodes in the
				AboutPage schema above expose the same people in
				machine-readable form for AI citation.
			*/}
			<section className="space-y-6 border-t border-navy-frame dark:border-navy-edge pt-12">
				<header className="space-y-2">
					<p className={sectionLabel}>The Masthead</p>
					<h2 className={sectionHeading}>Who Runs Adamastor</h2>
				</header>
				<p className="max-w-[65ch] text-base leading-relaxed text-foreground">
					Carlos had been writing a weekly read on Portugal’s startup scene since 2017, first as the Techstars
					StartUp Digest Portugal. Afonso, organising for Startup Grind Lisbon, kept seeing events scheduled against
					each other with no central calendar. Malik wanted to build a publication. We started Adamastor together.
				</p>
				<ul className="grid gap-8 sm:grid-cols-3">
					{masthead.map((person) => (
						<li key={person.name} className="space-y-3">
							<div className="overflow-hidden rounded-md border border-navy-frame dark:border-navy-edge">
								<Image
									alt={person.name}
									src={person.img}
									width={300}
									height={300}
									className="aspect-square h-auto w-full object-cover"
									style={{ filter: "url(#duotone-navy-portrait)" }}
								/>
							</div>
							<div className="space-y-3">
								<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
									<p className="text-lg font-bold text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)]">
										{person.name}
									</p>
									<div className="flex items-center gap-3 translate-y-[2px]">
										{person.links.map((link) => {
											const Icon = linkIconMap[link.kind];
											return (
												<Link
													key={link.href}
													href={link.href}
													rel="noopener noreferrer"
													target="_blank"
													aria-label={link.label}
													className="-m-1 p-1 text-navy-tone transition-colors hover:text-navy dark:text-navy-dim dark:hover:text-navy-lifted"
												>
													<Icon className="h-4 w-4" aria-hidden="true" />
												</Link>
											);
										})}
									</div>
								</div>
								<p className="text-base leading-relaxed text-muted-foreground">{person.bio}</p>
							</div>
						</li>
					))}
				</ul>
			</section>

			{/*
				Community credit. Matches the "Community / credit strap" pattern from
				docs/design-system.md. Reframed to partnership-led (away from
				"sibling communities", which over-claimed the relationship — LisboaJS
				and LisboaUX are Malik's projects, not Adamastor's siblings). Now
				positions everything as partnership across the Portuguese startup
				community. Org links use mutedLink because three solid-decoration
				inline links in one paragraph were visually too loud. UTM scheme
				matches the footer so analytics can split footer-driven cross-clicks
				from About-page ones.
			*/}
			<section className="space-y-6 border-t border-navy-frame dark:border-navy-edge pt-12">
				<header className="space-y-2">
					<p className={sectionLabel}>Wider Network</p>
					<h2 className={sectionHeading}>Curated with the Community</h2>
				</header>
				<p className="max-w-[65ch] text-base leading-relaxed text-foreground">
					Adamastor doesn’t curate in isolation. We work across the Portuguese startup community alongside{" "}
					<Link
						href="https://www.linkedin.com/school/fi-portugal/?utm_source=adamastor.blog&utm_medium=about&utm_campaign=cross_link"
						rel="noopener noreferrer"
						target="_blank"
						className={mutedLink}
					>
						Founder Institute Portugal
					</Link>
					,{" "}
					<Link
						href="https://www.startupgrind.com/lisbon/?utm_source=adamastor.blog&utm_medium=about&utm_campaign=cross_link"
						rel="noopener noreferrer"
						target="_blank"
						className={mutedLink}
					>
						Startup Grind Lisbon
					</Link>
					,{" "}
					<Link
						href="https://github.com/lisboajs?utm_source=adamastor.blog&utm_medium=about&utm_campaign=cross_link"
						rel="noopener noreferrer"
						target="_blank"
						className={mutedLink}
					>
						LisboaJS
					</Link>
					,{" "}
					<Link
						href="https://lisboaux.com/?utm_source=adamastor.blog&utm_medium=about&utm_campaign=cross_link"
						rel="noopener noreferrer"
						target="_blank"
						className={mutedLink}
					>
						LisboaUX
					</Link>
					,{" "}
					<Link
						href="https://casadoimpacto.scml.pt/?utm_source=adamastor.blog&utm_medium=about&utm_campaign=cross_link"
						rel="noopener noreferrer"
						target="_blank"
						className={mutedLink}
					>
						Casa do Impacto
					</Link>
					, and others.
				</p>
			</section>

			{/*
				Get in touch. Two cards, two audiences. Editorial pitches land in
				Carlos's inbox; event submissions get their own dedicated flow so
				they don't get lost in email. Uses the "Inline action with
				hover-background" pattern on the event submit link to mirror the
				footer ask — gives the secondary conversion a consistent home
				across the site.
			*/}
			<section className="space-y-6 border-t border-navy-frame dark:border-navy-edge pt-12">
				<header className="space-y-2">
					<p className={sectionLabel}>Get in Touch</p>
					<h2 className={sectionHeading}>Pitches, Tips, and Submissions</h2>
				</header>
				<dl className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2 rounded-lg border border-navy-frame dark:border-navy-edge p-5">
						<dt className="text-base font-semibold text-navy dark:text-navy-lifted">Editorial</dt>
						<dd className="text-base leading-relaxed text-muted-foreground">
							Send story pitches, contributions, and tips to{" "}
							<a href={`mailto:${EDITORIAL_EMAIL}`} className={editorialLink}>
								{EDITORIAL_EMAIL}
							</a>
							. Carlos reads every one.
						</dd>
					</div>
					<div className="space-y-2 rounded-lg border border-navy-frame dark:border-navy-edge p-5">
						<dt className="text-base font-semibold text-navy dark:text-navy-lifted">Events</dt>
						<dd className="text-base leading-relaxed text-muted-foreground">
							Organising a meetup, conference, or workshop in Portugal?
						</dd>
						<Link
							href="/events/submit"
							className="-mx-2 -my-1 inline-flex items-center gap-2 rounded-md px-2 py-1 text-base font-semibold text-navy transition-colors hover:bg-navy-wash dark:text-navy-lifted dark:hover:bg-navy-tint/[0.06]"
						>
							Submit your event
							<ArrowRightIcon className="h-4 w-4 text-orange-hue" aria-hidden="true" />
						</Link>
					</div>
				</dl>
			</section>
		</div>
	);
}
