"use client";

import { Collapsible } from "@/components/tailwind/ui/collapsible";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/tailwind/ui/sidebar";
import { cn } from "@/lib/utils"; // Assuming you have this utility
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon: LucideIcon;
		isActive?: boolean;
		items?: {
			title: string;
			url: string;
		}[];
	}[];
}) {
	const pathname = usePathname();

	// Helper function to check if an item is active
	const isItemActive = (itemUrl: string, subItems?: { url: string }[]) => {
		// Direct match
		if (pathname === itemUrl) return true;

		// Check if any sub-item is active (for parent highlighting)
		if (subItems) {
			return subItems.some((subItem) => pathname === subItem.url);
		}

		// For dashboard-like routes, you might want partial matching
		// Example: '/dashboard' should be active for '/dashboard/profile'
		if (itemUrl !== "/" && pathname.startsWith(itemUrl)) {
			return true;
		}

		return false;
	};

	const isSubItemActive = (subItemUrl: string) => {
		return pathname === subItemUrl;
	};

	return (
		<SidebarGroup>
			{/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
			<SidebarMenu>
				{items.map((item) => {
					const itemActive = isItemActive(item.url, item.items);

					return (
						<Collapsible key={item.title} asChild defaultOpen={itemActive || item.isActive}>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									tooltip={item.title}
									className={cn(
										// Base styles
										"transition-colors duration-200 px-3 py-[18px]",
										// Active state styles
										itemActive && ["bg-neutral-200 dark:bg-accent text-accent-foreground"],
										// Hover styles when not active
										!itemActive && "hover:bg-accent",
									)}
								>
									<a href={item.url}>
										<item.icon
											className={cn(
												"transition-colors duration-200",
												itemActive ? "text-primary" : "text-muted-foreground",
											)}
										/>
										<span
											className={cn(
												"transition-colors duration-200",
												itemActive && "text-accent-foreground font-medium",
											)}
										>
											{item.title}
										</span>
									</a>
								</SidebarMenuButton>

								{item.items?.length ? (
									<>
										<SidebarMenuSub>
											{item.items?.map((subItem) => {
												const subItemActive = isSubItemActive(subItem.url);

												return (
													<SidebarMenuSubItem key={subItem.title}>
														<SidebarMenuSubButton asChild className={cn("transition-colors duration-200 p-4")}>
															<a href={subItem.url}>
																<span
																	className={cn(
																		"transition-colors duration-200",
																		subItemActive && "text-accent-foreground",
																	)}
																>
																	{subItem.title}
																</span>
															</a>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												);
											})}
										</SidebarMenuSub>
									</>
								) : null}
							</SidebarMenuItem>
						</Collapsible>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
