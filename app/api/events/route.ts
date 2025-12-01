import { getUserProfile } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getUserProfile(supabase);

    // if (!user || user.role !== 'admin') {
    //     console.log('Unauthorized', {user});
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { title, description, start_time, city, url, bannerUrl } = body;

    // Validate required fields
    if (!title || !description || !start_time || !city) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("body", body);

    // Insert the event into the database
    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          title,
          description,
          start_time,
          city,
          url,
          banner_url: bannerUrl,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Event created successfully",
      event: data,
    });
  } catch (error) {
    console.error("Error in POST /api/events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
