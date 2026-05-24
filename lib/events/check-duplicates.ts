import type { SupabaseClient } from "@supabase/supabase-js";
import {
	findEventDuplicateCandidates,
	hasBlockingEventDuplicate,
	type EventDuplicateInput,
} from "./duplicate-detection";

export async function checkVisibleEventDuplicates(supabase: SupabaseClient, event: EventDuplicateInput) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const { data: visibleEvents, error } = await supabase
		.from("events")
		.select("id, title, description, start_time, city, url")
		.gte("start_time", today.toISOString());

	if (error) {
		throw error;
	}

	const duplicateCandidates = findEventDuplicateCandidates(event, (visibleEvents || []) as EventDuplicateInput[]);
	const hasBlockingDuplicate = hasBlockingEventDuplicate(duplicateCandidates);

	return {
		duplicateCandidates,
		hasBlockingDuplicate,
		severity: hasBlockingDuplicate ? "block" : duplicateCandidates.length > 0 ? "warning" : "none",
	};
}
