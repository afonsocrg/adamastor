"use client";

import type { MetadataResult } from "@/app/types";
import DateTimePickerField from "@/components/date-time-picker-field";
import { EventCategorySelector } from "@/components/event-category-selector";
import { Button } from "@/components/tailwind/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/tailwind/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form";
import { Input } from "@/components/tailwind/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Separator } from "@/components/tailwind/ui/separator";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { dateTimeStringWithNoTimezoneToTzDateString, tzDateStringToDateTimeStringWithNoTimezone } from "@/lib/datetime";
import { type EventCategorySlug, inferEventCategorySlugs } from "@/lib/events/categories";
import type { EventDuplicateCandidate } from "@/lib/events/duplicate-detection";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { detectCityFromText } from "./city-mappings";

const TIMEZONE = "Europe/Lisbon";

const urlFormSchema = z.object({
	url: z.string().url("Please enter a valid URL"),
});

const formSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		description: z.string().min(1, "Description is required"),
		url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
		bannerUrl: z.string().url("Please enter a valid banner URL").optional().or(z.literal("")),
		startTime: z.string().min(1, "Start time is required"),
		endTime: z.string().optional().or(z.literal("")),
		city: z.string().min(1, "City is required"),
		categorySlugs: z.array(z.string()),
	})
	.refine((data) => !data.endTime || data.endTime > data.startTime, {
		message: "End time must be after start time",
		path: ["endTime"],
	});

const defaultEventFormValues = {
	title: "",
	description: "",
	url: "",
	bannerUrl: "",
	startTime: "",
	endTime: "",
	city: "",
	categorySlugs: [],
};

type EventFormValues = z.infer<typeof formSchema>;

interface DuplicateReview {
	candidates: EventDuplicateCandidate[];
	severity: "block" | "warning";
	values: EventFormValues;
}

// Server action for scraping URLs
async function scrapeUrl(url: string): Promise<{ data?: MetadataResult; error?: string }> {
	try {
		const response = await fetch("/api/scrape", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ url }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			return {
				error: errorData.error || `Failed to fetch URL: ${response.statusText}`,
			};
		}

		const result = await response.json();
		return { data: result.data };
	} catch (error) {
		console.error("Error in scrapeUrl:", error);
		return { error: "An unexpected error occurred" };
	}
}

