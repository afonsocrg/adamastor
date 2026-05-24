import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface CategoryWelcomeEmailProps {
	firstName?: string | null;
	/** Display names of categories the subscriber just opted into, e.g. ["Design", "AI"]. */
	categoryNames: string[];
	/** Tokenized URL to /preferences — included on every category subscribe. */
	preferencesUrl: string;
}

function joinList(items: string[]): string {
	if (items.length === 0) return "";
	if (items.length === 1) return items[0];
	if (items.length === 2) return `${items[0]} and ${items[1]}`;
	return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export const CategoryWelcomeEmail = ({
	firstName,
	categoryNames,
	preferencesUrl,
}: CategoryWelcomeEmailProps) => {
	const greeting = firstName ? `Welcome, ${firstName}!` : "Welcome!";
	const categories = joinList(categoryNames);
	const previewText =
		categoryNames.length === 1
			? `You're now subscribed to ${categoryNames[0]} events.`
			: `You're now subscribed to ${categories} events.`;

	return (
		<Html lang="en" dir="ltr">
			<Tailwind>
				<Head />
				<Preview>{previewText}</Preview>
				<Body className="bg-gray-100 font-sans py-[40px]">
					<Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
						<Section>
							<Heading className="text-[24px] font-bold text-[#104357] mb-[16px]">{greeting}</Heading>

							<Text className="text-[16px] text-[#374151] mb-[16px] leading-[24px]">
								You're now on the Adamastor list for{" "}
								<strong>{categoryNames.length === 1 ? `${categoryNames[0]} events` : `${categories} events`}</strong>{" "}
								across Portugal — meetups, conferences, and workshops. We'll email you about the upcoming ones,
								and only the ones tagged with{" "}
								{categoryNames.length === 1 ? "this category" : "these categories"}.
							</Text>

							<Text className="text-[16px] text-[#374151] mb-[24px] leading-[24px]">
								In the meantime, take a look at what's coming up:
							</Text>

							<Section className="text-center mb-[32px]">
								<Button
									href="https://adamastor.blog/events"
									className="bg-[#04c9d8] text-white px-[24px] py-[12px] rounded-[6px] text-[14px] font-semibold no-underline box-border inline-block"
								>
									Browse all events
								</Button>
							</Section>

							<Hr className="border-gray-200 my-[24px]" />

							<Text className="text-[14px] text-gray-600 mb-[8px] leading-[20px]">
								<strong>Want more — or less — in your inbox?</strong>
							</Text>
							<Text className="text-[14px] text-gray-600 mb-[24px] leading-[20px]">
								You can change which categories you receive at any time, no password required:
							</Text>
							<Section className="text-center mb-[16px]">
								<Button
									href={preferencesUrl}
									className="bg-white text-[#104357] border border-solid border-[#104357] px-[20px] py-[10px] rounded-[6px] text-[14px] font-semibold no-underline box-border inline-block"
								>
									Manage your preferences
								</Button>
							</Section>
						</Section>

						<Section className="border-t border-solid border-gray-200 pt-[24px] mt-[24px]">
							<Text className="text-[12px] text-gray-500 text-center m-0 mb-[8px]">
								© {new Date().getFullYear()} Adamastor —{" "}
								<Link href="https://adamastor.blog" className="text-gray-500 underline">
									adamastor.blog
								</Link>
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

CategoryWelcomeEmail.PreviewProps = {
	firstName: "Malik",
	categoryNames: ["Design"],
	preferencesUrl: "https://adamastor.blog/preferences?token=00000000-0000-0000-0000-000000000000",
} as CategoryWelcomeEmailProps;

export default CategoryWelcomeEmail;
