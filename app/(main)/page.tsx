import HomePostsFeed from "@/components/home-posts-feed";
import { getPaginatedHomePosts } from "@/lib/home-posts";

export const revalidate = 3600;

const SITE_URL = "https://adamastor.blog";

/**
 * Homepage @graph: declares the three foundational entities that every other
 * page's schema references back to.
 *
 * - **Organization**: defined with `@id: ${SITE_URL}/#organization`, the same
 *   `@id` the About page uses for its richer Organization definition (with
 *   full founder Persons, sameAs, knowsAbout, contactPoint). Google merges
 *   entities by `@id` across pages, so this minimal homepage definition and
 *   the rich /about definition resolve to a single entity — and the richer
 *   one wins. Why have both: Google looks at `/` first for entity attribution,
 *   so an Organization here strengthens the canonical home of the entity.
 * - **WebSite**: gives the publication a parent `@id` (`${SITE_URL}/#website`)
 *   that downstream schemas (Article, AboutPage) can reference via
 *   `isPartOf`. No `potentialAction` for search yet since site search is
 *   currently removed.
 * - **Blog**: marks the homepage as the publication's blog feed and lists
 *   its author/publisher relationship for AI engines parsing "who runs
 *   Adamastor" without traversing to /about.
 */
const homepageJsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "Organization",
			"@id": `${SITE_URL}/#organization`,
			name: "Adamastor",
			alternateName: "Adamastor Magazine",
			url: SITE_URL,
			logo: {
				"@type": "ImageObject",
				url: `${SITE_URL}/adamastorLogotype.svg`,
			},
			sameAs: ["https://x.com/meetAdamastor", "https://www.linkedin.com/company/adamastor-magazine/"],
		},
		{
			"@type": "WebSite",
			"@id": `${SITE_URL}/#website`,
			url: SITE_URL,
			name: "Adamastor",
			description: "A digital publication for all things startup in Portugal.",
			publisher: { "@id": `${SITE_URL}/#organization` },
			inLanguage: "en",
		},
		{
			"@type": "Blog",
			"@id": `${SITE_URL}/#blog`,
			url: SITE_URL,
			name: "Adamastor Weekly",
			description: "A weekly read on Portugal's startup scene.",
			publisher: { "@id": `${SITE_URL}/#organization` },
			isPartOf: { "@id": `${SITE_URL}/#website` },
			inLanguage: "en",
		},
	],
};

export default async function Home() {
	const { posts, totalPages } = await getPaginatedHomePosts(1);

	// Articles list stays at screen-lg width — the wider (main) layout container
	// is for editorial pages like /events. Articles cards stretched to xl would
	// feel awkward and break reading rhythm.
	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema markup
				dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
			/>
			<div className="mx-auto max-w-screen-lg">
				<HomePostsFeed currentPage={1} posts={posts} totalPages={totalPages} />
			</div>
		</>
	);
}
