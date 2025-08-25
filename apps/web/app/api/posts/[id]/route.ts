import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { handleError, BadRequestError } from '@/lib/errors';
import { assertAuthenticated } from '@/lib/supabase/authentication'
import { generateUniqueSlug, ensureUniqueSlug, isValidSlug } from '@/lib/slugs';
import type { RouteParams } from './types';

export interface UpdatePostBody {
  title?: string;
  content?: string;
  slug?: string;
  is_public?: boolean;
}

export async function POST(request: Request, routeParams: RouteParams) {
  try {
    const { id } = await routeParams.params;
    const supabase = await createClient();

    const user = await assertAuthenticated(supabase);
    
    // RLS is responsible for checking if the user is the author of the post

    const { title, content, slug: customSlug, is_public }: UpdatePostBody = await request.json();

    // Handle slug logic
    let slug = customSlug;
    if (title && !customSlug) {
      // If title changed but no custom slug provided, generate new one
      slug = await generateUniqueSlug(title, id);
    } else if (customSlug) {
      // Validate custom slug format
      if (!isValidSlug(customSlug)) {
        throw new BadRequestError('Invalid slug format');
      }
      // Ensure custom slug is unique
      slug = await ensureUniqueSlug(customSlug, id);
    }

    const updatePayload = { content, title, slug, is_public }

    // 5. Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedPost) {
      console.error('Failed to update post', { updateError });
      throw new BadRequestError('Failed to update post');
    }

    return NextResponse.json({ 
      message: 'Post updated successfully', 
      post: updatedPost 
    });
    
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, routeParams: RouteParams) {
  try {
    const { id } = await routeParams.params;
    const supabase = await createClient();
    
    await assertAuthenticated(supabase);
    // RLS is responsible for checking if the user is the author of the post

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete post', { deleteError });
      throw new BadRequestError('Failed to delete post');
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}