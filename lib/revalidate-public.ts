import { revalidatePath } from "next/cache";

type PostRevalidationTarget = {
	id?: number | string | null;
	slug?: string | null;
};

export function revalidatePostListing() {
	revalidatePath("/");
	revalidatePath("/page/[page]", "page");
}

export function revalidatePostDetail(target: PostRevalidationTarget) {
	if (target.id) {
		revalidatePath(`/posts/${target.id}`);
	}

	if (target.slug) {
		revalidatePath(`/posts/${target.slug}`);
	}
}

export function revalidatePostContent(target: PostRevalidationTarget = {}) {
	revalidatePostListing();
	revalidatePostDetail(target);
}

export function revalidateEventsListing() {
	// /events and every page beneath it are ISR (revalidate=3600). On an
	// approve / edit / delete we must refresh the WHOLE tree — not just the base
	// list. revalidatePath("/events") alone leaves the programmatic sub-routes
	// stale for up to an hour, so a freshly approved event shows on /events but
	// is missing from /events/[city], /events/[category] (e.g. /events/ai),
	// /events/[city]/[category], and the calendar. "layout" purges the whole
	// subtree under the shared events layout; the explicit dynamic patterns are
	// belt-and-braces for the prerendered [slug]/[category] params.
	revalidatePath("/events", "layout");
	revalidatePath("/events/[slug]", "page");
	revalidatePath("/events/[slug]/[category]", "page");
	revalidatePath("/events/calendar");
}
