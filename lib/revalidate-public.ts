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
	revalidatePath("/events");
}
