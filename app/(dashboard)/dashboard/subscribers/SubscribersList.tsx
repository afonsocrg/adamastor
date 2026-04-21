"use client";

import { Badge } from "@/components/tailwind/ui/badge";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/tailwind/ui/table";
import { RefreshCw, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface Contact {
	id: string;
	email: string;
	first_name?: string | null;
	last_name?: string | null;
	created_at: string;
	unsubscribed: boolean;
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

export function SubscribersList() {
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");

	const fetchContacts = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/emailSubscribers", { cache: "no-store" });
			const data = (await response.json()) as { contacts?: Contact[]; error?: string };

			if (!response.ok) {
				throw new Error(data.error || "Failed to fetch contacts");
			}

			if (data.contacts) {
				setContacts(data.contacts);
			}
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

	const subscribedCount = contacts.filter((c) => !c.unsubscribed).length;
	const unsubscribedCount = contacts.filter((c) => c.unsubscribed).length;
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
			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="bg-card border rounded-lg p-4">
					<p className="text-sm text-muted-foreground uppercase tracking-wide">All Contacts</p>
					<p className="text-3xl font-semibold mt-1">{contacts.length}</p>
				</div>
				<div className="bg-card border rounded-lg p-4">
					<p className="text-sm text-muted-foreground uppercase tracking-wide">Subscribers</p>
					<p className="text-3xl font-semibold mt-1">{subscribedCount}</p>
				</div>
				<div className="bg-card border rounded-lg p-4">
					<p className="text-sm text-muted-foreground uppercase tracking-wide">Unsubscribed</p>
					<p className="text-3xl font-semibold mt-1">{unsubscribedCount}</p>
				</div>
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
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Added</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center py-8">
									<RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
								</TableCell>
							</TableRow>
						) : filteredContacts.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center py-8">
									<Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
									<p className="text-muted-foreground">No contacts found</p>
								</TableCell>
							</TableRow>
						) : (
							filteredContacts.map((contact) => (
								<TableRow key={contact.id}>
									<TableCell className="font-medium">{contact.email}</TableCell>
									<TableCell>{getContactName(contact)}</TableCell>
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

function SubscribersSkeleton() {
	return (
		<div className="space-y-6" aria-busy="true" aria-label="Loading subscribers">
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-hidden="true">
				{["all", "subscribed", "unsubscribed"].map((stat) => (
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
