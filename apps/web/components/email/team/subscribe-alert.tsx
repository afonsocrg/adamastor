import {
	Body,
	Button,
	Container,
	Font,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface SubscribeEmailAlertTemplateProps {
	subscriber_name: string;
	subscriber_email: string;
	subscription_date?: string;
	total_subscribers?: number;
}

export const SubscribeEmailAlertTemplate = ({
	subscriber_name,
	subscriber_email,
	total_subscribers,
}: SubscribeEmailAlertTemplateProps) => {
	return (
		<Html lang="en" dir="ltr">
			<Tailwind>
				<Head>
					<Font
						fontFamily="Inter"
						fallbackFontFamily="Helvetica"
						webFont={{
							url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
							format: "woff2",
						}}
						fontWeight={400}
						fontStyle="normal"
					/>
				</Head>
				<Preview>New subscriber alert: {subscriber_name} just joined your newsletter!</Preview>
				<Body className="bg-gray-100 py-[40px]" style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif" }}>
					<Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
						<Section>
							<Heading className="text-[28px] font-bold text-[#104357] mb-[24px]">🎉 New Subscriber Alert!</Heading>

							<Text className="text-[16px] text-[#374151] mb-[32px] leading-[24px]">
								Great news! Someone new just subscribed to Adamastor.
							</Text>

							<Section className="bg-[#f8fafc] border border-solid border-[#e2e8f0] rounded-[8px] p-[24px] mb-[32px]">
								<Text className="text-[14px] text-[#64748b] mb-[8px] font-semibold uppercase tracking-wide">
									Subscriber Details
								</Text>

								<Text className="text-[16px] text-[#374151] mb-[12px] leading-[24px]">
									<strong>Name:</strong> {subscriber_name}
								</Text>

								<Text className="text-[16px] text-[#374151] mb-[12px] leading-[24px]">
									<strong>Email:</strong> {subscriber_email}
								</Text>

								{total_subscribers && (
									<Text className="text-[16px] text-[#374151] leading-[24px]">
										<strong>Total subscribers:</strong> {total_subscribers.toLocaleString()}
									</Text>
								)}
							</Section>

							<Button
								href="https://adamastor.blog"
								className="bg-[#104357] text-white px-[24px] py-[12px] rounded-[12px] text-[16px] font-semibold box-border"
							>
								Go to Adamastor
							</Button>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

SubscribeEmailAlertTemplate.PreviewProps = {
	subscriber_name: "João Silva",
	subscriber_email: "joao.silva@startup.pt",
	total_subscribers: 0,
};
