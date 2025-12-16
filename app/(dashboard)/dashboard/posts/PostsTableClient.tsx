"use client";

import { Badge } from "@/components/tailwind/ui/badge";
import { Input } from "@/components/tailwind/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/tailwind/ui/table";
import { FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PostActions } from "./PostAction";

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
	// Author info from JOIN (key matches table name "authors")
	authors?: {
		id: string;
		name: string;
	} | null;
	// View count from PostHog
	views?: number;
}

interface PostsTableClientProps {
	posts: PostWithAuthor[] | null;
	emptyMessage: string;
	/**
	 * Whether to show the Author column.
	 * - false for "My Posts" (you know you wrote them)
	 * - true for "Others' Posts" (need to see who wrote each post)
	 */
	showAuthor?: boolean;
}

/**
 * Formats a date string into a human-readable relative time.
 */
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

/**
 * Formats view count with locale-aware number formatting.
 * e.g., 1234 → "1,234"
 */
function formatViewCount(views: number | undefined): string {
	if (views === undefined || views === null) return "—";
	return views.toLocaleString();
}

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
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search articles or authors"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-10"
				/>
			</div>

			{/* Table */}
			<div className="border rounded-lg">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							{showAuthor && <TableHead>Author</TableHead>}
							<TableHead>Status</TableHead>
							<TableHead>Views</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{/* Empty State */}
						{filteredPosts.length === 0 ? (
							<TableRow>
								<TableCell colSpan={showAuthor ? 5 : 4} className="text-center py-8">
									<FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
									<p className="text-muted-foreground">{search ? "No posts match your search" : emptyMessage}</p>
								</TableCell>
							</TableRow>
						) : (
							/* Post Rows */
							filteredPosts.map((post) => (
								<TableRow key={post.id}>
									{/* Title */}
									<TableCell className="max-w-[300px] px-4 py-8">
										<span className="font-medium truncate block">{post.title}</span>
										<span className="text-xs text-muted-foreground">{formatRelativeDate(post.created_at)}</span>
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
													? "bg-cyan-50 text-cyan-600 border-cyan-200"
													: "bg-amber-50 text-amber-600 border-amber-200"
											}
											variant={post.is_public ? "outline" : "secondary"}
										>
											{post.is_public ? "Published" : "Draft"}
										</Badge>
									</TableCell>

									{/* Unique Views from PostHog */}
									<TableCell className="text-muted-foreground px-4 py-8 font-semibold">
										{formatViewCount(post.views)}
									</TableCell>

									{/* Actions */}
									<TableCell className="text-right px-4 py-8">
										<PostActions post={post} />
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
