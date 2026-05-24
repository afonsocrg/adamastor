"use client";

import { Badge } from "@/components/tailwind/ui/badge";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/tailwind/ui/table";
import { EVENT_CATEGORIES, type EventCategorySlug } from "@/lib/events/categories";
import { AlertCircle, CheckCircle2, RefreshCw, Search, Users } from "lucide-react";
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
	const unsubscribedCount = contacts.length - subscribedCount;
	const digestCount = activeContacts.filter((c) => c.digest_subscribed).length;
	const categoryCounts: Record<EventCategorySlug, number> = Object.fromEntries(
		EVENT_CATEGORIES.map((category) => [
			category.slug,
			activeContacts.filter((c) => c.categories.includes(category.slug)).length,
		]),
	) as Record<EventCategorySlug, number>;

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
		<div className="space-y-6 dashboard-content-in">
			{/* Config panel — surfaces missing prod env vars before they bite */}
			{config ? <NewsletterConfigPanel config={config} /> : null}

			{/* Stats — primary first row */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div className="bg-card border rounded-lg p-4">
					<p className="text-sm text-muted-foreground uppercase tracking-wide">All Contacts</p>
					<p className="text-3xl font-semibold mt-1">{contacts.length}</p>
				</div>
				<div className="bg-card border rounded-lg p-4">
					<p className="text-sm text-muted-foreground uppercase tracking-wide">Subscribed</p>
					<p className="text-3xl font-semibold mt-1">{subscribedCount}</p>
				</div>
				<div className="bg-card border rounded-lg p-4">
					<p className="text-sm text-muted-foreground uppercase tracking-wide">Weekly digest</p>
					<p className="text-3xl font-semibold mt-1">{digestCount}</p>
				</div>
				<div className="bg-card border rounded-lg p-4">
					<p className="text-sm text-muted-foreground uppercase tracking-wide">Unsubscribed</p>
					<p className="text-3xl font-semibold mt-1">{unsubscribedCount}</p>
				</div>
			</div>

			{/* Per-category counts — useful to see what's actually being chosen */}
			<div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
				{EVENT_CATEGORIES.map((category) => (
					<div key={category.slug} className="bg-card border rounded-lg p-3">
						<p className="text-xs text-muted-foreground uppercase tracking-wide leading-tight">{category.name}</p>
						<p className="text-xl font-semibold mt-1">{categoryCounts[category.slug]}</p>
					</div>
				))}
			</div>

			{/* Search and Refresh */}
			<div className="flex gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search contacts…"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="pl-10"
					/>
				</div>
				<Button variant="outline" onClick={fetchContacts} disabled={loading}>
					<RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
					Refresh
				</Button>
			</div>

			{error && (
				<div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			)}

			{/* Table */}
			<div className="border rounded-lg overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Email</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Subscribed to</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Added</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8">
									<RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
								</TableCell>
							</TableRow>
						) : filteredContacts.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8">
									<Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
									<p className="text-muted-foreground">No contacts found</p>
								</TableCell>
							</TableRow>
						) : (
							filteredContacts.map((contact) => (
								<TableRow key={contact.id}>
									<TableCell className="font-medium">
										{contact.email}
										{contact.legacy_only ? (
											<span
												className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground"
												title="No Supabase preferences row yet — legacy digest contact"
											>
												legacy
											</span>
										) : null}
									</TableCell>
									<TableCell>{getContactName(contact)}</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{contact.digest_subscribed ? (
												<Badge className="rounded-md" variant="outline">
													Digest
												</Badge>
											) : null}
											{contact.categories.map((slug) => (
												<Badge key={slug} className="rounded-md" variant="secondary">
													{CATEGORY_NAME_BY_SLUG[slug] ?? slug}
												</Badge>
											))}
											{!contact.digest_subscribed && contact.categories.length === 0 ? (
												<span className="text-xs text-muted-foreground">—</span>
											) : null}
										</div>
									</TableCell>
									<TableCell>
										<Badge className="rounded-md" variant={contact.unsubscribed ? "secondary" : "outline"}>
											{contact.unsubscribed ? "Unsubscribed" : "Subscribed"}
										</Badge>
									</TableCell>
									<TableCell className="text-right text-muted-foreground">{formatDate(contact.created_at)}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

function NewsletterConfigPanel({ config }: { config: ConfigStatus }) {
	const missingSegments = [config.allSubscribersSegment, config.digestSegment].filter((s) => !s.configured);
	const missingTopics = config.categoryTopics.filter((t) => !t.configured);
	const hasMissing = missingSegments.length > 0 || missingTopics.length > 0;

	if (!hasMissing) {
		return (
			<div className="rounded-lg border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/10 px-4 py-3 flex items-start gap-3">
				<CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
				<div className="text-sm">
					<p className="font-medium text-emerald-900 dark:text-emerald-100">Newsletter config is complete.</p>
					<p className="text-emerald-700/80 dark:text-emerald-300/80 text-xs mt-0.5">
						All segments and topics are wired up. Per-category broadcasts and the digest will reach the right people.
					</p>
				</div>
			</div>
		);
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
		<div className="space-y-6" aria-busy="true" aria-label="Loading subscribers">
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-hidden="true">
				{["all", "subscribed", "digest", "unsubscribed"].map((stat) => (
					<div className="bg-card border rounded-lg p-4" key={stat}>
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-9 w-16 mt-3" />
					</div>
				))}
			</div>

			<div className="flex gap-4" aria-hidden="true">
				<div className="relative flex-1">
					<Skeleton className="h-10 w-full" />
				</div>
				<Skeleton className="h-10 w-24" />
			</div>

			<div className="border rounded-lg overflow-x-auto" aria-hidden="true">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Email</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Subscribed to</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Added</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{SKELETON_ROWS.map((row) => (
							<TableRow key={row}>
								<TableCell>
									<Skeleton className="h-4 w-48" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-32" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-5 w-40 rounded-md" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-6 w-24 rounded-md" />
								</TableCell>
								<TableCell className="text-right">
									<Skeleton className="h-4 w-24 ml-auto" />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
