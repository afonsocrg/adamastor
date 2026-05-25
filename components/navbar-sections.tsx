"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
	{ label: "Articles", href: "/", match: (p: string) => p === "/" || p === "/posts" || p.startsWith("/posts/") },
	{ label: "Events", href: "/events", match: (p: string) => p.startsWith("/events") },
] as const;

export default function NavbarSections() {
	const pathname = usePathname() ?? "/";

	return (
		<div className="hidden md:block border-b border-navy-faded dark:border-[rgba(76,228,240,0.12)]">
			<div className="max-w-screen-xl mx-auto flex flex-wrap items-center gap-x-8 gap-y-1 px-8">
				{SECTIONS.map((section) => {
					const active = section.match(pathname);
					return (
						<Link
							key={section.href}
							href={section.href}
							aria-current={active ? "page" : undefined}
							className={`-mb-px border-b-2 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-colors ${
								active
									? "border-navy text-navy dark:border-[#E3F2F7] dark:text-[#E3F2F7]"
									: "border-transparent text-navy-pastel hover:text-navy dark:hover:text-[#E3F2F7]"
							}`}
						>
							{section.label}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
