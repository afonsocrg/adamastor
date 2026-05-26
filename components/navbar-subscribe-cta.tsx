"use client";

import { useUserProfile } from "@/hooks/use-user-profile";
import { isSubscribed } from "@/lib/user-identity";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavbarSubscribeCta() {
	const { profile } = useUserProfile();
	const pathname = usePathname();
	const [subscribed, setSubscribed] = useState(false);

	// Re-read the localStorage hint on every navigation. The navbar lives in
	// the layout so it doesn't unmount on client-side route changes; without
	// this hook the pill would linger until full reload after a successful
	// subscribe.
	useEffect(() => {
		setSubscribed(isSubscribed());
	}, [pathname]);

	if (profile) return null;
	if (subscribed) return null;

	return (
		<Link
			href="/subscribe"
			className="inline-flex items-center rounded-full bg-gold-hue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-shade"
		>
			Subscribe
			<ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
		</Link>
	);
}
