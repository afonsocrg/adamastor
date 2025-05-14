import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tailwind/ui/tabs";
import { MyPosts } from "./MyPosts";
import { OthersPosts } from "./OthersPosts";

export default async function ProfilePage() {
  const supabase = await createClient();
  const profile = await assertAuthenticated(supabase);

  const isAdmin = profile.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <p className="text-gray-900 dark:text-white mb-4">(Logged in as [{profile.role.toUpperCase()}] {profile.email})</p>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Posts</h2>
        <Link
          href="/posts/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Post
        </Link>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="my-posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-posts">My Posts</TabsTrigger>
            <TabsTrigger value="others-posts">Others' Posts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-posts">
            <MyPosts userId={profile.id} />
          </TabsContent>

          <TabsContent value="others-posts">
            <OthersPosts currentUserId={profile.id} />
          </TabsContent>
        </Tabs>
      ) : (
        <MyPosts userId={profile.id} />
      )}
    </div>
  );
}
