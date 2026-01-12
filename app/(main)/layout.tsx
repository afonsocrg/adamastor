import Navbar from "@/components/navbar";
import Link from "next/link";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
	return (
		<div>
			<Navbar />
			<main className="max-w-screen-lg mx-auto p-4">{children}</main>

			{/* Your awesome vertical text */}
			<div className="justify-start tracking-wider uppercase [writing-mode:vertical-rl] left-0 bottom-1 hidden sm:block fixed text-xs m-2 text-muted-foreground hover:blur-sm transition-all duration-1000 hover:bg-gradient-to-r hover:from-[#24acb5] hover:to-[#2cdce9] bg-clip-text hover:text-transparent cursor-pointer">
				Only you know who you can be
			</div>

			{/* Footer */}
			<footer className="justify-end flex gap-3 text-muted-foreground p-4 mb-2 border-t">
				<Link
					href="https://www.linkedin.com/company/adamastor-magazine/"
					className="hover:underline hover:text-primary transition-colors"
				>
					LinkedIn
				</Link>
			</footer>
		</div>
	);
}
