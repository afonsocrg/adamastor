import type { JSONContent } from "novel";

export interface Post {
  id: string;
  title: string;
  date: string;
  content: JSONContent;
  is_public: boolean;
}

interface CreatePostArgs {
  title: string;
  content: JSONContent;
}
export async function createPost({ title, content }: CreatePostArgs) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content }),
  });

  if (!response.ok) {
    throw new Error('Failed to publish post');
  }

  return response
}

interface UpdatePostArgs {
  id: string;
  title?: string;
  content?: JSONContent;
  is_public?: boolean;
}
export async function updatePost({ id, title, content, is_public }: UpdatePostArgs) {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, is_public }),
  });

  if (!response.ok) {
    throw new Error('Failed to update post');
  }

  return response;
}

interface PublishPostArgs {
  id: string;
}
export async function publishPost({ id }: PublishPostArgs) {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_public: true }),
  });
}

interface UnpublishPostArgs {
  id: string;
}
export async function unpublishPost({ id }: UnpublishPostArgs) {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_public: false }),
  });
}

interface DeletePostArgs {
  id: string;
}
export async function deletePost({ id }: DeletePostArgs) {
  try {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
    });

    return response;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}


interface CopyPostArgs {
  id: string;
}
export async function copyPost({ id }: CopyPostArgs) {
  try {
    const response = await fetch(`/api/posts/${id}/copy`, {
      method: 'POST',
    });

    return response;
  } catch (error) {
    console.error('Error copying post:', error);
    throw error;
  }
}

