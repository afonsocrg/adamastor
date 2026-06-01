"use client";

import { getFirstNameForGreeting, getSavedIdentity } from "@/lib/user-identity";
import { useEffect, useState } from "react";

interface SubmitTitleProps {
	profileEmail: string | null;
}

export default function SubmitTitle({ profileEmail }: SubmitTitleProps) {
	const [firstName, setFirstName] = useState<string>("");

	// Mirrors the precedence rule in SubmitEventForm: don't personalize the
	// title from a saved identity that doesn't match the auth-locked email,
	// otherwise the H1 says "Submit your event, Joao" while the locked email
	// belongs to malik@hey.com — jarring and unclearable.
	useEffect(() => {
		const saved = getSavedIdentity();
		if (!saved) return;
		if (profileEmail && saved.email !== profileEmail) return;
		setFirstName(getFirstNameForGreeting(saved.name));
	}, [profileEmail]);

	return (
		<h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight text-navy [text-wrap:pretty] dark:text-navy-lifted [font-family:var(--font-lora-bold)]">
			{firstName ? `Submit your event, ${firstName}` : "Submit your event"}
		</h1>
	);
}
