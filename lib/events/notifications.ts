import "server-only";

import { EventSubmissionApprovedTemplate } from "@/components/email/event-submission-approved";
import { EventSubmissionConfirmationTemplate } from "@/components/email/event-submission-confirmation";
import { EventSubmissionReceivedTemplate } from "@/components/email/event-submission-received";
import { EventSubmissionRejectedTemplate } from "@/components/email/event-submission-rejected";
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
		const { data, error } = await supabase
			.from("profiles")
			.select("id, role")
			.eq("role", "admin");

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
			subject: `Update on your event submission`,
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
