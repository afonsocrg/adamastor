"use client";

import { inter, loraBold } from "@/styles/fonts";
import "@/styles/globals.css";

// Root error boundary. Only renders when the root layout/template itself throws,
// so it must supply its own <html>/<body> and can't rely on Providers, fonts, or
// chrome mounted above it. We re-apply the brand fonts here so even a top-level
// crash reads as the publication. Segment-level errors should be caught by a
// closer error.tsx instead.
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en" className={`${inter.variable} ${loraBold.variable}`}>
			<body>
				<main className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
					<p
						className="text-5xl leading-none text-navy [font-family:var(--font-lora-bold)]"
						aria-hidden="true"
					>
						Oops
					</p>
					<h1 className="mt-6 text-2xl font-bold text-navy">Something broke on our end</h1>
					<p className="mt-3 max-w-md text-navy-tone">
						An unexpected error stopped this page from loading. Try again — if it keeps happening, it's on us, not
						you.
					</p>
					<button
						type="button"
						onClick={() => reset()}
						className="mt-8 rounded-md bg-navy px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-navy-shade"
					>
						Try again
					</button>
				</main>
			</body>
		</html>
	);
}
