'use server'

import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONContent } from "novel";

async function createPost(title: string, content: JSONContent, isPublic: boolean) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

   // Get the author_id for the current user, fallback to system author
  const { data: authorData } = await supabase
    .from('authors')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const author_id = authorData?.id || '8a3ac70b-7f88-4767-b88a-0645bfdaf817';
  
  const { data: post, error } = await supabase
      .from('posts')
      .insert([
        { 
          title, 
          content,
          is_public: isPublic,
          created_by: user.id,
          author_id
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