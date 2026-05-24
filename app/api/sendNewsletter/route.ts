/**
 * Newsletter API Route
 *
 * Two newsletter products live here, switched by the `category` body field:
 *
 * 1. WEEKLY DIGEST  (default — no `category`)
 *    Editorial article + 10-day events window, sent to the digest segment.
 *
 * 2. PER-CATEGORY EVENTS  (`category: "design"` etc.)
 *    Events-only, filtered to that category. Broadcast targets the
 *    All Subscribers segment with a Topic filter — see
 *    lib/newsletter/topics.ts for the slug → topic ID mapping.
 *
 * Each product has a TEST mode (default — sends to one address; defaults
 * to delivered@resend.dev so an accidental call doesn't surprise anyone)
 * and a BROADCAST mode (`broadcast: true, confirmBroadcast: true` — sends
 * to every opted-in subscriber).
 *
 * Examples:
 *   POST /api/sendNewsletter
 *     { "postId": "147", "testEmail": "you@example-real-inbox" }
 *
 *   POST /api/sendNewsletter
 *     { "postId": "147", "broadcast": true, "confirmBroadcast": true }
 *
 *   POST /api/sendNewsletter
 *     { "category": "design", "testEmail": "you@example-real-inbox" }
 *
 *   POST /api/sendNewsletter
 *     { "category": "design", "broadcast": true, "confirmBroadcast": true }
 */

import { NewsletterTemplate } from "@/components/email/newsletter-template";
import { EVENT_CATEGORIES, type EventCategorySlug, isEventCategorySlug } from "@/lib/events/categories";
import { buildPreferencesUrl } from "@/lib/newsletter/preferences-url";
import { getAllSubscribersSegmentId, getDigestSegmentId } from "@/lib/newsletter/segments";
import { getCategoryTopicEnvName, getCategoryTopicId } from "@/lib/newsletter/topics";
import { createClient } from "@/lib/supabase/server";
import { convertPostContentForEmail } from "@/lib/tiptap-to-html";
import { render } from "@react-email/components";
import type { NextRequest } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's never-delivered sink. Safe default for misfired test calls — beats
// landing in a real inbox AND beats the @example.com pitfall (which Resend
// treats as a bounce and hurts sender reputation). Override via body.testEmail
// when you actually want the email in front of human eyes.
const DEFAULT_TEST_EMAIL = "delivered@resend.dev";
const DEFAULT_TEST_POST_ID = "147";
const EVENTS_WINDOW_DAYS = 10;

