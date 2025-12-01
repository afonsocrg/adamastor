"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/tailwind/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form";
import { Separator } from "@/components/tailwind/ui/separator";
import { Textarea } from "@/components/tailwind/ui/textarea";
import posthog from "posthog-js";

const FormSchema = z.object({
	feedback: z.string().min(5, {
		message: "Feedback must be at least 5 characters.",
	}),
});

export function FeedbackForm() {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	function onSubmit(data: z.infer<typeof FormSchema>) {
		// We're using PostHog. Might make sense to change later.
		posthog.capture("feedback_submitted", {
			feedback_text: data.feedback,
			feedback_length: data.feedback.length,
			page_url: window.location.pathname,
			page_title: document.title,
			timestamp: new Date().toISOString(),
		});

		// Show success message to user
		toast.success("Thanks for your feedback! 🙏", {
			description: "We really appreciate you taking the time to help us improve.",
		});

		// Reset the form after submission
		form.reset({
			feedback: "",
		});
	}

	return (
		<Form {...form}>
			<Separator />
			<div className="mb-10" />
			<div className="mb-10 space-y-2">
				<h2 className="scroll-m-20 text-lg text-primary/80 font-medium tracking-tight">Feedback</h2>
				<p className="text-muted-foreground">
					We'd love to hear your feedback about Adamastor. It will help us build a better platform for you.
				</p>
			</div>
			<form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 mb-20">
				<FormField
					control={form.control}
					name="feedback"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-muted-foreground">Feedback</FormLabel>
							<FormControl>
								<Textarea
									placeholder="What could be better?"
									className="resize-none h-36 px-5 py-4 rounded-xl"
									{...field}
								/>
							</FormControl>

							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="ml-auto mt-6 w-fit">
					<Button variant="outline" className="rounded-xl px-6 py-5" type="submit">
						Send Feedback
					</Button>
				</div>
			</form>
		</Form>
	);
}
