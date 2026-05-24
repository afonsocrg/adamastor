import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client backed by the service role key.
 *
 * Use this when an API route needs to write rows on behalf of an anonymous
 * caller (e.g. the public event submissions form). The service role bypasses
 * RLS entirely, so:
 *
 *   - NEVER import this from client code or surface its output to the browser.
 *   - The calling route is responsible for validating input and authorization.
 *
 * Wrapped in a factory so we throw early at first use if the env var is
 * missing, rather than failing silently inside a query.
 */
export function createServiceRoleClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url) {
		throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
	}

	if (!serviceRoleKey) {
		throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
	}

	return createClient(url, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
