"use client";

import { Badge } from "@/components/tailwind/ui/badge";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Label } from "@/components/tailwind/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/tailwind/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/tailwind/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tailwind/ui/tabs";
import { FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PostActions } from "./PostAction";
import { SendNewsletterDialog } from "./SendNewsletterDialog";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Post interface with author and view count information.
 */
export interface PostWithAuthor {
	id: string;
	title: string;
	slug: string;
	is_public: boolean;
	created_at: string;
	authors?: {
		id: string;
		name: string;
	} | null;
	views?: number;
	subscriptions?: number;
}

interface PostsTableClientProps {
	posts: PostWithAuthor[] | null;
	emptyMessage: string;
	showAuthor?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatRelativeDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();

	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
	if (diffHours < 24) return `about ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
	if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatCount(count: number | undefined): string {
	if (count === undefined || count === null) return "—";
	return count.toLocaleString();
}

// =============================================================================
// NEWSLETTER SECTION COMPONENT
// =============================================================================

interface NewsletterSectionProps {
	postId: string;
	postTitle: string;
}

function NewsletterSection({ postId, postTitle }: NewsletterSectionProps) {
	const [testEmail, setTestEmail] = useState("malik@hey.com");
	const [dialogMode, setDialogMode] = useState<"test" | "broadcast" | null>(null);

	return (
		<div className="mt-6 pt-6">
			<h3 className="text-xl font-semibold text-[#104357] dark:text-navy-lifted mb-4">Newsletter</h3>

			<Tabs defaultValue="test" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="test">Test Email</TabsTrigger>
					<TabsTrigger value="broadcast">Send to Everyone</TabsTrigger>
				</TabsList>

				{/* Test Email Tab */}
				<TabsContent value="test" className="space-y-4 mt-4">
					<p className="text-sm text-muted-foreground">
						Send a test email to preview how this article will look in the newsletter.
					</p>

					<div className="space-y-2">
						<Label htmlFor={`testEmail-${postId}`}>Send to</Label>
						<div className="flex gap-2">
							<Input
								id={`testEmail-${postId}`}
								type="email"
								placeholder="your@email.com"
								value={testEmail}
								onChange={(e) => setTestEmail(e.target.value)}
								className="flex-1"
							/>
							<Button onClick={() => setDialogMode("test")} variant="outline" disabled={!testEmail.trim()}>
								Choose events &amp; send
							</Button>
						</div>
					</div>

					<p className="text-xs text-muted-foreground">
						You'll pick up to 6 events to feature before the test sends. Note: the unsubscribe link won't work in test
						mode.
					</p>
				</TabsContent>

				{/* Broadcast Tab */}
				<TabsContent value="broadcast" className="space-y-4 mt-4">
					<div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3">
						<p className="text-sm text-amber-800 dark:text-amber-200">
							⚠️ This will send "{postTitle}" to <strong>all subscribers</strong>. You'll choose the featured events and
							confirm before anything goes out.
						</p>
					</div>

					<Button
						onClick={() => setDialogMode("broadcast")}
						className="inline-flex items-center px-4 py-2 text-white transition-all duration-200 rounded-lg bg-[#d4a657] hover:bg-[#d4a657]/90"
					>
						Choose events &amp; send to everyone
					</Button>
				</TabsContent>
			</Tabs>

			<SendNewsletterDialog
				postId={postId}
				postTitle={postTitle}
				mode={dialogMode ?? "test"}
				testEmail={testEmail}
				open={dialogMode !== null}
				onOpenChange={(open) => {
					if (!open) setDialogMode(null);
				}}
			/>
		</div>
	);
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PostsTableClient({ posts, emptyMessage, showAuthor = false }: PostsTableClientProps) {
	const [search, setSearch] = useState("");

	const filteredPosts = useMemo(() => {
		if (!posts) return [];
		if (!search.trim()) return posts;

		const searchLower = search.toLowerCase();
		return posts.filter((post) => {
			const titleMatch = post.title.toLowerCase().includes(searchLower);
			const authorMatch = post.authors?.name?.toLowerCase().includes(searchLower);
			return titleMatch || authorMatch;
		});
	}, [search, posts]);

	return (
		<div className="space-y-4">
			{/* Search Bar */}
			<div className="sticky top-1 z-10 bg-background">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search articles or authors"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-10"
				/>
			</div>

			{/* Table */}
			<div className="border rounded-lg overflow-visible">
				<Table className="table-fixed">
					<TableHeader>
						<TableRow>
							<TableHead className="w-[40%]">Title</TableHead>
							{showAuthor && <TableHead className="w-[45px]">Author</TableHead>}
							<TableHead className="w-[40px]">Status</TableHead>
							<TableHead className="w-[30px]">Views</TableHead>
							<TableHead className="w-[30px]">Subs</TableHead>
							<TableHead className="w-[30px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{/* Empty State */}
						{filteredPosts.length === 0 ? (
							<TableRow>
								<TableCell colSpan={showAuthor ? 7 : 6} className="text-center py-8">
									<FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
									<p className="text-muted-foreground">{search ? "No posts match your search" : emptyMessage}</p>
								</TableCell>
							</TableRow>
						) : (
							/* Post Rows */
							filteredPosts.map((post) => (
								<Sheet key={post.id}>
									<SheetTrigger asChild>
										<TableRow key={post.id} className="cursor-pointer">
											{/* Title */}
											<TableCell className="max-w-[300px] px-4 py-8">
												<span className="font-medium truncate block">{post.title}</span>
												<span className="text-[13px] text-muted-foreground">{formatRelativeDate(post.created_at)}</span>
											</TableCell>

											{/* Author (conditional) */}
											{showAuthor && (
												<TableCell className="text-muted-foreground px-4 py-8">{post.authors?.name ?? "—"}</TableCell>
											)}

											{/* Status Badge */}
											<TableCell className="px-4 py-8">
												<Badge
													className={
														post.is_public
															? "bg-navy-tint/50 text-navy border-navy-tint dark:bg-navy-tint/[0.15] dark:text-navy-lifted dark:border-navy-tint/[0.3]"
															: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/30"
													}
													variant={post.is_public ? "outline" : "secondary"}
												>
													{post.is_public ? "Published" : "Draft"}
												</Badge>
											</TableCell>

											{/* Unique Views from PostHog */}
											<TableCell className="text-muted-foreground px-4 py-8 text-lg">
												{formatCount(post.views)}
											</TableCell>

											{/* Subscriptions from PostHog */}
											<TableCell className="text-muted-foreground px-4 py-8 text-lg">
												{formatCount(post.subscriptions)}
											</TableCell>

											{/* Actions */}
											<TableCell className="text-right px-4 py-8">
												<PostActions post={post} />
											</TableCell>
										</TableRow>
									</SheetTrigger>
									<SheetContent className="sm:max-w-[800px]">
										<SheetHeader>
											<SheetTitle className="text-2xl font-bold text-[#104357] dark:text-navy-lifted flex gap-2 items-center">
												{post.title}
											</SheetTitle>
											<SheetDescription>Published {formatRelativeDate(post.created_at)}</SheetDescription>
										</SheetHeader>

										{/* Stats Cards */}
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
											<div className="bg-card border rounded-lg p-4">
												<p className="text-sm text-muted-foreground uppercase tracking-wide">Views</p>
												<p className="text-3xl font-semibold mt-1">{formatCount(post.views)}</p>
											</div>
											<div className="bg-card border rounded-lg p-4">
												<p className="text-sm text-muted-foreground uppercase tracking-wide">New Subscribers</p>
												<p className="text-3xl font-semibold mt-1">{formatCount(post.subscriptions)}</p>
											</div>
											<div className="bg-card border rounded-lg p-4">
												<p className="text-sm text-muted-foreground uppercase tracking-wide">Email Recipients</p>
												<p className="text-3xl mt-1">-</p>
											</div>
										</div>

										{/* Newsletter Section */}
										<NewsletterSection postId={post.id} postTitle={post.title} />
									</SheetContent>
								</Sheet>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
