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
	AlertDialogTrigger,
} from "@/components/tailwind/ui/alert-dialog";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Separator } from "@/components/tailwind/ui/separator";
import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";
import { clearSubscribed } from "@/lib/user-identity";
import { ArrowRightIcon, Linkedin } from "lucide-react";
import Image from "next/image";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Permissive client-side gate to avoid disabling the submit on every keystroke
// during a typo. The server (and zod schema on /api/preferences/request-link)
// is the authoritative validator.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InitialPreferences {
	email: string;
	firstName: string | null;
	categories: EventCategorySlug[];
	digestSubscribed: boolean;
	token: string;
}

export function PreferencesForm({ initial }: { initial: InitialPreferences }) {
	const [categories, setCategories] = useState<Set<EventCategorySlug>>(new Set(initial.categories));
	const [digest, setDigest] = useState(initial.digestSubscribed);
	const [saving, setSaving] = useState(false);

	// Token resolved server-side ⇒ we know this subscriber. Identify so the
	// follow-on saved/unsubscribe events tie to the same distinct_id as the
	// server-side request_link_email_sent that brought them here.
	useEffect(() => {
		posthog.identify(initial.email);
		posthog.capture("preferences_loaded", {
			email: initial.email,
			has_token: true,
			initial_categories: initial.categories,
			initial_categories_count: initial.categories.length,
			initial_digest_subscribed: initial.digestSubscribed,
		});
	}, [initial.email, initial.categories, initial.digestSubscribed]);

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

	async function handleSave() {
		setSaving(true);
		try {
			const response = await fetch("/api/preferences", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token: initial.token,
					categories: Array.from(categories),
					digest_subscribed: digest,
				}),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error || "Failed to save preferences");
			}

			const nextCategories = Array.from(categories);
			posthog.capture("preferences_saved", {
				email: initial.email,
				categories: nextCategories,
				categories_count: nextCategories.length,
				digest_subscribed: digest,
				previous_categories: initial.categories,
				previous_digest_subscribed: initial.digestSubscribed,
			});

			toast.success("Preferences saved.");
		} catch (error) {
			toast.error("Couldn't save preferences", {
				description: error instanceof Error ? error.message : "Please try again later.",
			});
		} finally {
			setSaving(false);
		}
	}

	async function handleUnsubscribeAll() {
		setCategories(new Set());
		setDigest(false);
		setSaving(true);
		try {
			const response = await fetch("/api/preferences", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token: initial.token,
					categories: [],
					digest_subscribed: false,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to unsubscribe");
			}

			posthog.capture("preferences_unsubscribe_all", {
				email: initial.email,
				previous_categories: initial.categories,
				previous_digest_subscribed: initial.digestSubscribed,
			});

			clearSubscribed();
			toast.success("Unsubscribed from everything. You can opt back in any time.");
		} catch {
			toast.error("Couldn't unsubscribe", { description: "Please try again later." });
		} finally {
			setSaving(false);
		}
	}

	return (
		<>
			<header className="space-y-3 pb-2 pt-2">
				<h1 className="text-3xl font-bold tracking-tight leading-tight text-navy [text-wrap:pretty] dark:text-cyan-lifted [font-family:var(--font-lora-bold)]">
					{initial.firstName ? `Hi ${initial.firstName} — manage your subscriptions` : "Manage your subscriptions"}
				</h1>
				<p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground [text-wrap:pretty]">
					Managing what we send to <span className="font-medium text-foreground">{initial.email}</span>.
				</p>
			</header>

			<aside className="rounded-lg bg-navy-veil/40 p-5 dark:bg-cyan-glow/[0.04]">
				<p className="text-sm leading-relaxed text-muted-foreground">
					Weekly emails — we send only what you pick below. One click any time to unsubscribe.
				</p>
			</aside>

			<div className="space-y-6 rounded-lg border border-navy-frame p-6 dark:border-cyan-glow/[0.18]">
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
								An editorial take on Portugal's startup scene — fundraises and founder interviews, every week, with a
								curation of events.
							</span>
						</span>
					</label>
				</section>

				<Separator />

				<section className="space-y-4">
					<div className="space-y-1">
						<h2 className="text-sm font-semibold text-navy dark:text-cyan-lifted">Topics to Follow</h2>
						<p className="text-sm text-muted-foreground">
							Each week we round up events happening across Portugal in the topics you pick. Choose one or many.
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

				<Separator />

				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<Button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="rounded-full bg-gold-hue font-semibold text-white hover:bg-gold-shade"
					>
						{saving ? (
							"Saving…"
						) : (
							<>
								Save preferences
								<ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
							</>
						)}
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<button
								type="button"
								disabled={saving}
								className="text-sm text-navy-tone underline-offset-4 transition-colors hover:text-navy hover:underline disabled:opacity-50 dark:text-navy-wash dark:hover:text-cyan-lifted"
							>
								Unsubscribe from everything
							</button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Unsubscribe from everything?</AlertDialogTitle>
								<AlertDialogDescription>
									You'll stop receiving the weekly digest and any per-category event newsletters. You can opt back in any
									time from this page.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleUnsubscribeAll}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									Yes, unsubscribe me
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</>
	);
}

