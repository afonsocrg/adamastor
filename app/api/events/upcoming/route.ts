import { ForbiddenError, handleError } from "@/lib/errors";
import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { TEAM } from "@/lib/team";
import { NextResponse } from "next/server";

interface UpcomingEventRow {
	id: number | string;
	title: string;
	start_time: string;
	city: string;
	submitter_email: string | null;
	event_category_assignments?: { category_slug: string }[];
}

/** First name of a team member by email (case-insensitive), or null if not one of us. */
function teamFirstName(email: string | null): string | null {
	if (!email) return null;
	const normalized = email.trim().toLowerCase();
	const member = TEAM.find((m) => m.email.toLowerCase() === normalized);
	return member ? member.name.split(" ")[0] : null;
}

/**
 * Upcoming approved events for the newsletter "feature events" picker in the
 * admin dashboard. Admin-only. Slim payload — the picker only needs date,
 * title, city, category, and provenance to let Carlos curate; the send route
 * re-fetches the full rows by ID at send time.
 *
 * `addedBy` is the first name of the team member who added the event (resolved
 * from `submitter_email`), or null for community submissions / scraped events —
 * so the UI can calmly flag "Added by Malik" without exposing anyone's email.
 */
export async function GET() {
	try {
		const supabase = await createClient();
		const profile = await assertAuthenticated(supabase);
		if (profile.role !== "admin") {
			throw new ForbiddenError("Admin access required");
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		// Only the next two weeks are featurable. The Weekly shouldn't promote
		// events too far out to act on, and a tighter window keeps the picker
		// focused on what's actually relevant to the upcoming issue.
		const horizon = new Date(today);
		horizon.setDate(horizon.getDate() + 14);
		horizon.setHours(23, 59, 59, 999);

		const { data, error } = await supabase
			.from("events")
			.select("id, title, start_time, city, submitter_email, event_category_assignments(category_slug)")
			.eq("status", "approved")
			.gte("start_time", today.toISOString())
			.lte("start_time", horizon.toISOString())
			.order("start_time", { ascending: true });

		if (error) {
			console.error("Error fetching upcoming events:", error);
			return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
		}

		const events = ((data ?? []) as UpcomingEventRow[]).map((e) => ({
			id: String(e.id),
			title: e.title,
			start_time: e.start_time,
			city: e.city,
			categorySlugs: (e.event_category_assignments ?? []).map((a) => a.category_slug),
			addedBy: teamFirstName(e.submitter_email),
		}));

		return NextResponse.json({ events });
	} catch (error) {
		console.error("Error in GET /api/events/upcoming:", error);
		return handleError(error);
	}
}
