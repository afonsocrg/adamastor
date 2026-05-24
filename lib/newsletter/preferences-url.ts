/**
 * Canonical builder for the no-login preferences URL. Centralized so the
 * URL shape (?token=...) can change in one place and every email picks it up.
 */
export function buildPreferencesUrl(token?: string): string {
	const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://adamastor.blog";
	return token ? `${base}/preferences?token=${encodeURIComponent(token)}` : `${base}/preferences`;
}
