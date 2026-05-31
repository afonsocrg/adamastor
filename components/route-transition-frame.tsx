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

	return (
		<div key={pathname} className={shouldAnimate ? "route-content-enter" : undefined}>
			{children}
		</div>
	);
}
