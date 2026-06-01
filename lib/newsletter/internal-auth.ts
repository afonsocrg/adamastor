import "server-only";

import type { NextRequest } from "next/server";

/**
 * Shared secret-auth for the internal newsletter endpoints (/api/sendNewsletter
 * and /api/cron/send-newsletter). One audited implementation of the
 * constant-time compare rather than a copy per route.
 *
 * Two distinct secrets use this same primitive:
 *   - NEWSLETTER_SEND_SECRET — gates the raw send engine (/api/sendNewsletter).
 *   - NEWSLETTER_CRON_SECRET  — gates the cron entry point the worker calls.
 * Keeping them separate means the worker-held cron secret never grants direct
 * access to the send engine, and either can be rotated without the other.
 */

/** Constant-time compare so a wrong secret can't be teased out by timing. */
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return mismatch === 0;
}

/** Pull the presented secret from `Authorization: Bearer …` or `x-cron-secret`. */
export function getProvidedSecret(request: NextRequest): string | null {
	const auth = request.headers.get("authorization");
	if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
	return request.headers.get("x-cron-secret");
}

// Flat (non-discriminated) shape on purpose: the repo's tsconfig runs with
// `strict: false`, where a `{ ok: true } | { ok: false; … }` union doesn't
// narrow (the `true`/`false` literals widen to `boolean`). `status`/`error`
// are only populated when `ok` is false.
export interface SecretCheck {
	ok: boolean;
	status?: 401 | 500;
	error?: string;
}

/**
 * Verify a request carries the expected shared secret. Fails CLOSED: if the
 * server has no secret configured (`expected` is empty), every call is
 * rejected with 500 rather than silently allowed — so a missing env var can
 * never accidentally re-open the endpoint.
 */
export function verifyInternalSecret(
	request: NextRequest,
	expected: string | undefined,
	envName: string,
): SecretCheck {
	if (!expected) {
		return { ok: false, status: 500, error: `${envName} is not configured on the server.` };
	}
	const provided = getProvidedSecret(request);
	if (!provided || !timingSafeEqual(provided, expected)) {
		return { ok: false, status: 401, error: "Unauthorized" };
	}
	return { ok: true };
}