export default function AddEventForm() {
	const [isScraping, setIsScraping] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
	const [duplicateCheckRevision, setDuplicateCheckRevision] = useState(0);
	const [duplicateReview, setDuplicateReview] = useState<DuplicateReview | null>(null);
	const [hasManuallyEditedCategories, setHasManuallyEditedCategories] = useState(false);

	const eventForm = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),

		defaultValues: defaultEventFormValues,
	});

	const urlForm = useForm<z.infer<typeof urlFormSchema>>({
		resolver: zodResolver(urlFormSchema),
		defaultValues: { url: "" },
	});

	// Watch all form fields for the disabled state
	const urlValue = urlForm.watch("url");
	const formValues = eventForm.watch();

	// Check if the event form is valid
	const isEventFormValid = formValues.title && formValues.description && formValues.startTime && formValues.city;

	const checkDuplicateReview = useCallback(async (values: EventFormValues, signal?: AbortSignal) => {
		if (!(values.title && values.description && values.startTime && values.city)) {
			setDuplicateReview(null);
			return;
		}

		const utcDateTime = dateTimeStringWithNoTimezoneToTzDateString(values.startTime, TIMEZONE);
		const response = await fetch("/api/events/duplicates", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				title: values.title,
				description: values.description,
				start_time: utcDateTime,
				city: values.city,
				url: values.url,
			}),
			signal,
		});

		if (!response.ok) {
			setDuplicateReview(null);
			return;
		}

		const duplicateData = await response.json();
		if (duplicateData.duplicateCandidates?.length > 0) {
			setDuplicateReview({
				candidates: duplicateData.duplicateCandidates,
				severity: duplicateData.severity === "block" ? "block" : "warning",
				values,
			});
		} else {
			setDuplicateReview(null);
		}
	}, []);

	const duplicateCheckKey = [
		formValues.title,
		formValues.description,
		formValues.startTime,
		formValues.city,
		formValues.url,
		formValues.categorySlugs.join(","),
		duplicateCheckRevision,
	].join("|");

	useEffect(() => {
		if (hasManuallyEditedCategories) return;

		const inferredCategorySlugs = inferEventCategorySlugs({
			title: formValues.title,
			description: formValues.description,
			url: formValues.url,
		});

		if (inferredCategorySlugs.length === 0) return;

		const currentCategorySlugs = eventForm.getValues("categorySlugs");
		if (currentCategorySlugs.join("|") === inferredCategorySlugs.join("|")) return;

		eventForm.setValue("categorySlugs", inferredCategorySlugs, {
			shouldDirty: true,
			shouldValidate: true,
		});
	}, [eventForm, formValues.description, formValues.title, formValues.url, hasManuallyEditedCategories]);

	useEffect(() => {
		if (!isEventFormValid) {
			setDuplicateReview(null);
			setIsCheckingDuplicates(false);
			return;
		}

		const controller = new AbortController();
		setDuplicateReview(null);
		const timeoutId = window.setTimeout(async () => {
			setIsCheckingDuplicates(true);

			try {
				const values = eventForm.getValues();
				await checkDuplicateReview(values, controller.signal);
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") return;
				setDuplicateReview(null);
			} finally {
				if (!controller.signal.aborted) {
					setIsCheckingDuplicates(false);
				}
			}
		}, 600);

		return () => {
			controller.abort();
			window.clearTimeout(timeoutId);
		};
	}, [checkDuplicateReview, duplicateCheckKey, eventForm, isEventFormValid]);

	const handleUrlSubmit = async (values: { url: string }) => {
		setIsScraping(true);
		setDuplicateReview(null);
		eventForm.setValue("url", values.url, { shouldValidate: true, shouldDirty: true });

		try {
			const result = await scrapeUrl(values.url);

			if (result.error) {
				toast.error(`${result.error} You can still finish the event manually.`);
			} else if (result.data) {
				const { title, description, url, bannerUrl, startTime, endTime, city } = result.data;
				const currentValues = eventForm.getValues();

				// Animate form population
				eventForm.setValue("title", title ?? currentValues.title);
				await new Promise((resolve) => setTimeout(resolve, 50));
				eventForm.setValue("description", description ?? currentValues.description);
				await new Promise((resolve) => setTimeout(resolve, 50));
				eventForm.setValue("url", url ?? values.url, { shouldValidate: true });
				await new Promise((resolve) => setTimeout(resolve, 50));
				eventForm.setValue("bannerUrl", bannerUrl ?? currentValues.bannerUrl, { shouldValidate: true });
				await new Promise((resolve) => setTimeout(resolve, 50));
				eventForm.setValue(
					"startTime",
					startTime ? tzDateStringToDateTimeStringWithNoTimezone(startTime, TIMEZONE) : currentValues.startTime,
				);
				if (endTime) {
					eventForm.setValue("endTime", tzDateStringToDateTimeStringWithNoTimezone(endTime, TIMEZONE), {
						shouldValidate: true,
					});
				}
				await new Promise((resolve) => setTimeout(resolve, 50));
				eventForm.setValue("city", city ?? currentValues.city);
				const inferredCategorySlugs = inferEventCategorySlugs({
					title: title ?? currentValues.title,
					description: description ?? currentValues.description,
					url: url ?? values.url,
				});
				if (!hasManuallyEditedCategories && inferredCategorySlugs.length > 0) {
					eventForm.setValue("categorySlugs", inferredCategorySlugs, {
						shouldDirty: true,
						shouldValidate: true,
					});
				}
				setDuplicateCheckRevision((revision) => revision + 1);
				setIsCheckingDuplicates(true);
				await checkDuplicateReview(eventForm.getValues());

				toast.success("Event data loaded. Review it and create the event when ready.");
			}
		} catch (_error) {
			toast.error("Failed to scrape URL. You can still fill the event details manually.");
		} finally {
			setIsCheckingDuplicates(false);
		}
		setIsScraping(false);
	};

	const submitEvent = async (values: EventFormValues, allowPotentialDuplicate = false) => {
		const { title, description, startTime, endTime, city, url, bannerUrl, categorySlugs } = values;
		const utcDateTime = dateTimeStringWithNoTimezoneToTzDateString(startTime, TIMEZONE);
		const utcEndTime = endTime ? dateTimeStringWithNoTimezoneToTzDateString(endTime, TIMEZONE) : null;

		return fetch("/api/events", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				title,
				description,
				start_time: utcDateTime,
				end_time: utcEndTime,
				city,
				url,
				bannerUrl,
				categorySlugs,
				allowPotentialDuplicate,
			}),
		});
	};

	const handleEventSubmit = async (values: EventFormValues) => {
		setIsSubmitting(true);
		setDuplicateReview(null);

		try {
			const response = await submitEvent(values);

			if (response.status === 409) {
				const duplicateData = await response.json();
				setDuplicateReview({
					candidates: duplicateData.duplicateCandidates || [],
					severity: duplicateData.severity === "block" ? "block" : "warning",
					values,
				});
				toast.error(
					duplicateData.severity === "block"
						? "This event already appears to be published."
						: "Review this possible duplicate before creating the event.",
				);
				return;
			}

			if (!response.ok) {
				throw new Error("Failed to create event");
			}

			// Reset form after successful submission
			eventForm.reset();
			urlForm.reset();
			setHasManuallyEditedCategories(false);
			toast.success("Event created successfully");
		} catch (_err) {
			toast.error("Failed to create event");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCreateAnyway = async () => {
		if (!duplicateReview || duplicateReview.severity === "block") return;

		setIsSubmitting(true);

		try {
			const response = await submitEvent(duplicateReview.values, true);

			if (!response.ok) {
				throw new Error("Failed to create event");
			}

			eventForm.reset();
			urlForm.reset();
			setHasManuallyEditedCategories(false);
			setDuplicateReview(null);
			toast.success("Event created successfully");
		} catch (_err) {
			toast.error("Failed to create event");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className={cn("container p-6 animate-fade-in")}>
			<h2 className="text-xl font-semibold text-[#104357] dark:text-navy-lifted flex gap-2 items-center mb-6">
				Add Event to the Agenda
			</h2>

			<div className="space-y-8">
				{/* URL Form Section */}
				<div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-150">
					<Form {...urlForm}>
						<form onSubmit={urlForm.handleSubmit(handleUrlSubmit)} className="space-y-4">
							<div className="flex space-x-2 w-full md:w-8/12">
								<FormField
									control={urlForm.control}
									name="url"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormControl>
												<Input
													placeholder="https://link-to-event-page.com"
													{...field}
													onClick={async () => {
														try {
															const text = await navigator.clipboard.readText();
															if (text?.startsWith("http")) {
																field.onChange(text);
															}
														} catch (err) {
															toast.error("Failed to read clipboard");
															console.error("Clipboard read failed:", err);
														}
													}}
													className="transition-all duration-200 rounded-xl"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button
									type="submit"
									variant="outline"
									className="rounded-lg transition-all duration-200"
									disabled={isScraping || !urlValue}
								>
									{isScraping ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
											Scraping…
										</>
									) : (
										"Get Event Data"
									)}
								</Button>
							</div>
							<p className="text-sm text-muted-foreground">
								Paste an event link to prefill the form, or complete the fields manually below.
							</p>
						</form>
					</Form>
				</div>

				{/* Event Details Form and Preview */}
				<div
					className={cn(
						"grid grid-cols-1 md:grid-cols-2 gap-4",
						"animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
					)}
				>
					<div className="w-full animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-200">
						<Card className="p-4 gap-4 flex flex-col h-full transition-all duration-200 rounded-xl">
							{isScraping ? (
								<div className="space-y-4">
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-24 w-full" />
									<div className="grid grid-cols-2 gap-4">
										<Skeleton className="h-10 w-full" />
										<Skeleton className="h-10 w-full" />
									</div>
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-24 ml-auto" />
								</div>
							) : (
								<EventDetailsForm
									form={eventForm}
									isSubmitting={isSubmitting}
									isCheckingDuplicates={isCheckingDuplicates}
									handleEventSubmit={handleEventSubmit}
									handleCreateAnyway={handleCreateAnyway}
									isFormValid={!!isEventFormValid}
									duplicateReview={duplicateReview}
									onManualCategoryChange={() => setHasManuallyEditedCategories(true)}
								/>
							)}
						</Card>
					</div>
					<div className="w-full animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-300">
						<EventPreview
							title={formValues.title}
							description={formValues.description}
							url={formValues.url}
							bannerUrl={formValues.bannerUrl}
						/>
					</div>
				</div>
			</div>
		</main>
	);
}

interface EventDetailsFormProps {
	form: UseFormReturn<EventFormValues>;
	isSubmitting: boolean;
	isCheckingDuplicates: boolean;
	handleEventSubmit: (values: EventFormValues) => void;
	handleCreateAnyway: () => void;
	isFormValid: boolean;
	duplicateReview: DuplicateReview | null;
	onManualCategoryChange: () => void;
}

function EventDetailsForm({
	form,
	isSubmitting,
	isCheckingDuplicates,
	handleEventSubmit,
	handleCreateAnyway,
	isFormValid,
	duplicateReview,
	onManualCategoryChange,
}: EventDetailsFormProps) {
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleEventSubmit)} className="space-y-4">
				<section className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-100">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => {
							// Check for the full Meetup date pattern
							const meetupDatePattern =
								/,\s*\w{3},\s*\w{3}\s+\d{1,2},\s*\d{4},\s*\d{1,2}:\d{2}\s*(AM|PM)\s*\|\s*Meetup/;
							const hasMeetupDatePattern = meetupDatePattern.test(field.value);

							// Check for just "| Meetup" (in case it appears without the date)
							const hasJustMeetup = !hasMeetupDatePattern && field.value.includes("| Meetup");

							return (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input placeholder="Event Title..." {...field} className="transition-all duration-200" />
									</FormControl>

									{hasMeetupDatePattern && (
										<button
											type="button"
											className="bg-navy-veil text-navy-bright dark:bg-navy-tint/[0.1] dark:text-navy-bright-dark p-2 rounded-xl animate-in underline underline-offset-2 cursor-pointer"
											onClick={() => {
												const cleanedValue = field.value.replace(meetupDatePattern, "").trim();
												field.onChange(cleanedValue);
											}}
										>
											Remove date and "| Meetup" suffix?
										</button>
									)}

									{hasJustMeetup && (
										<button
											type="button"
											className="bg-navy-veil text-navy-bright dark:bg-navy-tint/[0.1] dark:text-navy-bright-dark p-2 rounded-xl animate-in underline underline-offset-2 cursor-pointer"
											onClick={() => {
												const cleanedValue = field.value.replace(/\|\s*Meetup/g, "").trim();
												field.onChange(cleanedValue);
											}}
										>
											Remove "| Meetup" suffix?
										</button>
									)}

									<FormMessage />
								</FormItem>
							);
						}}
					/>
				</section>

				<section className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-200">
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Event Description..."
										{...field}
										className="transition-all duration-200 min-h-[100px]"
									/>
								</FormControl>
								{field.value.includes("*") && (
									<button
										type="button"
										className="bg-navy-veil text-navy-bright dark:bg-navy-tint/[0.1] dark:text-navy-bright-dark p-2 rounded-xl animate-in underline underline-offset-2 cursor-pointer"
										onClick={() => {
											// Remove all asterisks from the value
											const cleanedValue = field.value.replace(/\*/g, "");
											field.onChange(cleanedValue);
										}}
									>
										Is the asterisk (*) intentional? Click here to remove it.
									</button>
								)}

								<FormMessage />
							</FormItem>
						)}
					/>
				</section>

				<section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-250">
					<FormField
						control={form.control}
						name="url"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Event URL</FormLabel>
								<FormControl>
									<Input placeholder="https://event-page.com" {...field} className="transition-all duration-200" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="bannerUrl"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Banner URL</FormLabel>
								<FormControl>
									<Input
										placeholder="https://image-host.com/banner.jpg"
										{...field}
										className="transition-all duration-200"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</section>

				<section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-300">
					<FormField
						control={form.control}
						name="startTime"
						render={({ field }) => {
							return (
								<FormItem className="flex flex-col">
									<DateTimePickerField
										value={field.value}
										onChange={field.onChange}
										label="Start Time (Europe/Lisbon)"
										placeholder="Select date and time"
										disabled={field.disabled}
									/>
									<FormMessage />
								</FormItem>
							);
						}}
					/>

					<FormField
						control={form.control}
						name="endTime"
						render={({ field }) => (
							<FormItem className="flex flex-col">
								<DateTimePickerField
									value={field.value ?? ""}
									onChange={field.onChange}
									label="End time (optional)"
									placeholder="Leave blank if unknown"
									disabled={field.disabled}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="city"
						render={({ field }) => {
							// Check if there's a city in the title
							const titleValue = form.watch("title");
							const detectedCity = detectCityFromText(titleValue);
							const showCityHelper = detectedCity && field.value !== detectedCity.value;

							return (
								<FormItem className="flex flex-col">
									<FormLabel>City</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className="transition-all duration-200">
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

									{showCityHelper && (
										<button
											type="button"
											className="bg-navy-veil text-navy-bright dark:bg-navy-tint/[0.1] dark:text-navy-bright-dark p-2 rounded-xl animate-in underline underline-offset-2 cursor-pointer mt-2"
											onClick={() => {
												field.onChange(detectedCity.value);
											}}
										>
											Set "{detectedCity.display}" as city.
										</button>
									)}

									<FormMessage />
								</FormItem>
							);
						}}
					/>
				</section>

				<section className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-350">
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
										onManualChange={onManualCategoryChange}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</section>

				<div className="flex justify-end animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-400">
					<Button
						type="submit"
						disabled={isSubmitting || isCheckingDuplicates || !isFormValid || duplicateReview !== null}
						className="transition-all duration-200 rounded-lg bg-[#d4a657] hover:bg-[#d4a657]/90"
					>
						{isSubmitting || isCheckingDuplicates ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{isCheckingDuplicates ? "Checking duplicates..." : "Creating Event..."}
							</>
						) : (
							"Create Event"
						)}
					</Button>
				</div>

				{duplicateReview ? (
					<DuplicateReviewPanel
						duplicateReview={duplicateReview}
						isSubmitting={isSubmitting}
						onCreateAnyway={handleCreateAnyway}
					/>
				) : null}
			</form>
		</Form>
	);
}

