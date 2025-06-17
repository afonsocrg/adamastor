'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePost } from '@/lib/posts';

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    setIsPending(true);
    
    try {
      const response = await deletePost({ id: postId });

      if (!response.ok) throw new Error('Failed to delete post');
      
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className={`
        inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 
        rounded-md hover:bg-red-200 transition-colors
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}