import "server-only";

import { EventSameDayAlertTemplate } from "@/components/email/event-same-day-alert";
import { EventSubmissionApprovedTemplate } from "@/components/email/event-submission-approved";
import { EventSubmissionConfirmationTemplate } from "@/components/email/event-submission-confirmation";
import { EventSubmissionReceivedTemplate } from "@/components/email/event-submission-received";
import { EventSubmissionRejectedTemplate } from "@/components/email/event-submission-rejected";
import { EVENT_CATEGORIES } from "@/lib/events/categories";
import { capturePostHogEvent } from "@/lib/posthog-server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { Resend } from "resend";

const FROM_ADDRESS = "Adamastor <hi@digest.adamastor.blog>";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://adamastor.blog";
const TIMEZONE = "Europe/Lisbon";

function getResend() {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error("RESEND_API_KEY is not set");
	}
	return new Resend(apiKey);
}

function formatStartTimeForEmail(isoStartTime: string): string {
	return new Intl.DateTimeFormat("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: TIMEZONE,
	}).format(new Date(isoStartTime));
}

function formatCity(city: string): string {
	return city.charAt(0).toUpperCase() + city.slice(1);
}

/**
 * Resolve the list of admin email addresses to notify. Combines:
 *   - every profiles.role='admin' user with a non-null email
 *   - any addresses in EVENT_SUBMISSIONS_NOTIFY_EXTRA (comma-separated)
 * Deduplicated, lowercased.
 */
async function resolveAdminRecipients(): Promise<string[]> {
	const recipients = new Set<string>();

	try {
		const supabase = createServiceRoleClient();
		const { data, error } = await supabase.from("profiles").select("id, role").eq("role", "admin");

		if (error) {
			console.error("[notifications] failed to load admin profiles", error);
		} else if (data && data.length > 0) {
			const ids = data.map((row) => row.id as string);
			const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

			if (usersError) {
				console.error("[notifications] failed to list auth users", usersError);
			} else {
				for (const user of users.users) {
					if (ids.includes(user.id) && user.email) {
						recipients.add(user.email.toLowerCase());
					}
				}
			}
		}
	} catch (error) {
		console.error("[notifications] unexpected error resolving admin recipients", error);
	}

	const extras = (process.env.EVENT_SUBMISSIONS_NOTIFY_EXTRA ?? "")
		.split(",")
		.map((value) => value.trim().toLowerCase())
		.filter((value) => value.length > 0 && value.includes("@"));

	for (const extra of extras) {
		recipients.add(extra);
	}

	return [...recipients];
}

export interface SubmissionEmailContext {
	eventTitle: string;
	eventDescription: string;
	eventCity: string;
	eventStartTimeIso: string;
	eventUrl?: string | null;
	submitterName: string;
	submitterEmail: string;
}

export async function notifyAdminsOfSubmission(context: SubmissionEmailContext): Promise<void> {
	const recipients = await resolveAdminRecipients();

	if (recipients.length === 0) {
		console.warn("[notifications] no admin recipients resolved — skipping admin notification email");
		return;
	}

	try {
		await getResend().emails.send({
			from: FROM_ADDRESS,
			to: recipients,
			subject: `New event submission: ${context.eventTitle}`,
			react: EventSubmissionReceivedTemplate({
				eventTitle: context.eventTitle,
				eventDescription: context.eventDescription,
				eventCity: formatCity(context.eventCity),
				eventStartTimeLisbon: formatStartTimeForEmail(context.eventStartTimeIso),
				eventUrl: context.eventUrl,
				submitterName: context.submitterName,
				submitterEmail: context.submitterEmail,
				reviewUrl: `${SITE_URL}/dashboard/event-submissions`,
			}),
			replyTo: context.submitterEmail,
		});
	} catch (error) {
		console.error("[notifications] admin notification email failed", error);
	}
}

export async function sendSubmissionConfirmationEmail(context: SubmissionEmailContext): Promise<void> {
	try {
		await getResend().emails.send({
			from: FROM_ADDRESS,
			to: [context.submitterEmail],
			subject: "We got your event submission",
			react: EventSubmissionConfirmationTemplate({
				submitterName: context.submitterName,
				eventTitle: context.eventTitle,
				eventCity: formatCity(context.eventCity),
				eventStartTimeLisbon: formatStartTimeForEmail(context.eventStartTimeIso),
			}),
		});
	} catch (error) {
		console.error("[notifications] confirmation email failed", error);
	}
}

export async function sendSubmissionApprovedEmail(
	context: Pick<
		SubmissionEmailContext,
		"submitterName" | "submitterEmail" | "eventTitle" | "eventCity" | "eventStartTimeIso"
	> & { eventPageUrl: string },
): Promise<void> {
	try {
		await getResend().emails.send({
			from: FROM_ADDRESS,
			to: [context.submitterEmail],
			subject: `Your event is live: ${context.eventTitle}`,
			react: EventSubmissionApprovedTemplate({
				submitterName: context.submitterName,
				eventTitle: context.eventTitle,
				eventCity: formatCity(context.eventCity),
				eventStartTimeLisbon: formatStartTimeForEmail(context.eventStartTimeIso),
				eventPageUrl: context.eventPageUrl,
			}),
		});
	} catch (error) {
		console.error("[notifications] approved email failed", error);
	}
}

