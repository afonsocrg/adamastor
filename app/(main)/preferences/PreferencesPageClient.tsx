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
import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

			toast.success("Unsubscribed from everything. You can opt back in any time.");
		} catch {
			toast.error("Couldn't unsubscribe", { description: "Please try again later." });
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<h1 className="text-2xl font-extrabold tracking-tight text-[#104357] dark:text-[#E3F2F7]">
					{initial.firstName ? `Hi ${initial.firstName} — your preferences` : "Your newsletter preferences"}
				</h1>
				<p className="text-sm text-muted-foreground">
					Managing what we send to <span className="font-medium text-foreground">{initial.email}</span>.
				</p>
			</header>

			<section className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-base font-semibold text-[#104357] dark:text-[#E3F2F7]">Weekly digest</h2>
				</div>
				<label className="flex items-start gap-3 rounded-md border bg-card p-4 cursor-pointer hover:bg-accent/30 transition-colors">
					<input
						type="checkbox"
						className="mt-1 h-4 w-4 rounded border-input"
						checked={digest}
						onChange={(e) => setDigest(e.target.checked)}
					/>
					<span className="flex-1 space-y-1">
						<span className="block text-sm font-semibold leading-tight">Adamastor Weekly</span>
						<span className="block text-xs uppercase tracking-wide text-muted-foreground">By Carlos Resende</span>
						<span className="block text-sm text-muted-foreground pt-1">
							An editorial take on Portugal's startup scene — fundraises, founder interviews, and the moves worth
							knowing about. Every week, with the upcoming events on top.
						</span>
					</span>
				</label>
			</section>

			<section className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-base font-semibold text-[#104357] dark:text-[#E3F2F7]">Event categories</h2>
					<p className="text-sm text-muted-foreground">
						Pick the topics you want in your inbox. We'll only email you about events tagged with these.
					</p>
				</div>
				<div className="space-y-2">
					{EVENT_CATEGORIES.map((category) => (
						<label
							key={category.slug}
							className="flex items-start gap-3 rounded-md border bg-card p-4 cursor-pointer hover:bg-accent/30 transition-colors"
						>
							<input
								type="checkbox"
								className="mt-1 h-4 w-4 rounded border-input"
								checked={categories.has(category.slug)}
								onChange={() => toggleCategory(category.slug)}
							/>
							<span className="flex-1 space-y-1">
								<span className="block text-sm font-medium leading-tight">{category.name}</span>
								<span className="block text-sm text-muted-foreground">{category.description}</span>
							</span>
						</label>
					))}
				</div>
			</section>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<Button onClick={handleSave} disabled={saving}>
					{saving ? "Saving…" : "Save preferences"}
				</Button>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<button
							type="button"
							disabled={saving}
							className="text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
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
							<AlertDialogAction onClick={handleUnsubscribeAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
								Yes, unsubscribe me
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}

export function RequestLinkForm() {
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
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
			setDone(true);
		} catch {
			// Endpoint always returns 200 to avoid enumeration. Even a network
			// error gets the success message — the friendly response can be
			// re-triggered by trying again. No information leaked either way.
			setDone(true);
		} finally {
			setSubmitting(false);
		}
	}

	if (done) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-extrabold tracking-tight text-[#104357] dark:text-[#E3F2F7]">
					Check your inbox
				</h1>
				<p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
					If we have <span className="font-medium text-foreground">{email}</span> on file, a link to manage your
					preferences is on its way. The link works without a password.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<h1 className="text-2xl font-extrabold tracking-tight text-[#104357] dark:text-[#E3F2F7]">
					Manage your preferences
				</h1>
				<p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
					Enter the email address you subscribed with. We'll send you a link to manage which Adamastor newsletters you
					receive — no login needed.
				</p>
			</header>
			<form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
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
					aria-label="Your email address"
				/>
				<Button type="submit" disabled={submitting || !email.trim()}>
					{submitting ? "Sending…" : "Send link"}
				</Button>
			</form>
		</div>
	);
}
