import { CategoryWelcomeEmail } from "@/components/email/category-welcome";
import { EmailTemplate } from "@/components/email/email-template";
import { SubscribeEmailAlertTemplate } from "@/components/email/team/subscribe-alert";
import { EVENT_CATEGORIES, sanitizeEventCategorySlugs } from "@/lib/events/categories";
import { buildPreferencesUrl } from "@/lib/newsletter/preferences-url";
import { upsertSubscription } from "@/lib/newsletter/subscriptions";
import { syncResendPreferences } from "@/lib/newsletter/sync";
import { capturePostHogEvent } from "@/lib/posthog-server";
import { countActiveSubscribers, listAllContacts } from "@/lib/resend/contacts";
import { getNewsletterSegmentId } from "@/lib/resend/segment";
import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const digestSegmentId = getNewsletterSegmentId();

const TEAM_EMAILS = ["malik@hey.com", "afonso.crg@gmail.com", "carlosjoseresende@gmail.com"];

// Helper to add delay between API calls
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
	try {
		const { name, email, pageUrl, pageTitle, categories, digest } = await request.json();

		if (!email || typeof email !== "string" || !email.includes("@")) {
			return Response.json({ error: "Invalid email address" }, { status: 400 });
		}

		// Name is optional — the per-category inline form on /events/[slug]
		// only collects email to keep friction low. Fall back to the local
		// part of the email so Resend's firstName isn't blank.
		const trimmedName = typeof name === "string" ? name.trim() : "";
		const nameParts = trimmedName ? trimmedName.split(/\s+/) : [];
		const firstName = nameParts[0] || email.split("@")[0];
		const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

		// Backward compatibility: the existing footer SubscribeForm sends no
		// categories/digest fields, so a bare signup means "weekly digest". A
		// per-category form passes categories[] and (usually) digest:false.
		const requestedCategories = sanitizeEventCategorySlugs(categories);
		const digestRequested = typeof digest === "boolean" ? digest : requestedCategories.length === 0;

		// Create contact in Resend (idempotent — "already exists" is fine)
		const { data: contactData, error: contactError } = await resend.contacts.create({
			email: email,
			firstName: firstName,
			lastName: lastName,
		});

		if (contactError) {
			if (!contactError.message?.includes("already exists")) {
				console.error("Contact creation error:", contactError);
				return Response.json({ error: contactError.message }, { status: 500 });
			}
		}

		// Persist the preference in our DB (source of truth), then sync segments.
		const { subscription, previousCategories, previousDigestSubscribed, created } = await upsertSubscription({
			email,
			firstName: trimmedName ? firstName : null,
			addCategories: requestedCategories,
			digestSubscribed: digestRequested || undefined,
		});

		await syncResendPreferences({
			resend,
			email: subscription.email,
			previous: { categories: previousCategories, digestSubscribed: previousDigestSubscribed },
			next: { categories: subscription.categories, digestSubscribed: subscription.digest_subscribed },
		});

		await delay(500); // Wait before next API call

		// Welcome email AND team notification only fire on first-time signup —
		// re-subscribes (adding a new category to an existing row) shouldn't
		// spam the user with another welcome OR ping the team again. Both
		// are pushed to waitUntil so the HTTP response returns immediately;
		// the user sees the success toast without waiting on Resend.
		if (created) {
			const preferencesUrl = buildPreferencesUrl(subscription.preference_token);
			const subscribedToOnlyCategories =
				subscription.categories.length > 0 && !subscription.digest_subscribed;

			// Template + subject vary based on what the subscriber actually
			// opted into so a Design-only signup doesn't get a
			// digest-flavoured email that feels off.
			let welcomeSubject: string;
			let welcomeReact: React.ReactElement;
			if (subscribedToOnlyCategories) {
				const categoryNames = subscription.categories
					.map((slug) => EVENT_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug);
				welcomeSubject =
					categoryNames.length === 1
						? `Welcome to Adamastor ${categoryNames[0]} events`
						: "Welcome to Adamastor events";
				welcomeReact = CategoryWelcomeEmail({
					firstName: subscription.first_name ?? firstName,
					categoryNames,
					preferencesUrl,
				});
			} else {
				welcomeSubject = "Welcome to our Newsletter!";
				welcomeReact = EmailTemplate({ firstName, preferencesUrl });
			}

			waitUntil(
				(async () => {
					try {
						const { error: emailError } = await resend.emails.send({
							from: "hi@digest.adamastor.blog",
							to: [email],
							subject: welcomeSubject,
							react: welcomeReact,
						});
						if (emailError) console.error("Welcome email send error:", emailError);
					} catch (err) {
						console.error("Welcome email error:", err);
					}
				})(),
			);

			// Resolve display names for the team notif so the email body lists
			// "Design" instead of "design" — matches what subscribers see in their
			// own emails.
			const subscribedCategoryNames = subscription.categories.map(
				(slug) => EVENT_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug,
			);

			// One-line subject summary so the team can triage at a glance from
			// the inbox preview without opening the email — e.g.
			// "New subscriber: Malik → Design + Weekly digest".
			const subjectChannels = [
				subscription.digest_subscribed ? "Weekly digest" : null,
				...subscribedCategoryNames,
			].filter(Boolean) as string[];
			const subjectSummary = subjectChannels.length > 0 ? subjectChannels.join(" + ") : "no opt-ins";

			waitUntil(
				(async () => {
					try {
						await delay(500);

						const contacts = await listAllContacts(resend, { segmentId: digestSegmentId });
						const totalSubscribers = countActiveSubscribers(contacts);

						await delay(500);

						await resend.emails.send({
							from: "hi@digest.adamastor.blog",
							to: TEAM_EMAILS,
							subject: `New subscriber: ${firstName} → ${subjectSummary}`,
							react: SubscribeEmailAlertTemplate({
								subscriber_name: trimmedName || firstName,
								subscriber_email: email,
								total_subscribers: totalSubscribers,
								category_names: subscribedCategoryNames,
								digest_subscribed: subscription.digest_subscribed,
							}),
						});
					} catch (err) {
						console.error("Team notification error:", err);
					}
				})(),
			);
		}

		await capturePostHogEvent({
			event: "subscribed_newsletter",
			distinctId: email,
			properties: {
				email,
				page_url: pageUrl,
				page_title: pageTitle,
				categories: subscription.categories,
				digest_subscribed: subscription.digest_subscribed,
			},
		});

		return Response.json({
			success: true,
			contact: contactData,
			categories: subscription.categories,
			digest_subscribed: subscription.digest_subscribed,
		});
	} catch (error) {
		console.error("Subscription error:", error);
		return Response.json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 });
	}
}