interface EventRow {
	id: number | string;
	title: string;
	description: string;
	start_time: string;
	city: string;
	url: string;
	banner_url?: string | null;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			postId = DEFAULT_TEST_POST_ID,
			testEmail = DEFAULT_TEST_EMAIL,
			broadcast = false,
			confirmBroadcast = false,
			category: categoryInput,
		} = body;

		// ============================================
		// Resolve category context (per-category mode)
		// ============================================
		let category: { slug: EventCategorySlug; name: string } | null = null;
		if (categoryInput) {
			if (typeof categoryInput !== "string" || !isEventCategorySlug(categoryInput)) {
				return Response.json({ error: `Unknown category: ${categoryInput}` }, { status: 400 });
			}
			const meta = EVENT_CATEGORIES.find((c) => c.slug === categoryInput);
			if (!meta) {
				return Response.json({ error: `Unknown category: ${categoryInput}` }, { status: 400 });
			}
			category = { slug: meta.slug, name: meta.name };
		}

		// ============================================
		// Safety check + segment resolution for broadcasts
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

		// Per-category broadcasts target the All Subscribers base segment and
		// filter to opted-in contacts via the matching Topic. The digest still
		// targets the Adamastor Weekly segment directly (no topic filter).
		const targetSegmentId = broadcast
			? category
				? getAllSubscribersSegmentId()
				: getDigestSegmentId()
			: null;
		const targetTopicId = broadcast && category ? getCategoryTopicId(category.slug) : null;

		if (broadcast && !targetSegmentId) {
			return Response.json(
				{
					error: category
						? "All Subscribers segment is not configured (RESEND_SEGMENT_ALL_SUBSCRIBERS)."
						: "Newsletter segment ID is not configured (RESEND_SEGMENT_ID).",
				},
				{ status: 500 },
			);
		}

		if (broadcast && category && !targetTopicId) {
			return Response.json(
				{
					error: `No Resend topic configured for category "${category.slug}". Set ${getCategoryTopicEnvName(category.slug)}.`,
				},
				{ status: 500 },
			);
		}

		const supabase = await createClient();

		// ============================================
		// Fetch the post (digest mode only)
		// ============================================
		let article: {
			id: string;
			title: string;
			htmlContent: string;
			authorName: string;
			url: string;
		} | undefined;
		let postTitleForSubject: string | undefined;

		if (!category) {
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

			let articleHtml: string;
			try {
				articleHtml = convertPostContentForEmail(post.content);
				console.log(`✅ Converted content to HTML (${articleHtml.length} chars)`);
			} catch (conversionError) {
				console.error("Error converting content:", conversionError);
				articleHtml = "<p>Read the full article on our website.</p>";
			}

			article = {
				id: post.id.toString(),
				title: post.title,
				htmlContent: articleHtml,
				authorName: post.authors?.[0]?.name || "Carlos Resende",
				url: post.slug
					? `https://adamastor.blog/posts/${post.slug}`
					: `https://adamastor.blog/posts/${post.id}`,
			};
			postTitleForSubject = post.title;
		}

		// ============================================
		// Fetch upcoming events (filtered by category if set)
		// ============================================
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const futureDate = new Date(today);
		futureDate.setDate(futureDate.getDate() + EVENTS_WINDOW_DAYS);

		const { data: rawEvents, error: eventsError } = await supabase
			.from("events")
			.select("id, title, description, start_time, city, url, banner_url, event_category_assignments(category_slug)")
			.eq("status", "approved")
			.gte("start_time", today.toISOString())
			.lte("start_time", futureDate.toISOString())
			.order("start_time", { ascending: true });

		if (eventsError) {
			console.error("Error fetching events:", eventsError);
		}

		const eventsAll = (rawEvents ?? []) as Array<
			EventRow & { event_category_assignments?: { category_slug: string }[] }
		>;

		// Category filter in JS — Supabase doesn't filter on the join cleanly
		// without a more complex query. The window is at most 10 days of events,
		// so the in-memory filter is cheap.
		const events: EventRow[] = category
			? eventsAll.filter((event) =>
					(event.event_category_assignments ?? []).some((a) => a.category_slug === category.slug),
				)
			: eventsAll;

		console.log(`📅 ${events.length} events for ${category ? category.slug : "digest"}`);

		// ============================================
		// Render template + send (test or broadcast)
		// ============================================
		const preferencesUrl = buildPreferencesUrl();
		const templateProps = {
			events: events.map((e) => ({
				id: String(e.id),
				title: e.title,
				description: e.description,
				start_time: e.start_time,
				city: e.city,
				url: e.url,
				banner_url: e.banner_url ?? undefined,
			})),
			article,
			category: category ?? undefined,
			preferencesUrl,
		};

		const subject = category
			? `Adamastor — ${category.name} events this week`
			: `Adamastor: ${postTitleForSubject ?? "This week"}`;

		if (broadcast && targetSegmentId) {
			console.log(
				`📣 BROADCAST: ${category ? `category=${category.slug}` : "digest"} → segment ${targetSegmentId}${targetTopicId ? ` topic ${targetTopicId}` : ""}`,
			);

			const emailHtml = await render(NewsletterTemplate(templateProps));

			const { data: broadcastData, error: createError } = await resend.broadcasts.create({
				segmentId: targetSegmentId,
				...(targetTopicId ? { topicId: targetTopicId } : {}),
				from: "Adamastor <hi@digest.adamastor.blog>",
				replyTo: "carlos@adamastor.blog",
				subject,
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

			const { error: sendError } = await resend.broadcasts.send(broadcastData.id);

			if (sendError) {
				console.error("Broadcast send error:", sendError);
				return Response.json({ error: "Failed to send broadcast", details: sendError.message }, { status: 500 });
			}

			console.log("📨 Broadcast sent successfully!");

			return Response.json({
				success: true,
				mode: "broadcast",
				category: category?.slug ?? null,
				broadcastId: broadcastData.id,
				eventCount: events.length,
			});
		}

		// ----------------------------------------
		// TEST MODE: Send to single email
		// ----------------------------------------
		console.log(`🧪 TEST MODE: Sending ${category ? `${category.slug} ` : ""}to ${testEmail}`);

		const testSubject = category ? `[TEST] ${subject}` : `[TEST] ${subject}`;

		const { data: emailData, error: emailError } = await resend.emails.send({
			from: "Adamastor <hi@digest.adamastor.blog>",
			to: [testEmail],
			replyTo: "carlos@adamastor.blog",
			subject: testSubject,
			react: NewsletterTemplate(templateProps),
		});

		if (emailError) {
			console.error("Email send error:", emailError);
			return Response.json({ error: emailError.message }, { status: 500 });
		}

		console.log("✉️ Test email sent successfully!");

		return Response.json({
			success: true,
			mode: "test",
			category: category?.slug ?? null,
			sentTo: testEmail,
			eventCount: events.length,
			emailId: emailData?.id,
			note: "Unsubscribe link won't work in test mode — only in broadcast mode",
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
