"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { EVENT_CATEGORIES, type EventCategorySlug, isEventCategorySlug } from "@/lib/events/categories";
import { X } from "lucide-react";

interface EventCategorySelectorProps {
	value: EventCategorySlug[];
	onChange: (value: EventCategorySlug[]) => void;
	/**
	 * Called whenever the user explicitly adds or removes a category. Forms that
	 * auto-infer categories from other fields can use this to disable inference
	 * once the user has taken control. Optional.
	 */
	onManualChange?: () => void;
}

export function EventCategorySelector({ value, onChange, onManualChange }: EventCategorySelectorProps) {
	const selectedCategories = EVENT_CATEGORIES.filter((category) => value.includes(category.slug));
	const availableCategories = EVENT_CATEGORIES.filter((category) => !value.includes(category.slug));

	const addCategory = (slug: string) => {
		if (!isEventCategorySlug(slug)) return;

		onManualChange?.();
		onChange([...value, slug]);
	};

	const removeCategory = (slug: EventCategorySlug) => {
		onManualChange?.();
		onChange(value.filter((categorySlug) => categorySlug !== slug));
	};

	return (
		<div className="space-y-3">
			<Select value="" onValueChange={addCategory}>
				<SelectTrigger className="transition-all duration-200">
					<SelectValue placeholder="Add category" />
				</SelectTrigger>
				<SelectContent>
					{availableCategories.map((category) => (
						<SelectItem key={category.slug} value={category.slug}>
							{category.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{selectedCategories.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					{selectedCategories.map((category) => (
						<Button
							key={category.slug}
							type="button"
							variant="outline"
							size="sm"
							onClick={() => removeCategory(category.slug)}
							className="h-8 rounded-full border-navy bg-navy-tint pr-2 text-navy font-semibold hover:bg-navy-tint/80 dark:border-navy-tint/[0.45] dark:bg-navy-tint/[0.18] dark:text-navy-lifted dark:hover:bg-navy-tint/[0.25]"
						>
							{category.name}
							<X className="ml-1.5 h-3.5 w-3.5" />
							<span className="sr-only">Remove {category.name}</span>
						</Button>
					))}
				</div>
			) : null}
		</div>
	);
}
