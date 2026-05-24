import { checkVisibleEventDuplicates } from "@/lib/events/check-duplicates";
import { ForbiddenError, handleError } from "@/lib/errors";
import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const profile = await assertAuthenticated(supabase);

		if (profile.role !== "admin") {
			throw new ForbiddenError("Admin access required");
		}

		const body = await request.json();
		const { title, description, start_time, city, url } = body;

		if (!title || !description || !start_time || !city) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const result = await checkVisibleEventDuplicates(supabase, { title, description, start_time, city, url });

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error in POST /api/events/duplicates:", error);
		return handleError(error);
	}
}
