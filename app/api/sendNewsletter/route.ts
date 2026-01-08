/**
 * Newsletter API Route
 *
 * Sends a newsletter email with:
 * 1. A featured article (blog post)
 * 2. Upcoming events
 *
 * Flow:
 * 1. Receive postId (or use default for testing)
 * 2. Fetch post from Supabase
 * 3. Convert TipTap JSON → HTML
 * 4. Fetch upcoming events
 * 5. Render email template
 * 6. Send via Resend
 *
 * Test endpoint:
 * POST /api/sendNewsletter
 * Body: { "postId": "147" }  // or omit for default test post
 */

import { NewsletterTemplate } from "@/components/email/newsletter-template";
import { createClient } from "@/lib/supabase/server";
import { convertPostContentForEmail } from "@/lib/tiptap-to-html";
import type { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Default test email - you can change this or make it configurable
const DEFAULT_TEST_EMAIL = "malik@hey.com";

// Default test post ID - using the one you mentioned
const DEFAULT_TEST_POST_ID = "147";

export async function POST(request: NextRequest) {
	try {
		// ============================================
		// Parse Request Body
		// ============================================
		const body = await request.json();
		const { postId = DEFAULT_TEST_POST_ID, testEmail = DEFAULT_TEST_EMAIL, weekLabel = "This Week" } = body;

		console.log(`📧 Sending newsletter with post ${postId} to ${testEmail}`);

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
		// The post.content is TipTap JSON, we need to convert it to HTML for email
		let articleHtml: string;

		try {
			articleHtml = convertPostContentForEmail(post.content);
			console.log(`✅ Converted content to HTML (${articleHtml.length} chars)`);
		} catch (conversionError) {
			console.error("Error converting content:", conversionError);
			// Fallback to a simple message if conversion fails
			articleHtml = "<p>Read the full article on our website.</p>";
		}

		// ============================================
		// Step 3: Fetch Upcoming Events
		// ============================================
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const futureDate = new Date(today);
		futureDate.setDate(futureDate.getDate() + 10); // Rendering events that will be taking place in the upcoming 10 days.

		const { data: events, error: eventsError } = await supabase
			.from("events")
			.select("id, title, description, start_time, city, url, banner_url")
			.gte("start_time", today.toISOString())
			.lte("start_time", futureDate.toISOString())
			.order("start_time", { ascending: true });

		if (eventsError) {
			console.error("Error fetching events:", eventsError);
			// Continue without events rather than failing completely
		}

		console.log(`📅 Found ${events?.length || 0} upcoming events`);

		// ============================================
		// Step 4: Build Article Object for Template
		// ============================================
		const article = {
			id: post.id.toString(),
			title: post.title,
			htmlContent: articleHtml,
			authorName: post.authors?.[0]?.name || "Carlos Resende",
			// Use slug if available, otherwise fall back to ID
			url: post.slug ? `https://adamastor.blog/posts/${post.slug}` : `https://adamastor.blog/posts/${post.id}`,
		};

		// ============================================
		// Step 5: Send Email via Resend
		// ============================================
		const { data: emailData, error: emailError } = await resend.emails.send({
			from: "hi@digest.adamastor.blog",
			to: [testEmail],
			subject: `Adamastor: ${post.title}`,
			react: NewsletterTemplate({
				firstName: "Malik", // TODO: Extract from subscriber data
				events: events || [],
				weekLabel: weekLabel,
				article: article,
			}),
		});

		if (emailError) {
			console.error("Email send error:", emailError);
			return Response.json({ error: emailError.message }, { status: 500 });
		}

		console.log("✉️ Email sent successfully!");

		// ============================================
		// Step 6: Return Success Response
		// ============================================
		return Response.json({
			success: true,
			sentTo: testEmail,
			postId: post.id,
			postTitle: post.title,
			eventCount: events?.length || 0,
			emailId: emailData?.id,
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
