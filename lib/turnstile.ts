/**
 * Server-side Cloudflare Turnstile verification.
 *
 * If TURNSTILE_SECRET_KEY is unset (e.g. local dev that hasn't configured
 * Turnstile yet), verification is skipped with a warning rather than failing.
 * This keeps the submission flow exercisable in dev without a captcha widget.
 * In production, the secret key MUST be set — staging checks it via the env
 * audit script.
 */
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
	success: boolean;
	"error-codes"?: string[];
	hostname?: string;
	action?: string;
	cdata?: string;
}

export async function verifyTurnstileToken(token: string | undefined | null, remoteIp?: string): Promise<boolean> {
	const secretKey = process.env.TURNSTILE_SECRET_KEY;

	if (!secretKey) {
		console.warn("[turnstile] TURNSTILE_SECRET_KEY is not set — skipping verification (do NOT ship to prod like this)");
		return true;
	}

	if (!token) {
		return false;
	}

	const body = new URLSearchParams();
	body.set("secret", secretKey);
	body.set("response", token);
	if (remoteIp) body.set("remoteip", remoteIp);

	try {
		const response = await fetch(TURNSTILE_VERIFY_URL, {
			method: "POST",
			body,
		});

		if (!response.ok) {
			console.error("[turnstile] siteverify returned non-ok status", response.status);
			return false;
		}

		const data = (await response.json()) as TurnstileVerifyResponse;

		if (!data.success) {
			console.warn("[turnstile] verification failed", data["error-codes"]);
		}

		return data.success === true;
	} catch (error) {
		console.error("[turnstile] siteverify request threw", error);
		return false;
	}
}

export function getTurnstileSiteKey(): string | undefined {
	return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}
