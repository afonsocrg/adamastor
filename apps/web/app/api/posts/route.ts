import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const body = await request.json();
    const { title, content } = body;

    const { data, error } = await supabase
      .from('posts')
      .insert([
        { 
          title, 
          content,
          is_public: true,
          author_id: user.id
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