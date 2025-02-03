'use server'

import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "novel";

async function createPost(title: string, content: JSONContent, isPublic: boolean) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);
  
  const { data: post, error } = await supabase
      .from('posts')
      .insert([
        { 
          title, 
          content,
          is_public: isPublic,
          author_id: user.id
        }
      ])
      .select()
      .single();
    
  if (error) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post');
  }

  revalidatePath('/', 'page');
  return post;
}

export async function publishPost(title: string, content: JSONContent) {
  return await createPost(title, content, true);
}

export async function saveDraft(title: string, content: JSONContent) {
  return await createPost(title, content, false);
}