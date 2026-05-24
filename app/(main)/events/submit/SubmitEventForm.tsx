"use client";

import type { MetadataResult } from "@/app/types";
import DateTimePickerField from "@/components/date-time-picker-field";
import { EventCategorySelector } from "@/components/event-category-selector";
import { Button } from "@/components/tailwind/ui/button";
import { Card, CardContent } from "@/components/tailwind/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form";
import { Input } from "@/components/tailwind/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Separator } from "@/components/tailwind/ui/separator";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { TurnstileWidget } from "@/components/turnstile-widget";
import {
	dateTimeStringWithNoTimezoneToTzDateString,
	tzDateStringToDateTimeStringWithNoTimezone,
} from "@/lib/datetime";
import { inferEventCategorySlugs, type EventCategorySlug } from "@/lib/events/categories";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const TIMEZONE = "Europe/Lisbon";

const formSchema = z.object({
	title: z.string().trim().min(3, "Title is required"),
	description: z.string().trim().min(20, "Please tell us a bit more about the event"),
	url: z.string().trim().min(1, "Event link is required").url("Please share a valid event link"),
	bannerUrl: z.string().url().optional().or(z.literal("")),
	startTime: z.string().min(1, "Start time is required"),
	city: z.string().min(1, "City is required"),
	categorySlugs: z.array(z.string()),
	submitterName: z.string().trim().min(1, "Name is required"),
	submitterEmail: z.string().trim().email("Please share a valid email"),
	// Honeypot — must stay empty, but we don't surface an error so bots can't
	// learn they were caught. The API mirrors this and silently 200s on hit.
	website: z.string().optional(),
});

type SubmitFormValues = z.infer<typeof formSchema>;

interface SubmitEventFormProps {
	initialSubmitterEmail: string;
	emailIsLocked: boolean;
	turnstileSiteKey: string | null;
}

async function scrapeUrl(url: string): Promise<{ data?: MetadataResult; error?: string }> {
	try {
		const response = await fetch("/api/scrape", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ url }),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return { error: errorData.error || "We couldn't read that page." };
		}

		const result = await response.json();
		return { data: result.data };
	} catch {
		return { error: "We couldn't reach that page. Please check the URL." };
	}
}

