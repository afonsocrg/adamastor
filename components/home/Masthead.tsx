interface MastheadProps {
	heading?: string;
	dek?: string;
}

const DEFAULT_HEADING = "Latest from Adamastor";
// Opens with the canonical brand strapline ("A weekly read on Portugal's
// startup scene.") used verbatim on /about, /subscribe, /preferences, and
// the SubscribeForm coda — one publication voice across every surface that
// describes the Weekly. The second sentence names the offering mix.
const DEFAULT_DEK =
	"A weekly read on Portugal's startup scene. The Adamastor Weekly every Tuesday, plus occasional opinion from named voices in the ecosystem.";

/**
 * Editorial masthead for the homepage and the paginated archive pages.
 * Lora H1 in the same register as /events and /posts/[id] so the three
 * surfaces share one nameplate language. Lives *inside* the main column
 * so the sidebar top aligns with the H1 baseline (8-col grid rule).
 */
export default function Masthead({ heading = DEFAULT_HEADING, dek = DEFAULT_DEK }: MastheadProps) {
	return (
		<header className="space-y-3 pb-2 pt-2">
			<h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight text-navy [text-wrap:balance] [font-family:var(--font-lora-bold)] dark:text-cyan-lifted">
				{heading}
			</h1>
			<p className="text-sm md:text-base leading-snug md:leading-relaxed text-muted-foreground max-w-[60ch] [text-wrap:pretty]">
				{dek}
			</p>
		</header>
	);
}
