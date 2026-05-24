/**
 * Server-side PostHog event capture. Used by API routes where we can't
 * reach posthog-js. Fire-and-forget — failures are logged but never
 * bubble up to the caller (analytics shouldn't break product paths).
 */
export async function capturePostHogEvent(input: {
	event: string;
	distinctId: string;
	properties?: Record<string, unknown>;
}): Promise<void> {
	if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

	try {
		await fetch("https://eu.i.posthog.com/capture/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
				event: input.event,
				properties: {
					distinct_id: input.distinctId,
					...input.properties,
					timestamp: new Date().toISOString(),
				},
			}),
		});
	} catch (error) {
		console.error(`PostHog capture failed for ${input.event}:`, error);
	}
}
