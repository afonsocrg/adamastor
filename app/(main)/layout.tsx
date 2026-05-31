import AdamastorMark from "@/components/AdamastorMark";
import MobileTabBar from "@/components/MobileTabBar";
import Navbar from "@/components/navbar";
import RouteTransitionFrame from "@/components/route-transition-frame";
import { LinkedInIcon, TwitterIcon } from "@/public/social";
import { ArrowRightIcon, Rss } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

// Footer column primitives. Extracted to keep 15+ link instances and 3
// column headers visually consistent — any future tweak (hover state,
// tracking, color) is a single edit. Constants live here rather than as
// per-instance className duplication to enforce the editorial publication
// register the rest of the footer establishes.
const FOOTER_HEADING = "text-xs font-semibold uppercase tracking-[0.18em] text-navy-tone";
const FOOTER_LINK = "inline-block py-1.5 text-navy transition-colors hover:underline dark:text-cyan-lifted";
const FOOTER_LINK_WITH_ICON = `${FOOTER_LINK} inline-flex items-center gap-2`;
const FOOTER_NAV = "space-y-3 min-w-0";
const FOOTER_LIST = "space-y-2 text-sm";

export default function MainLayout({ children }: { children: ReactNode }) {
	return (
		<div>
			<Navbar />
			{/* Public editorial shell. max-w-6xl (1152px) gives homepage /
			    events enough room for the sidebar while keeping the main
			    reading column cleaner at laptop-wide viewports. Text-heavy
			    pages constrain themselves further where needed. */}
			<main className="max-w-6xl mx-auto p-4">
				<RouteTransitionFrame>{children}</RouteTransitionFrame>
			</main>

			{/* Footer: mid-weight editorial. Three rows:
			    (1) "Submit your event" ask — organiser-acquisition CTA in the
			        inline-subscribe register (navy semibold + orange arrow);
			        we don't reuse the gold pill because the navbar already
			        owns the one gold-per-page moment.
			    (2) Three-column grid — Adamastor seal (editorial colophon) |
			        Sections (Articles · Events · About) | Follow (RSS · X ·
			        LinkedIn). Column labels match the site-nav small-caps +
			        tracking register so the footer reads as a publication
			        index, not a sitemap dump.
			    (3) Copyright strap on a quiet bottom row. */}
			<footer className="mt-12 border-t border-navy-frame dark:border-cyan-glow/[0.12]">
				<div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
					<p className="text-sm text-muted-foreground">Organising an event in Portugal?</p>
					<Link
						href="/events/submit"
						className="-mx-2 -my-1 mt-1 inline-flex items-center gap-2 rounded-md px-2 py-1 text-base font-semibold text-navy transition-colors hover:bg-navy-wash dark:text-cyan-lifted dark:hover:bg-cyan-glow/[0.06]"
					>
						Get your event listed
						<ArrowRightIcon className="h-4 w-4 text-orange-hue" aria-hidden="true" />
					</Link>
				</div>

				<div className="border-t border-navy-frame dark:border-cyan-glow/[0.12]">
					<div className="max-w-6xl mx-auto grid grid-cols-1 gap-8 px-4 py-10 md:grid-cols-4 md:gap-12 md:px-8">
						<div>
							{/* Inlined SVG (not <Image>) so the paths are stylable for the
							    one-shot "ink draw-on" animation on first intersection.
							    Color is driven by currentColor → light/dark via text-*.
							    NOT wrapped in a Link — the seal is the rainbow easter egg
							    (click triggers a SMIL animation in AdamastorMark); a Link
							    wrapper would navigate instead of firing the animation. */}
							<AdamastorMark className="h-12 w-auto text-navy dark:text-white" />
						</div>

						{/* Browse Events: curated site-wide internal links to the highest-
						    intent events route variants. SEO purpose — every page on the
						    site sends link equity + anchor-text signal to these routes;
						    user-discovery purpose — visitors landing on the digest can
						    find their slice of the events surface from any page. Anchors
						    intentionally include geographic suffix ("in Portugal" /
						    "in Lisboa") as keyword-rich link text, even though some
						    destination page titles stay terse. */}
						<nav aria-label="Browse Events" className={FOOTER_NAV}>
							<Link
								href="/events"
								className={`${FOOTER_HEADING} block transition-colors hover:text-navy dark:hover:text-cyan-lifted`}
							>
								Browse Events
							</Link>
							<ul className={FOOTER_LIST}>
								{/* Order: Lisboa-anchored first (highest-intent for our audience),
								    then country-scope brand-aligned beats, ending with the niche
								    category. Reads as broadest-to-narrowest and groups by scope. */}
								<li>
									<Link href="/events/lisboa" className={FOOTER_LINK}>
										Startup events in Lisboa
									</Link>
								</li>
								<li>
									<Link href="/events/startups-fundraising" className={FOOTER_LINK}>
										Startup & Fundraising events in Portugal
									</Link>
								</li>
								<li>
									<Link href="/events/lisboa/software-engineering" className={FOOTER_LINK}>
										Software Engineering events in Lisboa
									</Link>
								</li>
								<li>
									<Link href="/events/design" className={FOOTER_LINK}>
										Design events in Portugal
									</Link>
								</li>
								<li>
									<Link href="/events/ai" className={FOOTER_LINK}>
										AI events in Portugal
									</Link>
								</li>
								<li>
									<Link href="/events/product" className={FOOTER_LINK}>
										Product Management events in Portugal
									</Link>
								</li>
							</ul>
						</nav>

						<nav aria-label="Our Projects" className={FOOTER_NAV}>
							<p className={FOOTER_HEADING}>Our Projects</p>
							<ul className={FOOTER_LIST}>
								<li>
									<Link
										href="https://lisboaux.com/?utm_source=adamastor.blog&utm_medium=footer&utm_campaign=cross_link"
										rel="noopener"
										target="_blank"
										className={FOOTER_LINK}
									>
										LisboaUX
									</Link>
								</li>
								<li>
									<Link
										href="https://github.com/lisboajs?utm_source=adamastor.blog&utm_medium=footer&utm_campaign=cross_link"
										rel="noopener"
										target="_blank"
										className={FOOTER_LINK}
									>
										LisboaJS
									</Link>
								</li>
								<li>
									<Link
										href="https://lisbonaiweek.com/?utm_source=adamastor.blog&utm_medium=footer&utm_campaign=cross_link"
										rel="noopener"
										target="_blank"
										className={FOOTER_LINK}
									>
										Lisbon AI Week
									</Link>
								</li>
								<li>
									<Link
										href="https://outono.org/?utm_source=adamastor.blog&utm_medium=footer&utm_campaign=cross_link"
										rel="noopener"
										target="_blank"
										className={FOOTER_LINK}
									>
										Outono
									</Link>
								</li>
								<li>
									<Link
										href="https://www.linkedin.com/school/fi-portugal/?utm_source=adamastor.blog&utm_medium=footer&utm_campaign=cross_link"
										rel="noopener"
										target="_blank"
										className={FOOTER_LINK}
									>
										Founder Institute Portugal
									</Link>
								</li>
								<li>
									<Link
										href="https://www.startupgrind.com/lisbon/?utm_source=adamastor.blog&utm_medium=footer&utm_campaign=cross_link"
										rel="noopener"
										target="_blank"
										className={FOOTER_LINK}
									>
										Startup Grind Lisbon
									</Link>
								</li>
							</ul>
						</nav>

						{/* Follow Us: dropped the previous `md:justify-self-end` so all
						    three nav columns share a uniform left-aligned grid. The
						    icon-prefix register distinguishes social affordances from
						    the other two columns' text-only links; alignment direction
						    no longer carries that weight. Labels wrapped in <span> so
						    icon/text spacing is stable across formatter passes. */}
						<nav aria-label="Follow Us" className={FOOTER_NAV}>
							<Link
								href="/subscribe"
								className={`${FOOTER_HEADING} block transition-colors hover:text-navy dark:hover:text-cyan-lifted`}
							>
								Follow Us
							</Link>
							<ul className={FOOTER_LIST}>
								<li>
									<Link href="/feed.xml" className={FOOTER_LINK_WITH_ICON}>
										<Rss className="h-4 w-4" aria-hidden="true" />
										<span>RSS</span>
									</Link>
								</li>
								<li>
									<Link
										href="https://x.com/meetAdamastor"
										rel="me noopener"
										target="_blank"
										className={FOOTER_LINK_WITH_ICON}
									>
										<TwitterIcon className="h-4 w-4" aria-hidden="true" />
										<span>X</span>
									</Link>
								</li>
								<li>
									<Link
										href="https://www.linkedin.com/company/adamastor-magazine/"
										rel="me noopener"
										target="_blank"
										className={FOOTER_LINK_WITH_ICON}
									>
										<LinkedInIcon className="h-4 w-4" aria-hidden="true" />
										<span>LinkedIn</span>
									</Link>
								</li>
							</ul>
						</nav>
					</div>
				</div>

				<div className="border-t border-navy-frame dark:border-cyan-glow/[0.12]">
					<div className="max-w-6xl mx-auto px-4 py-6 md:px-8">
						<Link
							href="/about"
							className="block text-center text-base font-bold italic text-navy dark:text-cyan-lifted [font-family:var(--font-lora-bold)] [text-wrap:balance] transition-colors hover:underline underline-offset-4 decoration-navy-tint decoration-2 dark:decoration-cyan-glow/[0.4]"
						>
							Only You Know Who You Can Be
						</Link>
					</div>
				</div>

				<div className="border-t border-navy-frame dark:border-cyan-glow/[0.12]">
					<div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-4 md:px-8">
						<p className="text-xs text-muted-foreground">© 2026 Adamastor</p>
						<Link
							href="/about"
							className="inline-block py-1.5 text-xs text-muted-foreground transition-colors hover:text-navy hover:underline dark:hover:text-cyan-lifted"
						>
							About us
						</Link>
					</div>
				</div>
			</footer>
			<MobileTabBar />
		</div>
	);
}
