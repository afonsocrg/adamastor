import { Avatar, AvatarFallback, AvatarImage } from "./tailwind/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./tailwind/ui/hover-card";

const authors = [
	{
		id: 0,
		name: "Carlos Resende",
		bio: "Carlos Resende is an Expert Evaluator for the European Commission and a contributor to Founder Institute Portugal, dedicated to supporting early-stage ventures and fostering innovation.",
		photoSrc: "carlos.jpeg",
	},
	{
		id: 1,
		name: "Fernando Fraga",
		bio: "Fernando is the founder of Fx2 Group and an entrepreneur, with a track record of launching his own ventures, supporting other founders in building successful startups, and advising on public policy related to entrepreneurship and innovation.",
		photoSrc: "fernando.jpg",
	},
];

export default function AuthorCard({ id, publishedAt }: { id: number; publishedAt: string }) {
	return (
		<>
			<div className="">
				<HoverCard>
					<HoverCardTrigger asChild className="cursor-pointer w-fit">
						<div className="flex items-center gap-2 w-fit">
							<div>
								<Avatar className="size-[45px]">
									<AvatarImage src={`/${authors[id].photoSrc}`} />
									<AvatarFallback>{authors[id].name.charAt(0)}</AvatarFallback>
								</Avatar>
							</div>
							<div className="flex flex-col">
								<div className="font-semibold text-[#24acb5] text-sm tracking-wider">
									{authors[id].name.toUpperCase()}
								</div>
								<div>
									<small className="text-muted-foreground tracking-wide">{publishedAt}</small>
								</div>
							</div>
						</div>
					</HoverCardTrigger>
					<HoverCardContent className="w-96 p-4">
						<div className="flex gap-6">
							<div>
								<h3 className="text-xl font-semibold">{authors[id].name}</h3>
								<p className="text-muted-foreground">{authors[id].bio}</p>
							</div>
							<div>
								<Avatar className="size-[65px]">
									<AvatarImage src={`/${authors[id].photoSrc}`} />
									<AvatarFallback>{authors[id].name.charAt(0)}</AvatarFallback>
								</Avatar>
							</div>
						</div>
					</HoverCardContent>
				</HoverCard>
			</div>
		</>
	);
}
