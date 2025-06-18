import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tailwind/ui/tabs";
import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MyPosts } from "./MyPosts";
import { OthersPosts } from "./OthersPosts";
import { Button } from "@/components/tailwind/ui/button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const profile = await assertAuthenticated(supabase);

  const isAdmin = profile.role === "admin";

  return (
    <div className="w-full mx-auto p-6 animate-in">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-[#104357] dark:text-[#E3F2F7] flex gap-2 items-center">Posts</h2>
        <Button className="inline-flex items-center px-4 py-2 bg-[#04C9D8] text-white font-semibold rounded-md hover:opacity-80 transition-colors" asChild>
        <Link
          href="/dashboard/posts/new"
          
        >
          Create New Post
        </Link>
        </Button>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="my-posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-posts">My Posts</TabsTrigger>
            <TabsTrigger value="others-posts">Others' Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="my-posts" className="animate-in">
            <MyPosts userId={profile.id} />
          </TabsContent>

          <TabsContent value="others-posts" className="animate-in">
            <OthersPosts currentUserId={profile.id} />
          </TabsContent>
        </Tabs>
      ) : (
        <MyPosts userId={profile.id} />
      )}
    </div>
  );
}
