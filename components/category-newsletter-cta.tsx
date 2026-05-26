"use client";

import { Input } from "@/components/tailwind/ui/input";
import type { EventCategorySlug } from "@/lib/events/categories";
import {
	clearSavedIdentity,
	clearSubscribed,
	getFirstNameForGreeting,
	getSavedIdentity,
	type SavedIdentity,
} from "@/lib/user-identity";
import { ArrowRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
 * in EventsPageClient — outlined navy-wash card, Lora Bold heading, navy
 * Subscribe text + orange arrow tip as the warmth accent. Editorial, not
 * SaaS-y.
 */
export function CategoryNewsletterCta({ categorySlug, categoryName }: CategoryNewsletterCtaProps) {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [prefilledFrom, setPrefilledFrom] = useState<SavedIdentity | null>(null);

	// One-shot localStorage hydration. The widget only collects email, so we
	// pre-fill that and snapshot the saved name for heading personalization.
	useEffect(() => {
		const saved = getSavedIdentity();
		if (!saved) return;
		setEmail((current) => (current === "" ? saved.email : current));
		setPrefilledFrom(saved);
	}, []);

	const isPrefilledNow = !!prefilledFrom && email === prefilledFrom.email;
	const greetingFirstName = prefilledFrom ? getFirstNameForGreeting(prefilledFrom.name) : "";
	const trimmedEmail = email.trim();
	const canSubmit = EMAIL_PATTERN.test(trimmedEmail);

	function handleNotYou() {
		clearSavedIdentity();
		clearSubscribed();
		setEmail("");
		setPrefilledFrom(null);
	}

	// Casing tweaks so the category reads naturally inside the heading +
	// description frame: "AI" stays uppercase; "Startups & Fundraising" →
	// singular "startup or fundraising" (plural reads awkwardly with the
	// "any … event" and "Every … meetup" templates below).
	function getCategoryNoun(): string {
		if (categoryName === "AI") return "AI";
		if (categoryName === "Startups & Fundraising") return "startup or fundraising";
		return categoryName.toLowerCase();
	}
	const categoryNoun = getCategoryNoun();
	const headingPhrase = `Don't miss any ${categoryNoun} event`;
	const description = `Every ${categoryNoun} meetup, conference, and workshop happening in Portugal, sent each week.`;

	// Funnel the visitor to /subscribe with the category pre-selected and
	// their email pre-filled — never direct-subscribe from here. The full
	// /subscribe form collects a name (so no nameless subscribers) and lets
	// them add the Weekly Digest or other categories before committing.
	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSubmit) return;
		const params = new URLSearchParams({ category: categorySlug, email: trimmedEmail });
		router.push(`/subscribe?${params.toString()}`);
	}

	return (
		<aside className="rounded-lg border border-navy-frame p-5 dark:border-cyan-glow/[0.18]">
			<h2 className="text-lg font-bold text-navy dark:text-cyan-lifted [font-family:var(--font-lora-bold)]">
				{greetingFirstName ? `${headingPhrase}, ${greetingFirstName}` : headingPhrase}
			</h2>
			<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
			<form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
				{isPrefilledNow && (
					<p className="text-xs text-muted-foreground">
						Pre-filled from your last visit.{" "}
						<button
							type="button"
							onClick={handleNotYou}
							className="font-medium text-navy underline underline-offset-4 decoration-navy-tint decoration-2 hover:decoration-navy dark:text-cyan-lifted dark:hover:text-cyan"
						>
							Not you?
						</button>
					</p>
				)}
				<Input
					type="email"
					required
					autoComplete="email"
					inputMode="email"
					spellCheck={false}
					placeholder="ana@yourstartup.pt"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					aria-label={`Email address to subscribe to ${categoryName} events`}
				/>
				<button
					type="submit"
					disabled={!canSubmit}
					className="-mx-2 -my-1 inline-flex items-center gap-2 self-start rounded-md px-2 py-1 text-sm font-semibold text-navy transition-colors hover:bg-navy-wash dark:text-cyan-lifted dark:hover:bg-cyan-glow/[0.06] disabled:opacity-50 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					Subscribe
					<ArrowRightIcon className="h-4 w-4 text-orange-hue" aria-hidden="true" />
				</button>
			</form>
		</aside>
	);
}
