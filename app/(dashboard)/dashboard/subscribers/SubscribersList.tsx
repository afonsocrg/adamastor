"use client";

import { Badge } from "@/components/tailwind/ui/badge";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/tailwind/ui/table";
import { RefreshCw, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface Contact {
	id: string;
	email: string;
	first_name?: string;
	last_name?: string;
	created_at: string;
	unsubscribed: boolean;
}

export function SubscribersList() {
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	const fetchContacts = async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/emailSubscribers");
			const data = await response.json();
			if (data.contacts) {
				setContacts(data.contacts);
				setFilteredContacts(data.contacts);
			}
		} catch (error) {
			console.error("Failed to fetch contacts:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchContacts();
	}, []);

	useEffect(() => {
		const filtered = contacts.filter(
			(contact) =>
				contact.email.toLowerCase().includes(search.toLowerCase()) ||
				contact.first_name?.toLowerCase().includes(search.toLowerCase()) ||
				contact.last_name?.toLowerCase().includes(search.toLowerCase()),
		);
		setFilteredContacts(filtered);
	}, [search, contacts]);

	const subscribedCount = contacts.filter((c) => !c.unsubscribed).length;
	const unsubscribedCount = contacts.filter((c) => c.unsubscribed).length;

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
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

	return (
		<div className="space-y-6">
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
					<p className="text-sm text-muted-foreground uppercase tracking-wide">Unsubscribers</p>
					<p className="text-3xl font-semibold mt-1">{unsubscribedCount}</p>
				</div>
			</div>

			{/* Search and Refresh */}
			<div className="flex gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
				</div>
				<Button variant="outline" onClick={fetchContacts} disabled={loading}>
					<RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
					Refresh
				</Button>
			</div>

			{/* Table */}
			<div className="border rounded-lg">
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
									<TableCell>
										{contact.first_name || contact.last_name
											? `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim()
											: "—"}
									</TableCell>
									<TableCell>
										<Badge variant={contact.unsubscribed ? "secondary" : "default"}>
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
