import type { Metadata } from "next";
import { Suspense } from "react";
import SubscribePageClient from "./SubscribePageClient";

export const metadata: Metadata = {
	title: "Subscribe — Adamastor",
	description:
		"Get the weekly digest by Carlos Resende plus curated event picks across Portugal in the topics you care about.",
	robots: { index: true, follow: true },
};

export default function SubscribePage() {
	return (
		<div className="mx-auto max-w-2xl space-y-8 md:p-4">
			<Suspense fallback={null}>
				<SubscribePageClient />
			</Suspense>
		</div>
	);
}