function DuplicateReviewPanel({
	duplicateReview,
	isSubmitting,
	onCreateAnyway,
}: {
	duplicateReview: DuplicateReview;
	isSubmitting: boolean;
	onCreateAnyway: () => void;
}) {
	const isBlocked = duplicateReview.severity === "block";

	return (
		<section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
			<div className="flex items-start gap-3">
				<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
				<div className="min-w-0 flex-1 space-y-3">
					<div className="space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="text-sm font-semibold">
								{isBlocked ? "This event already appears to be published" : "Possible duplicate event"}
							</h3>
						</div>
						<p className="text-sm leading-6 text-amber-900/80 dark:text-amber-100/80">
							{isBlocked
								? "Adamastor found a high-confidence match that is already visible online."
								: "Adamastor found a similar visible event. Review the match before creating a new listing."}
						</p>
					</div>

					<div className="space-y-2">
						{duplicateReview.candidates.map((candidate) => (
							<div
								key={`${candidate.event.id}-${candidate.reason}`}
								className="border-l border-amber-300/80 pl-3 text-amber-950 dark:border-amber-700 dark:text-amber-50"
							>
								<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
									<div className="min-w-0 space-y-0.5">
										<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-900/60 dark:text-amber-100/60">
											Matching event
										</p>
										<p className="line-clamp-2 text-sm font-medium leading-5 text-amber-950/90 dark:text-amber-50/90">
											{candidate.event.title}
										</p>
										<p className="text-xs leading-5 text-amber-900/65 dark:text-amber-100/65">
											{formatDuplicateEventDate(candidate.event.start_time)} · {formatCity(candidate.event.city)} ·{" "}
											{candidate.reason}
										</p>
									</div>

									{candidate.event.url ? (
										<Button
											variant="outline"
											size="sm"
											asChild
											className="border-amber-300 bg-transparent text-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-50 dark:hover:bg-amber-900/40"
										>
											<a href={candidate.event.url} target="_blank" rel="noopener noreferrer">
												<ExternalLink className="mr-2 h-4 w-4" />
												Open
											</a>
										</Button>
									) : null}
								</div>
							</div>
						))}
					</div>

					{isBlocked ? null : (
						<div className="flex justify-end">
							<Button
								type="button"
								variant="outline"
								disabled={isSubmitting}
								onClick={onCreateAnyway}
								className="bg-background"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating Event...
									</>
								) : (
									"Create Anyway"
								)}
							</Button>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}

function formatDuplicateEventDate(value: string) {
	return new Intl.DateTimeFormat("en-GB", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: TIMEZONE,
	}).format(new Date(value));
}

