"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";

import { ThemeProvider, useTheme } from "next-themes";
import { type Dispatch, type ReactNode, type SetStateAction, createContext } from "react";
import { Toaster } from "sonner";

import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { Suspense, useEffect } from "react";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

interface PostHogIdentifierProps {
	userId: string;
	userEmail?: string;
}

export const AppContext = createContext<{
	font: string;
	setFont: Dispatch<SetStateAction<string>>;
}>({
	font: "Default",
	setFont: () => {},
});

const ToasterProvider = () => {
	const { theme } = useTheme() as {
		theme: "light" | "dark" | "system";
	};
	return <Toaster theme={theme} />;
};

export default function Providers({ children }: { children: ReactNode }) {
	const [font, setFont] = useLocalStorage<string>("novel__font", "Default");

	return (
		<ThemeProvider attribute="class" enableSystem disableTransitionOnChange defaultTheme="system">
			<AppContext.Provider
				value={{
					font,
					setFont,
				}}
			>
				<ToasterProvider />
				{children}
			</AppContext.Provider>
		</ThemeProvider>
	);
}

export function PostHogIdentifier({ userId, userEmail }: PostHogIdentifierProps) {
	const posthog = usePostHog();

	useEffect(() => {
		if (userId && posthog) {
			// posthog.reset() used for debugging.
			posthog.identify(userId, {
				email: userEmail,
			});
			// console.log("PostHog reset and identified:", userId, userEmail); — Used for debugging.
		}
	}, [userId, userEmail, posthog]);

	return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
			api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
			person_profiles: "always",
			capture_pageview: false, // Disable automatic pageview capture, as we capture manually
		});
	}, []);

	return (
		<PHProvider client={posthog}>
			<SuspendedPostHogPageView />
			{children}
		</PHProvider>
	);
}

function PostHogPageView() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const posthog = usePostHog();

	// Track pageviews
	useEffect(() => {
		if (pathname && posthog) {
			let url = window.origin + pathname;
			if (searchParams.toString()) {
				// biome-ignore lint/style/useTemplate: <explanation>
				url = url + "?" + searchParams.toString();
			}

			posthog.capture("$pageview", { $current_url: url });
		}
	}, [pathname, searchParams, posthog]);

	return null;
}

// Wrap PostHogPageView in Suspense to avoid the useSearchParams usage above
// from de-opting the whole app into client-side rendering
// See: https://nextjs.org/docs/messages/deopted-into-client-rendering
function SuspendedPostHogPageView() {
	return (
		<Suspense fallback={null}>
			<PostHogPageView />
		</Suspense>
	);
}
