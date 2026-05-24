import {
	Body,
	Container,
	Font,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface EventSubmissionRejectedTemplateProps {
	submitterName: string;
	eventTitle: string;
	rejectionReason?: string | null;
}

export const EventSubmissionRejectedTemplate = ({
	submitterName,
	eventTitle,
	rejectionReason,
}: EventSubmissionRejectedTemplateProps) => {
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
				<Preview>Update on your event submission</Preview>
				<Body className="bg-gray-100 py-[40px]" style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif" }}>
					<Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
						<Section>
							<Heading className="text-[24px] font-bold text-[#104357] mb-[16px]">
								Hi {submitterName} — about your event
							</Heading>

							<Text className="text-[16px] text-[#374151] mb-[16px] leading-[24px]">
								Thanks again for submitting <strong>{eventTitle}</strong>. After reviewing it, we weren't able to
								publish this one on Adamastor.
							</Text>

							{rejectionReason ? (
								<Section className="bg-[#fff7ed] border border-solid border-[#fed7aa] rounded-[8px] p-[20px] mb-[24px]">
									<Text className="text-[14px] text-[#64748b] mb-[8px] font-semibold uppercase tracking-wide">
										Why
									</Text>
									<Text className="text-[14px] text-[#374151] leading-[22px] whitespace-pre-wrap">
										{rejectionReason}
									</Text>
								</Section>
							) : null}

							<Text className="text-[16px] text-[#374151] mb-[16px] leading-[24px]">
								We'd love to feature future events from you. If you'd like to discuss this one or send another, just
								reply to this email — we read every response.
							</Text>

							<Hr className="border-gray-200 my-[24px]" />

							<Text className="text-[14px] text-[#374151] leading-[22px]">
								Até breve,
								<br />
								<strong>The Adamastor team</strong>
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

EventSubmissionRejectedTemplate.PreviewProps = {
	submitterName: "Ana",
	eventTitle: "Lisbon AI Builders Meetup #12",
	rejectionReason: "This event is outside the tech / startup focus of Adamastor's audience. Best of luck with it!",
} satisfies EventSubmissionRejectedTemplateProps;
