"use server";

import { revalidatePostContent } from "@/lib/revalidate-public";
import { createClient } from "@/lib/supabase/server";
import type { JSONContent } from "novel";

export async function updatePost(postId: string, title: string, content: JSONContent) {
	const supabase = await createClient();
	const { data: post, error } = await supabase
		.from("posts")
		.update({ title, content })
		.eq("id", postId)
		.select("id, slug")
		.single();
	if (!error && post) {
		revalidatePostContent(post);
	}
	return error;
}
