"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/tailwind/ui/alert-dialog";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Label } from "@/components/tailwind/ui/label";
import { EVENT_CATEGORIES, type EventCategorySlug, isEventCategorySlug } from "@/lib/events/categories";
import {
	clearSavedIdentity,
	clearSubscribed,
	getFirstNameForGreeting,
	getSavedIdentity,
	saveIdentity,
	setSubscribed,
	type SavedIdentity,
} from "@/lib/user-identity";
import { ArrowRightIcon, Linkedin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Mirrors the gate on /preferences. Server-side validation in /api/subscribe
// is the authoritative check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SubscribePageClient() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Deep-link params from the per-category widget on /events/[city]/[category].
	// When a category arrives via the URL, we honor that specific intent —
	// pre-check the category, toggle the digest OFF (user explicitly came
	// for category emails, not the editorial digest), and pre-fill the
	// email they typed before navigating.
	const urlCategoryParam = searchParams.get("category");
	const urlCategory: EventCategorySlug | null =
		urlCategoryParam && isEventCategorySlug(urlCategoryParam) ? urlCategoryParam : null;
	const urlEmail = searchParams.get("email")?.trim() ?? "";

	const [name, setName] = useState("");
	const [email, setEmail] = useState(urlEmail);
	const [digest, setDigest] = useState(!urlCategory);
	const [categories, setCategories] = useState<Set<EventCategorySlug>>(
		() => (urlCategory ? new Set([urlCategory]) : new Set()),
	);
	const [submitting, setSubmitting] = useState(false);
	const [leaving, setLeaving] = useState(false);
	const [done, setDone] = useState(false);
	const [submittedEmail, setSubmittedEmail] = useState("");
	const [wasNewSubscription, setWasNewSubscription] = useState(true);
	const [navIntent, setNavIntent] = useState<string | null>(null);
	const [prefilledFrom, setPrefilledFrom] = useState<SavedIdentity | null>(null);

	// One-shot hydration from localStorage. Runs after first paint so SSR
	// stays clean (one-frame flash is acceptable for two fields). We only
	// hydrate when both fields are still empty — if the user started typing
	// before this fires, don't clobber.
	useEffect(() => {
		const saved = getSavedIdentity();
		if (!saved) return;
		setName((current) => (current === "" ? saved.name : current));
		setEmail((current) => (current === "" ? saved.email : current));
		setPrefilledFrom(saved);
	}, []);

	const isPrefilledNow =
		!!prefilledFrom && name === prefilledFrom.name && email === prefilledFrom.email;
	// Snapshot first name at prefill time so the H1 stays stable while the
	// user edits the inputs (live-updating would feel reactive/noisy).
	const greetingFirstName = prefilledFrom ? getFirstNameForGreeting(prefilledFrom.name) : "";

	function handleNotYou() {
		clearSavedIdentity();
		clearSubscribed();
		setName("");
		setEmail("");
		setPrefilledFrom(null);
	}

	const trimmedName = name.trim();
	const trimmedEmail = email.trim();
	const hasAtLeastOneOptIn = digest || categories.size > 0;
	const canSubmit =
		trimmedName.length > 0 && EMAIL_PATTERN.test(trimmedEmail) && hasAtLeastOneOptIn && !submitting;

	// Sticky-bar guardrail: if the user has any opt-in selected but has
	// scrolled past the in-form Subscribe button, surface a fixed bar at the
	// bottom of the viewport so the action stays one tap away. Only renders
	// when both conditions hold — quiet when the form button is on screen.
	const submitRowRef = useRef<HTMLDivElement>(null);
	const [isSubmitVisible, setIsSubmitVisible] = useState(true);

	useEffect(() => {
		const el = submitRowRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(([entry]) => setIsSubmitVisible(entry.isIntersecting), {
			threshold: 0,
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const selectionSummaryParts: string[] = [];
	if (digest) selectionSummaryParts.push("Adamastor Weekly");
	if (categories.size === 1) selectionSummaryParts.push("1 topic");
	else if (categories.size > 1) selectionSummaryParts.push(`${categories.size} topics`);
	const selectionSummary = selectionSummaryParts.join(" + ");

	const showStickyBar = !isSubmitVisible && hasAtLeastOneOptIn && !leaving && !done;

	// Guard against accidental tab close / refresh / external nav once the
	// user has visibly invested (name + email + at least one opt-in). Browsers
	// show their own generic "Changes you may not have saved" prompt and
	// ignore custom strings; we only need to call preventDefault + set
	// returnValue. Does NOT fire on Next.js client-side route changes —
	// App Router doesn't expose router events for that.
	const hasInvested =
		trimmedName.length > 0 && trimmedEmail.length > 0 && hasAtLeastOneOptIn && !done && !submitting;

	useEffect(() => {
		if (!hasInvested) return;
		const handler = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [hasInvested]);

	// In-app guard: intercept clicks on internal <Link>/<a> elements anywhere
	// in the document (navbar, footer, body) and route them through an
	// AlertDialog before letting them navigate. Skips the usual escape
	// hatches — modifier-clicks (cmd-click = new tab), middle clicks,
	// target=_blank, mailto/tel/#anchor hrefs, and cross-origin links (which
	// the beforeunload listener above already covers).
	useEffect(() => {
		if (!hasInvested) return;

		const handler = (event: MouseEvent) => {
			if (event.defaultPrevented) return;
			if (event.button !== 0) return;
			if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

			const anchor = (event.target as HTMLElement | null)?.closest("a");
			if (!anchor) return;
			if (anchor.target === "_blank") return;

			const href = anchor.getAttribute("href");
			if (!href) return;
			if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

			let destination: URL;
			try {
				destination = new URL(href, window.location.href);
			} catch {
				return;
			}

			if (destination.origin !== window.location.origin) return;
			if (
				destination.pathname === window.location.pathname &&
				destination.search === window.location.search
			) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			setNavIntent(destination.pathname + destination.search + destination.hash);
		};

		document.addEventListener("click", handler, true);
		return () => document.removeEventListener("click", handler, true);
	}, [hasInvested]);

	function confirmNavAway() {
		const intent = navIntent;
		setNavIntent(null);
		if (intent) router.push(intent);
	}

	function toggleCategory(slug: EventCategorySlug) {
		setCategories((prev) => {
			const next = new Set(prev);
			if (next.has(slug)) {
				next.delete(slug);
			} else {
				next.add(slug);
			}
			return next;
		});
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canSubmit) return;

		setSubmitting(true);

		const selectedCategories = Array.from(categories);
		const emailDomain = trimmedEmail.split("@")[1] ?? "unknown";

		// Anonymous capture mirroring the /preferences request-link form. The
		// server-side subscribed_newsletter event in /api/subscribe carries the
		// email itself, joining the funnel via session for legitimate users.
		posthog.capture("subscribe_page_submitted", {
			email_domain: emailDomain,
			has_name: trimmedName.length > 0,
			digest_requested: digest,
			categories_requested: selectedCategories,
			categories_count: selectedCategories.length,
		});

		try {
			const response = await fetch("/api/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: trimmedName,
					email: trimmedEmail,
					digest,
					categories: selectedCategories,
					pageUrl: window.location.href,
					pageTitle: document.title,
				}),
			});

			const payload = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(payload.error || "Subscription failed");
			}

			setSubmittedEmail(trimmedEmail);
			// Defaults to true (the optimistic case) if the field is missing;
			// older clients without the `created` field still get the 'You're
			// in' message rather than a confusing 'Welcome back'.
			setWasNewSubscription(payload.created !== false);
			saveIdentity({ name: trimmedName, email: trimmedEmail });
			setSubscribed();
		} catch (error) {
			toast.error("Couldn't subscribe", {
				description: error instanceof Error ? error.message : "Please try again later.",
			});
			setSubmitting(false);
			return;
		}

		setSubmitting(false);
		// Paired exit/enter transition mirrors the /preferences request-link
		// pattern: 150ms fade-out, then mount the success header with its own
		// fade-in. Prevents the abrupt swap between form and confirmation.
		setLeaving(true);
		await new Promise((resolve) => setTimeout(resolve, 150));
		setDone(true);
	}

	if (done) {
		return (
			<header className="space-y-4 pb-2 pt-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-out">
				<h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight text-navy [text-wrap:pretty] dark:text-cyan-lifted [font-family:var(--font-lora-bold)]">
					{wasNewSubscription ? "You’re in" : "Welcome back"}
				</h1>
				<p className="max-w-[60ch] text-sm md:text-base leading-snug md:leading-relaxed text-muted-foreground [text-wrap:pretty]">
					{wasNewSubscription ? (
						<>
							A welcome email is on its way to{" "}
							<span className="font-medium text-foreground">{submittedEmail}</span>. While you wait, see what’s coming
							up.
						</>
					) : (
						<>
							You’re already on our list at{" "}
							<span className="font-medium text-foreground">{submittedEmail}</span>. Catch up on what’s coming up.
						</>
					)}
				</p>
				<div className="pt-2">
					<Link
						href="/events"
						className="inline-flex items-center rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy-wash dark:border-cyan-lifted dark:text-cyan-lifted dark:hover:bg-cyan-glow/[0.08]"
					>
						Browse upcoming events
						<ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
					</Link>
				</div>
			</header>
		);
	}

	return (
		<>
		<div
			className={`space-y-8 transition-all duration-150 ease-out motion-reduce:transition-none ${
				leaving ? "pointer-events-none -translate-y-1 opacity-0" : "opacity-100"
			}`}
			aria-hidden={leaving}
		>
			<header className="space-y-3 pb-2 pt-2">
				<h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight text-navy [text-wrap:pretty] dark:text-cyan-lifted [font-family:var(--font-lora-bold)]">
					{greetingFirstName ? `Subscribe to Adamastor, ${greetingFirstName}` : "Subscribe to Adamastor"}
				</h1>
				<p className="max-w-[60ch] text-sm md:text-base leading-snug md:leading-relaxed text-muted-foreground [text-wrap:pretty]">
					The weekly digest by Carlos Resende, plus curated event picks across Portugal — choose what shows up in your
					inbox below.
				</p>
			</header>

			<form
				id="subscribe-form"
				onSubmit={handleSubmit}
				className="space-y-6 md:rounded-lg md:border md:border-navy-frame md:p-6 md:dark:border-cyan-glow/[0.18]"
			>
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
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="subscribe-name">Name</Label>
						<Input
							id="subscribe-name"
							type="text"
							required
							autoComplete="name"
							placeholder="Your name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={submitting}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="subscribe-email">Email</Label>
						<Input
							id="subscribe-email"
							type="email"
							required
							autoComplete="email"
							inputMode="email"
							spellCheck={false}
							placeholder="ana@yourstartup.pt"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={submitting}
						/>
					</div>
				</div>

				<section className="space-y-4">
					<h2 className="text-sm font-semibold text-navy dark:text-cyan-lifted">Weekly Digest</h2>
					<div className="flex items-start gap-3">
						<Image
							src="/carlos.jpeg"
							alt="Carlos Resende"
							width={40}
							height={40}
							className="h-10 w-10 shrink-0 rounded-full object-cover"
						/>
						<p className="text-xs leading-relaxed text-muted-foreground">
							By Carlos Resende — Co-founder of Founder Institute Portugal, Expert Evaluator at the European
							Commission, and Angel Investor ·{" "}
							<a
								href="https://www.linkedin.com/in/carlosresende47/"
								target="_blank"
								rel="noopener"
								className="inline-flex items-center gap-1 font-medium text-navy hover:underline dark:text-cyan-lifted"
							>
								<Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
								LinkedIn
							</a>
						</p>
					</div>
					<label className="flex cursor-pointer items-start gap-3 rounded-md border border-navy-frame p-4 transition-colors hover:bg-navy-wash/40 dark:border-cyan-glow/[0.18]">
						<input
							type="checkbox"
							className="mt-1 h-4 w-4 rounded border-navy-frame accent-[#104357]"
							checked={digest}
							onChange={(e) => setDigest(e.target.checked)}
						/>
						<span className="flex-1 space-y-1">
							<span className="block text-sm font-semibold leading-tight text-navy dark:text-cyan-lifted">
								Adamastor Weekly
							</span>
							<span className="block text-sm text-muted-foreground">
								An editorial take on Portugal’s startup scene — fundraises and founder interviews, every week, with a
								curation of events.
							</span>
						</span>
					</label>
				</section>

				<section className="space-y-4">
					<div className="space-y-1">
						<h2 className="text-sm font-semibold text-navy dark:text-cyan-lifted">Topics to Follow</h2>
						<p className="text-sm text-muted-foreground">
							Each week we round up events happening across Portugal in the topics you pick. Choose one or many —
							or skip and stick with the digest.
						</p>
					</div>
					<p className="text-xs leading-relaxed text-muted-foreground">
						Curated with the LisboaUX, LisboaJS, and Lisbon AI Week communities.
					</p>
					<div className="space-y-2">
						{EVENT_CATEGORIES.map((category) => (
							<label
								key={category.slug}
								className="flex cursor-pointer items-start gap-3 rounded-md border border-navy-frame p-4 transition-colors hover:bg-navy-wash/40 dark:border-cyan-glow/[0.18]"
							>
								<input
									type="checkbox"
									className="mt-1 h-4 w-4 rounded border-navy-frame accent-[#104357]"
									checked={categories.has(category.slug)}
									onChange={() => toggleCategory(category.slug)}
								/>
								<span className="flex-1 space-y-1">
									<span className="block text-sm font-medium leading-tight text-navy dark:text-cyan-lifted">
										{category.name}
									</span>
									<span className="block text-sm text-muted-foreground">{category.description}</span>
								</span>
							</label>
						))}
					</div>
				</section>

				<div
					ref={submitRowRef}
					className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end"
				>
					{!hasAtLeastOneOptIn && (
						<p className="text-xs text-muted-foreground sm:mr-auto" id="subscribe-empty-state-note">
							Pick the digest or at least one topic to subscribe.
						</p>
					)}
					<Button
						type="submit"
						disabled={!canSubmit}
						aria-describedby={!hasAtLeastOneOptIn ? "subscribe-empty-state-note" : undefined}
						className="rounded-full bg-gold-hue font-semibold text-white hover:bg-gold-shade"
					>
						{submitting ? (
							"Subscribing…"
						) : (
							<>
								Subscribe
								<ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
		<AlertDialog open={!!navIntent} onOpenChange={(open) => { if (!open) setNavIntent(null); }}>
			<AlertDialogContent className="border-navy-frame dark:border-cyan-glow/[0.18]">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-2xl font-bold leading-tight text-navy dark:text-cyan-lifted [font-family:var(--font-lora-bold)]">
						Save your picks first?
					</AlertDialogTitle>
					<AlertDialogDescription className="text-sm md:text-base leading-snug md:leading-relaxed text-muted-foreground [text-wrap:pretty]">
						You’re one click away from{" "}
						<span className="font-medium text-foreground">{selectionSummary || "subscribing"}</span>. Leave now and we
						won’t have you on the list.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="gap-2">
					<AlertDialogAction
						onClick={confirmNavAway}
						className="mt-2 inline-flex h-auto items-center justify-center bg-transparent px-2 py-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:bg-transparent hover:text-navy hover:underline dark:hover:text-cyan-lifted sm:mt-0"
					>
						Leave anyway
					</AlertDialogAction>
					<AlertDialogCancel className="mt-0 inline-flex items-center rounded-full border-0 bg-gold-hue px-4 py-2 font-semibold text-white hover:bg-gold-shade hover:text-white">
						Stay and subscribe
						<ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
					</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
		{showStickyBar && (
			<div
				role="region"
				aria-label="Subscribe action"
				className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-frame bg-background/95 shadow-[0_-1px_4px_-2px_rgba(8,41,58,0.05)] backdrop-blur-sm dark:border-cyan-glow/[0.18] motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300 motion-safe:ease-out"
			>
				<div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 md:px-8">
					<p className="truncate text-xs font-medium text-navy dark:text-cyan-lifted">{selectionSummary}</p>
					<Button
						type="submit"
						form="subscribe-form"
						disabled={!canSubmit}
						className="shrink-0 rounded-full bg-gold-hue font-semibold text-white hover:bg-gold-shade"
					>
						{submitting ? (
							"Subscribing…"
						) : (
							<>
								Subscribe
								<ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
							</>
						)}
					</Button>
				</div>
			</div>
		)}
		</>
	);
}
