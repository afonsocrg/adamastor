import { Avatar, AvatarFallback, AvatarImage } from "./tailwind/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./tailwind/ui/hover-card";

const author = "Carlos Resende";
const bio =
  "Carlos Resende is an Expert Evaluator for the European Commission and a contributor to Founder Institute Portugal, dedicated to supporting early-stage ventures and fostering innovation.";

export default function AuthorCard() {
  return (
    <>
      <HoverCard>
        <HoverCardTrigger asChild className="cursor-pointer w-fit">
          <div className="flex items-center gap-2 w-fit">
            <div>
              <Avatar>
                <AvatarImage src="/carlos.jpeg" />
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
            </div>
            <div className="font-semibold text-[#006686] text-sm">{author.toUpperCase()}</div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-96 p-4">
          <div className="flex gap-6">
            <div>
              <h3 className="text-xl font-semibold">Carlos Resende</h3>
              <p className="text-muted-foreground">{bio}</p>
            </div>
            <div>
              <Avatar className="size-[65px]">
                <AvatarImage src="/carlos.jpeg" />
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </>
  );
}