function isValidHttpUrl(value: string) {
	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

export default function SubmitEventForm({ initialSubmitterEmail, emailIsLocked, turnstileSiteKey }: SubmitEventFormProps) {
	const [isScraping, setIsScraping] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [turnstileToken, setTurnstileToken] = useState("");
	const [submissionState, setSubmissionState] = useState<
		{ kind: "idle" } | { kind: "success"; title: string } | { kind: "duplicate"; message: string }
	>({ kind: "idle" });
	// The scrape's cascade of setValue calls touches a lot of fields. Marking
	// it as a transition lets React keep the UI responsive (e.g. the user
	// typing into the name field) instead of jank-scrolling while everything
	// re-renders.
	const [, startScrapeTransition] = useTransition();

	const form = useForm<SubmitFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
			url: "",
			bannerUrl: "",
			startTime: "",
			city: "",
			categorySlugs: [],
			submitterName: "",
			submitterEmail: initialSubmitterEmail,
			website: "",
		},
	});

	const handleScrape = async (overrideUrl?: string) => {
		const candidate = (overrideUrl ?? form.getValues("url")).trim();
		if (!isValidHttpUrl(candidate)) {
			toast.error("Please paste a valid event link first.");
			return;
		}

		// Keep the visible field in sync if the caller passed a URL directly
		// (clipboard auto-paste path). Without this, the form field would stay
		// empty even though the scrape ran on a real URL.
		if (overrideUrl) {
			form.setValue("url", candidate, { shouldDirty: true, shouldValidate: true });
		}

		setIsScraping(true);
		try {
			const result = await scrapeUrl(candidate);
			if (result.error) {
				toast.error(`${result.error} You can still fill the form manually below.`);
				return;
			}

			const scraped = result.data;
			if (!scraped) {
				toast.error("We couldn't find event details on that page.");
				return;
			}

			const currentValues = form.getValues();
			const inferredCategories = inferEventCategorySlugs({
				title: scraped.title ?? currentValues.title,
				description: scraped.description ?? currentValues.description,
				url: scraped.url ?? candidate,
			});

			startScrapeTransition(() => {
				form.setValue("title", scraped.title ?? currentValues.title, { shouldDirty: true, shouldValidate: true });
				form.setValue("description", scraped.description ?? currentValues.description, {
					shouldDirty: true,
					shouldValidate: true,
				});
				// The scrape may normalise the URL (add trailing slash, etc) —
				// keep whatever it returns so the link matches what was parsed.
				if (scraped.url) {
					form.setValue("url", scraped.url, { shouldDirty: true, shouldValidate: true });
				}
				form.setValue("bannerUrl", scraped.bannerUrl ?? currentValues.bannerUrl, { shouldDirty: true });
				if (scraped.startTime) {
					form.setValue(
						"startTime",
						tzDateStringToDateTimeStringWithNoTimezone(scraped.startTime, TIMEZONE),
						{ shouldDirty: true, shouldValidate: true },
					);
				}
				if (scraped.city) {
					form.setValue("city", scraped.city, { shouldDirty: true, shouldValidate: true });
				}
				if (inferredCategories.length > 0 && currentValues.categorySlugs.length === 0) {
					form.setValue("categorySlugs", inferredCategories, { shouldDirty: true });
				}
			});

			toast.success("Event details loaded — review the form and submit when ready.");
		} catch (error) {
			console.error("Scrape failed", error);
			toast.error("Something went wrong. You can fill the form manually below.");
		} finally {
			setIsScraping(false);
		}
	};

	const handleSubmit = async (values: SubmitFormValues) => {
		// When Turnstile is configured we require a token; when it's not
		// configured (dev mode), we skip the check entirely.
		if (turnstileSiteKey && !turnstileToken) {
			toast.error("Please complete the spam check before submitting.");
			return;
		}

		setIsSubmitting(true);
		setSubmissionState({ kind: "idle" });

		try {
			const utcStartTime = dateTimeStringWithNoTimezoneToTzDateString(values.startTime, TIMEZONE);

			const response = await fetch("/api/events/submissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: values.title,
					description: values.description,
					start_time: utcStartTime,
					city: values.city,
					url: values.url,
					bannerUrl: values.bannerUrl,
					categorySlugs: values.categorySlugs,
					submitterName: values.submitterName,
					submitterEmail: values.submitterEmail,
					turnstileToken,
					website: values.website,
				}),
			});

			if (response.status === 409) {
				const payload = await response.json().catch(() => ({}));
				const message: string = payload.error ?? "This event is already on Adamastor.";
				setSubmissionState({ kind: "duplicate", message });
				toast.error(message);
				return;
			}

			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				throw new Error(payload.error ?? "Submission failed");
			}

			setSubmissionState({ kind: "success", title: values.title });
			toast.success("Thanks — we've got your submission!");
			form.reset({
				title: "",
				description: "",
				url: "",
				bannerUrl: "",
				startTime: "",
				city: "",
				categorySlugs: [],
				submitterName: "",
				submitterEmail: initialSubmitterEmail,
				website: "",
			});
			setTurnstileToken("");
		} catch (error) {
			const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (submissionState.kind === "success") {
		return (
			<Card className="rounded-xl">
				<CardContent className="flex flex-col items-start gap-4 p-8">
					<CheckCircle2 className="h-10 w-10 text-[#04C9D8]" />
					<div className="space-y-2">
						<h2 className="text-xl font-semibold text-[#104357] dark:text-[#E3F2F7]">
							Thanks — we got "{submissionState.title}"
						</h2>
						<p className="text-base leading-relaxed text-muted-foreground">
							We'll review it shortly and email you back. You can submit another event if you have more coming up.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						onClick={() => setSubmissionState({ kind: "idle" })}
						className="rounded-lg"
					>
						Submit another event
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="rounded-xl">
			<CardContent className="p-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="url"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Event link</FormLabel>
									<div className="flex flex-col gap-2 sm:flex-row">
										<FormControl>
											<Input
												placeholder="https://lu.ma/your-event"
												{...field}
												disabled={isScraping || isSubmitting}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														handleScrape();
													}
												}}
												onClick={async () => {
													// Auto-paste + auto-scrape on first click into an empty field.
													// Guarded by `field.value.trim().length === 0` so re-clicking
													// the field to edit an existing URL doesn't clobber it with
													// whatever's in the clipboard. Mirrors the admin add-event
													// affordance but takes it one step further by firing the
													// scrape immediately when a valid http(s) URL lands.
													if (field.value.trim().length > 0 || isScraping || isSubmitting) {
														return;
													}
													try {
														const text = await navigator.clipboard.readText();
														if (text && isValidHttpUrl(text.trim())) {
															await handleScrape(text.trim());
														}
													} catch {
														// Clipboard access denied or unavailable — silent fallback
														// (user can still type / paste manually). No toast, this
														// is a convenience affordance, not a required path.
													}
												}}
												className="flex-1"
											/>
										</FormControl>
										<Button
											type="button"
											variant="outline"
											onClick={() => handleScrape()}
											disabled={isScraping || isSubmitting || field.value.trim().length === 0}
											className="rounded-lg"
										>
											{isScraping ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
													Loading…
												</>
											) : (
												"Fill from event link"
											)}
										</Button>
									</div>
									<FormDescription>
										Paste your event page (Luma, Eventbrite, your own site...) and we'll try to fill in the rest.
										You can also fill the form manually.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Separator />

						{isScraping ? <ScrapeSkeleton /> : (
							<>
								<FormField
									control={form.control}
									name="title"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Event title</FormLabel>
											<FormControl>
												<Input placeholder="e.g. Lisbon AI Builders #12" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Who's it for? What will happen? Why should people come?"
													className="min-h-[140px]"
													{...field}
												/>
											</FormControl>
											<FormDescription>A short paragraph or two is perfect.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="startTime"
										render={({ field }) => (
											<FormItem className="flex flex-col">
												<DateTimePickerField
													value={field.value}
													onChange={field.onChange}
													label="Start time (Europe/Lisbon)"
													placeholder="Select date and time"
												/>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="city"
										render={({ field }) => (
											<FormItem className="flex flex-col">
												<FormLabel>City</FormLabel>
												<FormControl>
													<Select value={field.value} onValueChange={field.onChange}>
														<SelectTrigger>
															<SelectValue placeholder="Pick a city" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="lisboa">Lisboa</SelectItem>
															<SelectItem value="porto">Porto</SelectItem>
															<SelectItem value="online">Online</SelectItem>
															<Separator />
															<SelectItem value="algarve">Algarve</SelectItem>
															<SelectItem value="aveiro">Aveiro</SelectItem>
															<SelectItem value="braga">Braga</SelectItem>
															<SelectItem value="coimbra">Coimbra</SelectItem>
															<SelectItem value="guimaraes">Guimarães</SelectItem>
															<SelectItem value="leiria">Leiria</SelectItem>
															<SelectItem value="viseu">Viseu</SelectItem>
														</SelectContent>
													</Select>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="categorySlugs"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Categories</FormLabel>
											<FormControl>
												<EventCategorySelector
													value={field.value as EventCategorySlug[]}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormDescription>
												Pick one or more that fit. Helps the right people find your event.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</>
						)}

						<Separator />

						<div className="space-y-1">
							<h3 className="text-sm font-semibold text-[#104357] dark:text-[#E3F2F7]">Your details</h3>
							<p className="text-sm text-muted-foreground">
								So we can reach out if we need any clarifications.
							</p>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="submitterName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input placeholder="Your name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="submitterEmail"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												type="email"
												autoComplete="email"
												inputMode="email"
												spellCheck={false}
												placeholder="you@example.com"
												readOnly={emailIsLocked}
												className={emailIsLocked ? "bg-muted" : undefined}
												{...field}
											/>
										</FormControl>
										{emailIsLocked ? (
											<FormDescription>Using the email on your Adamastor account.</FormDescription>
										) : null}
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Honeypot — hidden from real users and screen readers */}
						<div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
							<label htmlFor="website">
								Website (leave empty)
								<input
									id="website"
									type="text"
									tabIndex={-1}
									autoComplete="off"
									{...form.register("website")}
								/>
							</label>
						</div>

						{turnstileSiteKey ? (
							<div>
								<TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
							</div>
						) : null}

						{submissionState.kind === "duplicate" ? (
							<div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
								{submissionState.message}
							</div>
						) : null}

						<div className="flex justify-end">
							<Button
								type="submit"
								disabled={isSubmitting || isScraping}
								className="rounded-lg bg-[#d4a657] hover:bg-[#d4a657]/90"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
										Submitting…
									</>
								) : (
									"Submit event"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

/**
 * Skeleton placeholders shown while a scrape is in flight. Matches the
 * heights of the real fields so the form doesn't jump when results land.
 */
function ScrapeSkeleton() {
	return (
		<div className="space-y-6" aria-busy="true" aria-live="polite">
			<div className="space-y-2">
				<Skeleton className="h-4 w-20" />
				<Skeleton className="h-10 w-full" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-[140px] w-full" />
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Skeleton className="h-4 w-40" />
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-10 w-full" />
				</div>
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-10 w-full" />
			</div>
			<p className="text-sm text-muted-foreground">Reading your event page…</p>
		</div>
	);
}
