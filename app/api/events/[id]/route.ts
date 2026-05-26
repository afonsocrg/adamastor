import { ForbiddenError, handleError } from "@/lib/errors";
import { sanitizeEventCategorySlugs } from "@/lib/events/categories";
import { revalidateEventsListing } from "@/lib/revalidate-public";
import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export interface UpdateEventBody {
	title?: string;
	description?: string;
	start_time?: string;
	end_time?: string | null;
	city?: string;
	url?: string;
	categorySlugs?: unknown;
}

export async function PUT(
	request: NextRequest,
	routeParams: {
		params: Promise<{
			id: string;
		}>;
	},
) {
	try {
		const supabase = await createClient();
		const profile = await assertAuthenticated(supabase);

		if (profile.role !== "admin") {
			throw new ForbiddenError("Admin access required");
		}

		const body: UpdateEventBody = await request.json();
		const { id } = await routeParams.params;

		// Separate event-column fields from category assignments so we don't try
		// to write categorySlugs as a column on the events table.
		const { categorySlugs: rawCategorySlugs, ...eventFields } = body;
		const hasCategoryUpdate = Object.prototype.hasOwnProperty.call(body, "categorySlugs");
		const nextCategorySlugs = hasCategoryUpdate ? sanitizeEventCategorySlugs(rawCategorySlugs) : null;

		// First, let's verify the event exists
		const { error: fetchError } = await supabase.from("events").select("id").eq("id", id).single();

		if (fetchError) {
			console.error("Error fetching existing event:", fetchError);
			throw fetchError;
		}

		const { data: updatedEvent, error: updateError } = await supabase
			.from("events")
			.update(eventFields)
			.eq("id", id)
			.select()
			.single();

		if (updateError) {
			console.error("Error updating event:", updateError);
			throw updateError;
		}

		if (nextCategorySlugs !== null) {
			const { data: existingAssignments, error: existingError } = await supabase
				.from("event_category_assignments")
				.select("category_slug")
				.eq("event_id", id);

			if (existingError) {
				console.error("Error fetching existing event category assignments:", existingError);
				throw existingError;
			}

			const existingSlugs = new Set<string>((existingAssignments ?? []).map((row) => row.category_slug as string));
			const nextSlugs = new Set<string>(nextCategorySlugs);
			const slugsToAdd = nextCategorySlugs.filter((slug) => !existingSlugs.has(slug));
			const slugsToRemove = [...existingSlugs].filter((slug) => !nextSlugs.has(slug));

			if (slugsToRemove.length > 0) {
				const { error: deleteError } = await supabase
					.from("event_category_assignments")
					.delete()
					.eq("event_id", id)
					.in("category_slug", slugsToRemove);

				if (deleteError) {
					console.error("Error removing event category assignments:", deleteError);
					throw deleteError;
				}
			}

			if (slugsToAdd.length > 0) {
				const { error: insertError } = await supabase.from("event_category_assignments").insert(
					slugsToAdd.map((categorySlug) => ({
						event_id: id,
						category_slug: categorySlug,
					})),
				);

				if (insertError) {
					console.error("Error inserting event category assignments:", insertError);
					throw insertError;
				}
			}
		}

		revalidateEventsListing();

		return NextResponse.json({
			success: true,
			data: {
				...updatedEvent,
				...(nextCategorySlugs !== null ? { categorySlugs: nextCategorySlugs } : {}),
			},
		});
	} catch (error) {
		console.error("Error in PUT /api/events/[id]:", error);
		return handleError(error);
	}
}

export async function DELETE(
	_request: NextRequest,
	routeParams: {
		params: Promise<{
			id: string;
		}>;
	},
) {
	try {
		const supabase = await createClient();
		const profile = await assertAuthenticated(supabase);

		if (profile.role !== "admin") {
			throw new ForbiddenError("Admin access required");
		}

		const { id } = await routeParams.params;

		// First, let's verify the event exists
		const { error: fetchError } = await supabase.from("events").select("id").eq("id", id).single();

		if (fetchError) {
			console.error("Error fetching existing event:", fetchError);
			throw fetchError;
		}

		const { error: deleteError } = await supabase.from("events").delete().eq("id", id);

		if (deleteError) {
			console.error("Error deleting event:", deleteError);
			throw deleteError;
		}

		revalidateEventsListing();

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error in DELETE /api/events/[id]:", error);
		return handleError(error);
	}
}
