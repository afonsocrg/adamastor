import type { JSONContent } from "novel";
import { urenoContent } from "./customContent";

export interface Post {
  id: string;
  title: string;
  date: string;
  content: JSONContent;
}

const STORAGE_KEY = "blog_posts";

export const postsService = {
  initialize: () => {
    // Check if we already have posts in localStorage
    const existingPosts = localStorage.getItem(STORAGE_KEY);
    if (!existingPosts) {
      // Initialize with the default post
      const defaultPost: Post = {
        id: "1",
        title: "Olá, Carlos!",
        date: "2024-01-20",
        content: urenoContent,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultPost]));
    }
  },

  getAllPosts: (): Post[] => {
    const posts = localStorage.getItem(STORAGE_KEY);
    return posts ? JSON.parse(posts) : [];
  },

  getPost: (id: string): Post | null => {
    const posts = postsService.getAllPosts();
    return posts.find((post) => post.id === id) || null;
  },

  createPost: (): Post => {
    const posts = postsService.getAllPosts();
    const newPost: Post = {
      id: Date.now().toString(),
      title: "New Post",
      date: new Date().toISOString().split("T")[0],
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
      },
    };
    posts.push(newPost);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    return newPost;
  },

  updatePost: (post: Post) => {
    const posts = postsService.getAllPosts();
    const index = posts.findIndex((p) => p.id === post.id);
    if (index !== -1) {
      posts[index] = post;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    }
  },

  deletePost: (id: string) => {
    const posts = postsService.getAllPosts();
    const index = posts.findIndex((p) => p.id === id);
    if (index !== -1) {
      posts.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    }
  },
};
