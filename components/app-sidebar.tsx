"use client";

import {
	BarChart3Icon,
	CalendarIcon,
	CalendarPlusIcon,
	InboxIcon,
	MailIcon,
	PenSquareIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Image from "next/image";
import type * as React from "react";

import { DashboardTrigger } from "@/components/dashboard-trigger";
import { NavMain, type NavItem } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/tailwind/ui/sidebar";
import type { UserWithProfile } from "@/lib/supabase/authentication";
import { getTeamMember } from "@/lib/team";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	profile?: UserWithProfile;
	pendingSubmissionsCount?: number;
}

export function AppSidebar({ profile, pendingSubmissionsCount = 0, ...props }: AppSidebarProps) {
	const member = getTeamMember(profile?.email);
	const userData = {
		name: member?.name ?? profile?.email?.split("@")[0] ?? "User",
		email: profile?.email ?? "user@example.com",
		avatar: member?.photo,
	};

	const articlesGroup: NavItem[] = [
		{ title: "New article", url: "/dashboard/posts/new", icon: PenSquareIcon },
		{ title: "My articles", url: "/dashboard/posts?tab=my-posts", icon: UserIcon },
		{ title: "Guest articles", url: "/dashboard/posts?tab=others-posts", icon: UsersIcon },
	];

	const eventsGroup: NavItem[] = [
		{ title: "New event", url: "/dashboard/add-event", icon: CalendarPlusIcon },
		{
			title: "Submissions",
			url: "/dashboard/event-submissions",
			icon: InboxIcon,
			badgeCount: pendingSubmissionsCount,
		},
		{ title: "Calendar", url: "/dashboard/calendar", icon: CalendarIcon },
	];

	const readersGroup: NavItem[] = [
		{ title: "Readership", url: "/dashboard/analytics", icon: BarChart3Icon },
		{ title: "Subscribers", url: "/dashboard/subscribers", icon: MailIcon },
	];

	return (
		<Sidebar variant="floating" collapsible="offcanvas" className="[&>div]:bg-white" {...props}>
			<SidebarHeader className="px-2 pt-3 pb-3">
				<div className="group/sidebar-header flex items-center justify-between">
					<a href="/" aria-label="Adamastor" className="flex h-8 items-center pl-[3px]">
						<Image
							src="/adamastorLogotype.svg"
							alt="Adamastor"
							width={140}
							height={28}
							priority
							className="h-7 w-auto"
						/>
					</a>
					<DashboardTrigger placement="sidebar" />
				</div>
			</SidebarHeader>

			<SidebarContent>
				<NavMain label="Articles" items={articlesGroup} />
				<NavMain label="Events" items={eventsGroup} dividerTop />
				<NavMain label="Readers" items={readersGroup} dividerTop />
			</SidebarContent>

			<SidebarFooter>
				<NavUser user={userData} />
			</SidebarFooter>
		</Sidebar>
	);
}
