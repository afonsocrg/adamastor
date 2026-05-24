"use client";

import { Badge } from "@/components/tailwind/ui/badge";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/tailwind/ui/table";
import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";
import { AlertCircle, RefreshCw, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface Contact {
	id: string;
	email: string;
	first_name?: string | null;
	last_name?: string | null;
	created_at: string;
	unsubscribed: boolean;
	categories: EventCategorySlug[];
	digest_subscribed: boolean;
	legacy_only: boolean;
}

interface ConfigStatus {
	allSubscribersSegment: { configured: boolean; envName: string };
	digestSegment: { configured: boolean; envName: string };
	categoryTopics: Array<{ slug: EventCategorySlug; name: string; configured: boolean; envName: string }>;
}

const SKELETON_ROWS = [
	"row-1",
	"row-2",
	"row-3",
	"row-4",
	"row-5",
	"row-6",
	"row-7",
	"row-8",
	"row-9",
	"row-10",
	"row-11",
	"row-12",
];

const CATEGORY_NAME_BY_SLUG: Record<EventCategorySlug, string> = Object.fromEntries(
	EVENT_CATEGORIES.map((c) => [c.slug, c.name]),
) as Record<EventCategorySlug, string>;

export function SubscribersList() {
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [config, setConfig] = useState<ConfigStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");

	const fetchContacts = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/emailSubscribers", { cache: "no-store" });
			const data = (await response.json()) as { contacts?: Contact[]; config?: ConfigStatus; error?: string };

			if (!response.ok) {
				throw new Error(data.error || "Failed to fetch contacts");
			}

			if (data.contacts) setContacts(data.contacts);
			if (data.config) setConfig(data.config);
		} catch (error) {
			console.error("Failed to fetch contacts:", error);
			setError(error instanceof Error ? error.message : "Failed to fetch contacts");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchContacts();
	}, []);

	const filteredContacts = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		if (!normalizedSearch) {
			return contacts;
		}

		return contacts.filter(
			(contact) =>
				contact.email.toLowerCase().includes(normalizedSearch) ||
				contact.first_name?.toLowerCase().includes(normalizedSearch) ||
				contact.last_name?.toLowerCase().includes(normalizedSearch),
		);
	}, [search, contacts]);

	// Stats: count active (not Resend-unsubscribed) contacts per channel so
	// the dashboard reflects engagement, not raw signups. Digest count uses
	// either the Supabase row OR legacy segment membership (matches the API
	// merge logic).
	const activeContacts = contacts.filter((c) => !c.unsubscribed);
	const subscribedCount = activeContacts.length;
	const digestCount = activeContacts.filter((c) => c.digest_subscribed).length;
	const categoryCounts: Record<EventCategorySlug, number> = Object.fromEntries(
		EVENT_CATEGORIES.map((category) => [
			category.slug,
			activeContacts.filter((c) => c.categories.includes(category.slug)).length,
		]),
	) as Record<EventCategorySlug, number>;
	// Bar strip uses the largest count (or 1, to avoid /0) as its 100% mark
	// so the proportions are meaningful when one category dominates.
	const categoryMax = Math.max(1, ...Object.values(categoryCounts));
	// Sorted desc by count for the editorial "which categories are landing"
	// read. Stable secondary sort by name preserves order for tied categories.
	const sortedCategories = [...EVENT_CATEGORIES].sort((a, b) => {
		const diff = categoryCounts[b.slug] - categoryCounts[a.slug];
		return diff !== 0 ? diff : a.name.localeCompare(b.name);
	});

	const isInitialLoading = loading && contacts.length === 0;

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);

		if (Number.isNaN(date.getTime())) {
			return "Unknown";
		}

		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 60) return `${diffMins} minutes ago`;
		if (diffHours < 24) return `about ${diffHours} hours ago`;
		if (diffDays < 7) return `${diffDays} days ago`;
		return date.toLocaleDateString();
	};

	const getContactName = (contact: Contact) => {
		const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
		return fullName || "—";
	};

	if (isInitialLoading) {
		return <SubscribersSkeleton />;
	}

	return (
		<div className="space-y-10 dashboard-content-in">
			{/* Config panel — surfaces missing prod env vars before they bite */}
			{config ? <NewsletterConfigPanel config={config} /> : null}

			{/* ─────────────────────────────────────────────────────────────
			    Headline number as editorial pull-quote. One confident figure
			    owns the top of the page; the secondary digest count sits
			    underneath as supporting context. See docs/design-system.md
			    "Stat displays" + "One highlight per fold" rules.
			    ───────────────────────────────────────────────────────────── */}
			<section>
				<p
					className="text-6xl font-bold tabular-nums leading-none text-navy dark:text-[#E3F2F7] [font-family:var(--font-title)]"
					aria-label={`${subscribedCount} subscribers`}
				>
					{subscribedCount}
				</p>
				<p className="mt-3 text-sm text-muted-foreground">
					{subscribedCount === 1 ? "subscriber" : "subscribers"}
					{digestCount > 0 ? (
						<>
							{" — "}
							<span className="tabular-nums">{digestCount}</span> on the weekly digest
						</>
					) : null}
				</p>
			</section>

			{/* ─────────────────────────────────────────────────────────────
			    By category — horizontal bar strip. Sorted desc; cyan fill is
			    the page's single highlight. Equal label width keeps the bars
			    aligned vertically for at-a-glance comparison.
			    ───────────────────────────────────────────────────────────── */}
			<section className="space-y-4">
				<div className="space-y-1">
					<h3 className="text-base font-semibold text-navy dark:text-[#E3F2F7]">By category</h3>
					<div className="h-px w-12 bg-cyan" aria-hidden="true" />
				</div>
				<dl className="space-y-2.5">
					{sortedCategories.map((category) => {
						const count = categoryCounts[category.slug];
						const pct = (count / categoryMax) * 100;
						return (
							<div key={category.slug} className="flex items-center gap-4">
								<dt className="w-48 shrink-0 truncate text-base text-foreground">{category.name}</dt>
								<div
									className="h-2 flex-1 overflow-hidden rounded-full bg-navy-faded dark:bg-[rgba(76,228,240,0.08)]"
									role="presentation"
								>
									<div
										className="h-full rounded-full bg-cyan transition-[width] duration-500 ease-out motion-reduce:transition-none"
										style={{ width: `${pct}%` }}
									/>
								</div>
								<dd className="w-10 shrink-0 text-right text-base tabular-nums text-foreground">{count}</dd>
							</div>
						);
					})}
				</dl>
			</section>

			{/* ─────────────────────────────────────────────────────────────
			    Recent activity — the table itself. Filters unsubscribed out
			    by default (their churn is digest-specific signal that
			    belongs elsewhere). Status column dropped; Added column also
			    dropped — date moves inline beneath email as small muted
			    text alongside the LEGACY chip.
			    ───────────────────────────────────────────────────────────── */}
			<section className="space-y-4">
				<div className="space-y-1">
					<h3 className="text-base font-semibold text-navy dark:text-[#E3F2F7]">Recent activity</h3>
					<p className="text-sm text-muted-foreground">Newest subscribers first.</p>
				</div>

				<div className="flex gap-4">
					<div className="relative flex-1">
						<Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							aria-label="Search subscribers by email or name"
							placeholder="Search contacts…"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className="pl-10"
						/>
					</div>
					<Button variant="outline" onClick={fetchContacts} disabled={loading}>
						<RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
						Refresh
					</Button>
				</div>

				{error && (
					<div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{error}
					</div>
				)}

				<div className="border rounded-lg overflow-x-auto">
					{/* Overriding shadcn Table's default text-sm with text-base —
					    the table is the page's primary data surface and benefits
					    from a more confident reading size. */}
					<Table className="text-base">
						<TableHeader>
							<TableRow>
								<TableHead>Subscriber</TableHead>
								<TableHead>Subscribed to</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={2} className="text-center py-8">
										<RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" aria-hidden="true" />
									</TableCell>
								</TableRow>
							) : filteredContacts.filter((c) => !c.unsubscribed).length === 0 ? (
								<TableRow>
									<TableCell colSpan={2} className="text-center py-8">
										<Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" aria-hidden="true" />
										<p className="text-muted-foreground">No subscribers found</p>
									</TableCell>
								</TableRow>
							) : (
								filteredContacts
									.filter((c) => !c.unsubscribed)
									.map((contact) => {
										// Name leads when we have one; otherwise the email becomes
										// the lead identifier and the secondary line drops it.
										const displayName = getContactName(contact);
										const hasName = displayName !== "—";
										return (
											<TableRow key={contact.id}>
												<TableCell className="max-w-[420px]">
													<div className="space-y-0.5">
														<div
															className="font-medium truncate"
															title={hasName ? displayName : contact.email}
														>
															{hasName ? displayName : contact.email}
														</div>
														<div className="text-sm text-muted-foreground tabular-nums truncate">
															{hasName ? `${contact.email} · ` : ""}
															{formatDate(contact.created_at)}
															{contact.legacy_only ? (
																<>
																	{" · "}
																	<span
																		className="uppercase tracking-wide"
																		title="No Supabase preferences row yet — legacy digest contact"
																	>
																		legacy
																	</span>
																</>
															) : null}
														</div>
													</div>
												</TableCell>
												<TableCell>
													{/* Digest + category badges share the same outlined
													    treatment — consistent visual rhythm. Hierarchy
													    comes from ordering: Digest renders first when
													    present, then category badges. */}
													<div className="flex flex-wrap items-center gap-1.5">
														{contact.digest_subscribed ? (
															<Badge className="rounded-md whitespace-nowrap text-sm" variant="outline">
																Digest
															</Badge>
														) : null}
														{contact.categories.map((slug) => (
															<Badge
																key={slug}
																className="rounded-md whitespace-nowrap text-sm"
																variant="outline"
															>
																{CATEGORY_NAME_BY_SLUG[slug] ?? slug}
															</Badge>
														))}
														{!contact.digest_subscribed && contact.categories.length === 0 ? (
															<span className="text-xs text-muted-foreground">—</span>
														) : null}
													</div>
												</TableCell>
											</TableRow>
										);
									})
							)}
						</TableBody>
					</Table>
				</div>
			</section>
		</div>
	);
}

