import { EmailTemplate } from "@/components/email/email-template";
import { SubscribeEmailAlertTemplate } from "@/components/email/team/subscribe-alert";
import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const TEAM_EMAILS = ["malik@hey.com", "afonso.crg@gmail.com", "carlosjoseresende@gmail.com"];

// Helper to add delay between API calls
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
	try {
		const { name, email, pageUrl, pageTitle } = await request.json();

		const nameParts = name.trim().split(/\s+/);
		const firstName = nameParts[0];
		const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

		if (!email || !email.includes("@")) {
			return Response.json({ error: "Invalid email address" }, { status: 400 });
		}

		// Create contact in Resend
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

		await delay(500); // Wait before next API call

		// Send welcome email to subscriber
		const { data: emailData, error: emailError } = await resend.emails.send({
			from: "hi@digest.adamastor.blog",
			to: [email],
			subject: "Welcome to our Newsletter!",
			react: EmailTemplate({ firstName }),
		});

		if (emailError) {
			console.error("Email send error:", emailError);
			return Response.json({ error: emailError.message }, { status: 500 });
		}

		// Send team notification and get subscriber count in the background
		// Don't await - let it happen after response is sent.
		// We're using a Vercel specific function, waitUntil for that.
		waitUntil(
			(async () => {
				try {
					await delay(500);

					const { data: contacts } = await resend.contacts.list();
					const totalSubscribers = contacts?.data?.length;

					await delay(500);

					await resend.emails.send({
						from: "hi@digest.adamastor.blog",
						to: TEAM_EMAILS,
						subject: `New subscriber: ${firstName} just joined!`,
						react: SubscribeEmailAlertTemplate({
							subscriber_name: name,
							subscriber_email: email,
							total_subscribers: totalSubscribers,
						}),
					});
				} catch (err) {
					console.error("Team notification error:", err);
				}
			})(),
		);

		// Capture event in PostHog (server-side)
		if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
			try {
				await fetch("https://eu.i.posthog.com/capture/", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
						event: "subscribed_newsletter",
						properties: {
							distinct_id: email,
							email: email,
							page_url: pageUrl,
							page_title: pageTitle,
							timestamp: new Date().toISOString(),
						},
					}),
				});
			} catch (posthogError) {
				console.error("PostHog capture error:", posthogError);
			}
		}

		return Response.json({
			success: true,
			contact: contactData,
			email: emailData,
		});
	} catch (error) {
		console.error("Subscription error:", error);
		return Response.json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 });
	}
}
