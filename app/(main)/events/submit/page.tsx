import { getUserProfile } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { getTurnstileSiteKey } from "@/lib/turnstile";
import type { Metadata } from "next";
import SubmitEventForm from "./SubmitEventForm";

export const metadata: Metadata = {
	title: "Submit an event — Adamastor",
	description:
		"Are you organising a tech, startup or design event in Portugal? Share it with Adamastor's community and reach more attendees.",
	robots: { index: true, follow: true },
};

export default async function SubmitEventPage() {
	const supabase = await createClient();
	const profile = await getUserProfile(supabase);

	const initialSubmitterEmail = profile?.email ?? "";
	const emailIsLocked = Boolean(profile?.email);

	return (
		<div className="mx-auto max-w-2xl space-y-6 md:p-4">
			<header className="space-y-3 pb-2 pt-2">
				<h1 className="text-2xl font-extrabold tracking-tight leading-tight text-[#104357] [text-wrap:pretty] dark:text-[#E3F2F7]">
					Submit your event
				</h1>
				<p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground [text-wrap:pretty]">
					Adamastor curates the events worth knowing about in Portugal's tech and startup scene. Tell us about yours
					and we'll review it within a couple of working days.
				</p>
			</header>

			<SubmitEventForm
				initialSubmitterEmail={initialSubmitterEmail}
				emailIsLocked={emailIsLocked}
				turnstileSiteKey={getTurnstileSiteKey() ?? null}
			/>
		</div>
	);
}
