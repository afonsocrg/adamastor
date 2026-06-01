"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

export default function RouteTransitionFrame({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const hasMounted = useRef(false);
	const shouldAnimate = hasMounted.current;

	useEffect(() => {
		hasMounted.current = true;
	}, []);

	// This frame remounts its subtree whenever the key changes (that's how the
	// crossfade re-fires). Keying by the full pathname means EVERY navigation
	// tears down everything below — including nested layouts. The /events filter
	// matrix relies on its layout persisting across navigations (the city tab
	// row lives there and must not remount on each chip click), so collapse the
	// whole /events/* section to one stable key. Internal /events navigations
	// then run their own local crossfade (EventsLayoutShell) without nuking the
	// persistent chrome; entering /events from another section still fades.
	const isEventsSection = pathname === "/events" || pathname.startsWith("/events/");
	const transitionKey = isEventsSection ? "/events" : pathname;

	return (
		<div key={transitionKey} className={shouldAnimate ? "route-content-enter" : undefined}>
			{children}
		</div>
	);
}
