import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="bg-accent p-4 mb-6">
      <div className="max-w-screen-lg mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Ureno
        </Link>
        <Link href="/edit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          New Post
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
