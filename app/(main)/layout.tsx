import MobileTabBar from "@/components/MobileTabBar";
import Navbar from "@/components/navbar";
import Link from "next/link";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
	return (
		<div>
			<Navbar />
			{/* Container widened to screen-xl (1280px) so editorial pages like
			    /events can breathe. Text-heavy pages constrain themselves
			    further (posts/[id] uses max-w-[750px]; preferences and
			    events/submit use max-w-2xl). Defensive wrappers on / and
			    /about keep them at max-w-screen-lg for comfortable text
			    line lengths. */}
			<main className="max-w-screen-xl mx-auto p-4">{children}</main>

			{/* Footer: organiser-acquisition link on the left (own its own
			    weight, navy + text-sm), passive channels on the right
			    (RSS / X / LinkedIn, muted). Keeps the editorial vs follow
			    distinction visible in the footer too. */}
			<footer className="flex items-center justify-between gap-3 p-4 mb-2 border-t border-navy-faded dark:border-[rgba(76,228,240,0.12)]">
				<Link href="/events/submit" className="text-sm text-navy hover:underline dark:text-[#E3F2F7]">
					Submit your event
				</Link>
				<div className="flex gap-3 text-muted-foreground">
					<Link href="/feed.xml" className="hover:underline transition-colors">
						RSS
					</Link>
					<Link href="https://x.com/meetAdamastor" className="hover:underline transition-colors">
						X
					</Link>
					<Link
						href="https://www.linkedin.com/company/adamastor-magazine/"
						className="hover:underline transition-colors"
					>
						LinkedIn
					</Link>
				</div>
			</footer>
			<MobileTabBar />
		</div>
	);
}
