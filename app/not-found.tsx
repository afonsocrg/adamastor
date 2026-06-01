import Link from "next/link";

// Root 404 boundary. Renders for unmatched URLs and any `notFound()` call that
// isn't caught by a closer not-found.tsx. Kept on-brand (navy + Lora Bold
// numeral) so a mistyped link still feels like the publication, not a default
// framework page.
export default function NotFound() {
	return (
		<main className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
			<p
				className="text-6xl leading-none text-navy dark:text-navy-lifted [font-family:var(--font-lora-bold)]"
				aria-hidden="true"
			>
				404
			</p>
			<h1 className="mt-6 text-2xl font-bold text-navy dark:text-navy-lifted">This page wandered off</h1>
			<p className="mt-3 max-w-md text-navy-tone dark:text-navy-dim">
				The link is broken or the page has moved. The startup scene keeps moving — let's get you back to it.
			</p>
			<div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
				<Link
					href="/"
					className="text-sm font-semibold uppercase tracking-[0.14em] text-navy underline-offset-4 hover:underline dark:text-navy-lifted"
				>
					Back home
				</Link>
				<Link
					href="/events"
					className="text-sm font-semibold uppercase tracking-[0.14em] text-navy-tone underline-offset-4 hover:text-navy hover:underline dark:text-navy-dim dark:hover:text-navy-lifted"
				>
					Browse events
				</Link>
			</div>
		</main>
	);
}
