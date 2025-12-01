import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddEventForm from "./AddEventForm";

export default async function AddEventPage() {
  const supabase = await createClient();
  
  try {
    await assertAuthenticated(supabase);
  } catch (error) {
    redirect("/login");
  }

  return <AddEventForm />;
}
