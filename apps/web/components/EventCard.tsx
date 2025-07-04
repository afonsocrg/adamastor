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
	position: number;
	onEventClick: () => void;
	onDelete: (eventId: string) => void;
	isAdmin: boolean;
}

export function EventCard({ event, position, onEventClick, onDelete, isAdmin }: EventCardProps) {
	const router = useRouter();

	return (
		<article className="group">
			<ContextMenu>
				<ContextMenuTrigger>
					<Link
						href={event.url}
						target="_blank"
						rel="noopener noreferrer"
						onClick={onEventClick}
						className="flex flex-col px-4 py-4 rounded-lg hover:bg-accent/50 transition-all animate-in border-l-4 border-[#04C9D8] rounded-l"
					>
						<div className="flex gap-8 align-top ml-1">
							<section className="space-y-3 mb-3 w-full">
								<div className="flex justify-between items-start">
									<h3 className="text-xl font-bold group-hover:text-[#24acb5] [font-family:var(--font-default)]">
										{event.title}
									</h3>
								</div>
								<p className="text-muted-foreground prose line-clamp-2">{event.description}</p>

								<div className="text-muted-foreground flex items-center gap-1">
									<MapPinIcon className="h-5 w-5" />
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
