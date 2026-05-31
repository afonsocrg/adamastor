import { EventDateBadge } from "@/components/EventDateBadge";
import { formatDate } from "@/lib/datetime";
import type { PublicEvent } from "@/lib/events/fetch-public";
import { withUtm } from "@/lib/events/utm";
import { getDisplayTitle } from "@/lib/posts/kind";
import type { RelatedPost } from "@/lib/posts/related";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface HomeSidebarProps {
	opinions: RelatedPost[];
	upcomingEvents: PublicEvent[];
}

const EVENTS_TIMEZONE = "Europe/Lisbon";

function formatEventDay(date: string | Date): { weekday: string; day: string } {
	const d = new Date(date);
	return {
		weekday: d.toLocaleDateString("en-GB", { timeZone: EVENTS_TIMEZONE, weekday: "short" }),
		day: d.toLocaleDateString("en-GB", { timeZone: EVENTS_TIMEZONE, day: "numeric" }),
	};
}

function formatCity(city: string): string {
	if (!city) return "";
	return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
}

const MODULE_HEADING = "text-xs font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-cyan-dim";
const OPINION_MODULE_HEADING = "text-xs font-semibold uppercase tracking-[0.14em] text-orange-hue";
const MODULE_TITLE =
	"text-[1.0625rem] font-bold leading-snug tracking-tight text-navy [text-wrap:balance] dark:text-cyan-lifted";

/**
 * Homepage sidebar. Two editorial modules stacked at desktop, collapsing
 * to a coda below the main column on mobile. Module chrome (border + radius)
 * applies only at lg+; on mobile we drop the card register per the design
 * system, so the sidebar reads as a continuation of the page rather than two
 * boxed widgets.
 *
 * Modules:
 *   1. "From the opinion desk" — recent opinion-kind posts. Mirrors the
 *      ReadNext strip on `/posts/[id]` so an Opinion reader meets the same
 *      typographic language on both surfaces.
 *   2. "Upcoming events" — top N upcoming events with UTM-tagged outbound
 *      links to the event source (Luma/Eventbrite/etc.) + a "Browse all
 *      events →" exit to `/events`. Cross-route bridge: readers who switch
 *      between `/` and `/events` see the other surface's content surfaced.
 */
export default function HomeSidebar({ opinions, upcomingEvents }: HomeSidebarProps) {
	if (opinions.length === 0 && upcomingEvents.length === 0) return null;

	return (
		<aside className="flex flex-col gap-8 lg:gap-10">
			{opinions.length > 0 && (
				<section className="lg:rounded-md lg:border lg:border-navy-frame lg:bg-white lg:p-6 lg:dark:border-cyan-glow/[0.18] lg:dark:bg-transparent">
					<header className="space-y-2">
						<p className={OPINION_MODULE_HEADING}>From the opinion desk</p>
						<h2 className={MODULE_TITLE}>Named voices in the ecosystem</h2>
					</header>
					<ul className="mt-4 divide-y divide-navy-frame dark:divide-cyan-glow/[0.12]">
						{opinions.map((post) => (
							<li key={post.id}>
								<Link
									href={`/posts/${post.slug ?? post.id}`}
									className="group flex items-start gap-3 py-4 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								>
									{post.authors?.image_url ? (
										<Image
											src={post.authors.image_url}
											alt={post.authors.name ?? "Author portrait"}
											width={40}
											height={40}
											className="h-10 w-10 shrink-0 rounded-full border border-navy-frame object-cover"
										/>
									) : null}
									<div className="min-w-0 flex-1">
										<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-hue">Opinion</p>
										<h3 className="mt-1 text-sm font-semibold leading-snug text-navy [text-wrap:balance] transition-colors group-hover:underline dark:text-cyan-lifted">
											{getDisplayTitle(post.title)}
										</h3>
										<p className="mt-1 text-xs text-navy-tone dark:text-cyan-dim">
											{post.authors?.name ?? "Adamastor"}
											<span aria-hidden="true"> · </span>
											<time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
										</p>
									</div>
								</Link>
							</li>
						))}
					</ul>
				</section>
			)}

			{upcomingEvents.length > 0 && (
				<section className="lg:rounded-md lg:border lg:border-navy-frame lg:bg-white lg:p-6 lg:dark:border-cyan-glow/[0.18] lg:dark:bg-transparent">
					<header className="space-y-2">
						<p className={MODULE_HEADING}>Upcoming</p>
						<h2 className={MODULE_TITLE}>Events worth showing up to</h2>
					</header>
					<ul className="mt-4 divide-y divide-navy-frame dark:divide-cyan-glow/[0.12]">
						{upcomingEvents.map((event) => {
							const { weekday, day } = formatEventDay(event.start_time);
							const decoratedHref = withUtm(event.url, {
								medium: "referral",
								campaign: "home_sidebar_events",
								content: event.id,
							});
							return (
								<li key={event.id}>
									<Link
										href={decoratedHref}
										target="_blank"
										rel="noopener noreferrer"
										className="group flex items-start gap-3 py-4 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									>
										{/* Shared date block — navy-veil surface tone (tint stays
										    reserved for the calendars' active/selected day). */}
										<EventDateBadge
											weekday={weekday}
											day={day}
											dateTime={new Date(event.start_time).toISOString()}
										/>
										<div className="min-w-0 flex-1">
											<h3 className="text-sm font-semibold leading-snug text-navy [text-wrap:pretty] transition-colors group-hover:underline dark:text-cyan-lifted">
												{event.title}
											</h3>
											{event.city && (
												<p className="mt-1 text-xs text-navy-tone dark:text-cyan-dim">{formatCity(event.city)}</p>
											)}
										</div>
									</Link>
								</li>
							);
						})}
					</ul>
					<Link
						href="/events"
						className="mt-4 -mx-2 -my-1 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-navy transition-colors hover:bg-navy-veil/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:text-cyan-lifted dark:hover:bg-cyan-glow/[0.06]"
					>
						Browse all events
						<ArrowRightIcon className="h-4 w-4 text-orange-hue" aria-hidden="true" />
					</Link>
				</section>
			)}
		</aside>
	);
}
