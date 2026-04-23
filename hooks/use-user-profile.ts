"use client";

import type { UserWithProfile } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function useUserProfile() {
	const [profile, setProfile] = useState<UserWithProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();
		let isMounted = true;

		const loadProfile = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!isMounted) {
				return;
			}

			if (!user) {
				setProfile(null);
				setIsLoading(false);
				return;
			}

			const { data: userProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

			if (!isMounted) {
				return;
			}

			setProfile(
				userProfile
					? {
							email: user.email,
							id: user.id,
							role: userProfile.role,
						}
					: null,
			);
			setIsLoading(false);
		};

		void loadProfile();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(() => {
			void loadProfile();
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	return { isLoading, profile };
}
