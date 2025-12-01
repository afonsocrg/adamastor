import { EmailTemplate } from "@/components/email/email-template";
import type { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
	try {
		const { email, pageUrl, pageTitle } = await request.json();

		if (!email || !email.includes("@")) {
			return Response.json({ error: "Invalid email address" }, { status: 400 });
		}

		// Create contact in Resend audience
		const { data: contactData, error: contactError } = await resend.contacts.create({
			email: email,
			audienceId: process.env.RESEND_AUDIENCE_ID as string,
		});

		if (contactError) {
			// If contact already exists, that's okay - continue to send email
			if (!contactError.message?.includes("already exists")) {
				console.error("Contact creation error:", contactError);
				return Response.json({ error: contactError.message }, { status: 500 });
			}
		}

		// Send welcome email
		const { data: emailData, error: emailError } = await resend.emails.send({
			from: "hi@digest.adamastor.blog",
			to: [email],
			subject: "Welcome to our Newsletter!",
			react: EmailTemplate({ firstName: email.split("@")[0] }),
		});

		if (emailError) {
			console.error("Email send error:", emailError);
			return Response.json({ error: emailError.message }, { status: 500 });
		}

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
				// Don't fail the subscription if PostHog fails
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
