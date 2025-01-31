import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const Navbar = async () => {
  // const router = useRouter();

  // const handleNewPost = () => {
  //   const newPost = postsService.createPost();
  //   router.push(`/posts/${newPost.id}/edit`);
  // };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="bg-accent p-4 mb-6">
      <div className="max-w-screen-lg mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Home
        </Link>
        {user && (
          <div className="flex gap-3">
            <Link href="/posts/new" className="text-xl font-bold hover:underline hover:text-primary">
              New Post
            </Link>
            <Link href="/profile" className="text-xl font-bold hover:underline hover:text-primary">
              Profile
            </Link>
            <Link href="/logout" className="text-xl font-bold hover:underline hover:text-primary">
              Logout
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
