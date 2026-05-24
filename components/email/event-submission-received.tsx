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

interface EventSubmissionReceivedTemplateProps {
	eventTitle: string;
	eventDescription: string;
	eventCity: string;
	eventStartTimeLisbon: string;
	eventUrl?: string | null;
	submitterName: string;
	submitterEmail: string;
	reviewUrl: string;
}

export const EventSubmissionReceivedTemplate = ({
	eventTitle,
	eventDescription,
	eventCity,
	eventStartTimeLisbon,
	eventUrl,
	submitterName,
	submitterEmail,
	reviewUrl,
}: EventSubmissionReceivedTemplateProps) => {
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
				<Preview>New event submission: {eventTitle}</Preview>
				<Body className="bg-gray-100 py-[40px]" style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif" }}>
					<Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
						<Section>
							<Heading className="text-[24px] font-bold text-[#104357] mb-[8px]">📥 New event submission</Heading>
							<Text className="text-[14px] text-[#64748b] mb-[24px]">
								{submitterName} ({submitterEmail}) submitted an event for review.
							</Text>

							<Section className="bg-[#f8fafc] border border-solid border-[#e2e8f0] rounded-[8px] p-[20px] mb-[24px]">
								<Text className="text-[18px] font-semibold text-[#104357] mb-[8px] leading-[24px]">{eventTitle}</Text>
								<Text className="text-[14px] text-[#64748b] mb-[12px] leading-[20px]">
									{eventStartTimeLisbon} · {eventCity}
								</Text>
								<Text className="text-[14px] text-[#374151] leading-[22px] whitespace-pre-wrap">{eventDescription}</Text>
								{eventUrl ? (
									<Text className="text-[14px] text-[#04c9d8] mt-[12px] leading-[20px] break-all">
										<a href={eventUrl} className="text-[#04c9d8] underline">
											{eventUrl}
										</a>
									</Text>
								) : null}
							</Section>

							<Button
								href={reviewUrl}
								className="bg-[#104357] text-white px-[24px] py-[12px] rounded-[12px] text-[14px] font-semibold no-underline box-border"
							>
								Review submission
							</Button>

							<Hr className="border-gray-200 my-[24px]" />

							<Text className="text-[12px] text-gray-500 leading-[18px]">
								You're receiving this because you're an admin on Adamastor.
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

EventSubmissionReceivedTemplate.PreviewProps = {
	eventTitle: "Lisbon AI Builders Meetup #12",
	eventDescription:
		"Monthly gathering of AI engineers and founders building agents, RAG systems, and LLM-powered products. Lightning talks + open networking.",
	eventCity: "Lisboa",
	eventStartTimeLisbon: "Thu, 28 May 2026, 19:00",
	eventUrl: "https://lu.ma/lisbon-ai-builders-12",
	submitterName: "Ana Martins",
	submitterEmail: "ana@example.com",
	reviewUrl: "https://adamastor.blog/dashboard/event-submissions",
} satisfies EventSubmissionReceivedTemplateProps;
