"use client";

import { Collapsible } from "@/components/tailwind/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/tailwind/ui/sidebar";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

export type NavSubItem = { title: string; url: string };

export type NavItem = {
	title: string;
	url: string;
	icon: LucideIcon;
	isActive?: boolean;
	badgeCount?: number;
	items?: NavSubItem[];
};

interface NavMainProps {
	items: NavItem[];
	label?: string;
	dividerTop?: boolean;
}

export function NavMain({ items, label, dividerTop = false }: NavMainProps) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentPathWithSearch = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

	const currentSearch = searchParams.toString();

	// Active iff the item's URL is "currently being viewed". Rules:
	//   - URL with a query (e.g. /posts?tab=my-posts) → require exact pathname AND matching query.
	//   - URL without a query → match exact pathname (no query active), or a deeper child path.
	// Required because two items can share a base pathname (e.g. /posts?tab=my-posts vs /posts/new),
	// and a naive startsWith on the base would light up multiple rows at once.
	const isItemActive = (itemUrl: string, subItems?: NavSubItem[]) => {
		const [itemPath, itemQuery] = itemUrl.split("?");

		if (itemQuery) {
			if (pathname === itemPath && currentSearch === itemQuery) return true;
		} else {
			if (pathname === itemPath && !currentSearch) return true;
			if (pathname.startsWith(`${itemPath}/`)) return true;
		}

		if (subItems) return subItems.some((sub) => isItemActive(sub.url));

		return false;
	};

	const isSubItemActive = (subItemUrl: string) => currentPathWithSearch === subItemUrl;

	return (
		<SidebarGroup className={cn("py-1", dividerTop && "border-t border-navy-frame mt-1 pt-2")}>
			{label ? (
				<SidebarGroupLabel className="font-serif uppercase tracking-[0.18em] text-[10px] text-navy-tone">
					{label}
				</SidebarGroupLabel>
			) : null}

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
										"relative transition-colors duration-200 px-3 py-[18px]",
										itemActive && "bg-navy-tint text-navy-shade font-medium hover:bg-navy-tint",
										!itemActive && "hover:bg-navy-frame",
									)}
								>
									<a href={item.url}>
										<item.icon
											className={cn(
												"transition-colors duration-200",
												itemActive ? "text-navy-shade" : "text-navy-tone",
											)}
										/>
										<span
											className={cn(
												"transition-colors duration-200",
												itemActive ? "text-navy-shade font-medium" : "text-navy-shade/85",
											)}
										>
											{item.title}
										</span>
										{item.badgeCount && item.badgeCount > 0 ? (
											<span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-hue px-1.5 text-[11px] font-semibold leading-none text-white">
												{item.badgeCount > 99 ? "99+" : item.badgeCount}
											</span>
										) : null}
									</a>
								</SidebarMenuButton>

								{item.items?.length ? (
									<SidebarMenuSub className="border-navy-frame">
										{item.items.map((subItem) => {
											const subItemActive = isSubItemActive(subItem.url);
											return (
												<SidebarMenuSubItem key={subItem.title}>
													<SidebarMenuSubButton
														asChild
														className={cn(
															"transition-colors duration-200 p-4",
															subItemActive && "bg-navy-tint text-navy-shade hover:bg-navy-tint",
															!subItemActive && "text-navy-shade/75 hover:text-navy-shade hover:bg-navy-frame",
														)}
													>
														<a href={subItem.url}>
															<span
																className={cn(
																	"transition-colors duration-200",
																	subItemActive && "text-navy-shade font-medium",
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
								) : null}
							</SidebarMenuItem>
						</Collapsible>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
