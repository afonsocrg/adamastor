import { PublishedTag } from "@components/PublishedTag";
import { PostActions } from "./PostAction";

export interface Post {
  id: string;
  title: string;
  is_public: boolean;
}

interface PostListProps {
  posts: Post[] | null;
  emptyMessage: string;
}

export function PostList({ posts, emptyMessage }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts?.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">{emptyMessage}</p>
      ) : (
        posts?.map((post) => (
          <div
            key={post.id}
            className="bg-white shadow rounded-lg p-6 flex flex-col sm:flex-row justify-between items-center gap-4"
          >
            <div className="flex items-center gap-2 flex-1">
              <PublishedTag is_public={post.is_public} />
              <h2 className="text-xl font-semibold text-neutral-900 truncate">
                {post.title}
              </h2>
            </div>
            <PostActions post={post} />
          </div>
        ))
      )}
    </div>
  );
}
