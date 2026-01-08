"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Label } from "@/components/tailwind/ui/label";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Newsletter Dashboard
 *
 * A simple interface to test sending newsletters with articles.
 *
 * Flow:
 * 1. Enter a post ID (defaults to 147 for testing)
 * 2. Click "Send Test Email"
 * 3. API fetches the post, converts content, includes events
 * 4. Email sent to test address
 */
export default function NewsletterDashboard() {
	const [isLoading, setIsLoading] = useState(false);
	const [postId, setPostId] = useState("147"); // Default test post
	const [testEmail, setTestEmail] = useState("malik@hey.com");

	async function sendTestEmail() {
		// Validation
		if (!postId.trim()) {
			toast.error("Please enter a post ID");
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch("/api/sendNewsletter", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					postId: postId,
					testEmail: testEmail,
					weekLabel: "This Week",
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to send newsletter");
			}

			toast.success("Test email sent! 📧", {
				description: `"${result.postTitle}" sent to ${result.sentTo} with ${result.eventCount} events`,
			});
		} catch (error) {
			toast.error("Failed to send", {
				description: error instanceof Error ? error.message : "Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="max-w-xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Newsletter Dashboard</h1>
				<p className="text-muted-foreground mt-1">
					Send a test newsletter with a featured article and upcoming events.
				</p>
			</div>

			{/* Post ID Input */}
			<div className="space-y-2">
				<Label htmlFor="postId">Post ID</Label>
				<Input
					id="postId"
					type="text"
					placeholder="e.g., 147"
					value={postId}
					onChange={(e) => setPostId(e.target.value)}
				/>
				<p className="text-xs text-muted-foreground">
					The blog post to feature in the newsletter. Find IDs in the posts dashboard.
				</p>
			</div>

			{/* Test Email Input */}
			<div className="space-y-2">
				<Label htmlFor="testEmail">Send to</Label>
				<Input
					id="testEmail"
					type="email"
					placeholder="your@email.com"
					value={testEmail}
					onChange={(e) => setTestEmail(e.target.value)}
				/>
			</div>

			{/* Actions */}
			<div className="flex gap-3">
				<Button onClick={sendTestEmail} disabled={isLoading}>
					{isLoading ? "Sending..." : "Send Test Email"}
				</Button>
			</div>

			{/* Help Text */}
			<div className="rounded-lg bg-muted p-4 text-sm">
				<p className="font-medium mb-2">What happens when you send:</p>
				<ol className="list-decimal list-inside space-y-1 text-muted-foreground">
					<li>Gets the post from our Database.</li>
					<li>Converts the content to email HTML.</li>
					<li>Gets upcoming events (next 14 days).</li>
					<li>Renders the newsletter template.</li>
					<li>Sends via Resend to your test email.</li>
				</ol>
			</div>
		</div>
	);
}
