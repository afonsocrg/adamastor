"use client";

import { useUserProfile } from "@/hooks/use-user-profile";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export default function NavbarSubscribeCta() {
	const { profile } = useUserProfile();

	if (profile) return null;

	return (
		<Link
			href="/subscribe"
			className="inline-flex items-center rounded-full bg-gold-main px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-dark"
		>
			Subscribe
			<ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
		</Link>
	);
}
