import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tailwind/ui/tabs";
import { formatDate } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: posts,
    error,
    status,
  } = await supabase.from("posts").select("*").eq("is_public", true).order("created_at", { ascending: false });

  if (error && status !== 200) {
    console.log("error", error);
  }

  return (
    <div className="space-y-4 ">
      <Tabs defaultValue="all" className="w-full space-y-6 animate-in">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="digest">Weekly Digest</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="animate-in gap-4 flex flex-col">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="space-y-4 flex flex-col p-4 border rounded-lg hover:bg-accent/50 transition-all animate-in"
            >
              <h2 className="text-xl font-semibold hover:text-[#24acb5]">{post.title}</h2>
              <p className="text-muted-foreground">{formatDate(post.created_at)}</p>
            </Link>
          ))}
        </TabsContent>
        <TabsContent value="digest" className="animate-in gap-4 flex flex-col">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="space-y-4 flex flex-col p-4 border rounded-lg hover:bg-accent/50 transition-all animate-in"
            >
              <h2 className="text-xl font-semibold hover:text-[#24acb5] transition-all">{post.title}</h2>
              <p className="text-muted-foreground">{formatDate(post.created_at)}</p>
            </Link>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
