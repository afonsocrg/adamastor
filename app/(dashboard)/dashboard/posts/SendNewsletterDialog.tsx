"use client";

import { Button } from "@/components/tailwind/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/tailwind/ui/dialog";
import { Input } from "@/components/tailwind/ui/input";
import { Label } from "@/components/tailwind/ui/label";
import { EVENT_CATEGORY_COLORS } from "@/lib/events/categories";
import { cn } from "@/lib/utils";
import { CalendarRange, CalendarX2, Check, Loader2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// The Weekly features a hand-picked, finite set of events — not a 7-day dump.
// Six is the editorial cap (keeps the issue scannable and the inbox light).
const MAX_FEATURED_EVENTS = 6;

interface UpcomingEvent {
	id: string;
	title: string;
	start_time: string;
	city: string;
	categorySlugs: string[];
	/** First name of the team member who added it, else null (community/scraped). */
	addedBy: string | null;
}

interface SendNewsletterDialogProps {
	postId: string;
	postTitle: string;
	/** "test" sends to one inbox; "broadcast" sends to every subscriber. */
	mode: "test" | "broadcast";
	/** Recipient for test mode (ignored for broadcast). */
	testEmail: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
	timeZone: "Europe/Lisbon",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});
// en-CA gives YYYY-MM-DD, which sorts chronologically as a string — used as the
// day-grouping key so the picker is organised by day, not a flat soonest-first
// list (which biases the editor toward clustering picks on the nearest day).
const DAY_KEY_FMT = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Europe/Lisbon",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});
const DAY_HEADER_FMT = new Intl.DateTimeFormat("en-GB", {
	timeZone: "Europe/Lisbon",
	weekday: "short",
	day: "numeric",
	month: "short",
});
const SHORT_DAY_FMT = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", weekday: "short" });

function formatCity(city: string): string {
	return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
}

function categoryLabel(slug: string): string {
	return EVENT_CATEGORY_COLORS[slug as keyof typeof EVENT_CATEGORY_COLORS]?.label ?? slug;
}

