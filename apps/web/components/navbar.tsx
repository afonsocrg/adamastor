import { createClient } from "@/lib/supabase/server";
import { CalendarPlusIcon, FileTextIcon, LogOutIcon, SquarePenIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "./search-bar";
import { Badge } from "./tailwind/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./tailwind/ui/hover-card";
import { Separator } from "./tailwind/ui/separator";

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
            <Link href="/">
              <p className="max-w-48">A digital publication about all things startup in Portugal</p>
            </Link>
          </div>

          <div className="flex-1 flex justify-center">
            <Link href="/">
              <Image
                priority
                className="dark:hidden"
                src={"/adamastorLogotype.svg"}
                height={160}
                width={160}
                alt="Adamastor Logotype"
              />
              <Image
                priority
                className="hidden dark:block"
                src={"/adamastorLogotypeDark.svg"}
                height={160}
                width={160}
                alt="Adamastor Logotype"
              />
            </Link>
          </div>

          <div className="w-60 justify-end">
            <div className="flex gap-3 justify-end !text-muted-foreground">
              <Link href="/about" className="hover:underline hover:text-primary">
                About
              </Link>
              <Link href="/events" className="hover:underline hover:text-primary flex gap-1 group">
                Events
                <Badge variant="default">NEW</Badge>
              </Link>

              {user && (
                <>
                  <HoverCard>
                    <HoverCardTrigger className="cursor-pointer">Account</HoverCardTrigger>
                    <HoverCardContent className="flex flex-col rounded-xl space-y-2 p-2 !text-muted-foreground">
                      <Link
                        href="/posts/new"
                        className="hover:underline hover:text-primary hover:bg-muted p-2 rounded-md transition-all flex items-center gap-2"
                      >
                        <SquarePenIcon className="h-4 w-4" />
                        New Post
                      </Link>
                      <Link
                        href="/profile"
                        className="hover:underline hover:text-primary hover:bg-muted p-2 rounded-md transition-all flex items-center gap-2"
                      >
                        <FileTextIcon className="h-4 w-4" />
                        View Posts
                      </Link>
                      <Link
                        href="/add-event"
                        className="hover:underline hover:text-primary hover:bg-muted p-2 rounded-md transition-all flex items-center gap-2"
                      >
                        <CalendarPlusIcon className="h-4 w-4" />
                        New Event
                      </Link>
                      <Separator />

                      <Link
                        prefetch={false}
                        href="/logout"
                        className="hover:underline hover:text-primary hover:bg-muted p-2 rounded-md transition-all flex items-center gap-2"
                      >
                        <LogOutIcon className="h-4 w-4" />
                        Sign out
                      </Link>
                    </HoverCardContent>
                  </HoverCard>
                </>
              )}
            </div>
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
