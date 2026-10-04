/**
 * One-off / manual run of the Resend → Supabase unsubscribe reconcile.
 *
 *   pnpm dlx tsx@4 --tsconfig scripts/tsconfig.json --env-file=.env.local scripts/reconcile-unsubscribes.ts          # dry run
 *   pnpm dlx tsx@4 --tsconfig scripts/tsconfig.json --env-file=.env.local scripts/reconcile-unsubscribes.ts --apply  # write
 *
 * The weekly events send (lib/newsletter/send-events-weekly.ts) runs the same
 * reconcile before every live send, so this is only for backfills and spot checks.
 */
import { listResendContacts, reconcileResendUnsubscribes } from "@/lib/newsletter/reconcile-unsubscribes";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const mask = (email: string) => email.replace(/^(.).*(@.*)$/, "$1***$2");

async function main() {
	if (process.argv.includes("--apply")) {
		const { unsubscribed } = await listResendContacts(resend);
		const { updated } = await reconcileResendUnsubscribes(unsubscribed);
		console.log(`Resend unsubscribed: ${unsubscribed.size}. Supabase rows updated: ${updated.length}`);
		for (const email of updated) console.log(`  ${mask(email)}`);
	} else {
		const { unsubscribed: emails } = await listResendContacts(resend);
		const { data, error } = await createServiceRoleClient()
			.from("newsletter_subscriptions")
			.select("email, categories, digest_subscribed")
			.in("email", [...emails])
			.is("unsubscribed_at", null);
		if (error) throw error;
		console.log(`Resend unsubscribed: ${emails.size}. Still active in Supabase (would update): ${data.length}`);
		for (const row of data)
			console.log(
				`  ${mask(row.email)}  categories=${row.categories.join(",") || "-"}  weekly=${row.digest_subscribed}`,
			);
		console.log("Dry run. Re-run with --apply to write.");
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