/** Group events into [dayKey, events[]] pairs, ordered chronologically. */
function groupByDay(events: UpcomingEvent[]): [string, UpcomingEvent[]][] {
	const groups = new Map<string, UpcomingEvent[]>();
	for (const event of events) {
		const key = DAY_KEY_FMT.format(new Date(event.start_time));
		const bucket = groups.get(key);
		if (bucket) bucket.push(event);
		else groups.set(key, [event]);
	}
	return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function SendNewsletterDialog({
	postId,
	postTitle,
	mode,
	testEmail,
	open,
	onOpenChange,
}: SendNewsletterDialogProps) {
	const [events, setEvents] = useState<UpcomingEvent[] | null>(null);
	const [loadingEvents, setLoadingEvents] = useState(false);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [confirmText, setConfirmText] = useState("");
	const [isSending, setIsSending] = useState(false);

	// Load candidate events lazily — only the first time the dialog opens.
	// NOTE: deps are [open, events] ONLY. Putting `loadingEvents` here would
	// re-fire the effect the instant we set it true, and the cleanup would
	// cancel the in-flight request — a self-cancelling fetch.
	useEffect(() => {
		if (!open || events !== null) return;

		let cancelled = false;
		setLoadingEvents(true);
		fetch("/api/events/upcoming")
			.then((res) => {
				if (!res.ok) throw new Error("Failed to load events");
				return res.json();
			})
			.then((data) => {
				if (!cancelled) setEvents(data.events ?? []);
			})
			.catch(() => {
				if (!cancelled) {
					setEvents([]);
					toast.error("Couldn't load upcoming events");
				}
			})
			.finally(() => {
				if (!cancelled) setLoadingEvents(false);
			});

		return () => {
			cancelled = true;
		};
	}, [open, events]);

	const selectedSet = new Set(selectedIds);
	const atLimit = selectedIds.length >= MAX_FEATURED_EVENTS;
	const isBroadcast = mode === "broadcast";
	const grouped = events ? groupByDay(events) : [];

	// Live distribution of the current picks across days — the "spread cue" that
	// makes day-clustering visible so the editor self-corrects.
	const selectedByDay = (() => {
		const map = new Map<string, { key: string; label: string; count: number }>();
		for (const event of events ?? []) {
			if (!selectedSet.has(event.id)) continue;
			const key = DAY_KEY_FMT.format(new Date(event.start_time));
			const existing = map.get(key);
			if (existing) existing.count += 1;
			else map.set(key, { key, label: SHORT_DAY_FMT.format(new Date(event.start_time)), count: 1 });
		}
		return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
	})();
	const distinctAvailableDays = grouped.length;
	// Nudge only when it's genuinely lopsided: ≥3 picks all on one day while the
	// week offers others. Calm suggestion, never a block — Carlos stays in charge.
	const concentrated = selectedIds.length >= 3 && selectedByDay.length === 1 && distinctAvailableDays > 1;

	function toggleEvent(id: string) {
		setSelectedIds((prev) => {
			if (prev.includes(id)) return prev.filter((x) => x !== id);
			if (prev.length >= MAX_FEATURED_EVENTS) return prev; // cap reached — ignore
			return [...prev, id];
		});
	}

	async function handleSend() {
		if (isBroadcast && confirmText !== "SEND") {
			toast.error("Type SEND to confirm");
			return;
		}

		setIsSending(true);
		try {
			const response = await fetch("/api/sendNewsletter", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					postId,
					eventIds: selectedIds,
					...(isBroadcast ? { broadcast: true, confirmBroadcast: true } : { testEmail }),
				}),
			});

			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Failed to send");

			toast.success(isBroadcast ? "Newsletter sent 🚀" : "Test email sent 📧", {
				description: isBroadcast
					? `Sent to all subscribers · ${result.eventCount} event${result.eventCount === 1 ? "" : "s"}`
					: `Sent to ${result.sentTo} · ${result.eventCount} event${result.eventCount === 1 ? "" : "s"}`,
			});

			setSelectedIds([]);
			setConfirmText("");
			onOpenChange(false);
		} catch (error) {
			toast.error("Failed to send", {
				description: error instanceof Error ? error.message : "Please try again.",
			});
		} finally {
			setIsSending(false);
		}
	}

	const sendDisabled = isSending || (isBroadcast && confirmText !== "SEND");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]">
				<DialogHeader className="space-y-1.5 border-b border-navy-frame px-6 pb-4 pt-6 text-left dark:border-navy-edge">
					<DialogTitle className="text-lg font-semibold text-navy dark:text-navy-lifted">
						{isBroadcast ? "Send the Weekly to all subscribers" : "Send a test of the Weekly"}
					</DialogTitle>
					<DialogDescription className="text-navy-tone dark:text-navy-dim">
						Choose up to {MAX_FEATURED_EVENTS} events to feature in{" "}
						<span className="font-medium text-navy dark:text-navy-lifted">“{postTitle}”</span>, then{" "}
						{isBroadcast ? "confirm below" : "send the test"}.
					</DialogDescription>
				</DialogHeader>

				{/* Event picker */}
				<div className="flex min-h-0 flex-1 flex-col gap-2 px-6 py-4">
					<div className="flex items-baseline justify-between gap-3">
						<span className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-navy-dim">
							Featured events
						</span>
						<span
							className={cn(
								"shrink-0 text-xs tabular-nums",
								atLimit ? "font-semibold text-navy dark:text-navy-lifted" : "text-navy-tone dark:text-navy-dim",
							)}
						>
							{selectedIds.length} of {MAX_FEATURED_EVENTS} selected
						</span>
					</div>

					<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg border border-navy-frame dark:border-navy-edge">
						{loadingEvents ? (
							<div className="flex items-center justify-center gap-2 py-16 text-sm text-navy-tone dark:text-navy-dim">
								<Loader2 className="h-4 w-4 animate-spin" />
								Loading events…
							</div>
						) : grouped.length > 0 ? (
							grouped.map(([dayKey, dayEvents]) => (
								<div key={dayKey}>
									<div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-navy-frame bg-background px-3 py-1.5 dark:border-navy-edge">
										<span className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-tone dark:text-navy-dim">
											{DAY_HEADER_FMT.format(new Date(dayEvents[0].start_time))}
										</span>
										<span className="text-xs tabular-nums text-navy-tone/70 dark:text-navy-dim/70">
											{dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
										</span>
									</div>
									<ul className="divide-y divide-navy-frame dark:divide-navy-edge">
										{dayEvents.map((event) => {
											const isSelected = selectedSet.has(event.id);
											const disabled = !isSelected && atLimit;
											const cats = event.categorySlugs.map(categoryLabel).join(", ");
											return (
												<li key={event.id}>
													<button
														type="button"
														onClick={() => toggleEvent(event.id)}
														disabled={disabled}
														aria-pressed={isSelected}
														className={cn(
															"group flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left transition-colors",
															"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-tint",
															"motion-reduce:transition-none",
															isSelected
																? "bg-navy-veil/70 dark:bg-navy-tint/[0.08]"
																: "hover:bg-navy-frame/50 dark:hover:bg-navy-edge/40",
															disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
														)}
													>
														<span
															aria-hidden="true"
															className={cn(
																"flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
																isSelected
																	? "border-navy bg-navy text-white dark:border-navy-lifted dark:bg-navy-lifted dark:text-navy"
																	: "border-navy-frame bg-white text-transparent group-hover:border-navy-tone/40 dark:border-navy-edge dark:bg-transparent",
															)}
														>
															<Check className="h-3.5 w-3.5" strokeWidth={3} />
														</span>

														<span className="min-w-0 flex-1">
															<span className="block truncate font-medium text-navy dark:text-navy-lifted">
																{event.title}
															</span>
															<span className="mt-0.5 block truncate text-sm text-navy-tone dark:text-navy-dim">
																<span className="tabular-nums">{TIME_FMT.format(new Date(event.start_time))}</span> ·{" "}
																{formatCity(event.city)}
																{cats && ` · ${cats}`}
															</span>
															{event.addedBy && (
																<span className="mt-1 inline-flex items-center gap-1 text-xs text-navy-tone/80 dark:text-navy-dim/80">
																	<UserRound className="h-3 w-3" aria-hidden="true" />
																	Added by {event.addedBy}
																</span>
															)}
														</span>
													</button>
												</li>
											);
										})}
									</ul>
								</div>
							))
						) : (
							<div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
								<CalendarX2 className="h-6 w-6 text-navy-tone/60 dark:text-navy-dim/60" />
								<p className="text-sm text-navy-tone dark:text-navy-dim">No upcoming approved events to feature.</p>
							</div>
						)}
					</div>

					{concentrated && (
						<div className="flex items-start gap-2 rounded-lg bg-navy-veil/70 px-3 py-2 text-xs text-navy-tone dark:bg-navy-tint/[0.06] dark:text-navy-dim">
							<CalendarRange className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
							<span>
								All {selectedIds.length} picks are on {selectedByDay[0].label} — there{" "}
								{distinctAvailableDays - 1 === 1 ? "is" : "are"} {distinctAvailableDays - 1} other day
								{distinctAvailableDays - 1 === 1 ? "" : "s"} with events. Spreading them out gives the Weekly more
								range.
							</span>
						</div>
					)}

					{atLimit && (
						<p className="text-xs text-navy-tone dark:text-navy-dim">
							That’s the maximum — deselect one to choose another.
						</p>
					)}

					{/* Broadcast confirmation gate */}
					{isBroadcast && (
						<div className="mt-1 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
							<p className="text-sm text-amber-900 dark:text-amber-200">
								This sends to <strong>every subscriber</strong> and can’t be undone.
							</p>
							<div className="space-y-1.5">
								<Label htmlFor="confirm-send" className="text-amber-900 dark:text-amber-200">
									Type SEND to confirm
								</Label>
								<Input
									id="confirm-send"
									value={confirmText}
									onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
									placeholder="SEND"
									autoComplete="off"
									className="bg-white dark:bg-transparent"
								/>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="gap-2 border-t border-navy-frame px-6 py-4 dark:border-navy-edge">
					<Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSending}>
						Cancel
					</Button>
					<Button
						onClick={handleSend}
						disabled={sendDisabled}
						className={cn(
							"text-white",
							isBroadcast
								? "bg-[#d4a657] hover:bg-[#d4a657]/90"
								: "bg-navy hover:bg-navy/90 dark:bg-navy-lifted dark:text-navy dark:hover:bg-navy-lifted/90",
						)}
					>
						{isSending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Sending…
							</>
						) : isBroadcast ? (
							"Send to everyone"
						) : (
							"Send test"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