export function RequestLinkForm() {
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [leaving, setLeaving] = useState(false);
	const [done, setDone] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const trimmed = email.trim();
		if (!trimmed) return;

		setSubmitting(true);
		// Anonymous capture — we have no proof yet that the typed email belongs
		// to this browser. Email_domain is enough to spot abuse patterns and
		// see how often anonymous visitors hit this form. The server-side
		// counterpart (sent/skipped) carries the email itself, so the funnel
		// still joins via session for legitimate users.
		const emailDomain = trimmed.split("@")[1] ?? "unknown";
		posthog.capture("preferences_request_link_submitted", {
			email_domain: emailDomain,
		});
		try {
			await fetch("/api/preferences/request-link", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: trimmed }),
			});
		} catch {
			// Endpoint always returns 200 to avoid enumeration. Even a network
			// error gets the success message — the friendly response can be
			// re-triggered by trying again. No information leaked either way.
		} finally {
			setSubmitting(false);
		}

		// Paired exit/enter transition: fade the form out for 150ms (exits run
		// ~20% faster than entrances per the animation playbook), then mount
		// the success header with its own fade-in. Prevents the abrupt swap
		// where one tree disappears and another snaps into place.
		setLeaving(true);
		await new Promise((resolve) => setTimeout(resolve, 150));
		setDone(true);
	}

	if (done) {
		return (
			<header className="space-y-3 pb-2 pt-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-out">
				<h1 className="text-3xl font-bold leading-tight tracking-tight text-navy [text-wrap:pretty] dark:text-cyan-lifted [font-family:var(--font-lora-bold)]">
					Check your inbox
				</h1>
				<p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground [text-wrap:pretty]">
					If we have <span className="font-medium text-foreground">{email}</span> on file, a link to manage your
					preferences is on its way. The link works without a password.
				</p>
			</header>
		);
	}

	return (
		<div
			className={`space-y-8 transition-all duration-150 ease-out motion-reduce:transition-none ${
				leaving ? "pointer-events-none -translate-y-1 opacity-0" : "opacity-100"
			}`}
			aria-hidden={leaving}
		>
			<header className="space-y-3 pb-2 pt-2">
				<h1 className="text-3xl font-bold leading-tight tracking-tight text-navy [text-wrap:pretty] dark:text-cyan-lifted [font-family:var(--font-lora-bold)]">
					Manage your subscriptions
				</h1>
				<p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground [text-wrap:pretty]">
					Enter the email address you subscribed with. We'll send you a link to manage which Adamastor newsletters you
					receive — no login needed.
				</p>
			</header>

			<div className="rounded-lg border border-navy-frame p-6 dark:border-cyan-glow/[0.18]">
				<form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
					<Input
						type="email"
						required
						autoComplete="email"
						inputMode="email"
						spellCheck={false}
						placeholder="ana@yourstartup.pt"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={submitting}
						aria-label="Your email address"
						className="flex-1"
					/>
					<Button
						type="submit"
						disabled={submitting || !EMAIL_PATTERN.test(email.trim())}
						className="rounded-full bg-gold-hue font-semibold text-white hover:bg-gold-shade"
					>
						{submitting ? (
							"Sending…"
						) : (
							<>
								Send link
								<ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
							</>
						)}
					</Button>
				</form>
			</div>
		</div>
	);
}
