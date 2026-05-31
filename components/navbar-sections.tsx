"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const SECTIONS = [
	{ label: "Articles", href: "/", match: (p: string) => p === "/" || p === "/posts" || p.startsWith("/posts/") },
	{ label: "Events", href: "/events", match: (p: string) => p.startsWith("/events") },
] as const;

const SECTION_LINK_CLASS = "-mb-px border-b-2 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-colors";
const INACTIVE_SECTION_CLASS = "border-transparent text-navy-tone hover:text-navy dark:hover:text-cyan-lifted";
const ACTIVE_SECTION_CLASS = "border-navy text-navy dark:border-cyan-lifted dark:text-cyan-lifted";
const ACTIVE_TEXT_CLASS = "border-transparent text-navy dark:text-cyan-lifted";

export default function NavbarSections() {
	const pathname = usePathname() ?? "/";
	const activeIndex = Math.max(
		SECTIONS.findIndex((section) => section.match(pathname)),
		0,
	);
	const trackRef = useRef<HTMLElement>(null);
	const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
	const [clipPath, setClipPath] = useState<string>("inset(0px 100% 0px 0px)");
	const [underline, setUnderline] = useState({ left: 0, width: 0 });
	const [hasMeasured, setHasMeasured] = useState(false);

	const measureActiveTab = useCallback(() => {
		const track = trackRef.current;
		const activeLink =
			track?.querySelector<HTMLAnchorElement>('a[aria-current="page"]') ?? linkRefs.current[activeIndex];

		if (!track || !activeLink) return;

		const trackRect = track.getBoundingClientRect();
		const activeRect = activeLink.getBoundingClientRect();
		const left = Math.max(0, activeRect.left - trackRect.left);
		const right = Math.max(0, trackRect.right - activeRect.right);

		setClipPath(`inset(0px ${right}px 0px ${left}px)`);
		setUnderline({ left, width: activeRect.width });
		setHasMeasured(true);
	}, [activeIndex]);

	useLayoutEffect(() => {
		measureActiveTab();
	}, [measureActiveTab]);

	useEffect(() => {
		measureActiveTab();

		const track = trackRef.current;
		if (!track) return;

		const resizeObserver = new ResizeObserver(measureActiveTab);
		resizeObserver.observe(track);
		for (const link of linkRefs.current) {
			if (link) resizeObserver.observe(link);
		}

		document.fonts?.ready.then(measureActiveTab).catch(() => {
			// Font readiness is only a measurement refinement; layout still works
			// from the initial and ResizeObserver passes.
		});

		return () => resizeObserver.disconnect();
	}, [measureActiveTab]);

	return (
		<div className="hidden md:block border-b border-navy-frame dark:border-cyan-glow/[0.12]">
			<div className="max-w-6xl mx-auto px-4 md:px-8">
				<nav ref={trackRef} aria-label="Sections" className="relative flex flex-wrap items-center gap-x-8 gap-y-1">
					{SECTIONS.map((section, index) => {
						const active = section.match(pathname);
						return (
							<Link
								key={section.href}
								ref={(node) => {
									linkRefs.current[index] = node;
								}}
								href={section.href}
								aria-current={active ? "page" : undefined}
								className={cn(
									SECTION_LINK_CLASS,
									!hasMeasured && active ? ACTIVE_SECTION_CLASS : INACTIVE_SECTION_CLASS,
								)}
							>
								{section.label}
							</Link>
						);
					})}

					<div
						data-section-active-layer
						aria-hidden="true"
						className={cn(
							"pointer-events-none absolute inset-0 flex flex-wrap items-center gap-x-8 gap-y-1 overflow-hidden will-change-[clip-path] [transition:clip-path_220ms_cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none",
							hasMeasured ? "opacity-100" : "opacity-0",
						)}
						style={{ clipPath }}
					>
						{SECTIONS.map((section) => (
							<span key={section.href} className={cn(SECTION_LINK_CLASS, ACTIVE_TEXT_CLASS)}>
								{section.label}
							</span>
						))}
					</div>

					<span
						aria-hidden="true"
						className={cn(
							"pointer-events-none absolute bottom-[-1px] left-0 h-0.5 w-px origin-left bg-navy dark:bg-cyan-lifted [transition:transform_220ms_cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none",
							hasMeasured ? "opacity-100" : "opacity-0",
						)}
						style={{
							transform: `translateX(${underline.left}px) scaleX(${underline.width})`,
						}}
					/>
				</nav>
			</div>
		</div>
	);
}
