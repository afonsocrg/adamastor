export const CITY_MAPPINGS: Record<string, string[]> = {
	lisboa: ["lisboa", "lisbon", "lx", "sintra"],
	porto: ["porto", "oporto", "gaia", "matosinhos"],
	online: ["online", "virtual", "remote", "zoom"],
	algarve: ["algarve", "faro", "albufeira", "portimão", "portimao"],
	aveiro: ["aveiro"],
	braga: ["braga"],
	coimbra: ["coimbra"],
	guimaraes: ["guimarães", "guimaraes"],
	leiria: ["leiria"],
	viseu: ["viseu"],
};

/**
 * Detects a Portuguese city from text using word boundary matching.
 * Returns an object with value (key) and display name, or undefined if not found.
 */
export function detectCityFromText(text: string): { value: string; display: string } | undefined {
	const normalizedText = text.toLowerCase();

	for (const [cityKey, variations] of Object.entries(CITY_MAPPINGS)) {
		for (const variation of variations) {
			const regex = new RegExp(`\\b${variation}\\b`, "i");
			if (regex.test(normalizedText)) {
				return {
					value: cityKey,
					display: cityKey.charAt(0).toUpperCase() + cityKey.slice(1),
				};
			}
		}
	}

	return undefined;
}
