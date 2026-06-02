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
import { verifyInternalSecret } from "@/lib/newsletter/internal-auth";
import { buildPreferencesUrl } from "@/lib/newsletter/preferences-url";
import { getAllSubscribersSegmentId, getDigestSegmentId } from "@/lib/newsletter/segments";
import { countActiveCategorySubscribers } from "@/lib/newsletter/subscriptions";
import { getCategoryTopicEnvName, getCategoryTopicId } from "@/lib/newsletter/topics";
import { capturePostHogEvent } from "@/lib/posthog-server";
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
// One week. Matches the weekly send cadence so consecutive issues don't overlap
// and re-list the same events. (Was 10 days, which double-listed ~3 days of
// events across back-to-back weekly emails.)
const EVENTS_WINDOW_DAYS = 7;
// Editorial cap on featured events in a manual digest. Mirrors the dashboard
// picker (SendNewsletterDialog) — keeps the issue scannable. The route enforces
// it too so an oversized payload can't slip past the UI.
const MAX_FEATURED_EVENTS = 6;

interface EventRow {
	id: number | string;
	title: string;
	description: string;
	start_time: string;
	city: string;
	url: string;
	banner_url?: string | null;
}

type EventRowWithCats = EventRow & { event_category_assignments?: { category_slug: string }[] };

