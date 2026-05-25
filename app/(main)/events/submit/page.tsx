import { getUserProfile } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { getTurnstileSiteKey } from "@/lib/turnstile";
import type { Metadata } from "next";
import Image from "next/image";
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
		<div className="mx-auto max-w-2xl space-y-8 md:p-4">
			<header className="space-y-3 pb-2 pt-2">
				<h1 className="text-3xl font-bold tracking-tight leading-tight text-navy [text-wrap:pretty] dark:text-[#E3F2F7] [font-family:var(--font-lora-bold)]">
					Submit your event
				</h1>
				<p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground [text-wrap:pretty]">
					Adamastor curates the events worth knowing about in Portugal's tech and startup scene. Tell us about yours
					and we'll review it within a couple of hours.
				</p>
			</header>

			{/* Trust strip: three real faces + reassurance copy. Soft
			    navy-faded wash distinguishes it from the outlined form
			    module below without competing for visual weight. */}
			<aside className="flex items-start gap-4 rounded-lg bg-navy-faded/40 p-5 dark:bg-[rgba(76,228,240,0.04)]">
				<div className="flex shrink-0 -space-x-2">
					<Image
						src="/afonso.jpeg"
						alt="Afonso Gonçalves"
						width={44}
						height={44}
						className="h-11 w-11 rounded-full border-2 border-background object-cover"
					/>
					<Image
						src="/carlos.jpeg"
						alt="Carlos Resende"
						width={44}
						height={44}
						className="h-11 w-11 rounded-full border-2 border-background object-cover"
					/>
					<Image
						src="/malik.jpeg"
						alt="Malik Piara"
						width={44}
						height={44}
						className="h-11 w-11 rounded-full border-2 border-background object-cover"
					/>
				</div>
				<div className="space-y-1">
					<h2 className="text-sm font-semibold text-navy dark:text-[#E3F2F7]">
						Reviewed by Afonso, Carlos & Malik
					</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						The three of us read every submission and get back to you within a couple of hours.
						Questions before you submit?{" "}
						<a
							href="mailto:hello@adamastor.blog"
							className="font-medium text-navy underline underline-offset-4 decoration-cyan decoration-2 hover:text-cyan-darker dark:text-[#E3F2F7] dark:hover:text-cyan transition-colors"
						>
							Get in touch
						</a>
						.
					</p>
				</div>
			</aside>

			<SubmitEventForm
				initialSubmitterEmail={initialSubmitterEmail}
				emailIsLocked={emailIsLocked}
				turnstileSiteKey={getTurnstileSiteKey() ?? null}
			/>
		</div>
	);
}
