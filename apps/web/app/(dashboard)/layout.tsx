import { AppSidebar } from "@/components/app-sidebar";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import LoadingScreen from "@/components/loading-screen";
import { Separator } from "@/components/tailwind/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/tailwind/ui/sidebar";
import { SidebarTrigger } from "@/components/tailwind/ui/sidebar";
import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import type React from "react";
import { PostHogIdentifier } from "../providers";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Fetch user profile data at layout level
	const supabase = await createClient();
	const profile = await assertAuthenticated(supabase);

	return (
		<div className="min-h-screen flex">
			<LoadingScreen />
			<PostHogIdentifier userId={profile.id} userEmail={profile.email} />
			<SidebarProvider>
				<AppSidebar profile={profile} />
				<SidebarInset className="flex-1">
					<div className="flex items-center gap-2 px-4 py-3">
						<SidebarTrigger className="-ml-1" />
						<Separator orientation="vertical" className="mr-2 h-4" />
						<DynamicBreadcrumbs />
					</div>
					{children}
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
