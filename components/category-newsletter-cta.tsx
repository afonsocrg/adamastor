"use client";

import { Input } from "@/components/tailwind/ui/input";
import type { EventCategorySlug } from "@/lib/events/categories";
import { ArrowRightIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CategoryNewsletterCtaProps {
	categorySlug: EventCategorySlug;
	categoryName: string;
}

/**
 * Inline newsletter CTA for a single event category. Lives in the sidebar
 * of /events/[category] pages (and city × category combined routes) so the
 * "Events in your inbox" ask is contextual to whichever category the
 * visitor is browsing. Stacks vertically to fit the narrow sidebar column.
 *
 * Visual treatment mirrors the generic "Events in your inbox" sidebar block
 * in EventsPageClient — outlined navy-faded card, Lora Bold heading, navy
 * Subscribe text + orange arrow tip as the warmth accent. Editorial, not
 * SaaS-y.
 */
export function CategoryNewsletterCta({ categorySlug, categoryName }: CategoryNewsletterCtaProps) {
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const trimmed = email.trim();
		if (!trimmed) return;

		setSubmitting(true);
		try {
			const response = await fetch("/api/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: trimmed,
					categories: [categorySlug],
					digest: false,
					pageUrl: window.location.pathname,
					pageTitle: document.title,
				}),
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.error || "Failed to subscribe");
			}

			setDone(true);
			setEmail("");
			toast.success(`You're in — ${categoryName} events coming to your inbox.`);
		} catch (error) {
			toast.error("Subscription failed", {
				description: error instanceof Error ? error.message : "Please try again later.",
			});
		} finally {
			setSubmitting(false);
		}
	}

	if (done) {
		return (
			<aside className="rounded-lg border border-navy-faded p-5 dark:border-[rgba(76,228,240,0.18)]">
				<p className="text-sm leading-relaxed text-navy dark:text-[#E3F2F7]">
					Thanks — you'll get <span className="font-semibold">{categoryName}</span> events in your inbox. Check your email
					for a welcome message.
				</p>
			</aside>
		);
	}

	return (
		<aside className="rounded-lg border border-navy-faded p-5 dark:border-[rgba(76,228,240,0.18)]">
			<h2 className="text-lg font-bold text-navy dark:text-[#E3F2F7] [font-family:var(--font-lora-bold)]">
				{categoryName} events in your inbox
			</h2>
			<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
				A focused weekly digest of {categoryName.toLowerCase()} meetups, conferences, and workshops across Portugal.
			</p>
			<form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
				<Input
					type="email"
					required
					autoComplete="email"
					inputMode="email"
					spellCheck={false}
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					disabled={submitting}
					aria-label={`Email address to subscribe to ${categoryName} events`}
				/>
				<button
					type="submit"
					disabled={submitting || !email.trim()}
					className="inline-flex items-center gap-2 self-start text-sm font-semibold text-navy hover:text-cyan-darker dark:text-[#E3F2F7] dark:hover:text-cyan transition-colors disabled:opacity-50 disabled:hover:text-navy disabled:dark:hover:text-[#E3F2F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
				>
					{submitting ? "Joining…" : "Subscribe"}
					<ArrowRightIcon className="h-4 w-4 text-orange-main" aria-hidden="true" />
				</button>
			</form>
		</aside>
	);
}
