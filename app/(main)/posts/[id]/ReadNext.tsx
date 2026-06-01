import { formatDate } from "@/lib/datetime";
import { getDisplayTitle } from "@/lib/posts/kind";
import type { RelatedPost } from "@/lib/posts/related";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ReadNextProps {
	posts: RelatedPost[];
}

export default function ReadNext({ posts }: ReadNextProps) {
	if (posts.length === 0) return null;

	return (
		<section className="border-t border-navy-frame dark:border-navy-edge pt-10">
			<p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-hue">
				More opinion
			</p>
			<ul className="mt-6 divide-y divide-navy-frame dark:divide-navy-edge">
				{posts.map((post) => (
					<li key={post.id}>
						<Link
							href={`/posts/${post.slug ?? post.id}`}
							className="group flex items-start gap-4 py-5 transition-colors hover:bg-navy-veil/40 sm:px-3"
						>
							{post.authors?.image_url ? (
								<Image
									src={post.authors.image_url}
									alt={post.authors.name ?? "Author portrait"}
									width={48}
									height={48}
									className="h-12 w-12 shrink-0 rounded-md border border-navy-frame dark:border-navy-edge object-cover"
									style={{ filter: "url(#duotone-navy-portrait)" }}
								/>
							) : null}
							<div className="min-w-0 flex-1 space-y-1.5">
								<h3 className="text-[1.1875rem] font-semibold leading-snug tracking-tight text-navy dark:text-navy-lifted [text-wrap:balance] group-hover:underline md:text-xl">
									{getDisplayTitle(post.title)}
								</h3>
								<p className="text-sm text-navy-tone dark:text-navy-dim">
									{post.authors?.name ?? "Adamastor"}
									<span aria-hidden="true"> · </span>
									<time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
								</p>
							</div>
							<ArrowRightIcon
								className="mt-2 h-4 w-4 shrink-0 text-orange-hue transition-transform group-hover:translate-x-0.5"
								aria-hidden="true"
							/>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
