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

interface EmailTemplateProps {
	firstName: string;
	/**
	 * Tokenized /preferences URL. Optional only so existing PreviewProps and
	 * any old callers keep compiling — every real send should pass it so the
	 * footer "Manage preferences" link works.
	 */
	preferencesUrl?: string;
}

export const EmailTemplate = ({ firstName, preferencesUrl }: EmailTemplateProps) => {
	return (
		<Html lang="en" dir="ltr">
			<Tailwind>
				<Head />
				<Preview>Welcome to Portugal's startup community! Let's get you started.</Preview>
				<Body className="bg-gray-100 font-sans py-[40px]">
					<Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
						<Section>
							<Heading className="text-[32px] font-bold text-[#104357] mb-[24px]">👋 Welcome, {firstName}!</Heading>

							<Text className="text-[16px] text-[#374151] mb-[24px] leading-[24px]">
								Bem-vindo! Thank you for joining Portugal's premier digital publication for startup enthusiasts,
								founders, and innovators. You're now part of a vibrant community that's shaping the future of Portuguese
								entrepreneurship.
							</Text>

							<Text className="text-[16px] text-[#374151] mb-[24px] leading-[24px]">
								From Lisbon's thriving tech scene to Porto's emerging startups, from funding rounds to success stories,
								we'll keep you informed about everything happening in Portugal's dynamic startup ecosystem.
							</Text>

							<Text className="text-[16px] text-[#374151] mb-[32px] leading-[24px]">
								Did you know we also have an events page? Every week, we highlight meetups and conferences that we
								believe might be worth your time.
							</Text>

							<Section className="text-center mb-[32px]">
								<Button
									href="https://adamastor.blog/events"
									className="bg-[#04c9d8] text-white px-[32px] py-[16px] rounded-[12px] text-[14px] font-semibold no-underline box-border inline-block"
								>
									Check our Events Page
								</Button>
							</Section>

							<Text className="text-[14px] text-gray-600 mb-[24px] leading-[20px] bg-gray-50 p-[16px] rounded-[8px]">
								<strong>What you'll get:</strong>
								<br />• Weekly startup news and insights from Portugal
								<br />• Exclusive interviews with Portuguese founders
								<br />• Investment and funding updates
								<br />• Event notifications and networking opportunities
							</Text>

							<Text className="text-[16px] text-[#374151] mb-[32px] leading-[24px]">
								Ready to dive into Portugal's startup scene? Let's build the future together!
							</Text>

							<Text className="text-[16px] text-[#374151] mb-[32px] leading-[24px]">
								Até breve,
								<br />
								<strong>Carlos Resende</strong>
							</Text>
						</Section>

						<Section className="border-t border-solid border-gray-200 pt-[24px]">
							<Text className="text-[12px] text-gray-500 text-center m-0 mb-[8px]">
								© {new Date().getFullYear()} Adamastor. All rights reserved.
							</Text>

							{preferencesUrl ? (
								<Text className="text-[12px] text-gray-500 text-center m-0">
									<Link href={preferencesUrl} className="text-gray-500 underline">
										Manage your preferences
									</Link>
								</Text>
							) : null}
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

EmailTemplate.PreviewProps = {
	firstName: "João",
};