export async function sendSubmissionRejectedEmail(
	context: Pick<SubmissionEmailContext, "submitterName" | "submitterEmail" | "eventTitle"> & {
		rejectionReason?: string | null;
	},
): Promise<void> {
	try {
		await getResend().emails.send({
			from: FROM_ADDRESS,
			to: [context.submitterEmail],
			subject: "Update on your event submission",
			react: EventSubmissionRejectedTemplate({
				submitterName: context.submitterName,
				eventTitle: context.eventTitle,
				rejectionReason: context.rejectionReason,
			}),
		});
	} catch (error) {
		console.error("[notifications] rejected email failed", error);
	}
}

// ──────────────────────────────────────────────────────────────────────────
// Same-day clash alert
// ──────────────────────────────────────────────────────────────────────────

/** Lisbon calendar-date key (YYYY-MM-DD) for an ISO timestamp. */
function lisbonDayKey(iso: string): string {
	return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(
		new Date(iso),
	);
}

/** "Thursday, 28 May 2026" in Lisbon time. */
function formatDayLong(iso: string): string {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: TIMEZONE,
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(new Date(iso));
}

/** "18:30" in Lisbon time. */
function formatTimeShort(iso: string): string {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: TIMEZONE,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date(iso));
}

function categoryDisplayName(slug: string): string {
	return EVENT_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

interface ClashSourceEvent {
	id: number | string;
	title: string;
	city: string;
	startTimeIso: string;
	url?: string | null;
	categorySlugs: string[];
}

/**
 * When a new event B is approved, email the organisers of already-listed events
 * A that opted into same-day alerts and genuinely clash with B: same Lisbon
 * day, same city (online never clashes — no physical-attendance overlap), and
 * at least one shared category.
 *
 * Best-effort throughout: a missing `notify_same_day` column (migration not yet
 * applied) or a send failure is logged, never thrown — approval must not depend
 * on this. Recipients are deduped by email; if one organiser has two qualifying
 * events that day, their earliest is used as the "your event" anchor.
 */
export async function notifyOrganisersOfSameDayClash(newEvent: ClashSourceEvent): Promise<void> {
	const city = (newEvent.city ?? "").trim();
	if (!city || city.toLowerCase() === "online") return;
	if (newEvent.categorySlugs.length === 0) return;

	const dayKey = lisbonDayKey(newEvent.startTimeIso);
	const anchor = new Date(newEvent.startTimeIso).getTime();
	// ±36h around B comfortably brackets B's Lisbon day across DST/offset; the
	// exact same-day match is done in JS below on the Lisbon day key.
	const windowStart = new Date(anchor - 36 * 60 * 60 * 1000).toISOString();
	const windowEnd = new Date(anchor + 36 * 60 * 60 * 1000).toISOString();

	let candidates: Array<{
		id: number | string;
		title: string;
		start_time: string;
		submitter_name: string | null;
		submitter_email: string | null;
		event_category_assignments?: { category_slug: string }[] | null;
	}>;

	try {
		const supabase = createServiceRoleClient();
		const { data, error } = await supabase
			.from("events")
			.select("id, title, start_time, submitter_name, submitter_email, event_category_assignments(category_slug)")
			.eq("status", "approved")
			.eq("notify_same_day", true)
			.ilike("city", city)
			.neq("id", newEvent.id)
			.gte("start_time", windowStart)
			.lte("start_time", windowEnd)
			.order("start_time", { ascending: true });

		if (error) {
			// Most likely cause pre-migration: column notify_same_day doesn't
			// exist. Stay dormant rather than break the approval flow.
			console.error("[notifications] same-day clash lookup failed (is the migration applied?)", error);
			return;
		}
		candidates = data ?? [];
	} catch (error) {
		console.error("[notifications] same-day clash lookup threw", error);
		return;
	}

	const newCategorySet = new Set(newEvent.categorySlugs);

	// Keep the earliest qualifying event per organiser email.
	const byEmail = new Map<string, (typeof candidates)[number] & { sharedSlug: string }>();
	for (const candidate of candidates) {
		const email = candidate.submitter_email?.trim().toLowerCase();
		if (!email) continue;
		if (lisbonDayKey(candidate.start_time) !== dayKey) continue;
		const sharedSlug = (candidate.event_category_assignments ?? [])
			.map((a) => a.category_slug)
			.find((slug) => newCategorySet.has(slug));
		if (!sharedSlug) continue;
		if (!byEmail.has(email)) byEmail.set(email, { ...candidate, sharedSlug });
	}

	if (byEmail.size === 0) return;

	const eventDate = formatDayLong(newEvent.startTimeIso);
	const newEventTime = formatTimeShort(newEvent.startTimeIso);
	const cityLabel = formatCity(city);

	await Promise.allSettled(
		[...byEmail.values()].map((source) =>
			getResend()
				.emails.send({
					from: FROM_ADDRESS,
					to: [source.submitter_email as string],
					subject: `Another ${categoryDisplayName(source.sharedSlug)} event shares your day`,
					react: EventSameDayAlertTemplate({
						organiserName: (source.submitter_name ?? "there").trim() || "there",
						categoryName: categoryDisplayName(source.sharedSlug),
						eventDate,
						city: cityLabel,
						yourEventTitle: source.title,
						yourEventTime: formatTimeShort(source.start_time),
						newEventTitle: newEvent.title,
						newEventTime,
						newEventUrl: newEvent.url ?? null,
						lineupUrl: `${SITE_URL}/events/calendar?category=${encodeURIComponent(source.sharedSlug)}`,
						manageUrl: null,
					}),
				})
				.catch((error) => console.error("[notifications] same-day alert send failed", error)),
		),
	);

	await capturePostHogEvent({
		event: "event_same_day_alert_sent",
		distinctId: "event-system",
		properties: {
			recipients: byEmail.size,
			new_event_id: newEvent.id,
			city: cityLabel,
		},
	});
}
