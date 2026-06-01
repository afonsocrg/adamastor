"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/tailwind/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/tailwind/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/tailwind/ui/sidebar";

export function NavUser({
	user,
}: {
	user: {
		name: string;
		email: string;
		avatar?: string;
	};
}) {
	const { isMobile } = useSidebar();
	const displayName = user.name[0]?.toUpperCase() + user.name.slice(1);
	const nameParts = user.name.trim().split(/\s+/);
	const initials =
		nameParts.length >= 2
			? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
			: nameParts[0][0]?.toUpperCase() || "U";

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-navy-frame hover:bg-navy-frame dark:data-[state=open]:bg-navy-edge/50 dark:hover:bg-navy-edge/40"
						>
							<Avatar className="h-8 w-8 rounded-full">
								{user.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
								<AvatarFallback className="rounded-full bg-navy-frame dark:bg-navy-edge text-navy-shade dark:text-navy-lifted text-xs font-medium">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left leading-tight">
								<span className="truncate text-sm font-medium text-navy-shade">{displayName}</span>
								<span className="truncate text-xs text-navy-tone">{user.email}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-3.5 text-navy-tone" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-full">
									{user.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
									<AvatarFallback className="rounded-full bg-navy-frame dark:bg-navy-edge text-navy-shade dark:text-navy-lifted text-xs font-medium">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left leading-tight">
									<span className="truncate text-sm font-medium text-navy-shade">{displayName}</span>
									<span className="truncate text-xs text-navy-tone">{user.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />

						<DropdownMenuItem>
							<LogOut />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
