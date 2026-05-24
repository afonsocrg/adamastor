import {
	Body,
	Button,
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

interface EventSubmissionApprovedTemplateProps {
	submitterName: string;
	eventTitle: string;
	eventCity: string;
	eventStartTimeLisbon: string;
	eventPageUrl: string;
}

export const EventSubmissionApprovedTemplate = ({
	submitterName,
	eventTitle,
	eventCity,
	eventStartTimeLisbon,
	eventPageUrl,
}: EventSubmissionApprovedTemplateProps) => {
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
				<Preview>Your event is live on Adamastor</Preview>
				<Body className="bg-gray-100 py-[40px]" style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif" }}>
					<Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
						<Section>
							<Heading className="text-[28px] font-bold text-[#104357] mb-[16px]">
								🎉 Your event is live, {submitterName}!
							</Heading>

							<Text className="text-[16px] text-[#374151] mb-[24px] leading-[24px]">
								We just published your event on Adamastor. Thanks for sharing it with Portugal's tech community.
							</Text>

							<Section className="bg-[#f8fafc] border border-solid border-[#e2e8f0] rounded-[8px] p-[20px] mb-[24px]">
								<Text className="text-[18px] font-semibold text-[#104357] mb-[8px] leading-[24px]">{eventTitle}</Text>
								<Text className="text-[14px] text-[#64748b] leading-[20px]">
									{eventStartTimeLisbon} · {eventCity}
								</Text>
							</Section>

							<Section className="mb-[24px]">
								<Button
									href={eventPageUrl}
									className="bg-[#04c9d8] text-white px-[24px] py-[12px] rounded-[12px] text-[14px] font-semibold no-underline box-border"
								>
									See it on Adamastor
								</Button>
							</Section>

							<Text className="text-[16px] text-[#374151] leading-[24px]">
								Got more events coming up? You can submit them anytime at{" "}
								<a href="https://adamastor.blog/events/submit" className="text-[#04c9d8] underline">
									adamastor.blog/events/submit
								</a>
								.
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

EventSubmissionApprovedTemplate.PreviewProps = {
	submitterName: "Ana",
	eventTitle: "Lisbon AI Builders Meetup #12",
	eventCity: "Lisboa",
	eventStartTimeLisbon: "Thu, 28 May 2026, 19:00",
	eventPageUrl: "https://adamastor.blog/events",
} satisfies EventSubmissionApprovedTemplateProps;
