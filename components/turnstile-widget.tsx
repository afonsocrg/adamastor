"use client";

import { useEffect, useId, useRef } from "react";

declare global {
	interface Window {
		turnstile?: {
			render: (
				container: HTMLElement,
				options: {
					sitekey: string;
					callback?: (token: string) => void;
					"error-callback"?: () => void;
					"expired-callback"?: () => void;
					theme?: "light" | "dark" | "auto";
				},
			) => string;
			reset: (widgetId?: string) => void;
			remove: (widgetId?: string) => void;
		};
	}
}

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileWidgetProps {
	siteKey: string;
	onToken: (token: string) => void;
	onError?: () => void;
	theme?: "light" | "dark" | "auto";
}

/**
 * Lightweight wrapper around Cloudflare Turnstile's explicit-render API.
 * Loads the script on first mount (idempotent), renders one widget into a
 * div, and cleans up on unmount.
 *
 * No new npm dep — the third-party script is small and we don't need any of
 * the bells/whistles in @marsidev/react-turnstile.
 */
export function TurnstileWidget({ siteKey, onToken, onError, theme = "auto" }: TurnstileWidgetProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const widgetIdRef = useRef<string | null>(null);
	const elementId = useId();

	useEffect(() => {
		let cancelled = false;

		function ensureScript(): Promise<void> {
			if (typeof window === "undefined") return Promise.resolve();
			if (window.turnstile) return Promise.resolve();
			if (document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)) {
				return new Promise<void>((resolve) => {
					const check = window.setInterval(() => {
						if (window.turnstile) {
							window.clearInterval(check);
							resolve();
						}
					}, 50);
				});
			}

			return new Promise<void>((resolve) => {
				const script = document.createElement("script");
				script.src = TURNSTILE_SCRIPT_SRC;
				script.async = true;
				script.defer = true;
				script.onload = () => resolve();
				document.head.appendChild(script);
			});
		}

		ensureScript().then(() => {
			if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
			widgetIdRef.current = window.turnstile.render(containerRef.current, {
				sitekey: siteKey,
				theme,
				callback: (token) => onToken(token),
				"error-callback": () => onError?.(),
				"expired-callback": () => onToken(""),
			});
		});

		return () => {
			cancelled = true;
			if (widgetIdRef.current && window.turnstile) {
				try {
					window.turnstile.remove(widgetIdRef.current);
				} catch {
					// Widget already gone — nothing to do.
				}
				widgetIdRef.current = null;
			}
		};
	}, [siteKey, onToken, onError, theme]);

	return <div ref={containerRef} id={`cf-turnstile-${elementId}`} className="min-h-[65px]" />;
}
