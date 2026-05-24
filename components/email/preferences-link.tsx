import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface PreferencesLinkEmailProps {
	preferencesUrl: string;
}

export const PreferencesLinkEmail = ({ preferencesUrl }: PreferencesLinkEmailProps) => {
	return (
		<Html lang="en" dir="ltr">
			<Tailwind>
				<Head />
				<Preview>Your Adamastor preferences link</Preview>
				<Body className="bg-gray-100 font-sans py-[40px]">
					<Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
						<Section>
							<Heading className="text-[24px] font-bold text-[#104357] mb-[16px]">Manage your preferences</Heading>

							<Text className="text-[16px] text-[#374151] mb-[24px] leading-[24px]">
								Use the link below to update which Adamastor newsletters you receive. It opens a page where you can opt
								in or out of any category — no login needed.
							</Text>

							<Section className="text-center mb-[32px]">
								<Button
									href={preferencesUrl}
									className="bg-[#104357] text-white px-[24px] py-[12px] rounded-[6px] text-[14px] font-semibold no-underline box-border inline-block"
								>
									Open my preferences
								</Button>
							</Section>

							<Text className="text-[14px] text-gray-500 mb-[16px] leading-[20px]">
								If the button doesn't work, paste this link into your browser:
								<br />
								<Link href={preferencesUrl} className="text-gray-500 underline break-all">
									{preferencesUrl}
								</Link>
							</Text>

							<Text className="text-[14px] text-gray-500 leading-[20px]">
								If you didn't request this, you can safely ignore the email.
							</Text>
						</Section>

						<Section className="border-t border-solid border-gray-200 pt-[24px] mt-[24px]">
							<Text className="text-[12px] text-gray-500 text-center m-0">
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

PreferencesLinkEmail.PreviewProps = {
	preferencesUrl: "https://adamastor.blog/preferences?token=00000000-0000-0000-0000-000000000000",
} as PreferencesLinkEmailProps;

export default PreferencesLinkEmail;
