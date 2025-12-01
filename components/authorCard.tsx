import { Avatar, AvatarFallback, AvatarImage } from "./tailwind/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./tailwind/ui/hover-card";

interface Author {
	id: string;
	name: string;
	bio: string | null;
	image_url: string | null;
	website_url: string | null;
	social_links: any;
	slug: string;
}

export default function AuthorCard({ author, publishedAt }: { author: Author; publishedAt: string }) {
	return (
		<>
			<div className="">
				<HoverCard>
					<HoverCardTrigger asChild className="cursor-pointer w-fit">
						<div className="flex items-center gap-2 w-fit">
							<div>
								<Avatar className="size-[45px]">
									<AvatarImage src={author.image_url || undefined} />
									<AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
								</Avatar>
							</div>
							<div className="flex flex-col">
								<div className="font-semibold text-[#24acb5] text-sm tracking-wider">
									{author.name.toUpperCase()}
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
								<h3 className="text-xl font-semibold">{author.name}</h3>
								<p className="text-muted-foreground">{author.bio || "No bio available"}</p>
							</div>
							<div>
								<Avatar className="size-[65px]">
									<AvatarImage src={author.image_url || undefined} />
									<AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
								</Avatar>
							</div>
						</div>
					</HoverCardContent>
				</HoverCard>
			</div>
		</>
	);
}
