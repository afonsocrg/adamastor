import Link from "next/link";
import { formatDate } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: posts,
    error,
    status,
  } = await supabase
    .from("posts")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error && status !== 200) {
    console.log("error", error);
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          className="block p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <h2 className="text-xl font-semibold">{post.title}</h2>
          <p className="text-muted-foreground">{formatDate(post.created_at)}</p>
        </Link>
      ))}
    </div>
  );
}
