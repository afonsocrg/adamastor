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

interface EventSubmissionConfirmationTemplateProps {
	submitterName: string;
	eventTitle: string;
	eventCity: string;
	eventStartTimeLisbon: string;
}

export const EventSubmissionConfirmationTemplate = ({
	submitterName,
	eventTitle,
	eventCity,
	eventStartTimeLisbon,
}: EventSubmissionConfirmationTemplateProps) => {
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
				<Preview>We got your event — review coming up</Preview>
				<Body className="bg-gray-100 py-[40px]" style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif" }}>
					<Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
						<Section>
							<Heading className="text-[28px] font-bold text-[#104357] mb-[16px]">Thanks, {submitterName}!</Heading>

							<Text className="text-[16px] text-[#374151] mb-[24px] leading-[24px]">
								We received your event submission and our team will review it shortly. You'll get another email once
								it's published — or with feedback if we need anything from you.
							</Text>

							<Section className="bg-[#f8fafc] border border-solid border-[#e2e8f0] rounded-[8px] p-[20px] mb-[24px]">
								<Text className="text-[14px] text-[#64748b] mb-[8px] font-semibold uppercase tracking-wide">
									Your submission
								</Text>
								<Text className="text-[18px] font-semibold text-[#104357] mb-[8px] leading-[24px]">{eventTitle}</Text>
								<Text className="text-[14px] text-[#64748b] leading-[20px]">
									{eventStartTimeLisbon} · {eventCity}
								</Text>
							</Section>

							<Text className="text-[16px] text-[#374151] leading-[24px]">
								We typically respond within a couple of working days. If your event is time-sensitive, just reply to
								this email and we'll prioritise it.
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

EventSubmissionConfirmationTemplate.PreviewProps = {
	submitterName: "Ana",
	eventTitle: "Lisbon AI Builders Meetup #12",
	eventCity: "Lisboa",
	eventStartTimeLisbon: "Thu, 28 May 2026, 19:00",
} satisfies EventSubmissionConfirmationTemplateProps;
