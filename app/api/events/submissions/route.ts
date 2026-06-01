import { sanitizeEventCategorySlugs } from "@/lib/events/categories";
import { checkVisibleEventDuplicates } from "@/lib/events/check-duplicates";
import { notifyAdminsOfSubmission, sendSubmissionConfirmationEmail } from "@/lib/events/notifications";
import { BadRequestError, handleError } from "@/lib/errors";
import { revalidateEventsListing } from "@/lib/revalidate-public";
import { getUserProfile } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { waitUntil } from "@vercel/functions";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const submissionSchema = z.object({
	title: z.string().trim().min(3, "Title is required").max(200),
	description: z.string().trim().min(20, "Please tell us a bit more about the event").max(5000),
	start_time: z.string().min(1, "Start time is required"),
	end_time: z.string().nullable().optional(),
	city: z.string().trim().min(1, "City is required"),
	url: z.string().trim().min(1, "Event link is required").url("Please share a valid event link"),
	bannerUrl: z.string().url("Banner URL must be a valid URL").optional().or(z.literal("")),
	categorySlugs: z.array(z.string()).optional(),
	// Opt-in: email this organiser if we later approve another event sharing
	// their day + city + category. Persisted best-effort (see below).
	notifySameDay: z.boolean().optional(),
	submitterName: z.string().trim().min(1, "Name is required").max(120),
	submitterEmail: z.string().trim().email("Please share a valid email"),
	turnstileToken: z.string().optional(),
	// Honeypot — bots love to fill every field; humans never see this one.
	// No max(0) constraint here on purpose: we want the request to pass
	// validation and then silently 200 below, so bots can't tell they were
	// caught and tune their behaviour.
	website: z.string().optional(),
});

