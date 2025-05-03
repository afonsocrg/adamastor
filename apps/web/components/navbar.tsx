import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import SearchBar from "./search-bar";

const Navbar = async () => {
  // const router = useRouter();

  // const handleNewPost = () => {
  //   const newPost = postsService.createPost();
  //   router.push(`/posts/${newPost.id}/edit`);
  // };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <div className="bg-[#04C9D8] w-full h-1" />
      <nav className="p-4 mb-6">
        <div className="max-w-screen-lg mx-auto flex justify-between items-center">
          <section className="flex space-x-8 items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              Adamastor
            </Link>
            <SearchBar />
          </section>

          {user && (
            <div className="flex gap-3">
              <Link href="/posts/new" className="text-xl font-semibold hover:underline hover:text-primary">
                New Post
              </Link>
              <Link href="/profile" className="text-xl font-semibold hover:underline hover:text-primary">
                Profile
              </Link>
              <Link
                prefetch={false}
                href="/logout"
                className="text-xl font-semibold hover:underline hover:text-primary"
              >
                Logout
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
