import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const body = await request.json();
    const { title, content } = body;

    // Get the author_id for the current user, fallback to system author
    const { data: authorData } = await supabase
      .from('authors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const author_id = authorData?.id || '8a3ac70b-7f88-4767-b88a-0645bfdaf817';

    const { data, error } = await supabase
      .from('posts')
      .insert([
        { 
          title, 
          content,
          is_public: true,
          created_by: user.id,
          author_id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Post created successfully', post: data });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
} 