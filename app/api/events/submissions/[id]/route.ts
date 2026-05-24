import {
	sendSubmissionApprovedEmail,
	sendSubmissionRejectedEmail,
} from "@/lib/events/notifications";
import { sanitizeEventCategorySlugs } from "@/lib/events/categories";
import { BadRequestError, ForbiddenError, NotFoundError, handleError } from "@/lib/errors";
import { revalidateEventsListing } from "@/lib/revalidate-public";
import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { waitUntil } from "@vercel/functions";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
	title: z.string().trim().min(3).max(200).optional(),
	description: z.string().trim().min(1).max(5000).optional(),
	start_time: z.string().min(1).optional(),
	city: z.string().trim().min(1).optional(),
	url: z.string().url().nullable().optional().or(z.literal("")),
	bannerUrl: z.string().url().nullable().optional().or(z.literal("")),
	categorySlugs: z.array(z.string()).optional(),
	decision: z.enum(["approve", "reject"]).optional(),
	rejectionReason: z.string().trim().max(2000).optional(),
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://adamastor.blog";

export async function PATCH(
	request: NextRequest,
	routeParams: { params: Promise<{ id: string }> },
) {
	try {
		const supabase = await createClient();
		const profile = await assertAuthenticated(supabase);

		if (profile.role !== "admin") {
			throw new ForbiddenError("Admin access required");
		}

		const body = await request.json();
		const parsed = patchSchema.safeParse(body);

		if (!parsed.success) {
			throw new BadRequestError(parsed.error.issues[0]?.message ?? "Invalid request");
		}

		const { id: idParam } = await routeParams.params;
		const eventId = Number(idParam);
		if (!Number.isFinite(eventId)) {
			throw new BadRequestError("Invalid event id");
		}

		const { data: existing, error: fetchError } = await supabase
			.from("events")
			.select("id, title, description, city, start_time, status, submitter_name, submitter_email")
			.eq("id", eventId)
			.single();

		if (fetchError || !existing) {
			throw new NotFoundError("Submission not found");
		}

		const update: Record<string, unknown> = {};

		if (parsed.data.title !== undefined) update.title = parsed.data.title;
		if (parsed.data.description !== undefined) update.description = parsed.data.description;
		if (parsed.data.start_time !== undefined) update.start_time = parsed.data.start_time;
		if (parsed.data.city !== undefined) update.city = parsed.data.city;
		if (parsed.data.url !== undefined) update.url = parsed.data.url === "" ? null : parsed.data.url;
		if (parsed.data.bannerUrl !== undefined)
			update.banner_url = parsed.data.bannerUrl === "" ? null : parsed.data.bannerUrl;

		const decision = parsed.data.decision;
		const isApproving = decision === "approve";
		const isRejecting = decision === "reject";

		if (isApproving) {
			update.status = "approved";
			update.reviewed_by = profile.id;
			update.reviewed_at = new Date().toISOString();
			update.rejection_reason = null;
		} else if (isRejecting) {
			update.status = "rejected";
			update.reviewed_by = profile.id;
			update.reviewed_at = new Date().toISOString();
			update.rejection_reason = parsed.data.rejectionReason ?? null;
		}

		if (Object.keys(update).length > 0) {
			const { error: updateError } = await supabase.from("events").update(update).eq("id", eventId);

			if (updateError) {
				console.error("[/api/events/submissions/[id]] update failed", updateError);
				throw updateError;
			}
		}

		if (parsed.data.categorySlugs !== undefined) {
			const nextSlugs = sanitizeEventCategorySlugs(parsed.data.categorySlugs);

			const { data: existingAssignments, error: existingError } = await supabase
				.from("event_category_assignments")
				.select("category_slug")
				.eq("event_id", eventId);

			if (existingError) {
				console.error("[/api/events/submissions/[id]] category fetch failed", existingError);
				throw existingError;
			}

			const existingSlugs = new Set<string>((existingAssignments ?? []).map((row) => row.category_slug as string));
			const nextSlugSet = new Set<string>(nextSlugs);
			const slugsToAdd = nextSlugs.filter((slug) => !existingSlugs.has(slug));
			const slugsToRemove = [...existingSlugs].filter((slug) => !nextSlugSet.has(slug));

			if (slugsToRemove.length > 0) {
				const { error: deleteError } = await supabase
					.from("event_category_assignments")
					.delete()
					.eq("event_id", eventId)
					.in("category_slug", slugsToRemove);

				if (deleteError) {
					console.error("[/api/events/submissions/[id]] category delete failed", deleteError);
					throw deleteError;
				}
			}

			if (slugsToAdd.length > 0) {
				const { error: insertError } = await supabase.from("event_category_assignments").insert(
					slugsToAdd.map((categorySlug) => ({ event_id: eventId, category_slug: categorySlug })),
				);

				if (insertError) {
					console.error("[/api/events/submissions/[id]] category insert failed", insertError);
					throw insertError;
				}
			}
		}

		// Outgoing emails + revalidation
		const submitterEmail = existing.submitter_email as string | null;
		const submitterName = (existing.submitter_name as string | null) ?? "there";
		const finalTitle = (update.title as string | undefined) ?? (existing.title as string);
		const finalCity = (update.city as string | undefined) ?? (existing.city as string);
		const finalStartTime = (update.start_time as string | undefined) ?? (existing.start_time as string);

		if (isApproving) {
			revalidateEventsListing();
			if (submitterEmail) {
				// City-filtered route is the closest thing to a "your event"
				// page we have today — better than dropping the submitter into
				// the unfiltered listing. If we add per-event pages later,
				// swap this for the canonical URL.
				const cityForLink = (finalCity ?? "").toLowerCase();
				const eventPageUrl = cityForLink
					? `${SITE_URL}/events/${encodeURIComponent(cityForLink)}`
					: `${SITE_URL}/events`;
				waitUntil(
					sendSubmissionApprovedEmail({
						submitterEmail,
						submitterName,
						eventTitle: finalTitle,
						eventCity: finalCity,
						eventStartTimeIso: finalStartTime,
						eventPageUrl,
					}),
				);
			}
		} else if (isRejecting) {
			if (submitterEmail) {
				waitUntil(
					sendSubmissionRejectedEmail({
						submitterEmail,
						submitterName,
						eventTitle: finalTitle,
						rejectionReason: parsed.data.rejectionReason ?? null,
					}),
				);
			}
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return handleError(error);
	}
}
