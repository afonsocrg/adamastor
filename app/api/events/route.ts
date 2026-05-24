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

		// Admin instant-publish path: explicitly mark approved so the row
		// bypasses the moderation queue that defaults new submissions to
		// status='pending'. Stamping reviewed_by/reviewed_at keeps the audit
		// trail consistent with the review-queue path.
		const now = new Date().toISOString();
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
					status: "approved",
					submitted_by: profile.id,
					submitter_email: profile.email,
					submitted_at: now,
					reviewed_by: profile.id,
					reviewed_at: now,
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
