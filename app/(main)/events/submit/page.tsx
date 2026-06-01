import { getUserProfile } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { getTurnstileSiteKey } from "@/lib/turnstile";
import type { Metadata } from "next";
import Image from "next/image";
import SubmitEventForm from "./SubmitEventForm";
import SubmitTitle from "./SubmitTitle";

const SUBMIT_TITLE = "Submit an event — Adamastor";
const SUBMIT_DESCRIPTION =
	"Are you organising a tech, startup or design event in Portugal? Share it with Adamastor's community and reach more attendees.";

export const metadata: Metadata = {
	title: SUBMIT_TITLE,
	description: SUBMIT_DESCRIPTION,
	alternates: { canonical: "/events/submit" },
	robots: { index: true, follow: true },
	openGraph: {
		title: SUBMIT_TITLE,
		description: SUBMIT_DESCRIPTION,
		url: "https://adamastor.blog/events/submit",
		siteName: "Adamastor",
		type: "website",
		images: [{ url: "/socialPreview2.jpg", width: 1200, height: 630, alt: "Submit an event to Adamastor" }],
	},
	twitter: {
		card: "summary_large_image",
		title: SUBMIT_TITLE,
		description: SUBMIT_DESCRIPTION,
		images: ["/socialPreview2.jpg"],
	},
};

export default async function SubmitEventPage() {
	const supabase = await createClient();
	const profile = await getUserProfile(supabase);

	const initialSubmitterEmail = profile?.email ?? "";
	const emailIsLocked = Boolean(profile?.email);

	return (
		<div className="mx-auto max-w-2xl space-y-6 md:space-y-8 md:p-4">
			<header className="space-y-3 pb-2 pt-2">
				<SubmitTitle profileEmail={profile?.email ?? null} />
				<p className="max-w-[60ch] text-sm md:text-base leading-snug md:leading-relaxed text-muted-foreground [text-wrap:pretty]">
					Adamastor curates the events worth knowing about in Portugal’s tech and startup scene. Tell us about yours and
					we’ll review it within a couple of hours.
				</p>
			</header>

			{/* Trust strip: three real faces + reassurance copy. Soft
			    navy-wash wash distinguishes it from the outlined form
			    module below without competing for visual weight. */}
			<aside className="flex flex-col sm:flex-row items-start gap-4 rounded-lg bg-navy-veil/40 p-5 dark:bg-navy-tint/[0.04]">
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
					<h2 className="text-sm font-semibold text-navy dark:text-navy-lifted">Reviewed by Afonso, Carlos & Malik</h2>
					<p className="text-sm leading-snug md:leading-relaxed text-muted-foreground">
						The three of us read every submission and get back to you within a couple of hours. Questions before you
						submit?{" "}
						<a
							href="mailto:hello@adamastor.blog"
							className="font-medium text-navy underline underline-offset-4 decoration-navy-tint decoration-2 hover:decoration-navy dark:text-navy-lifted dark:hover:text-cyan transition-colors"
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
