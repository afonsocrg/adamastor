"use client";
import { CatIcon, Link } from "lucide-react";
import { Button } from "./tailwind/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./tailwind/ui/hover-card";

export default function ShareWidget() {
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
              <Button variant="ghost" className="w-full justify-start flex gap-2">
                <Link className="mr-2 h-4 w-4 " />
                Copy URL
              </Button>
              <div className="border-b w-full" />
              <Button variant="ghost" className="w-full justify-start flex gap-2">
                <CatIcon className="mr-2 h-4 w-4 " />
                Share to Facebook
              </Button>
              <Button variant="ghost" className="w-full justify-start flex gap-2">
                <CatIcon className="mr-2 h-4 w-4 " />
                Share to LinkedIn
              </Button>
              <Button variant="ghost" className="w-full justify-start flex gap-2">
                <CatIcon className="mr-2 h-4 w-4 " />
                Share to Bluesky
              </Button>
              <Button variant="ghost" className="w-full justify-start flex gap-2">
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
