"use client";

import { AlignLeft, CalendarDays } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect, useRef, useState } from "react";

function isArticlePath(pathname: string) {
	return pathname === "/" || pathname.startsWith("/posts");
}

export default function MobileTabBar() {
	const pathname = usePathname();
	const posthog = usePostHog();
	const [visible, setVisible] = useState(true);
	const lastScrollY = useRef(0);

	const isArticles = isArticlePath(pathname);
	const isEvents = pathname.startsWith("/events");
	const shouldRender = isArticles || isEvents;

	useEffect(() => {
		lastScrollY.current = window.scrollY;

		const onScroll = () => {
			const y = window.scrollY;
			if (Math.abs(y - lastScrollY.current) > 5) {
				setVisible(y < lastScrollY.current || y < 20);
			}
			lastScrollY.current = y;
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		setVisible(true);
		lastScrollY.current = 0;
	}, [pathname]);

	if (!shouldRender) {
		return null;
	}

	const handleTabSelect = (tab: "articles" | "events") => {
		posthog.capture("bottom_tab_selected", {
			tab,
			from_path: pathname,
			to_path: tab === "articles" ? "/" : "/events",
		});
	};

	return (
		<nav className={`mobile-tab-bar${visible ? "" : " mobile-tab-bar--hidden"}`} aria-label="Mobile navigation">
			<Link
				href="/"
				onClick={() => handleTabSelect("articles")}
				className={`mobile-tab-bar__tab${isArticles ? " mobile-tab-bar__tab--active" : ""}`}
				aria-current={isArticles ? "page" : undefined}
			>
				<AlignLeft size={22} strokeWidth={isArticles ? 2 : 1.5} />
				<span className="mobile-tab-bar__label">Articles</span>
			</Link>

			<Link
				href="/events"
				onClick={() => handleTabSelect("events")}
				className={`mobile-tab-bar__tab${isEvents ? " mobile-tab-bar__tab--active" : ""}`}
				aria-current={isEvents ? "page" : undefined}
			>
				<CalendarDays size={22} strokeWidth={isEvents ? 2 : 1.5} />
				<span className="mobile-tab-bar__label">Events</span>
			</Link>
		</nav>
	);
}
