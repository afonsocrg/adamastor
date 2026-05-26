"use client";

import { EVENT_CATEGORY_COLORS, type EventCategorySlug, isEventCategorySlug } from "@/lib/events/categories";
import { Pencil } from "lucide-react";
import moment from "moment";

interface AgendaEvent {
	id: number | string;
	title: string;
	start: Date;
	end: Date;
	city?: string;
	url?: string;
	categorySlugs?: string[];
}

interface AgendaListProps {
	events: AgendaEvent[];
	date: Date;
	length?: number;
}

// Match react-big-calendar's default agenda window (30 days from the anchor
// date). Toolbar prev/next steps by the same amount, so consecutive ranges
// tile cleanly.
const DEFAULT_LENGTH_DAYS = 30;

function formatTime(d: Date): string {
	const m = moment(d);
	return m.minutes() === 0 ? m.format("h A") : m.format("h:mm A");
}

function formatTimeRange(start: Date, end: Date): string {
	return `${formatTime(start)} – ${formatTime(end)}`;
}

function CategoryPill({ slug }: { slug: string }) {
	if (!isEventCategorySlug(slug)) return null;
	const { chip, label } = EVENT_CATEGORY_COLORS[slug as EventCategorySlug];
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider ${chip}`}
		>
			{label}
		</span>
	);
}

export default function AgendaList({ events, date, length = DEFAULT_LENGTH_DAYS }: AgendaListProps) {
	const startRange = moment(date).startOf("day").toDate();
	const endRange = moment(startRange).add(length, "days").toDate();
	// Single `now` per render — used to flag past events. Previously called
	// per-event in the map loop below.
	const nowMs = Date.now();

	const eventsInRange = events
		.filter((e) => e.start >= startRange && e.start < endRange)
		.sort((a, b) => a.start.getTime() - b.start.getTime());

	if (eventsInRange.length === 0) {
		return (
			<div className="rounded-md border border-dashed border-navy-frame px-6 py-16 text-center text-sm leading-relaxed text-muted-foreground dark:border-cyan-glow/[0.18]">
				No events in this window.
			</div>
		);
	}

	const groups = new Map<string, AgendaEvent[]>();
	for (const ev of eventsInRange) {
		const key = moment(ev.start).format("YYYY-MM-DD");
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(ev);
	}

	const todayKey = moment().startOf("day").format("YYYY-MM-DD");

	return (
		<div className="divide-y divide-navy-frame dark:divide-cyan-glow/[0.18]">
			{Array.from(groups.entries()).map(([key, dayEvents]) => {
				const day = moment(key, "YYYY-MM-DD").toDate();
				const isToday = key === todayKey;
				return (
					<section key={key} className="py-6 first:pt-0 last:pb-0">
						<div className="mb-4 flex items-baseline gap-3">
							<h3 className="text-xl font-bold text-navy dark:text-cyan-lifted [font-family:var(--font-lora-bold)]">
								{moment(day).format("dddd, MMM D")}
							</h3>
							{isToday && (
								<span className="rounded-full bg-navy-tint px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-navy dark:bg-cyan-glow/[0.18] dark:text-cyan-lifted">
									Today
								</span>
							)}
						</div>
						<ul className="space-y-3">
							{dayEvents.map((ev) => {
								const primaryCategory = ev.categorySlugs?.[0];
								const isPast = ev.end.getTime() < nowMs;
								return (
									<li
										key={ev.id}
										className={`group flex items-start gap-4 sm:gap-6 ${isPast ? "opacity-40" : ""}`}
									>
										<span className="w-24 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground sm:w-32">
											{formatTimeRange(ev.start, ev.end)}
										</span>
										<div className="min-w-0 flex-1">
											<div className="flex items-start gap-2">
												{ev.url ? (
													<a
														href={ev.url}
														target="_blank"
														rel="noopener noreferrer"
														className="text-sm font-medium text-navy underline-offset-4 decoration-navy-tint decoration-2 hover:underline dark:text-cyan-lifted dark:decoration-cyan-glow/40"
													>
														{ev.title}
													</a>
												) : (
													<span className="text-sm font-medium text-navy dark:text-cyan-lifted">{ev.title}</span>
												)}
												<a
													href={`/events/${ev.id}/edit`}
													className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-navy-wash hover:text-navy group-hover:opacity-100 focus:opacity-100 dark:hover:bg-cyan-glow/[0.12] dark:hover:text-cyan-lifted"
													title="Edit"
													aria-label={`Edit ${ev.title}`}
												>
													<Pencil className="h-3.5 w-3.5" />
												</a>
											</div>
											{(primaryCategory || ev.city) && (
												<div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
													{primaryCategory && <CategoryPill slug={primaryCategory} />}
													{ev.city && <span>{ev.city}</span>}
												</div>
											)}
										</div>
									</li>
								);
							})}
						</ul>
					</section>
				);
			})}
		</div>
	);
}
