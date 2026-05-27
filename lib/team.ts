export type TeamMember = {
	email: string;
	name: string;
	photo: string;
};

export const TEAM: readonly TeamMember[] = [
	{ email: "carlosjoseresende@gmail.com", name: "Carlos Resende", photo: "/carlos.jpeg" },
	{ email: "afonso.crg@gmail.com", name: "Afonso Gonçalves", photo: "/afonso.jpeg" },
	{ email: "malik@hey.com", name: "Malik Piara", photo: "/malik.jpeg" },
];

export function getTeamMember(email?: string | null): TeamMember | null {
	if (!email) return null;
	return TEAM.find((m) => m.email === email) ?? null;
}
