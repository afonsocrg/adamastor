import { ForbiddenError, handleError } from "@/lib/errors";
import { listAllContacts } from "@/lib/resend/contacts";
import { getNewsletterSegmentId } from "@/lib/resend/segment";
import { assertAuthenticated } from "@/lib/supabase/authentication";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const segmentId = getNewsletterSegmentId();

export async function GET() {
	try {
		const supabase = await createClient();
		const profile = await assertAuthenticated(supabase);

		if (profile.role !== "admin") {
			throw new ForbiddenError("Admin access required");
		}

		const contacts = await listAllContacts(resend, { segmentId });

		return NextResponse.json(
			{
				contacts,
			},
			{
				headers: {
					"Cache-Control": "no-store",
				},
			},
		);
	} catch (error) {
		return handleError(error);
	}
}
