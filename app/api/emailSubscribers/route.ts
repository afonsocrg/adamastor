import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
	try {
		const { data, error } = await resend.contacts.list({
			limit: 100,
		});

		if (error) {
			console.error("Error fetching contacts:", error);
			return Response.json({ error: error.message }, { status: 500 });
		}

		return Response.json({
			contacts: data?.data ?? [],
		});
	} catch (error) {
		console.error("Contacts fetch error:", error);
		return Response.json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 });
	}
}
