import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditPostClient from "./edit-post-client";
import { getUserProfile } from "@/lib/supabase/authentication";
interface EditPostPageProps {
  params: Promise<{ id: string }>;
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

  const profile = await getUserProfile(supabase);
  if (profile && (profile.id === post.author_id || profile.role === 'admin')) {
    return <EditPostClient post={post} />;
  }
  redirect(`/posts/${id}`);

}
