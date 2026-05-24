import "@/styles/globals.css";
import "@/styles/prosemirror.css";
import "katex/dist/katex.min.css";

import { cal, crimson, crimsonBold, inconsolata, inconsolataBold, inter } from "@/styles/fonts";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";
import { PostHogProvider } from "./providers";

const title = "Adamastor — All Things Startup in Portugal";
const description =
	"Adamastor is a digital publication for all things startup in Portugal. A weekly digest on the Portuguese startup scene and an events calendar for founders, builders, and operators.";

export const metadata: Metadata = {
	title,
	description,
	openGraph: {
		title,
		description,
		images: [
			{
				url: "/socialPreview2.jpg",
				width: 1200,
				height: 630,
				alt: "Adamastor — A digital publication for all things startup in Portugal",
			},
		],
	},
	twitter: {
		title,
		description,
		card: "summary_large_image",
		images: ["/socialPreview2.jpg"],
	},
	// Advertise the RSS feed so browsers (and feed-discovery tools, RSS
	// readers' "find feed" features, etc.) can auto-detect it from any page.
	alternates: {
		types: {
			"application/rss+xml": [{ url: "/feed.xml", title: "Adamastor — Weekly Digest" }],
		},
	},
	metadataBase: new URL("https://adamastor.blog"),
};

export const viewport: Viewport = {
	themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${inter.variable} ${cal.variable} ${crimsonBold.variable} ${crimson.variable} ${inconsolata.variable} ${inconsolataBold.variable}`}
			suppressHydrationWarning
		>
			<body>
				<PostHogProvider>
					<Providers>{children}</Providers>
				</PostHogProvider>
			</body>
		</html>
	);
}
