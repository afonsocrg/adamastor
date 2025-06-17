import "@/styles/globals.css";
import "@/styles/prosemirror.css";
import "katex/dist/katex.min.css";

import { 
  cal, 
  crimson, 
  crimsonBold, 
  inconsolata, 
  inconsolataBold, 
  inter 
} from "@/styles/fonts";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";
import { PostHogProvider } from "./providers";

const title = "Adamastor - All about Startups in Portugal";
const description = "All about Startups in Portugal";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [
      {
        url: "/socialPreview.jpg",
        width: 1200,
        height: 630,
        alt: "Adamastor - All about Startups in Portugal",
      },
    ],
  },
  twitter: {
    title,
    description,
    card: "summary_large_image",
    images: ["/socialPreview.jpg"],
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
          <Providers>
            {children}
          </Providers>
        </PostHogProvider>
      </body>
    </html>
  );
}