function formatCity(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

interface EventPreviewProps {
	title: string;
	description: string;
	url: string;
	bannerUrl: string;
}

function EventPreview({ title, description, url, bannerUrl }: EventPreviewProps) {
	return (
		<Card className="h-full transition-all duration-200 rounded-xl">
			<CardHeader>
				<CardTitle className="animate-in fade-in-0 duration-300">
					{title || <span className="text-muted-foreground">Event Title</span>}
				</CardTitle>
				<CardDescription className="line-clamp-2 animate-in fade-in-0 duration-300 delay-100">
					{description || <span className="text-muted-foreground">Event description will appear here...</span>}
				</CardDescription>
			</CardHeader>
			<CardContent className="overflow-hidden">
				{bannerUrl ? (
					<div className="mb-4 animate-in fade-in-0 zoom-in-95 duration-500 delay-200">
						<img
							src={bannerUrl}
							alt={title || "Preview image"}
							className="rounded-md max-h-64 object-contain w-full transition-transform duration-300 hover:scale-105"
							onError={(e) => {
								e.currentTarget.style.display = "none";
							}}
						/>
					</div>
				) : (
					<div className="mb-4 h-48 bg-muted rounded-md flex items-center justify-center animate-pulse">
						<span className="text-muted-foreground">Event banner will appear here</span>
					</div>
				)}

				<div className="grid grid-cols-1 gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-300">
					{url && (
						<div>
							<h3 className="text-sm font-medium text-muted-foreground">URL</h3>
							<p className="text-sm truncate">
								<a
									href={url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline transition-colors duration-200"
								>
									{url}
								</a>
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
