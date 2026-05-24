import { sanitizeEventCategorySlugs } from "@/lib/events/categories";
import { getUserProfile } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditEventClient from "./edit-event-client";

interface EditEventPageProps {
	// The dynamic segment is named [slug] at the routing layer so it can
	// share its parent with the public city/category routes. Semantically
	// the value is still the numeric event id used by the API.
	params: Promise<{ slug: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
	const { slug: eventId } = await params;

	// Guard against the segment being passed a city/category slug — those
	// would silently 404 below, but cheaper to short-circuit.
	if (!/^\d+$/.test(eventId)) {
		notFound();
	}

	const supabase = await createClient();

	const { data: event, error } = await supabase
		.from("events")
		.select("*, event_category_assignments(category_slug)")
		.eq("id", eventId)
		.single();

	if (error || !event) {
		notFound();
	}

	const profile = await getUserProfile(supabase);
	if (!profile) {
		redirect("/login");
	}

	if (profile.role !== "admin") {
		redirect("/events");
	}

	const initialCategorySlugs = sanitizeEventCategorySlugs(
		(event.event_category_assignments ?? []).map((assignment: { category_slug: string }) => assignment.category_slug),
	);

	return <EditEventClient event={event} initialCategorySlugs={initialCategorySlugs} />;
}
