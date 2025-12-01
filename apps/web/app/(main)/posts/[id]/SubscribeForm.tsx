"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/tailwind/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form";
import { Input } from "@/components/tailwind/ui/input";

const FormSchema = z.object({
	name: z.string().min(1, "Please enter your name."),
	email: z.string().email("Enter a valid email address."),
});

export function SubscribeForm() {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			name: "",
			email: "",
		},
	});

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		try {
			const response = await fetch("/api/subscribe", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: data.name,
					email: data.email,
					pageUrl: window.location.pathname,
					pageTitle: document.title,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to subscribe");
			}

			toast.success("Thanks for subscribing! 🙏", {
				description: "Check your email for a welcome message.",
			});

			form.reset({
				name: "",
				email: "",
			});
		} catch (error) {
			toast.error("Subscription failed", {
				description: error instanceof Error ? error.message : "Please try again later.",
			});
		}
	}

	return (
		<Form {...form}>
			<div className="mb-10 space-y-2" />
			<form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
				<p className="text-muted-foreground text-lg">Join our mailing list and get updates every week</p>
				<div className="flex flex-col md:flex-row gap-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel className="sr-only">Name</FormLabel>
								<FormControl>
									<Input
										{...field}
										id={field.name}
										type="text"
										placeholder="Your name"
										className="px-5 py-4 rounded-xl"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel className="sr-only">Email</FormLabel>
								<FormControl>
									<Input
										{...field}
										id={field.name}
										type="email"
										placeholder="hi@adamastor.blog"
										className="px-5 py-4 rounded-xl"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<div className="ml-auto mt-6 w-fit">
					<Button
						variant="outline"
						className="rounded-xl px-6 py-5"
						type="submit"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting ? "Subscribing..." : "Subscribe"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
