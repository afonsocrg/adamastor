import "@/styles/globals.css";
import "@/styles/prosemirror.css";
import "katex/dist/katex.min.css";

import Navbar from "@/components/navbar";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";

const title = "Adamastor - All about Startups in Portugal";
const description = "All about Startups in Portugal";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
  twitter: {
    title,
    description,
    // card: "summary_large_image",
    // creator: "@steventey",
  },
  // metadataBase: new URL("https://novel.sh"),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div>
            <Navbar />
            <main className="max-w-screen-lg mx-auto p-4">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
