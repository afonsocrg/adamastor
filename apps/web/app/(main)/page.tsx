import { Separator } from "@/components/tailwind/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tailwind/ui/tabs";
import { formatDate } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@tiptap/core";
import Link from "next/link";
import {
  Color,
  StarterKit,
  TaskItem,
  TaskList,
  TextStyle,
  TiptapImage,
  TiptapLink,
  TiptapUnderline,
  Youtube,
} from "novel";

// Helper function to generate content preview
function getContentPreview(postContent) {
  let contentPreview = "Check out this post on our blog.";

  try {
    const contentText = generateText(postContent, [
      StarterKit,
      TaskItem,
      TaskList,
      TiptapImage,
      TiptapUnderline,
      TextStyle,
      Color,
      TiptapLink,
      Youtube,
    ]).slice(0, 360);

    if (contentText.length > 0) {
      const lastSpaceIndex = contentText.lastIndexOf(" ");
      contentPreview = lastSpaceIndex > 0 ? `${contentText.substring(0, lastSpaceIndex)}...` : `${contentText}...`;
    }
  } catch (error) {
    console.error("Error generating content preview", error);
    console.log("Continuing with default content preview");
  }

  return contentPreview;
}

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
          {posts?.map((post) => {
            const contentPreview = getContentPreview(post.content);

            return (
              <article className="group" key={post.id}>
                <Link
                  href={`/posts/${post.slug}`}
                  className="flex flex-col sm:px-4 py-4 rounded-lg hover:bg-accent/50 transition-all animate-in"
                >
                  <div className="flex gap-8 align-top">
                    <section className="space-y-3 mb-3">
                      <h2 className="text-xl font-bold group-hover:text-[#24acb5] duration-300 [font-family:var(--font-default)] space-x-4">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground prose line-clamp-2">{contentPreview}</p>
                      <p className="text-muted-foreground text-sm">{formatDate(post.created_at)}</p>
                    </section>
                    {/* <div className="bg-neutral-50 w-60 h-40 sm:flex rounded-lg m-0 text-neutral-500 justify-center items-center font-light text-xl hidden">
                      {post.title.includes("#") ? post.title.slice(post.title.indexOf("#")) : ""}
                    </div> */}
                  </div>
                </Link>
                <Separator />
              </article>
            );
          })}
        </TabsContent>
        <TabsContent value="digest" className="animate-in gap-4 flex flex-col">
          {posts?.map((post) => {
            const contentPreview = getContentPreview(post.content);

            return (
              <article className="group" key={post.id}>
                <Link
                  href={`/posts/${post.slug}`}
                  className="flex flex-col sm:px-4 py-4 rounded-lg hover:bg-accent/50 transition-all animate-in"
                >
                  <div className="flex gap-8 align-top">
                    <section className="space-y-3 mb-3">
                      <h2 className="text-xl font-bold group-hover:text-[#24acb5] [font-family:var(--font-default)] space-x-4">
                        {post.title.includes("|") ? post.title.split("|")[0] : post.title}
                      </h2>
                      <p className="text-muted-foreground prose line-clamp-2">{contentPreview}</p>
                      <p className="text-muted-foreground text-sm">{formatDate(post.created_at)}</p>
                    </section>
                    <div className="bg-neutral-50 w-60 h-40 sm:flex rounded-lg m-0 text-neutral-500 justify-center items-center font-light text-xl hidden">
                      {post.title.includes("#") ? post.title.slice(post.title.indexOf("#")) : ""}
                    </div>
                  </div>
                </Link>
                <Separator />
              </article>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
