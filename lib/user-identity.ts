/**
 * Lightweight client-side "remember me" for name + email across forms.
 *
 * Used by /events/submit and /subscribe so a returning visitor doesn't
 * re-type the same details. localStorage is plenty for this — no PII
 * leaves the browser. Versioned key so we can ship breaking shape changes
 * without colliding with old entries.
 */

const STORAGE_KEY = "adamastor:identity:v1";
const SUBSCRIBED_KEY = "adamastor:subscribed:v1";

export interface SavedIdentity {
	name: string;
	email: string;
	savedAt: number;
}

export function getSavedIdentity(): SavedIdentity | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<SavedIdentity>;
		if (typeof parsed?.name !== "string" || typeof parsed?.email !== "string") return null;
		return {
			name: parsed.name,
			email: parsed.email,
			savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
		};
	} catch {
		return null;
	}
}

export function saveIdentity(identity: { name: string; email: string }): void {
	if (typeof window === "undefined") return;
	const name = identity.name.trim();
	const email = identity.email.trim();
	if (!name || !email) return;
	try {
		const payload: SavedIdentity = { name, email, savedAt: Date.now() };
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch {
		// Quota exceeded, private browsing, etc. — silent fail is fine,
		// the user just loses the convenience next visit.
	}
}

/**
 * Returns the first word of a name, capitalized for use in a greeting
 * (e.g. "Submit your event, Ana"). Lowercases the rest of the word to
 * normalize inputs like "ANA" or "ana" → "Ana". Returns an empty string
 * when the input has no usable word.
 */
export function getFirstNameForGreeting(name: string): string {
	const first = name.trim().split(/\s+/)[0] ?? "";
	if (!first) return "";
	return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/**
 * Save only the email (preserving any existing name in storage). Used by
 * call sites that legitimately collect email-only — e.g. the category
 * newsletter widget in the /events sidebar — so they don't clobber a
 * richer identity saved by /subscribe or /events/submit.
 */
export function saveEmail(email: string): void {
	if (typeof window === "undefined") return;
	const trimmedEmail = email.trim();
	if (!trimmedEmail) return;
	try {
		const existing = getSavedIdentity();
		const payload: SavedIdentity = {
			name: existing?.name ?? "",
			email: trimmedEmail,
			savedAt: Date.now(),
		};
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch {
		// ignore
	}
}

export function clearSavedIdentity(): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore
	}
}

/**
 * Marks the visitor as subscribed to *something* on Adamastor. UI-only hint
 * — the server (newsletter_subscriptions table + Resend) is the source of
 * truth. Used to hide the navbar Subscribe CTA and unlock "Manage" flows
 * without round-tripping the server on every render. Worst case the flag is
 * stale and a subscribed visitor sees the Subscribe pill once; clicking it
 * lands them on the "Welcome back" branch of /subscribe — no harm done.
 */
export function setSubscribed(): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(SUBSCRIBED_KEY, "1");
	} catch {
		// ignore
	}
}

export function isSubscribed(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(SUBSCRIBED_KEY) === "1";
	} catch {
		return false;
	}
}

export function clearSubscribed(): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(SUBSCRIBED_KEY);
	} catch {
		// ignore
	}
}
