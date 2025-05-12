"use client";
import { CatIcon, Link } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./tailwind/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./tailwind/ui/hover-card";

export default function ShareWidget() {
  const [isCopied, setIsCopied] = useState(false);

  // Function to copy the current URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);

      toast("URL Copied!");

      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast("Failed to copy");
    }
  };

  // Function to share to social media
  const shareToSocialMedia = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case "twitter": // X
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case "bluesky":
        shareUrl = `https://bsky.app/intent/compose?text=${url}`;
        break;
      default:
        return;
    }

    // Open a new window for sharing
    window.open(shareUrl, "_blank");
  };

  return (
    <>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline" className="rounded-lg">
            Share
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-48 p-0" sideOffset={10} align="start">
          <div className="flex gap-6 m-0">
            <div>
              <Button variant="ghost" className="w-full justify-start flex gap-2" onClick={copyToClipboard}>
                <Link className="mr-2 h-4 w-4 " />
                Copy URL
              </Button>
              <div className="border-b w-full" />
              <Button
                variant="ghost"
                className="w-full justify-start flex gap-2"
                onClick={() => shareToSocialMedia("facebook")}
              >
                <CatIcon className="mr-2 h-4 w-4 " />
                Share to Facebook
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start flex gap-2"
                onClick={() => shareToSocialMedia("linkedin")}
              >
                <CatIcon className="mr-2 h-4 w-4 " />
                Share to LinkedIn
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start flex gap-2"
                onClick={() => shareToSocialMedia("bluesky")}
              >
                <CatIcon className="mr-2 h-4 w-4 " />
                Share to Bluesky
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start flex gap-2"
                onClick={() => shareToSocialMedia("twitter")}
              >
                <CatIcon className="mr-2 h-4 w-4 " />
                Share to X
              </Button>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </>
  );
}