function NewsletterConfigPanel({ config }: { config: ConfigStatus }) {
	const missingSegments = [config.allSubscribersSegment, config.digestSegment].filter((s) => !s.configured);
	const missingTopics = config.categoryTopics.filter((t) => !t.configured);
	const hasMissing = missingSegments.length > 0 || missingTopics.length > 0;

	// Don't render the "everything is fine" success banner — it's silent
	// noise. Only surface this panel when something needs attention. The
	// healthy state is the absence of the panel.
	if (!hasMissing) {
		return null;
	}

	return (
		<div className="rounded-lg border border-amber-300/60 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10 px-4 py-3 flex items-start gap-3">
			<AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
			<div className="text-sm space-y-2">
				<div>
					<p className="font-medium text-amber-900 dark:text-amber-100">Newsletter config incomplete.</p>
					<p className="text-amber-800/80 dark:text-amber-200/80 text-xs mt-0.5">
						Per-category broadcasts will fail or fall back to no-op for missing entries. See{" "}
						<code className="text-[11px] bg-amber-100/70 dark:bg-amber-500/20 px-1 rounded">
							docs/newsletter-subscriptions.md
						</code>
						.
					</p>
				</div>
				<ul className="text-xs text-amber-900/90 dark:text-amber-200/90 space-y-1">
					{missingSegments.map((s) => (
						<li key={s.envName}>
							<span className="font-medium">Missing segment:</span>{" "}
							<code className="bg-amber-100/70 dark:bg-amber-500/20 px-1 rounded">{s.envName}</code>
						</li>
					))}
					{missingTopics.map((t) => (
						<li key={t.envName}>
							<span className="font-medium">Missing topic for {t.name}:</span>{" "}
							<code className="bg-amber-100/70 dark:bg-amber-500/20 px-1 rounded">{t.envName}</code>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

function SubscribersSkeleton() {
	return (
		<div className="space-y-10" aria-busy="true" aria-label="Loading subscribers">
			{/* Hero number placeholder */}
			<div aria-hidden="true" className="space-y-3">
				<Skeleton className="h-14 w-24" />
				<Skeleton className="h-4 w-56" />
			</div>

			{/* By category bar strip placeholder */}
			<div aria-hidden="true" className="space-y-4">
				<Skeleton className="h-5 w-28" />
				<div className="space-y-2.5">
					{EVENT_CATEGORIES.map((category) => (
						<div key={category.slug} className="flex items-center gap-4">
							<Skeleton className="h-4 w-48 shrink-0" />
							<Skeleton className="h-2 flex-1 rounded-full" />
							<Skeleton className="h-4 w-10 shrink-0" />
						</div>
					))}
				</div>
			</div>

			{/* Recent activity table placeholder */}
			<div aria-hidden="true" className="space-y-4">
				<Skeleton className="h-5 w-36" />

				<div className="flex gap-4">
					<div className="relative flex-1">
						<Skeleton className="h-10 w-full" />
					</div>
					<Skeleton className="h-10 w-24" />
				</div>

				<div className="border rounded-lg overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Subscriber</TableHead>
								<TableHead>Subscribed to</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{SKELETON_ROWS.map((row) => (
								<TableRow key={row}>
									<TableCell>
										<div className="space-y-1">
											<Skeleton className="h-4 w-40" />
											<Skeleton className="h-3 w-56" />
										</div>
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-40 rounded-md" />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
