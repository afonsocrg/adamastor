"use client";

import DateTimePickerField from "@/components/date-time-picker-field";
import { EventCategorySelector } from "@/components/event-category-selector";
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
import { Badge } from "@/components/tailwind/ui/badge";
import { Button } from "@/components/tailwind/ui/button";
import { Card, CardContent } from "@/components/tailwind/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/tailwind/ui/form";
import { Input } from "@/components/tailwind/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Separator } from "@/components/tailwind/ui/separator";
import { Textarea } from "@/components/tailwind/ui/textarea";
import {
	dateTimeStringWithNoTimezoneToTzDateString,
	tzDateStringToDateTimeStringWithNoTimezone,
} from "@/lib/datetime";
import { type EventCategorySlug } from "@/lib/events/categories";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const TIMEZONE = "Europe/Lisbon";

interface ReviewEvent {
	id: string;
	title: string;
	description: string;
	url: string;
	banner_url: string;
	start_time: string;
	city: string;
	status: "pending" | "approved" | "rejected";
	submitter_name: string | null;
	submitter_email: string | null;
	submitted_at: string;
	reviewed_at: string | null;
	rejection_reason: string | null;
}

const formSchema = z.object({
	title: z.string().trim().min(3, "Title is required"),
	description: z.string().trim().min(1, "Description is required"),
	url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
	bannerUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
	startTime: z.string().min(1, "Start time is required"),
	city: z.string().min(1, "City is required"),
	categorySlugs: z.array(z.string()),
});

type ReviewFormValues = z.infer<typeof formSchema>;

interface ReviewSubmissionClientProps {
	event: ReviewEvent;
	initialCategorySlugs: EventCategorySlug[];
}

export default function ReviewSubmissionClient({ event, initialCategorySlugs }: ReviewSubmissionClientProps) {
	const router = useRouter();
	const [isSaving, setIsSaving] = useState(false);
	const [pendingAction, setPendingAction] = useState<null | "save" | "approve" | "reject">(null);
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [rejectionReason, setRejectionReason] = useState(event.rejection_reason ?? "");

	const form = useForm<ReviewFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: event.title,
			description: event.description,
			url: event.url,
			bannerUrl: event.banner_url,
			startTime: tzDateStringToDateTimeStringWithNoTimezone(event.start_time, TIMEZONE),
			city: event.city,
			categorySlugs: initialCategorySlugs,
		},
	});

	const buildPayload = (values: ReviewFormValues) => {
		const utcStartTime = dateTimeStringWithNoTimezoneToTzDateString(values.startTime, TIMEZONE);
		return {
			title: values.title,
			description: values.description,
			start_time: utcStartTime,
			city: values.city,
			url: values.url || "",
			bannerUrl: values.bannerUrl || "",
			categorySlugs: values.categorySlugs,
		};
	};

	const submitDecision = async (decision: null | "approve" | "reject", reason?: string) => {
		const valid = await form.trigger();
		if (!valid) {
			toast.error("Please fix the highlighted fields before continuing.");
			return false;
		}

		setIsSaving(true);
		setPendingAction(decision ?? "save");

		try {
			const values = form.getValues();
			const payload = {
				...buildPayload(values),
				...(decision ? { decision } : {}),
				...(decision === "reject" ? { rejectionReason: reason ?? "" } : {}),
			};

			const response = await fetch(`/api/events/submissions/${event.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error ?? "Request failed");
			}

			if (decision === "approve") {
				toast.success("Approved and published.");
			} else if (decision === "reject") {
				toast.success("Submission rejected and submitter notified.");
			} else {
				toast.success("Changes saved.");
			}

			router.push("/dashboard/event-submissions");
			router.refresh();
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : "Something went wrong.";
			toast.error(message);
			return false;
		} finally {
			setIsSaving(false);
			setPendingAction(null);
		}
	};

	const handleSave = () => submitDecision(null);
	const handleApprove = () => submitDecision("approve");
	const handleRejectConfirm = async () => {
		const ok = await submitDecision("reject", rejectionReason);
		if (ok) setRejectDialogOpen(false);
	};

	return (
		<div className="space-y-6">
			<header className="space-y-2">
				<div className="flex items-center gap-3 flex-wrap">
					<h2 className="text-xl font-semibold text-[#104357] dark:text-[#E3F2F7]">Review submission</h2>
					{event.status === "pending" ? (
						<Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Pending</Badge>
					) : event.status === "approved" ? (
						<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Approved</Badge>
					) : (
						<Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">Rejected</Badge>
					)}
				</div>
				<div className="text-sm text-muted-foreground space-y-1">
					<div>
						<strong>Submitted by:</strong> {event.submitter_name ?? "—"}{" "}
						{event.submitter_email ? (
							<a className="text-[#04C9D8] underline" href={`mailto:${event.submitter_email}`}>
								{event.submitter_email}
							</a>
						) : null}
					</div>
					<div>
						<strong>Submitted at:</strong>{" "}
						{new Intl.DateTimeFormat("en-GB", {
							dateStyle: "medium",
							timeStyle: "short",
							timeZone: TIMEZONE,
						}).format(new Date(event.submitted_at))}
					</div>
					{event.reviewed_at ? (
						<div>
							<strong>Reviewed at:</strong>{" "}
							{new Intl.DateTimeFormat("en-GB", {
								dateStyle: "medium",
								timeStyle: "short",
								timeZone: TIMEZONE,
							}).format(new Date(event.reviewed_at))}
						</div>
					) : null}
					{event.rejection_reason ? (
						<div className="text-rose-900 dark:text-rose-300">
							<strong>Rejection note sent to submitter:</strong> {event.rejection_reason}
						</div>
					) : null}
				</div>
			</header>

			<Card className="rounded-xl">
				<CardContent className="p-6">
					<Form {...form}>
						<form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Title</FormLabel>
										<FormControl>
											<Input {...field} />
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
											<Textarea {...field} className="min-h-[140px]" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="startTime"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<DateTimePickerField
												value={field.value}
												onChange={field.onChange}
												label="Start time (Europe/Lisbon)"
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
								name="url"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Event URL</FormLabel>
										<FormControl>
											<Input {...field} />
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
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

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
										<FormMessage />
									</FormItem>
								)}
							/>
						</form>
					</Form>
				</CardContent>
			</Card>

			<div className="flex flex-col sm:flex-row gap-3 justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={handleSave}
					disabled={isSaving}
					className="rounded-lg"
				>
					{pendingAction === "save" ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
						</>
					) : (
						"Save changes"
					)}
				</Button>
				<Button
					type="button"
					variant="destructive"
					onClick={() => setRejectDialogOpen(true)}
					disabled={isSaving}
					className="rounded-lg"
				>
					Reject
				</Button>
				<Button
					type="button"
					onClick={handleApprove}
					disabled={isSaving}
					className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
				>
					{pendingAction === "approve" ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Approving...
						</>
					) : (
						"Approve & publish"
					)}
				</Button>
			</div>

			<AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Reject this submission?</AlertDialogTitle>
						<AlertDialogDescription>
							The submitter will receive an email with the note below. Keep it brief and respectful.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<Textarea
						value={rejectionReason}
						onChange={(e) => setRejectionReason(e.target.value)}
						placeholder="Optional — explain briefly why this isn't a fit."
						className="min-h-[100px]"
					/>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleRejectConfirm();
							}}
							disabled={isSaving}
							className="bg-rose-600 hover:bg-rose-700"
						>
							{pendingAction === "reject" ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rejecting...
								</>
							) : (
								"Send rejection"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
