import { Badge } from "@/components/tailwind/ui/badge";
import { Button } from "@/components/tailwind/ui/button";
import { Card, CardContent } from "@/components/tailwind/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/tailwind/ui/table";
import { getUserProfile } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface SubmissionRow {
	id: number;
	title: string;
	city: string;
	start_time: string;
	status: "pending" | "approved" | "rejected";
	submitter_name: string | null;
	submitter_email: string | null;
	submitted_at: string;
}

function formatLisbonDate(iso: string): string {
	return new Intl.DateTimeFormat("en-GB", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Europe/Lisbon",
	}).format(new Date(iso));
}

function formatRelative(iso: string): string {
	const date = new Date(iso);
	const diffMs = Date.now() - date.getTime();
	const diffMinutes = Math.round(diffMs / 60_000);
	if (diffMinutes < 1) return "just now";
	if (diffMinutes < 60) return `${diffMinutes}m ago`;
	const diffHours = Math.round(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours}h ago`;
	const diffDays = Math.round(diffHours / 24);
	if (diffDays < 14) return `${diffDays}d ago`;
	return formatLisbonDate(iso);
}

function formatCity(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function EventSubmissionsPage() {
	// Defense-in-depth: the dashboard layout already redirects non-admins, but
	// this page reads via the service role (RLS-bypassing) so an accidental
	// future move outside the dashboard tree must not leak data.
	const sessionClient = await createClient();
	const profile = await getUserProfile(sessionClient);
	if (!profile || profile.role !== "admin") notFound();

	const supabase = createServiceRoleClient();

	// Run independent queries in parallel — they don't depend on each other.
	const [pendingResponse, recentlyDecidedResponse] = await Promise.all([
		supabase
			.from("events")
			.select("id, title, city, start_time, status, submitter_name, submitter_email, submitted_at")
			.eq("status", "pending")
			.order("submitted_at", { ascending: false }),
		supabase
			.from("events")
			.select("id, title, city, start_time, status, submitter_name, submitter_email, submitted_at")
			.in("status", ["approved", "rejected"])
			.not("submitter_email", "is", null)
			.order("reviewed_at", { ascending: false, nullsFirst: false })
			.limit(15),
	]);

	const { data: pendingData, error: pendingError } = pendingResponse;
	const { data: recentlyDecidedData, error: decidedError } = recentlyDecidedResponse;

	if (pendingError) {
		console.error("Failed to load pending submissions", pendingError);
	}
	if (decidedError) {
		console.error("Failed to load recently decided submissions", decidedError);
	}

	const pending = (pendingData ?? []) as SubmissionRow[];
	const recent = (recentlyDecidedData ?? []) as SubmissionRow[];

	return (
		<div className="w-full mx-auto p-6 space-y-8">
			<header className="space-y-2">
				<div className="flex items-center gap-3">
					<h2 className="text-xl font-semibold text-[#104357] dark:text-[#E3F2F7]">Event submissions</h2>
					{pending.length > 0 ? (
						<Badge className="bg-[#04C9D8] text-white hover:bg-[#04C9D8]">{pending.length} pending</Badge>
					) : null}
				</div>
				<p className="text-sm text-muted-foreground">
					Review events submitted by the community. Edit anything before approving — your changes are what get
					published.
				</p>
			</header>

			<section className="space-y-3">
				<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending review</h3>
				{pending.length === 0 ? (
					<Card>
						<CardContent className="p-8 text-center text-sm text-muted-foreground">
							You're all caught up — no submissions waiting.
						</CardContent>
					</Card>
				) : (
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Event</TableHead>
									<TableHead>Submitter</TableHead>
									<TableHead>When</TableHead>
									<TableHead>Submitted</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pending.map((row) => (
									<TableRow key={row.id}>
										<TableCell className="max-w-[260px]">
											<div className="font-medium text-[#104357] dark:text-[#E3F2F7] truncate">{row.title}</div>
											<div className="text-xs text-muted-foreground">{formatCity(row.city)}</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">{row.submitter_name ?? "—"}</div>
											{row.submitter_email ? (
												<div className="text-xs text-muted-foreground truncate max-w-[200px]">
													{row.submitter_email}
												</div>
											) : null}
										</TableCell>
										<TableCell className="whitespace-nowrap text-sm">{formatLisbonDate(row.start_time)}</TableCell>
										<TableCell className="text-sm text-muted-foreground whitespace-nowrap">
											{formatRelative(row.submitted_at)}
										</TableCell>
										<TableCell className="text-right">
											<Button asChild size="sm" variant="default">
												<Link href={`/dashboard/event-submissions/${row.id}`}>Review</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Card>
				)}
			</section>

			{recent.length > 0 ? (
				<section className="space-y-3">
					<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recently decided</h3>
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Event</TableHead>
									<TableHead>Submitter</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">View</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{recent.map((row) => (
									<TableRow key={row.id}>
										<TableCell className="max-w-[260px]">
											<div className="font-medium text-[#104357] dark:text-[#E3F2F7] truncate">{row.title}</div>
											<div className="text-xs text-muted-foreground">{formatCity(row.city)}</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">{row.submitter_name ?? "—"}</div>
											{row.submitter_email ? (
												<div className="text-xs text-muted-foreground truncate max-w-[200px]">
													{row.submitter_email}
												</div>
											) : null}
										</TableCell>
										<TableCell>
											{row.status === "approved" ? (
												<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Approved</Badge>
											) : (
												<Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">Rejected</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<Button asChild size="sm" variant="ghost">
												<Link href={`/dashboard/event-submissions/${row.id}`}>Open</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Card>
				</section>
			) : null}
		</div>
	);
}
