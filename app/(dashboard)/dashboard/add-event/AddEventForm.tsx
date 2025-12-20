"use client";

import type { MetadataResult } from "@/app/types";
import DateTimePickerField from "@/components/date-time-picker-field";
import { Button } from "@/components/tailwind/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/tailwind/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form";
import { Input } from "@/components/tailwind/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Separator } from "@/components/tailwind/ui/separator";
import { Skeleton } from "@/components/tailwind/ui/skeleton";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { dateTimeStringWithNoTimezoneToTzDateString, tzDateStringToDateTimeStringWithNoTimezone } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { detectCityFromText } from "./city-mappings";

const TIMEZONE = "Europe/Lisbon";

const urlFormSchema = z.object({
	url: z.string().url("Please enter a valid URL"),
});

const formSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().min(1, "Description is required"),
	url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
	bannerUrl: z.string().url("Please enter a valid banner URL").optional(),
	startTime: z.string().min(1, "Start time is required"),
	city: z.string().min(1, "City is required"),
});

const defaultEventFormValues = {
	title: "",
	description: "",
	url: "",
	bannerUrl: "",
	startTime: "",
	city: "",
};

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
	const [hasLoadedMetadata, setHasLoadedMetadata] = useState(false);

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
	const isEventFormValid =
		formValues.title && formValues.description && formValues.url && formValues.startTime && formValues.city;

	const handleUrlSubmit = async (values: { url: string }) => {
		setIsScraping(true);
		try {
			const result = await scrapeUrl(values.url);

			if (result.error) {
				toast.error(result.error);
			} else if (result.data) {
				const { title, description, url, bannerUrl, startTime, city } = result.data;

				// Animate form population
				eventForm.setValue("title", title ?? "");
				await new Promise((resolve) => setTimeout(resolve, 50));
				eventForm.setValue("description", description ?? "");
				await new Promise((resolve) => setTimeout(resolve, 50));
				eventForm.setValue("url", url ?? "");
				await new Promise((resolve) => setTimeout(resolve, 50));
				eventForm.setValue("bannerUrl", bannerUrl ?? "");
				await new Promise((resolve) => setTimeout(resolve, 50));
				eventForm.setValue(
					"startTime",
					startTime ? tzDateStringToDateTimeStringWithNoTimezone(startTime, TIMEZONE) : "",
				);
				await new Promise((resolve) => setTimeout(resolve, 50));
				eventForm.setValue("city", city ?? "");

				setHasLoadedMetadata(true);
				toast.success("Event data loaded successfully");
			}
		} catch (error) {
			toast.error("Failed to scrape URL");
		}
		setIsScraping(false);
	};

	const handleEventSubmit = async (values: z.infer<typeof formSchema>) => {
		const { title, description, startTime, city, url, bannerUrl } = values;
		setIsSubmitting(true);

		try {
			const utcDateTime = dateTimeStringWithNoTimezoneToTzDateString(startTime, TIMEZONE);

			const response = await fetch("/api/events", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title,
					description,
					start_time: utcDateTime,
					city,
					url,
					bannerUrl,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to create event");
			}

			// Reset form after successful submission
			eventForm.reset();
			urlForm.reset();
			setHasLoadedMetadata(false);
			toast.success("Event created successfully");
		} catch (err) {
			toast.error("Failed to create event");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className={cn("container p-6 animate-fade-in")}>
			<h2 className="text-xl font-semibold text-[#104357] dark:text-[#E3F2F7] flex gap-2 items-center mb-6">
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
															if (text && text.startsWith("http")) {
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
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Scraping...
										</>
									) : (
										"Get Event Data"
									)}
								</Button>
							</div>
						</form>
					</Form>
				</div>

				{/* Loading Skeleton */}
				{isScraping && !hasLoadedMetadata && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-0 duration-300">
						<Card className="p-4 rounded-xl">
							<div className="space-y-4">
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-24 w-full" />
								<div className="grid grid-cols-2 gap-4">
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
								</div>
								<Skeleton className="h-10 w-24 ml-auto" />
							</div>
						</Card>
						<Card className="rounded-xl">
							<CardHeader>
								<Skeleton className="h-6 w-3/4" />
								<Skeleton className="h-4 w-full" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-48 w-full mb-4" />
								<Skeleton className="h-4 w-1/2" />
							</CardContent>
						</Card>
					</div>
				)}

				{/* Event Details Form and Preview */}
				{hasLoadedMetadata && !isScraping && (
					<div
						className={cn(
							"grid grid-cols-1 md:grid-cols-2 gap-4",
							"animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
						)}
					>
						<div className="w-full animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-200">
							<Card className="p-4 gap-4 flex flex-col h-full transition-all duration-200 rounded-xl">
								<EventDetailsForm
									form={eventForm}
									isSubmitting={isSubmitting}
									handleEventSubmit={handleEventSubmit}
									isFormValid={!!isEventFormValid}
								/>
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
				)}
			</div>
		</main>
	);
}

interface EventDetailsFormProps {
	form: UseFormReturn<z.infer<typeof formSchema>>;
	isSubmitting: boolean;
	handleEventSubmit: (values: z.infer<typeof formSchema>) => void;
	isFormValid: boolean;
}

function EventDetailsForm({ form, isSubmitting, handleEventSubmit, isFormValid }: EventDetailsFormProps) {
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
										<div
											className="bg-[#DFF6F8] text-[#28AFB8] p-2 rounded-xl animate-in underline underline-offset-2 cursor-pointer"
											onClick={() => {
												const cleanedValue = field.value.replace(meetupDatePattern, "").trim();
												field.onChange(cleanedValue);
											}}
										>
											Remove date and "| Meetup" suffix?
										</div>
									)}

									{hasJustMeetup && (
										<div
											className="bg-[#DFF6F8] text-[#28AFB8] p-2 rounded-xl animate-in underline underline-offset-2 cursor-pointer"
											onClick={() => {
												const cleanedValue = field.value.replace(/\|\s*Meetup/g, "").trim();
												field.onChange(cleanedValue);
											}}
										>
											Remove "| Meetup" suffix?
										</div>
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
									<div
										className="bg-[#DFF6F8] text-[#28AFB8] p-2 rounded-xl animate-in underline underline-offset-2 cursor-pointer"
										onClick={() => {
											// Remove all asterisks from the value
											const cleanedValue = field.value.replace(/\*/g, "");
											field.onChange(cleanedValue);
										}}
									>
										Is the asterisk (*) intentional? Click here to remove it.
									</div>
								)}

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
								</FormItem>
							);
						}}
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
										<div
											className="bg-[#DFF6F8] text-[#28AFB8] p-2 rounded-xl animate-in underline underline-offset-2 cursor-pointer mt-2"
											onClick={() => {
												field.onChange(detectedCity.value);
											}}
										>
											Set "{detectedCity.display}" as city.
										</div>
									)}

									<FormMessage />
								</FormItem>
							);
						}}
					/>
				</section>

				<div className="flex justify-end animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-400">
					<Button
						type="submit"
						disabled={isSubmitting || !isFormValid}
						className="transition-all duration-200 rounded-lg bg-[#d4a657] hover:bg-[#d4a657]/90"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Creating Event...
							</>
						) : (
							"Create Event"
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
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