function getClientIp(request: NextRequest): string | undefined {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0]?.trim();
	return request.headers.get("x-real-ip") ?? undefined;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const parsed = submissionSchema.safeParse(body);

		if (!parsed.success) {
			const firstIssue = parsed.error.issues[0];
			throw new BadRequestError(firstIssue?.message ?? "Invalid submission");
		}

		const data = parsed.data;

		// Honeypot triggered → silently succeed so bots don't learn we caught
		// them, but skip everything.
		if (data.website && data.website.length > 0) {
			return NextResponse.json({ message: "Thanks — we've got your submission." });
		}

		const ip = getClientIp(request);
		const turnstileOk = await verifyTurnstileToken(data.turnstileToken, ip);
		if (!turnstileOk) {
			throw new BadRequestError("Spam check failed. Please refresh and try again.");
		}

		// Resolve the current user (if any) using the session-aware SSR client.
		// We don't trust the client to tell us who they are — we re-read from
		// the cookie session.
		const ssrClient = await createClient();
		const profile = await getUserProfile(ssrClient);

		const isDryRun = request.nextUrl.searchParams.get("dryRun") === "1";

		// Pick the client used for the duplicate check. Real submissions use
		// the service role so dedup also sees pending submissions (preventing
		// two organisers piling the same event into the queue). Dry-runs use
		// the anon SSR client so QA can exercise the route without needing
		// SUPABASE_SERVICE_ROLE_KEY — at the cost of only seeing approved
		// events in the dedup pass, which is fine for QA.
		const dedupClient = isDryRun ? ssrClient : createServiceRoleClient();

		const cleanUrl = data.url && data.url.length > 0 ? data.url : null;
		const cleanBannerUrl = data.bannerUrl && data.bannerUrl.length > 0 ? data.bannerUrl : null;
		// Empty categories is a VALID, intentional state — many events (e.g. a
		// marketing meetup) don't fit any of our five categories, and a wrong tag
		// is worse than no tag: it would push the event into a category newsletter
		// whose subscribers don't care about it. So we keep ONLY what the
		// submitter/admin explicitly chose (the form offers keyword suggestions
		// they can accept or clear) — no server-side auto-tagging that could
		// mislabel. Better untagged than mistagged.
		const categorySlugs = sanitizeEventCategorySlugs(data.categorySlugs ?? []);

		const { duplicateCandidates, hasBlockingDuplicate } = await checkVisibleEventDuplicates(dedupClient, {
			title: data.title,
			description: data.description,
			start_time: data.start_time,
			city: data.city,
			url: cleanUrl,
		});

		if (hasBlockingDuplicate) {
			return NextResponse.json(
				{
					error: "This event is already on Adamastor — no need to submit it again.",
					duplicateCandidates,
					severity: "block",
				},
				{ status: 409 },
			);
		}

		// Dry-run short-circuit: pipeline verified up to the insert; no write,
		// no email.
		if (isDryRun) {
			return NextResponse.json({
				message: "Dry run — input validated and duplicate check passed. Nothing was saved.",
				dryRun: true,
				duplicateCandidates,
			});
		}

		// Real path: service role for the write (also the same client we used
		// for the dedup query, so no second connection).
		const adminClient = dedupClient;
		const isAdminSubmitter = profile?.role === "admin";
		const nowIso = new Date().toISOString();
		const status = isAdminSubmitter ? "approved" : "pending";

		const { data: insertedEvent, error: insertError } = await adminClient
			.from("events")
			.insert([
				{
					title: data.title,
					description: data.description,
					start_time: data.start_time,
					end_time: data.end_time ?? null,
					city: data.city,
					url: cleanUrl,
					banner_url: cleanBannerUrl,
					status,
					submitted_by: profile?.id ?? null,
					submitter_name: data.submitterName,
					submitter_email: data.submitterEmail,
					submitted_at: nowIso,
					reviewed_by: isAdminSubmitter ? profile.id : null,
					reviewed_at: isAdminSubmitter ? nowIso : null,
				},
			])
			.select()
			.single();

		if (insertError || !insertedEvent) {
			console.error("[/api/events/submissions] insert failed", insertError);
			return NextResponse.json({ error: "Could not save your submission. Please try again." }, { status: 500 });
		}

		if (categorySlugs.length > 0) {
			const { error: categoriesError } = await adminClient.from("event_category_assignments").insert(
				categorySlugs.map((categorySlug) => ({
					event_id: insertedEvent.id,
					category_slug: categorySlug,
				})),
			);

			if (categoriesError) {
				console.error("[/api/events/submissions] category assignment failed", categoriesError);
				// Don't roll back the submission — the admin can fix categories
				// during review. Losing the whole event over a category quirk
				// would be a worse UX than landing it with no categories.
			}
		}

		// Persist the same-day-alert opt-in as a separate best-effort update
		// rather than a column in the insert above. If the notify_same_day
		// migration hasn't been applied yet, the insert still succeeds and the
		// opt-in simply stays dormant (logged) until the column exists.
		// Migration: supabase/migrations/20260601000000_add_notify_same_day_to_events.sql
		if (data.notifySameDay) {
			const { error: notifyOptInError } = await adminClient
				.from("events")
				.update({ notify_same_day: true })
				.eq("id", insertedEvent.id);
			if (notifyOptInError) {
				console.error(
					"[/api/events/submissions] notify_same_day opt-in failed (is the migration applied?)",
					notifyOptInError,
				);
			}
		}

		// Fire-and-forget notifications and revalidation. waitUntil lets the
		// response return immediately while emails finish in the background.
		const emailContext = {
			eventTitle: data.title,
			eventDescription: data.description,
			eventCity: data.city,
			eventStartTimeIso: data.start_time,
			eventUrl: cleanUrl,
			submitterName: data.submitterName,
			submitterEmail: data.submitterEmail,
		};

		waitUntil(
			(async () => {
				await Promise.allSettled([
					notifyAdminsOfSubmission(emailContext),
					sendSubmissionConfirmationEmail(emailContext),
				]);
			})(),
		);

		// If admin submitted directly, the event is already approved — revalidate
		// the public listing immediately so the new row shows up.
		if (isAdminSubmitter) {
			revalidateEventsListing();
		}

		return NextResponse.json({
			message: isAdminSubmitter ? "Event published." : "Thanks — we've got your submission and you'll hear back soon.",
			status,
			duplicateCandidates,
		});
	} catch (error) {
		return handleError(error);
	}
}
