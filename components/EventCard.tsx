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
import { MapPinIcon, PencilIcon, TrashIcon } from "lucide-react";
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

export function EventCard({ event, onEventClick, onDelete }: EventCardProps) {
	const router = useRouter();
	const { profile } = useUserProfile();
	const isAdmin = profile?.role === "admin" || process.env.NEXT_ALLOW_BAD_UI === "true";

	return (
		<article className="group">
			<ContextMenu>
				<ContextMenuTrigger>
					<Link
						href={event.url}
						target="_blank"
						rel="noopener noreferrer"
						onClick={onEventClick}
						className="flex flex-col rounded-lg rounded-l border-l-4 border-[#04C9D8] px-4 py-4 transition-colors duration-150 ease hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
					>
						<div className="ml-1 flex gap-8 align-top">
							<section className="w-full space-y-3">
								<div className="flex justify-between items-start">
									<h3 className="text-xl font-bold leading-tight text-[#104357] transition-colors duration-150 ease [text-wrap:pretty] group-hover:text-[#24acb5] dark:text-[#E3F2F7] [font-family:var(--font-default)]">
										{event.title}
									</h3>
								</div>
								<p className="line-clamp-2 max-w-[70ch] text-base leading-relaxed text-muted-foreground">
									{event.description}
								</p>

								<div className="flex items-center gap-1.5 text-sm leading-5 text-muted-foreground">
									<MapPinIcon className="h-4 w-4 shrink-0" />
									{event.city.charAt(0).toUpperCase() + event.city.slice(1)}
								</div>
							</section>
						</div>
					</Link>
				</ContextMenuTrigger>
				{isAdmin && (
					<ContextMenuContent>
						<ContextMenuItem
							onClick={(e) => {
								e.preventDefault();
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
