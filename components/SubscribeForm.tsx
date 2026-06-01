"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form";
import { Input } from "@/components/tailwind/ui/input";
import type { PostKind } from "@/lib/posts/kind";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const FormSchema = z.object({
	name: z.string().min(1, "Please enter your name."),
	email: z.string().email("Enter a valid email address."),
});

type FormValues = z.infer<typeof FormSchema>;

interface SubscribeFormProps {
	kind: PostKind;
}

function copyForKind(kind: PostKind): { heading: string; dek: string; stickyLabel: string } {
	if (kind === "weekly") {
		return {
			heading: "Subscribe to Adamastor Weekly",
			dek: "A weekly read on Portugal’s startup scene. The raises, the launches, and the stories behind them. Every Tuesday by Carlos Resende, who’s curated it since 2017.",
			stickyLabel: "Adamastor Weekly · Every Tuesday",
		};
	}
	return {
		heading: "Subscribe to Adamastor",
		dek: "A weekly read on Portugal’s startup scene — the raises, the launches, the hires — plus opinion from named voices in the ecosystem. Curated by Carlos Resende since 2017.",
		stickyLabel: "Adamastor",
	};
}

export function SubscribeForm({ kind }: SubscribeFormProps) {
	const { heading, dek, stickyLabel } = copyForKind(kind);
	const [done, setDone] = useState(false);
	const submitRowRef = useRef<HTMLDivElement>(null);
	const [submitVisible, setSubmitVisible] = useState(true);
	// Track the navbar's Subscribe pill independently. While the navbar pill is
	// visible at the top of the page, the sticky bar is redundant chrome — the
	// action is already one tap away. Sticky only earns its space once BOTH the
	// navbar pill AND the in-coda submit row have scrolled offscreen.
	const [navbarSubscribeVisible, setNavbarSubscribeVisible] = useState(true);

	const form = useForm<FormValues>({
		resolver: zodResolver(FormSchema),
		defaultValues: { name: "", email: "" },
	});

	// Unified visibility tracker. Both the in-coda submit row and the navbar
	// Subscribe pill drive the sticky bar's gating; re-query the navbar pill
	// each tick because it conditionally renders on auth state and may appear
	// or disappear after hydration (logged-in users → no pill).
	useEffect(() => {
		let ticking = false;

		const isInView = (el: HTMLElement) => {
			const r = el.getBoundingClientRect();
			return r.top < window.innerHeight && r.bottom > 0;
		};

		const recompute = () => {
			ticking = false;
			const submit = submitRowRef.current;
			if (submit) setSubmitVisible(isInView(submit));
			const navPill = document.querySelector<HTMLElement>("[data-navbar-subscribe-cta]");
			setNavbarSubscribeVisible(navPill ? isInView(navPill) : false);
		};

		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			queueMicrotask(recompute);
		};

		recompute();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, []);

	async function onSubmit(data: FormValues) {
		try {
			const response = await fetch("/api/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: data.name,
					email: data.email,
					pageUrl: window.location.pathname,
					pageTitle: document.title,
				}),
			});

			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Failed to subscribe");

			toast.success("Thanks for subscribing! 🙏", {
				description: "Check your email for a welcome message.",
			});
			setDone(true);
			form.reset({ name: "", email: "" });
		} catch (error) {
			toast.error("Subscription failed", {
				description: error instanceof Error ? error.message : "Please try again later.",
			});
		}
	}

	const showStickyBar = !submitVisible && !navbarSubscribeVisible && !done && !form.formState.isSubmitting;

	return (
		<>
			<section className="border-t border-navy-frame dark:border-navy-edge pt-10" data-subscribe-region>
				<p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-tone dark:text-navy-dim">Subscribe</p>
				<h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-navy dark:text-navy-lifted [text-wrap:balance] md:text-[1.75rem]">
					{heading}
				</h2>
				<p className="mt-3 max-w-[55ch] text-base leading-relaxed text-navy-tone dark:text-navy-dim">{dek}</p>

				{done ? (
					<div className="mt-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
						<p className="text-base font-medium text-navy dark:text-navy-lifted">
							You’re in. The next edition lands in your inbox.
						</p>
					</div>
				) : (
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
							<div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="sr-only">Name</FormLabel>
											<FormControl>
												<Input {...field} type="text" placeholder="Ana" className="h-11" autoComplete="given-name" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="sr-only">Email</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="email"
													placeholder="ana@yourstartup.pt"
													className="h-11"
													autoComplete="email"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div ref={submitRowRef} className="flex justify-end pt-1">
								<Button
									type="submit"
									disabled={form.formState.isSubmitting}
									className="rounded-full bg-gold-hue px-6 font-semibold text-white shadow-none hover:bg-gold-shade hover:text-white"
								>
									{form.formState.isSubmitting ? "Subscribing…" : "Subscribe"}
									<ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
								</Button>
							</div>
						</form>
					</Form>
				)}
			</section>

			{showStickyBar && (
				<section
					className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-frame dark:border-navy-edge bg-white/95 shadow-[0_-1px_4px_-2px_rgba(8,41,58,0.05)] backdrop-blur-sm motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300 motion-safe:ease-out dark:bg-navy-deep/90"
					aria-label="Subscribe"
				>
					<div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
						<p className="text-xs font-medium text-navy dark:text-navy-lifted">{stickyLabel}</p>
						<Button
							type="button"
							onClick={() => {
								submitRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
							}}
							className="rounded-full bg-gold-hue px-5 font-semibold text-white shadow-none hover:bg-gold-shade hover:text-white"
						>
							Subscribe
							<ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
						</Button>
					</div>
				</section>
			)}
		</>
	);
}
