import { AppSidebar } from "@/components/app-sidebar";
import { DashboardTrigger } from "@/components/dashboard-trigger";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import RouteTransitionFrame from "@/components/route-transition-frame";
import { SidebarInset, SidebarProvider } from "@/components/tailwind/ui/sidebar";
import { type UserWithProfile, assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type React from "react";
import { PostHogIdentifier } from "../providers";

async function getPendingSubmissionsCount(): Promise<number> {
	try {
		const supabase = createServiceRoleClient();
		const { count, error } = await supabase
			.from("events")
			.select("id", { count: "exact", head: true })
			.eq("status", "pending");
		if (error) {
			console.error("DashboardLayout: failed to count pending submissions", error);
			return 0;
		}
		return count ?? 0;
	} catch (error) {
		console.error("DashboardLayout: pending submissions count threw", error);
		return 0;
	}
}

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Fetch user profile data at layout level
	const supabase = await createClient();
	let profile: UserWithProfile;
	try {
		profile = await assertAuthenticated(supabase);
	} catch {
		redirect("/login");
	}

	if (profile.role !== "admin") {
		redirect("/dashboard");
	}

	const pendingSubmissionsCount = await getPendingSubmissionsCount();

	const cookieStore = await cookies();
	const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

	return (
		<div className="min-h-screen flex">
			<PostHogIdentifier userId={profile.id} userEmail={profile.email} />
			<SidebarProvider defaultOpen={sidebarOpen}>
				<AppSidebar profile={profile} pendingSubmissionsCount={pendingSubmissionsCount} />
				<SidebarInset className="flex-1">
					<div className="flex items-center gap-2 px-4 py-5">
						<DashboardTrigger placement="topbar" className="-ml-1" />
						<DynamicBreadcrumbs />
					</div>
					<RouteTransitionFrame>{children}</RouteTransitionFrame>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
