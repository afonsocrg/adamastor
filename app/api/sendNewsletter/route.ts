/**
 * Newsletter API Route
 *
 * Two modes:
 * 1. TEST MODE (default): Send to a single email for previewing
 *    POST /api/sendNewsletter
 *    Body: { "postId": "147", "testEmail": "malik@hey.com" }
 *
 * 2. BROADCAST MODE: Send to entire audience via Resend Broadcasts
 *    POST /api/sendNewsletter
 *    Body: { "postId": "147", "broadcast": true, "confirmBroadcast": true }
 *
 *    The confirmBroadcast flag is a safety check to prevent accidental sends.
 */

import { NewsletterTemplate } from "@/components/email/newsletter-template";
import { createClient } from "@/lib/supabase/server";
import { convertPostContentForEmail } from "@/lib/tiptap-to-html";
import { render } from "@react-email/components";
import type { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_TEST_EMAIL = "malik@hey.com";
const DEFAULT_TEST_POST_ID = "147";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			postId = DEFAULT_TEST_POST_ID,
			testEmail = DEFAULT_TEST_EMAIL,
			weekLabel = "This Week",
			broadcast = false,
			confirmBroadcast = false,
		} = body;

		// ============================================
		// Safety Check for Broadcast Mode
		// ============================================
		if (broadcast && !confirmBroadcast) {
			return Response.json(
				{
					error: "Broadcast mode requires confirmBroadcast: true",
					hint: "This is a safety check. Add confirmBroadcast: true to send to all subscribers.",
				},
				{ status: 400 },
			);
		}

		// ============================================
		// Validate Environment Variables for Broadcast
		// ============================================
		if (broadcast) {
			const audienceId = process.env.RESEND_AUDIENCE_ID;
			if (!audienceId) {
				return Response.json({ error: "RESEND_AUDIENCE_ID environment variable is not set" }, { status: 500 });
			}
		}

		const supabase = await createClient();

		// ============================================
		// Step 1: Fetch the Post
		// ============================================
		const { data: post, error: postError } = await supabase
			.from("posts")
			.select(`
				id,
				title,
				content,
				slug,
				authors (
					id,
					name
				)
			`)
			.eq("id", Number.parseInt(postId, 10))
			.single();

		if (postError) {
			console.error("Error fetching post:", postError);
			return Response.json({ error: "Failed to fetch post", details: postError.message }, { status: 500 });
		}

		if (!post) {
			return Response.json({ error: `Post with ID ${postId} not found` }, { status: 404 });
		}

		console.log(`📝 Found post: "${post.title}"`);

		// ============================================
		// Step 2: Convert Post Content to HTML
		// ============================================
		let articleHtml: string;

		try {
			articleHtml = convertPostContentForEmail(post.content);
			console.log(`✅ Converted content to HTML (${articleHtml.length} chars)`);
		} catch (conversionError) {
			console.error("Error converting content:", conversionError);
			articleHtml = "<p>Read the full article on our website.</p>";
		}

		// ============================================
		// Step 3: Fetch Upcoming Events
		// ============================================
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const futureDate = new Date(today);
		futureDate.setDate(futureDate.getDate() + 10);

		const { data: events, error: eventsError } = await supabase
			.from("events")
			.select("id, title, description, start_time, city, url, banner_url")
			.gte("start_time", today.toISOString())
			.lte("start_time", futureDate.toISOString())
			.order("start_time", { ascending: true });

		if (eventsError) {
			console.error("Error fetching events:", eventsError);
		}

		console.log(`📅 Found ${events?.length || 0} upcoming events`);

		// ============================================
		// Step 4: Build Article Object
		// ============================================
		const article = {
			id: post.id.toString(),
			title: post.title,
			htmlContent: articleHtml,
			authorName: post.authors?.[0]?.name || "Carlos Resende",
			url: post.slug ? `https://adamastor.blog/posts/${post.slug}` : `https://adamastor.blog/posts/${post.id}`,
		};

		// ============================================
		// Step 5: Send Email (Test or Broadcast)
		// ============================================

		if (broadcast) {
			// ----------------------------------------
			// BROADCAST MODE: Send to entire audience
			// ----------------------------------------
			console.log("📣 BROADCAST MODE: Sending to entire audience");

			const audienceId = process.env.RESEND_AUDIENCE_ID;
			if (!audienceId) {
				return Response.json({ error: "RESEND_AUDIENCE_ID is not configured" }, { status: 500 });
			}

			// Render the React component to HTML string
			const emailHtml = await render(
				NewsletterTemplate({
					events: events || [],
					weekLabel: weekLabel,
					article: article,
				}),
			);

			// Step 5a: Create the broadcast
			const { data: broadcastData, error: createError } = await resend.broadcasts.create({
				audienceId: audienceId,
				from: "Adamastor <hi@digest.adamastor.blog>",
				replyTo: "carlos@adamastor.blog",
				subject: `Adamastor: ${post.title}`,
				html: emailHtml,
			});

			if (createError) {
				console.error("Broadcast create error:", createError);
				return Response.json({ error: "Failed to create broadcast", details: createError.message }, { status: 500 });
			}

			if (!broadcastData?.id) {
				return Response.json({ error: "Broadcast was created but no ID was returned" }, { status: 500 });
			}

			console.log(`✅ Broadcast created with ID: ${broadcastData.id}`);

			// Step 5b: Send the broadcast
			const { error: sendError } = await resend.broadcasts.send(broadcastData.id);

			if (sendError) {
				console.error("Broadcast send error:", sendError);
				return Response.json({ error: "Failed to send broadcast", details: sendError.message }, { status: 500 });
			}

			console.log("📨 Broadcast sent successfully!");

			return Response.json({
				success: true,
				mode: "broadcast",
				broadcastId: broadcastData.id,
				postId: post.id,
				postTitle: post.title,
				eventCount: events?.length || 0,
			});
		}

		// ----------------------------------------
		// TEST MODE: Send to single email
		// ----------------------------------------
		console.log(`🧪 TEST MODE: Sending to ${testEmail}`);

		const { data: emailData, error: emailError } = await resend.emails.send({
			from: "Adamastor <hi@digest.adamastor.blog>",
			to: [testEmail],
			replyTo: "carlos@adamastor.blog",
			subject: `[TEST] Adamastor: ${post.title}`,
			react: NewsletterTemplate({
				events: events || [],
				weekLabel: weekLabel,
				article: article,
			}),
		});

		if (emailError) {
			console.error("Email send error:", emailError);
			return Response.json({ error: emailError.message }, { status: 500 });
		}

		console.log("✉️ Test email sent successfully!");

		return Response.json({
			success: true,
			mode: "test",
			sentTo: testEmail,
			postId: post.id,
			postTitle: post.title,
			eventCount: events?.length || 0,
			emailId: emailData?.id,
			note: "Unsubscribe link won't work in test mode - only in broadcast mode",
		});
	} catch (error) {
		console.error("Newsletter send error:", error);
		return Response.json(
			{
				error: error instanceof Error ? error.message : "An error occurred",
				stack: error instanceof Error ? error.stack : undefined,
			},
			{ status: 500 },
		);
	}
}
