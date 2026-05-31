import RouteTransitionFrame from "@/components/route-transition-frame";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
	return <RouteTransitionFrame>{children}</RouteTransitionFrame>;
}
