'use server'

import { createClient } from "@/lib/supabase/server";
import type { JSONContent } from "novel";

export async function updatePost(postId: string, title: string, content: JSONContent) {
  const supabase = await createClient();
  const { error } = await supabase.from('posts').update({ title, content }).eq('id', postId);
  return error;
}