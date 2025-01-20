import Link from "next/link";

// Dummy data - replace with your actual data structure
const DUMMY_POSTS = [
  { id: 1, title: "Getting Started with Next.js", date: "2024-03-20" },
  { id: 2, title: "Understanding TypeScript", date: "2024-03-19" },
  { id: 3, title: "React Best Practices", date: "2024-03-18" },
];

export default function Home() {
  return (
    <div className="space-y-4">
      {DUMMY_POSTS.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="block p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <h2 className="text-xl font-semibold">{post.title}</h2>
          <p className="text-muted-foreground">{post.date}</p>
        </Link>
      ))}
    </div>
  );
}
