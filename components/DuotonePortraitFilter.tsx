/**
 * Shared SVG filter definition for the editorial portrait duotone (navy
 * gradient). Inlined into any page that renders portraits with the duotone
 * treatment — see docs/design-system.md → *Editorial portrait duotone* for
 * the full two-step pipeline rationale. The filter `id` is global per page,
 * but rendering this component twice on the same page is a no-op visually
 * (browsers resolve the first definition).
 */
export default function DuotonePortraitFilter() {
	return (
		<svg
			aria-hidden="true"
			focusable="false"
			className="absolute h-0 w-0"
			style={{ position: "absolute", width: 0, height: 0 }}
		>
			<defs>
				<filter id="duotone-navy-portrait" colorInterpolationFilters="sRGB">
					<feColorMatrix
						type="matrix"
						values="0.2126 0.7152 0.0722 0 0
								0.2126 0.7152 0.0722 0 0
								0.2126 0.7152 0.0722 0 0
								0      0      0      1 0"
					/>
					<feComponentTransfer>
						<feFuncR type="table" tableValues="0.008 0.910" />
						<feFuncG type="table" tableValues="0.063 0.941" />
						<feFuncB type="table" tableValues="0.102 0.957" />
					</feComponentTransfer>
				</filter>
			</defs>
		</svg>
	);
}
