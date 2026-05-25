"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/tailwind/ui/alert-dialog";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/tailwind/ui/context-menu";
import { useUserProfile } from "@/hooks/use-user-profile";
import { withUtm } from "@/lib/events/utm";
import { PencilIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Event {
	id: string;
	title: string;
	description: string;
	start_time: string;
	city: string;
	url: string;
	banner_url?: string;
}

interface EventCardProps {
	event: Event;
	onEventClick: () => void;
	onDelete: (eventId: string) => void;
}

// Europe/Lisbon time formatted as HH:MM (24-hour, publication-grade).
// Locale-agnostic, won't render as "5:30 PM" in en-US.
const TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
	timeZone: "Europe/Lisbon",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

function formatCity(city: string): string {
	return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
}

export function EventCard({ event, onEventClick, onDelete }: EventCardProps) {
	const router = useRouter();
	const { profile } = useUserProfile();
	const isAdmin = profile?.role === "admin" || process.env.NEXT_ALLOW_BAD_UI === "true";

	return (
		// Pure rail layout — events hang off the parent column's navy-faded
		// left border (see EventsPageClient). Cyan dots live on the day
		// headers, not the individual event rows (matches Luma's pattern —
		// the rail marks day transitions, not every entry).
		<article className="group">
			<ContextMenu>
				<ContextMenuTrigger>
					<Link
						href={withUtm(event.url, { medium: "referral", campaign: "events_listing" })}
						target="_blank"
						rel="noopener noreferrer"
						onClick={onEventClick}
						// Clean white at rest, navy-faded outline on hover.
						// Reserves visual change for the interaction signal;
						// default reads as an editorial entry, not a boxed item.
						className="flex flex-col rounded-lg border border-transparent p-4 transition-colors duration-150 ease hover:border-navy-faded dark:hover:border-[rgba(76,228,240,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
					>
						<section className="w-full space-y-2">
							<h3 className="text-xl font-bold leading-tight text-[#104357] [text-wrap:pretty] dark:text-[#E3F2F7] [font-family:var(--font-inter)] decoration-cyan decoration-2 underline-offset-4 group-hover:underline">
								{event.title}
							</h3>
							{/* Metadata strip — time leads (most scannable for "what's
							    happening tonight"), then city. Bullet separator.
							    tabular-nums keeps times column-aligned across cards. */}
							<p className="text-sm leading-5 text-muted-foreground">
								<span className="tabular-nums">{TIME_FORMATTER.format(new Date(event.start_time))}</span>
								<span aria-hidden="true"> · </span>
								<span>{formatCity(event.city)}</span>
							</p>
							<p className="line-clamp-2 max-w-[50ch] text-base leading-relaxed text-muted-foreground">
								{event.description}
							</p>
						</section>
					</Link>
				</ContextMenuTrigger>
				{isAdmin && (
					<ContextMenuContent>
						<ContextMenuItem
							onClick={(e) => {
								e.preventDefault();
								// `/events/[slug]/edit` — [slug] is overloaded to accept
								// city slugs, category slugs, AND numeric event IDs. The
								// edit page short-circuits on /^\d+$/ to pick the ID
								// branch. See app/(main)/events/[slug]/edit/page.tsx.
								router.push(`/events/${event.id}/edit`);
							}}
						>
							<div className="flex gap-2 cursor-pointer">
								<PencilIcon className="h-4 w-4" />
								<div>Edit Event</div>
							</div>
						</ContextMenuItem>
						<ContextMenuItem
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<div className="flex gap-2 cursor-pointer">
										<TrashIcon className="h-4 w-4" />
										<div>Delete Event</div>
									</div>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Are you sure?</AlertDialogTitle>
										<AlertDialogDescription>
											This action cannot be undone. This will permanently delete the event "{event.title}".
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => onDelete(event.id)}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</ContextMenuItem>
					</ContextMenuContent>
				)}
			</ContextMenu>
		</article>
	);
}
