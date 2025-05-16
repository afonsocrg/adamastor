"use client";
import { BlueskyIcon, FacebookIcon, LinkedInIcon, TwitterIcon } from "@/public/social";
import { Link } from "lucide-react";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./tailwind/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./tailwind/ui/hover-card";

export default function ShareWidget() {
  const [isCopied, setIsCopied] = useState(false);

  // Function to copy the current URL to clipboard
  const copyToClipboard = async () => {
    posthog.capture("shared_post", {
      share_method: "copy_link",
      page: window.location.pathname, // Page currently being shared
      //post_id: "",  // TODO: Get id from DB? @afonso
      post_title: encodeURIComponent(document.title), // TODO: Get title directly from DB? Also, get id instead? @afonso
    });
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
    const title = encodeURIComponent(document.title); // TODO: Get title directly from DB?

    posthog.capture("shared_post", {
      share_method: "social",
      trigger: "button",
      channel: platform,
      page: window.location.pathname, // Page currently being shared
      //post_id: "",  // TODO: Get id from DB? @afonso
      post_title: title, // TODO: Get title directly from DB? Also, get id instead? @afonso
    });

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
                <FacebookIcon />
                Share to Facebook
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start flex gap-2"
                onClick={() => shareToSocialMedia("linkedin")}
              >
                <LinkedInIcon />
                Share to LinkedIn
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start flex gap-2"
                onClick={() => shareToSocialMedia("bluesky")}
              >
                <BlueskyIcon />
                Share to Bluesky
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start flex gap-2"
                onClick={() => shareToSocialMedia("twitter")}
              >
                <TwitterIcon />
                Share to X
              </Button>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </>
  );
}
