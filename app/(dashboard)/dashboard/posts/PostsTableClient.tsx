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
 * Extended Post interface that includes optional author information.
 *
 * Note: Your current Post type only has { id, title, slug, is_public }.
 * You'll need to update your Supabase query to include created_at and author info.
 * See instructions at the bottom of this file.
 */
export interface PostWithAuthor {
	id: string;
	title: string;
	slug: string;
	is_public: boolean;
	created_at: string;
	// Author info - will be null for "My Posts" since we don't need it there
	author?: {
		id: string;
		name: string;
	} | null;
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Formats a date string into a human-readable relative time.
 *
 * Examples:
 * - "5 minutes ago"
 * - "about 3 hours ago"
 * - "2 days ago"
 * - "Jan 15, 2024" (for dates older than 7 days)
 *
 * Why relative time? It reduces cognitive load. Users care more about
 * "how recent" something is rather than the exact timestamp.
 */
function formatRelativeDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();

	// Convert milliseconds to larger units
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	// Return appropriate format based on how long ago
	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
	if (diffHours < 24) return `about ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
	if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

	// For older dates, show the actual date
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PostsTableClient({ posts, emptyMessage, showAuthor = false }: PostsTableClientProps) {
	// ---------------------------------------------------------------------------
	// STATE
	// ---------------------------------------------------------------------------

	/**
	 * Search state for filtering posts by title.
	 * We use controlled input pattern: the Input's value is always `search`,
	 * and onChange updates `search`.
	 */
	const [search, setSearch] = useState("");

	// ---------------------------------------------------------------------------
	// DERIVED STATE (MEMOIZED)
	// ---------------------------------------------------------------------------

	/**
	 * useMemo: Only recompute filtered posts when `search` or `posts` changes.
	 *
	 * Why useMemo here?
	 * - Filtering is O(n) operation
	 * - Without memoization, it would run on every render
	 * - With memoization, it only runs when dependencies change
	 *
	 * For small lists (<100 items), this optimization is negligible.
	 * But it's a good habit and makes the code more predictable.
	 */
	const filteredPosts = useMemo(() => {
		if (!posts) return [];
		if (!search.trim()) return posts;

		const searchLower = search.toLowerCase();
		return posts.filter((post) => {
			// Search in title
			const titleMatch = post.title.toLowerCase().includes(searchLower);
			// Search in author name (if available)
			const authorMatch = post.author?.name?.toLowerCase().includes(searchLower);
			return titleMatch || authorMatch;
		});
	}, [search, posts]);

	// ---------------------------------------------------------------------------
	// RENDER
	// ---------------------------------------------------------------------------

	return (
		<div className="space-y-4">
			{/* Search Bar */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search posts..."
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
										<TableCell className="text-muted-foreground px-4 py-8">
											{post.author?.name ?? "Carlos Resende"}
										</TableCell>
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

									{/* Number of Unique Views */}
									<TableCell className="text-muted-foreground px-4 py-8">{/* TODO: Fetch PostHog */}22</TableCell>

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

// =============================================================================
// INSTRUCTIONS: UPDATING YOUR SUPABASE QUERIES
// =============================================================================
/*
 * Your current queries only select "*" from posts. To show author names,
 * you'll need to JOIN with your profiles/users table.
 *
 * Option 1: If you have a "profiles" table with user info:
 *
 *   const { data: posts } = await supabase
 *     .from("posts")
 *     .select(`
 *       *,
 *       author:profiles!created_by (
 *         id,
 *         name
 *       )
 *     `)
 *     .eq("created_by", userId)
 *     .order("created_at", { ascending: false });
 *
 * Option 2: If author info is directly on the posts table:
 *
 *   Just make sure "created_at" and "author_name" columns exist.
 *
 * The key insight: Supabase's .select() can do JOINs using the
 * `table!foreign_key (columns)` syntax. This is called "embedded resources".
 *
 * Docs: https://supabase.com/docs/guides/database/joins-and-nesting
 */
