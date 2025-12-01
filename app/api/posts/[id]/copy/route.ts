import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { handleError, BadRequestError, UnauthorizedError } from '@/lib/errors';
import { assertAuthenticated } from '@/lib/supabase/authentication'
import type { RouteParams } from '../types';

export async function POST(request: Request, routeParams: RouteParams) {
  try {
    const { id } = await routeParams.params;
    const supabase = await createClient();

    const user = await assertAuthenticated(supabase);
 
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (postError || !post) {
      console.error('Failed to get post', { postError });
      throw new BadRequestError('Failed to get post');
    }

    // Get the author_id for the current user, fallback to system author
    const { data: authorData } = await supabase
      .from('authors')
      .select('id')
      .eq('user_id', user.id)
      .single();
    const author_id = authorData?.id || '8a3ac70b-7f88-4767-b88a-0645bfdaf817';
 
    // if (post.author_id !== user.id) {
    //   throw new UnauthorizedError('You are not the author of this post');
    // }

    const { data: newPost, error: newPostError } = await supabase
      .from('posts')
      .insert({
        title: `[Copy] ${post.title}`,
        content: post.content,
        is_public: false,
        created_by: user.id,
        author_id,
      })
      .select()
      .single();

    if (newPostError || !newPost) {
      console.error('Failed to duplicate post', { newPostError });
      throw new BadRequestError('Failed to duplicate post');
    }

    return NextResponse.json({ 
      message: 'Post updated successfully', 
      post: newPost 
    });
    
  } catch (error) {
    return handleError(error);
  }
}