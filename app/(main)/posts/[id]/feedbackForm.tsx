"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const FormSchema = z.object({
	feedback: z.string().min(5, {
		message: "Note must be at least 5 characters.",
	}),
});

type FeedbackValues = z.infer<typeof FormSchema>;

export function FeedbackForm() {
	const form = useForm<FeedbackValues>({
		resolver: zodResolver(FormSchema),
		defaultValues: { feedback: "" },
	});

	function scrollToSubscribe() {
		const subscribeSection = document.querySelector<HTMLElement>("[data-subscribe-region]");
		if (subscribeSection) {
			subscribeSection.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}

	function onSubmit(data: FeedbackValues) {
		posthog.capture("feedback_submitted", {
			feedback_text: data.feedback,
			feedback_length: data.feedback.length,
			page_url: window.location.pathname,
			page_title: document.title,
			timestamp: new Date().toISOString(),
		});

		// Peak-end + foot-in-the-door: the reader just invested effort writing
		// a note. That's the maximum-commitment moment of the session. Surface
		// a subscribe escalation in the same beat — small ask after a larger
		// one, framed conversationally rather than transactionally.
		toast.success("Thanks for the note. Carlos reads every one.", {
			description: "While you’re here — get next Tuesday’s edition in your inbox.",
			action: {
				label: "Subscribe",
				onClick: scrollToSubscribe,
			},
		});

		form.reset({ feedback: "" });
	}

	return (
		<section className="border-t border-navy-frame pt-10">
			<p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-cyan-dim">
				Reader notes
			</p>
			<h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-navy dark:text-cyan-lifted [text-wrap:balance] md:text-[1.75rem]">
				Reply to this piece
			</h2>
			<p className="mt-3 max-w-[55ch] text-base leading-relaxed text-navy-tone dark:text-cyan-dim">
				Anonymous. Carlos reads every note that comes in.
			</p>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
					<FormField
						control={form.control}
						name="feedback"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="sr-only">Note</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Type your thoughts here…"
										className="resize-none h-32 leading-relaxed"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex justify-end">
						<Button
							type="submit"
							variant="outline"
							className="rounded-full border-navy px-6 font-semibold text-navy hover:bg-navy-wash dark:border-cyan-glow/40 dark:text-cyan-lifted"
						>
							Send note
						</Button>
					</div>
				</form>
			</Form>
		</section>
	);
}
