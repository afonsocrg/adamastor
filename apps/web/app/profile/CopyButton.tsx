'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { copyPost } from '@/lib/posts';

export function CopyButton({ postId }: { postId: string }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleCopy() {
    setIsPending(true);
    
    try {
      const response = await copyPost({ id: postId });

      if (!response.ok) throw new Error('Failed to copy post');
      
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={isPending}
      className={`
        inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 
        rounded-md hover:bg-gray-200 transition-colors
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isPending ? 'Creating copy...' : 'Create copy'}
    </button>
  );
}