/**
 * Skeleton fallback shown by Next.js while the /events route segment loads
 * (route navigations, revalidation requests). Mirrors EventsPageClient's
 * structure so users see the intended layout immediately, not a generic
 * spinner. Tones: navy-wash only — no cyan accents until the real content
 * arrives, so the skeleton never competes with the page's signal moments.
 */
export default function EventsLoading() {
	return (
		<div className="space-y-10 md:p-4" aria-hidden="true">
			{/* City tab row */}
			<div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-navy-frame dark:border-navy-edge pb-1">
				{[64, 48, 48, 56].map((w, i) => (
					<div
						key={`tab-${i}`}
						className="h-5 animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]"
						style={{ width: `${w}px` }}
					/>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-8 gap-8 lg:gap-20">
				{/* Events column — header lives inside the column so sidebar
				    top aligns with H1 baseline, mirroring EventsPageClient. */}
				<div className="order-2 lg:order-1 lg:col-span-5 space-y-8">
					{/* H1 + dek */}
					<div className="space-y-3">
						<div className="h-9 w-40 animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
						<div className="space-y-2">
							<div className="h-4 w-full max-w-[70ch] animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
							<div className="h-4 w-3/4 max-w-[55ch] animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
						</div>
					</div>

					{/* Category chips */}
					<div className="flex flex-wrap gap-2">
						{[44, 64, 92, 120, 80, 110].map((w, i) => (
							<div
								key={`chip-${i}`}
								className="h-9 animate-pulse rounded-full border border-navy-frame bg-transparent dark:border-navy-edge"
								style={{ width: `${w}px` }}
							/>
						))}
					</div>

					{/* Events list with rail */}
					<div className="border-l border-navy-frame dark:border-navy-edge pl-8 space-y-10">
						{[3, 2].map((cardCount, dayIdx) => (
							<div key={`day-${dayIdx}`} className="space-y-4">
								<div className="h-5 w-40 animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
								{Array.from({ length: cardCount }).map((_, cardIdx) => (
									<div key={`card-${dayIdx}-${cardIdx}`} className="space-y-2 p-4">
										<div className="h-6 w-3/4 max-w-[40ch] animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
										<div className="h-4 w-32 animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
										<div className="h-4 w-full max-w-[50ch] animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
										<div className="h-4 w-2/3 max-w-[40ch] animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
									</div>
								))}
							</div>
						))}
					</div>
				</div>

				{/* Sidebar */}
				<div className="order-1 lg:order-2 lg:col-span-3">
					<div className="flex flex-col gap-6">
						{/* Calendar card */}
						<div className="rounded-lg border border-navy-frame dark:border-navy-edge p-5 space-y-4">
							<div className="h-5 w-24 animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
							<div className="grid grid-cols-7 gap-1.5">
								{Array.from({ length: 42 }).map((_, i) => (
									<div
										key={`cal-${i}`}
										className="h-9 w-full animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]"
									/>
								))}
							</div>
						</div>

						{/* Subscribe block */}
						<div className="rounded-lg border border-navy-frame dark:border-navy-edge p-5 space-y-3">
							<div className="h-6 w-44 animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
							<div className="h-4 w-full animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
							<div className="h-4 w-2/3 animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
							<div className="h-4 w-20 mt-4 animate-pulse rounded bg-navy-wash dark:bg-navy-tint/[0.08]" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
