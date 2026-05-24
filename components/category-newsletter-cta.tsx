"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import type { EventCategorySlug } from "@/lib/events/categories";
import { useState } from "react";
import { toast } from "sonner";

interface CategoryNewsletterCtaProps {
	categorySlug: EventCategorySlug;
	categoryName: string;
}

/**
 * Inline newsletter CTA shown on a category's /events/[slug] page. Email-only
 * to minimise friction — name is optional in /api/subscribe.
 *
 * Conversion-conscious copy: leads with what the subscriber gets ("Design
 * events delivered weekly") rather than asking them to "join our list".
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
			<aside className="rounded-lg border border-[#04C9D8]/30 bg-[#DFF6F8] px-6 py-5 dark:border-[#04C9D8]/30 dark:bg-[#04C9D8]/10">
				<p className="text-sm font-medium leading-relaxed text-[#104357] dark:text-[#E3F2F7]">
					Thanks — you'll get {categoryName} events in your inbox. Check your email for a welcome message.
				</p>
			</aside>
		);
	}

	return (
		<aside className="rounded-lg border bg-card px-6 py-5 shadow-sm">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-1">
					<h2 className="text-base font-semibold leading-tight text-[#104357] dark:text-[#E3F2F7]">
						Get {categoryName} events in your inbox
					</h2>
					<p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
						A focused weekly digest of {categoryName.toLowerCase()} meetups, conferences, and workshops across Portugal.
						Unsubscribe anytime.
					</p>
				</div>
				<form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
					<Input
						type="email"
						required
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={submitting}
						aria-label={`Email address to subscribe to ${categoryName} events`}
					/>
					<Button type="submit" disabled={submitting || !email.trim()}>
						{submitting ? "Joining…" : "Subscribe"}
					</Button>
				</form>
			</div>
		</aside>
	);
}
