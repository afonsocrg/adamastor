'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { publishPost, unpublishPost } from '@/lib/posts';

export function PublishButton({ 
  postId, 
  isPublic 
}: { 
  postId: string; 
  isPublic: boolean;
}) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setIsPending(true);
    
    try {
      if (isPublic) {
        await unpublishPost({ id: postId });
      } else {
        await publishPost({ id: postId });
      }

      router.refresh();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`
        inline-flex items-center px-3 py-1.5 rounded-md transition-colors
        ${isPublic 
          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
          : 'bg-green-100 text-green-700 hover:bg-green-200'
        }
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isPending ? 'Processing...' : (isPublic ? 'Unpublish' : 'Publish')}
    </button>
  );
}