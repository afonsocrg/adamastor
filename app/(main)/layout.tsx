import MobileTabBar from "@/components/MobileTabBar";
import Navbar from "@/components/navbar";
import { ArrowRightIcon, Linkedin, Rss, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
	return (
		<div>
			<Navbar />
			{/* Container widened to screen-xl (1280px) so editorial pages like
			    /events can breathe. Text-heavy pages constrain themselves
			    further (posts/[id] uses max-w-[750px]; preferences and
			    events/submit use max-w-2xl). Defensive wrappers on / and
			    /about keep them at max-w-screen-lg for comfortable text
			    line lengths. */}
			<main className="max-w-screen-xl mx-auto p-4">{children}</main>

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
			<footer className="mt-12 border-t border-navy-faded dark:border-[rgba(76,228,240,0.12)]">
				<div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
					<p className="text-sm text-muted-foreground">Organising an event in Portugal?</p>
					<Link
						href="/events/submit"
						className="-mx-2 -my-1 mt-1 inline-flex items-center gap-2 rounded-md px-2 py-1 text-base font-semibold text-navy transition-colors hover:bg-navy-faded dark:text-[#E3F2F7] dark:hover:bg-[rgba(76,228,240,0.06)]"
					>
						Submit your event
						<ArrowRightIcon className="h-4 w-4 text-orange-main" aria-hidden="true" />
					</Link>
				</div>

				<div className="border-t border-navy-faded dark:border-[rgba(76,228,240,0.12)]">
					<div className="max-w-screen-xl mx-auto grid grid-cols-1 gap-8 px-4 py-10 md:grid-cols-3 md:gap-12 md:px-8">
						<div>
							<Image
								src="/adamastorMark.svg"
								alt="Adamastor"
								width={214}
								height={188}
								className="h-12 w-auto dark:hidden"
							/>
							<Image
								src="/adamastorMarkDark.svg"
								alt="Adamastor"
								width={214}
								height={188}
								className="hidden h-12 w-auto dark:block"
							/>
						</div>

						<nav aria-label="Our projects" className="space-y-3 md:justify-self-center">
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-pastel">Our projects</p>
							<ul className="space-y-2 text-sm">
								<li>
									<Link
										href="https://lisboaux.com/?utm_source=adamastor&utm_medium=footer&utm_campaign=cross_link"
										rel="noopener"
										target="_blank"
										className="text-navy hover:underline dark:text-[#E3F2F7]"
									>
										LisboaUX
									</Link>
								</li>
								<li>
									<Link
										href="https://github.com/lisboajs?utm_source=adamastor&utm_medium=footer&utm_campaign=cross_link"
										rel="noopener"
										target="_blank"
										className="text-navy hover:underline dark:text-[#E3F2F7]"
									>
										LisboaJS
									</Link>
								</li>
								<li>
									<Link
										href="https://outono.org/?utm_source=adamastor&utm_medium=footer&utm_campaign=cross_link"
										rel="noopener"
										target="_blank"
										className="text-navy hover:underline dark:text-[#E3F2F7]"
									>
										Outono
									</Link>
								</li>
								<li>
									<Link
										href="https://www.linkedin.com/school/fi-portugal/?utm_source=adamastor&utm_medium=footer&utm_campaign=cross_link"
										rel="noopener"
										target="_blank"
										className="text-navy hover:underline dark:text-[#E3F2F7]"
									>
										Founder Institute Portugal
									</Link>
								</li>
								<li>
									<Link
										href="https://www.startupgrind.com/lisbon/?utm_source=adamastor&utm_medium=footer&utm_campaign=cross_link"
										rel="noopener"
										target="_blank"
										className="text-navy hover:underline dark:text-[#E3F2F7]"
									>
										Startup Grind Lisbon
									</Link>
								</li>
							</ul>
						</nav>

						<nav aria-label="Follow us" className="space-y-3 md:justify-self-end">
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-pastel">Follow us</p>
							<ul className="space-y-2 text-sm">
								<li>
									<Link
										href="/feed.xml"
										className="inline-flex items-center gap-2 text-navy hover:underline dark:text-[#E3F2F7]"
									>
										<Rss className="h-4 w-4" aria-hidden="true" />
										RSS
									</Link>
								</li>
								<li>
									<Link
										href="https://x.com/meetAdamastor"
										rel="me noopener"
										target="_blank"
										className="inline-flex items-center gap-2 text-navy hover:underline dark:text-[#E3F2F7]"
									>
										<Twitter className="h-4 w-4" aria-hidden="true" />
										X
									</Link>
								</li>
								<li>
									<Link
										href="https://www.linkedin.com/company/adamastor-magazine/"
										rel="me noopener"
										target="_blank"
										className="inline-flex items-center gap-2 text-navy hover:underline dark:text-[#E3F2F7]"
									>
										<Linkedin className="h-4 w-4" aria-hidden="true" />
										LinkedIn
									</Link>
								</li>
							</ul>
						</nav>
					</div>
				</div>

				<div className="border-t border-navy-faded dark:border-[rgba(76,228,240,0.12)]">
					<div className="max-w-screen-xl mx-auto px-4 py-6 md:px-8">
						<p className="text-center text-base italic text-navy dark:text-[#E3F2F7] [font-family:var(--font-lora-bold)] [text-wrap:balance]">
							Only You Know Who You Can Be
						</p>
					</div>
				</div>

				<div className="border-t border-navy-faded dark:border-[rgba(76,228,240,0.12)]">
					<div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3 px-4 py-4 md:px-8">
						<p className="text-xs text-muted-foreground">© 2026 Adamastor</p>
						<Link
							href="/about"
							className="text-xs text-muted-foreground transition-colors hover:text-navy hover:underline dark:hover:text-[#E3F2F7]"
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
