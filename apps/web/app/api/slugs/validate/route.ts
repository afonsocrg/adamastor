import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const excludeId = searchParams.get('excludeId');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    let query = supabase
      .from('posts')
      .select('id')
      .eq('slug', slug);
      
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      // If no rows found, slug is unique
      if (error.code === 'PGRST116') {
        return NextResponse.json({ isUnique: true });
      }
      
      // Other database errors
      console.error('Database error checking slug:', error);
      return NextResponse.json(
        { error: 'Database error checking slug availability' },
        { status: 500 }
      );
    }
    
    // If we found a row, slug is taken
    return NextResponse.json({ isUnique: false });
    
  } catch (error) {
    console.error('Error in slug validation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}