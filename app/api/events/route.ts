import { checkVisibleEventDuplicates } from "@/lib/events/check-duplicates";
import { sanitizeEventCategorySlugs } from "@/lib/events/categories";
import { ForbiddenError, handleError } from "@/lib/errors";
import { revalidateEventsListing } from "@/lib/revalidate-public";
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
		const { title, description, start_time, city, url, bannerUrl, allowPotentialDuplicate } = body;
		const categorySlugs = sanitizeEventCategorySlugs(body.categorySlugs);

		// Validate required fields
		if (!title || !description || !start_time || !city) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const { duplicateCandidates, hasBlockingDuplicate } = await checkVisibleEventDuplicates(supabase, {
			title,
			description,
			start_time,
			city,
			url,
		});

		if (duplicateCandidates.length > 0 && (hasBlockingDuplicate || !allowPotentialDuplicate)) {
			return NextResponse.json(
				{
					error: hasBlockingDuplicate
						? "This event already appears to be published."
						: "This event may already be published.",
					duplicateCandidates,
					severity: hasBlockingDuplicate ? "block" : "warning",
				},
				{ status: 409 },
			);
		}

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

		const { error: categoriesError } =
			categorySlugs.length > 0
				? await supabase.from("event_category_assignments").insert(
						categorySlugs.map((categorySlug) => ({
							event_id: data.id,
							category_slug: categorySlug,
						})),
					)
				: { error: null };

		if (categoriesError) {
			console.error("Error assigning event categories:", categoriesError);
			await supabase.from("events").delete().eq("id", data.id);
			return NextResponse.json({ error: "Failed to assign event categories" }, { status: 500 });
		}

		revalidateEventsListing();

		return NextResponse.json({
			message: "Event created successfully",
			event: {
				...data,
				categorySlugs,
			},
		});
	} catch (error) {
		console.error("Error in POST /api/events:", error);
		return handleError(error);
	}
}
