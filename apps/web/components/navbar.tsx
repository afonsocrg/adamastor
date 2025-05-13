import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
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

      <nav className="p-4 mb-2 border-b">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="w-60 leading-tight font-normal text-muted-foreground text-sm">
            <p>A digital publication about</p>
            <p>all things startup in Portugal</p>
          </div>

          <div className="flex-1 flex justify-center">
            <Link href="/">
              <Image
                className="dark:hidden"
                src={"/adamastorLogotype.svg"}
                height={160}
                width={160}
                alt="Adamastor Logotype"
              />
              <Image
                className="hidden dark:block"
                src={"/adamastorLogotypeDark.svg"}
                height={160}
                width={160}
                alt="Adamastor Logotype"
              />
            </Link>
          </div>

          <div className="w-60 justify-end">
            {user && (
              <div className="flex gap-3 justify-end !text-muted-foreground">
                <Link href="/posts/new" className="text-xl font-medium hover:underline hover:text-primary">
                  New Post
                </Link>
                <Link href="/profile" className="text-xl font-medium hover:underline hover:text-primary">
                  Profile
                </Link>
                <Link
                  prefetch={false}
                  href="/logout"
                  className="text-xl font-medium hover:underline hover:text-primary"
                >
                  Logout
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="p-4 md:mb-6 border-b flex justify-center ">
        <SearchBar />
      </div>
    </>
  );
};

export default Navbar;
