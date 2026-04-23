"use client";

import { useUserProfile } from "@/hooks/use-user-profile";
import { CalendarPlusIcon, FileTextIcon, LogOutIcon, SquarePenIcon } from "lucide-react";
import Link from "next/link";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./tailwind/ui/hover-card";
import { Separator } from "./tailwind/ui/separator";

export default function NavbarUserMenu() {
	const { profile } = useUserProfile();

	if (!profile) {
		return null;
	}

	return (
		<HoverCard>
			<HoverCardTrigger asChild className="cursor-pointer">
				<Link href="/dashboard/calendar">Account</Link>
			</HoverCardTrigger>
			<HoverCardContent className="flex flex-col rounded-xl space-y-2 p-2 !text-muted-foreground">
				<Link
					href="/dashboard/posts/new"
					className="hover:underline hover:text-primary hover:bg-muted p-2 rounded-md transition-all flex items-center gap-2"
				>
					<SquarePenIcon className="h-4 w-4" />
					New Post
				</Link>
				<Link
					href="/dashboard/posts"
					className="hover:underline hover:text-primary hover:bg-muted p-2 rounded-md transition-all flex items-center gap-2"
				>
					<FileTextIcon className="h-4 w-4" />
					View Posts
				</Link>
				<Link
					href="/dashboard/add-event"
					className="hover:underline hover:text-primary hover:bg-muted p-2 rounded-md transition-all flex items-center gap-2"
				>
					<CalendarPlusIcon className="h-4 w-4" />
					New Event
				</Link>
				<Separator />

				<Link
					prefetch={false}
					href="/logout"
					className="hover:underline hover:text-primary hover:bg-muted p-2 rounded-md transition-all flex items-center gap-2"
				>
					<LogOutIcon className="h-4 w-4" />
					Sign out
				</Link>
			</HoverCardContent>
		</HoverCard>
	);
}
