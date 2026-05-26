import { sanitizeEventCategorySlugs } from "@/lib/events/categories";
import { getUserProfile } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { notFound } from "next/navigation";
import ReviewSubmissionClient from "./ReviewSubmissionClient";

interface ReviewPageProps {
	params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ReviewSubmissionPage({ params }: ReviewPageProps) {
	// Defense-in-depth: see sibling page.tsx for the rationale.
	const sessionClient = await createClient();
	const profile = await getUserProfile(sessionClient);
	if (!profile || profile.role !== "admin") notFound();

	const { id: idParam } = await params;
	const eventId = Number(idParam);
	if (!Number.isFinite(eventId)) {
		notFound();
	}

	const supabase = createServiceRoleClient();
	const { data: event, error } = await supabase
		.from("events")
		.select("*, event_category_assignments(category_slug)")
		.eq("id", eventId)
		.single();

	if (error || !event) {
		notFound();
	}

	const initialCategorySlugs = sanitizeEventCategorySlugs(
		(event.event_category_assignments ?? []).map((assignment: { category_slug: string }) => assignment.category_slug),
	);

	return (
		<div className="w-full mx-auto p-6 max-w-3xl">
			<ReviewSubmissionClient
				event={{
					id: String(event.id),
					title: event.title,
					description: event.description,
					url: event.url ?? "",
					banner_url: event.banner_url ?? "",
					start_time: event.start_time,
					end_time: event.end_time ?? null,
					city: event.city,
					status: event.status,
					submitter_name: event.submitter_name ?? null,
					submitter_email: event.submitter_email ?? null,
					submitted_at: event.submitted_at,
					reviewed_at: event.reviewed_at ?? null,
					rejection_reason: event.rejection_reason ?? null,
				}}
				initialCategorySlugs={initialCategorySlugs}
			/>
		</div>
	);
}
