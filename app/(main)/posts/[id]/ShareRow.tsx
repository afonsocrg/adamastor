"use client";

import { BlueskyIcon, LinkedInIcon, TwitterIcon, WhatsAppIcon } from "@/public/social";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tailwind/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, Link as LinkIcon } from "lucide-react";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";

interface ShareRowProps {
	className?: string;
}

// 44×44 hit target at mobile (Apple HIG / Material / WCAG 2.5.5 AAA);
// compresses to 36×36 at sm+ where mouse precision makes the larger target
// feel like wasted chrome. Icon stays 16×16 in both; only the surrounding
// hit-area scales.
const iconButton =
	"inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-full text-navy-tone transition-colors hover:bg-navy-veil/40 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 dark:text-navy-dim dark:hover:bg-navy-tint/[0.06] dark:hover:text-navy-lifted";

export default function ShareRow({ className }: ShareRowProps) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			posthog.capture("shared_post", {
				share_method: "copy_link",
				page: window.location.pathname,
				post_title: encodeURIComponent(document.title),
			});
			toast.success("Link copied");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Couldn’t copy the link");
		}
	}

	function handleSocial(platform: "bluesky" | "twitter" | "linkedin" | "whatsapp") {
		const rawUrl = window.location.href;
		const url = encodeURIComponent(rawUrl);
		const title = encodeURIComponent(document.title);
		// WhatsApp's `?text=` field concatenates title + URL as a single message
		// (it doesn't render unfurl previews unless the URL is the entire text on
		// its own line — leading newline keeps the title readable AND lets the
		// link unfurl on the recipient side).
		const waText = encodeURIComponent(`${document.title}\n${rawUrl}`);
		posthog.capture("shared_post", {
			share_method: "social",
			trigger: "icon_row",
			channel: platform,
			page: window.location.pathname,
			post_title: title,
		});
		const intentMap: Record<typeof platform, string> = {
			bluesky: `https://bsky.app/intent/compose?text=${url}`,
			twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
			linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
			whatsapp: `https://wa.me/?text=${waText}`,
		};
		window.open(intentMap[platform], "_blank", "noopener,noreferrer");
	}

	return (
		<TooltipProvider delayDuration={120}>
			<div className={cn("flex items-center gap-1", className)}>
				<Tooltip>
					<TooltipTrigger asChild>
						<button type="button" onClick={handleCopy} className={iconButton} aria-label="Copy link to this article">
							{copied ? (
								<Check className="h-4 w-4 text-green-shade" aria-hidden="true" />
							) : (
								<LinkIcon className="h-4 w-4" aria-hidden="true" />
							)}
						</button>
					</TooltipTrigger>
					<TooltipContent>{copied ? "Link copied" : "Copy link"}</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => handleSocial("bluesky")}
							className={iconButton}
							aria-label="Share on Bluesky"
						>
							<BlueskyIcon className="h-4 w-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Share on Bluesky</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => handleSocial("twitter")}
							className={iconButton}
							aria-label="Share on X"
						>
							<TwitterIcon className="h-4 w-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Share on X</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => handleSocial("linkedin")}
							className={iconButton}
							aria-label="Share on LinkedIn"
						>
							<LinkedInIcon className="h-4 w-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Share on LinkedIn</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => handleSocial("whatsapp")}
							className={iconButton}
							aria-label="Share on WhatsApp"
						>
							<WhatsAppIcon className="h-4 w-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Share on WhatsApp</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}
