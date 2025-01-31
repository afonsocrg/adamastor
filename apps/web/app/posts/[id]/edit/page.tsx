import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditPostClient from "./edit-post-client";

interface EditPostPageProps {
  params: { id: string };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || post.author_id !== user.id) {
    redirect(`/posts/${id}`);
  }

  return <EditPostClient postId={post.id} initialContent={post.content} title={post.title} />;
}
