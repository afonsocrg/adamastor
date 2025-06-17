import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { handleError } from '@/lib/errors';
import { assertAuthenticated } from '@/lib/supabase/authentication';

export interface UpdateEventBody {
  title?: string;
  description?: string;
  start_time?: string;
  city?: string;
  url?: string;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    await assertAuthenticated(supabase);

    const body: UpdateEventBody = await request.json();
    const { id } = params;

    console.log('Update request payload:', { id, ...body });

    // First, let's verify the event exists
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching existing event:', fetchError);
      throw fetchError;
    }

    console.log('Existing event:', existingEvent);

    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating event:', updateError);
      throw updateError;
    }

    console.log('Updated event:', updatedEvent);

    return NextResponse.json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error('Error in PUT /api/events/[id]:', error);
    return handleError(error);
  }
} 