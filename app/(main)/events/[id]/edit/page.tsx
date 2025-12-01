import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getUserProfile } from "@/lib/supabase/authentication";
import EditEventClient from "./edit-event-client";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  const profile = await getUserProfile(supabase);
  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'admin') {
    redirect('/events');
  }

  return <EditEventClient event={event} />;
} 