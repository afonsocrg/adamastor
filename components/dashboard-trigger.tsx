"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/tailwind/ui/button";
import { useSidebar } from "@/components/tailwind/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tailwind/ui/tooltip";
import { cn } from "@/lib/utils";

interface DashboardTriggerProps {
	placement: "sidebar" | "topbar";
	className?: string;
}

export function DashboardTrigger({ placement, className }: DashboardTriggerProps) {
	const { toggleSidebar, state } = useSidebar();
	const isExpanded = state === "expanded";

	const Icon = isExpanded ? ChevronsLeft : ChevronsRight;
	const label = isExpanded ? "Hide sidebar" : "Show sidebar";

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					data-sidebar="trigger"
					variant="ghost"
					size="icon"
					aria-label={label}
					className={cn(
						"h-8 w-8 text-navy-tone hover:bg-navy-frame hover:text-navy-shade",
						"transition-opacity duration-200 ease-out motion-reduce:transition-none",
						placement === "sidebar" && [
							"opacity-0",
							"group-hover/sidebar-header:opacity-100 focus-visible:opacity-100",
						],
						placement === "topbar" &&
							(isExpanded
								? "opacity-0 pointer-events-none"
								: "opacity-100 delay-150"),
						className,
					)}
					onClick={toggleSidebar}
				>
					<Icon className="h-4 w-4" />
					<span className="sr-only">{label}</span>
				</Button>
			</TooltipTrigger>
			<TooltipContent
				side={placement === "sidebar" ? "right" : "bottom"}
				className="flex items-center gap-2"
			>
				<span>{label}</span>
				<kbd className="inline-flex h-5 items-center rounded border border-navy-frame bg-navy-frame/40 px-1.5 font-mono text-[10px] text-navy-tone">
					⌘B
				</kbd>
			</TooltipContent>
		</Tooltip>
	);
}
