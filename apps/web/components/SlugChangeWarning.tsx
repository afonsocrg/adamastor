"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/tailwind/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface SlugChangeWarningProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  originalSlug: string;
  newSlug: string;
}

export function SlugChangeWarning({ 
  isOpen, 
  onOpenChange, 
  onConfirm,
  originalSlug,
  newSlug
}: SlugChangeWarningProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <AlertDialogTitle>Change URL Slug?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              You're about to change this post's URL slug from{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
                {originalSlug}
              </code>{" "}
              to{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
                {newSlug}
              </code>.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Warning:</strong> This will break any existing links to your post. 
                People who have bookmarked or shared the old URL will get a "Page Not Found" error.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p><strong>Current URL:</strong></p>
              <p className="text-muted-foreground font-mono text-xs break-all">
                https://adamastor.blog/posts/{originalSlug}
              </p>
              
              <p><strong>New URL:</strong></p>
              <p className="text-muted-foreground font-mono text-xs break-all">
                https://adamastor.blog/posts/{newSlug}
              </p>
            </div>

            <p className="text-sm">
              Are you sure you want to proceed with this change?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel>
            Keep Original Slug
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Change Slug Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}