export async function POST(request: NextRequest) {
	// Auth gate. This route can broadcast to the entire subscriber list, so it
	// requires the shared NEWSLETTER_SEND_SECRET (Authorization: Bearer …) for
	// EVERY mode — including test sends, which can still hit an arbitrary
	// address. Fails closed: if the secret isn't configured, nothing gets in.
	// The cron route (/api/cron/send-newsletter) forwards this secret when it
	// delegates here; manual QA passes it as a Bearer header.
	const auth = verifyInternalSecret(request, process.env.NEWSLETTER_SEND_SECRET, "NEWSLETTER_SEND_SECRET");
	if (!auth.ok) {
		return Response.json({ error: auth.error }, { status: auth.status });
	}

	try {
		const body = await request.json();
		const {
			postId = DEFAULT_TEST_POST_ID,
			testEmail = DEFAULT_TEST_EMAIL,
			broadcast = false,
			confirmBroadcast = false,
			category: categoryInput,
			eventIds,
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
		const targetSegmentId = broadcast ? (category ? getAllSubscribersSegmentId() : getDigestSegmentId()) : null;
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
		let article:
			| {
					id: string;
					title: string;
					htmlContent: string;
					authorName: string;
					url: string;
					authorImageUrl?: string;
			  }
			| undefined;
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
						name,
						image_url
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

			// authors.image_url is stored as a site-relative path (e.g. "/carlos.jpeg").
			// Email needs an absolute URL, and we point at the RAW file (not /_next/image)
			// because the optimizer serves WebP, which many email clients can't render.
			const rawAuthorImage = post.authors?.[0]?.image_url as string | null | undefined;
			const authorImageUrl = rawAuthorImage
				? rawAuthorImage.startsWith("http")
					? rawAuthorImage
					: `https://adamastor.blog${rawAuthorImage}`
				: undefined;

			article = {
				id: post.id.toString(),
				title: post.title,
				htmlContent: articleHtml,
				authorName: post.authors?.[0]?.name || "Carlos Resende",
				url: post.slug ? `https://adamastor.blog/posts/${post.slug}` : `https://adamastor.blog/posts/${post.id}`,
				authorImageUrl,
			};
			postTitleForSubject = post.title;
		}

		// ============================================
		// Resolve the events to feature
		// ============================================
		// Manual digest sends pass a curated `eventIds` array — Carlos hand-picks
		// up to MAX_FEATURED_EVENTS in the dashboard (SendNewsletterDialog), and
		// what he picks is exactly what sends (an empty array → no featured
		// events). The per-category cron passes no `eventIds` at all and falls
		// back to "all approved in the next window", filtered to the category.
		const EVENTS_SELECT =
			"id, title, description, start_time, city, url, banner_url, event_category_assignments(category_slug)";
		const curatedIds: number[] | null = Array.isArray(eventIds)
			? eventIds
					.slice(0, MAX_FEATURED_EVENTS)
					.map((id: unknown) => Number(id))
					.filter((id: number) => Number.isFinite(id))
			: null;

		let rawEvents: EventRowWithCats[] | null;
		let eventsError: { message: string } | null;

		if (curatedIds) {
			// Curated: send exactly the picked events, in date order. No date
			// window here — the picker (SendNewsletterDialog) already constrains
			// selection to the next 14 days. An empty pick means an article-only
			// issue (no events section).
			if (curatedIds.length === 0) {
				rawEvents = [];
				eventsError = null;
			} else {
				const res = await supabase
					.from("events")
					.select(EVENTS_SELECT)
					.in("id", curatedIds)
					.eq("status", "approved")
					.order("start_time", { ascending: true });
				rawEvents = res.data as EventRowWithCats[] | null;
				eventsError = res.error;
			}
		} else {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const futureDate = new Date(today);
			futureDate.setDate(futureDate.getDate() + EVENTS_WINDOW_DAYS);

			const res = await supabase
				.from("events")
				.select(EVENTS_SELECT)
				.eq("status", "approved")
				.gte("start_time", today.toISOString())
				.lte("start_time", futureDate.toISOString())
				.order("start_time", { ascending: true });
			rawEvents = res.data as EventRowWithCats[] | null;
			eventsError = res.error;
		}

		if (eventsError) {
			console.error("Error fetching events:", eventsError);
		}

		const eventsAll = (rawEvents ?? []) as EventRowWithCats[];

		// Category filter in JS — Supabase doesn't filter on the join cleanly
		// without a more complex query. The set is small, so this is cheap.
		const events: EventRowWithCats[] = category
			? eventsAll.filter((event) =>
					(event.event_category_assignments ?? []).some((a) => a.category_slug === category.slug),
				)
			: eventsAll;

		console.log(
			`📅 ${events.length} events for ${category ? category.slug : "digest"}${curatedIds ? " (curated)" : ""}`,
		);

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
				categorySlugs: (e.event_category_assignments ?? []).map((a) => a.category_slug),
			})),
			article,
			category: category ?? undefined,
			preferencesUrl,
		};

		const subject = category
			? `Adamastor — ${category.name} events this week`
			: `Adamastor: ${postTitleForSubject ?? "This week"}`;

		if (broadcast && targetSegmentId) {
			// Per-category broadcast guards: don't send a category email that
			// would land empty or reach nobody. (The digest is exempt — it's the
			// manual editorial send and always carries the article.)
			if (category) {
				if (events.length === 0) {
					console.log(`⏭️ Skipping ${category.slug}: no events in the next ${EVENTS_WINDOW_DAYS} days.`);
					return Response.json({ success: true, skipped: true, reason: "no_events", category: category.slug });
				}
				// null = couldn't determine (DB hiccup) → fail open and let the
				// Resend topic filter be the final gate. 0 = genuinely nobody opted in.
				const subscriberCount = await countActiveCategorySubscribers(category.slug);
				if (subscriberCount === 0) {
					console.log(`⏭️ Skipping ${category.slug}: no opted-in subscribers.`);
					return Response.json({ success: true, skipped: true, reason: "no_subscribers", category: category.slug });
				}
			}

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

			// Product visibility: record every real send (not test sends) so the
			// newsletter cadence + reach shows up alongside the rest of the funnel.
			await capturePostHogEvent({
				event: "newsletter_broadcast_sent",
				distinctId: "newsletter-system",
				properties: {
					product: category ? "per_category_events" : "weekly_digest",
					category: category?.slug ?? null,
					broadcast_id: broadcastData.id,
					event_count: events.length,
				},
			});

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
