"use client";

/**
 * THROWAWAY exploration tool — delete once Malik picks a blockquote variant.
 *
 * Toggles `quote-a` / `quote-b` / `quote-c` on <html>. The corresponding CSS
 * rules live in styles/prosemirror.css under matching scoped selectors. The
 * picker stores the selected letter in localStorage so reloads keep the
 * chosen direction.
 *
 * To remove after a decision:
 *   1. delete this file
 *   2. delete the <QuoteVariantPicker /> mount in page.tsx
 *   3. promote the chosen .quote-X rule to unscoped `.article-prose blockquote`
 *      in prosemirror.css and delete the other two.
 */

import { useEffect, useState } from "react";

type Variant = "a" | "d" | "e" | "f";

const STORAGE_KEY = "adamastor_quote_variant";
const VARIANTS: { letter: Variant; name: string }[] = [
	{ letter: "a", name: "Marginal Glyph" },
	{ letter: "d", name: "Indent Margin" },
	{ letter: "e", name: "Twin Apertures" },
	{ letter: "f", name: "Tactile Broadside" },
];
const VARIANT_LETTERS: Variant[] = ["a", "d", "e", "f"];

function applyVariant(variant: Variant) {
	const html = document.documentElement;
	html.classList.remove("quote-a", "quote-b", "quote-c", "quote-d", "quote-e", "quote-f");
	html.classList.add(`quote-${variant}`);
}

export default function QuoteVariantPicker() {
	const [variant, setVariant] = useState<Variant>("a");

	useEffect(() => {
		const saved = window.localStorage.getItem(STORAGE_KEY) as Variant | null;
		const initial: Variant = saved && VARIANT_LETTERS.includes(saved) ? saved : "a";
		setVariant(initial);
		applyVariant(initial);
	}, []);

	function pick(next: Variant) {
		setVariant(next);
		window.localStorage.setItem(STORAGE_KEY, next);
		applyVariant(next);
		// Scroll the first blockquote into view so the change is visible.
		document.querySelector(".article-prose blockquote")?.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
	}

	return (
		<aside
			className="fixed bottom-6 right-6 z-50 rounded-full border border-navy-frame bg-white/95 px-3 py-2 shadow-[0_4px_12px_-4px_rgba(8,41,58,0.18)] backdrop-blur-sm dark:bg-navy-deep/90"
			aria-label="Blockquote variant picker"
		>
			<div className="flex items-center gap-2">
				<span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-tone dark:text-cyan-dim">
					Quote
				</span>
				<div className="flex items-center gap-1">
					{VARIANTS.map((v) => {
						const isActive = v.letter === variant;
						return (
							<button
								key={v.letter}
								type="button"
								onClick={() => pick(v.letter)}
								title={v.name}
								className={
									isActive
										? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white"
										: "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-navy-tone transition-colors hover:bg-navy-frame hover:text-navy"
								}
							>
								{v.letter.toUpperCase()}
							</button>
						);
					})}
				</div>
			</div>
		</aside>
	);
}
