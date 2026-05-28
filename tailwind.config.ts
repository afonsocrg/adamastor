import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			// ─────────────────────────────────────────────────────────────────
  			// Adamastor brand tokens (see docs/design-system.md for usage rules)
  			// Adds named keys to color families so the default numeric scales
  			// (cyan-50, orange-700, green-100…) stay intact. Use as:
  			//   bg-navy, text-cyan-pastel, border-orange-dark, etc.
  			// ─────────────────────────────────────────────────────────────────
  			// ─────────────────────────────────────────────────────────────────
  			// Adamastor brand palette — painter's vocabulary
  			// (see docs/design-system.md for the canonical framework).
  			//
  			// Each color family uses the SAME variant names with consistent
  			// OKLCH character so families read as one system:
  			//
  			//   deep   → extra-dark shade        L≈0.25, C≈0.05  (rare structural emphasis)
  			//   shade  → dark shade              L≈0.40, C≈0.06  (typography anchor)
  			//   tone   → mid-tone, grey-added    L≈0.55, C≈0.04  (secondary text, labels)
  			//   hue    → pure, vivid             L≈0.65-0.75, C≈0.15-0.20  (high-stim accent, rare)
  			//   tint   → lightened (pure + white) L≈0.88, C≈0.07  (soft UI fills, selected states)
  			//   wash   → very light tint          L≈0.94, C≈0.03  (backgrounds, hairlines)
  			//
  			// Brand rule: TINTS ONLY for interactive accents (chips, selected
  			// states, fills). `shade`/`deep`/`hue` are reserved for structural
  			// typography or deliberate brand-moment use per the stimulation tier.
  			//
  			// Cyan rule: ⚠️ cyan is RESTRICTED — it's a dark-mode anchor (lifted/
  			// glow/dim) and a rare brand-moment hue (hero covers, big CTAs).
  			// In light mode, use NAVY.TINT for default highlights (active states,
  			// selected cells, chips). Cyan may be deprecated entirely.
  			//
  			// DEFAULT alias: keeps `bg-navy` / `bg-cyan` / etc. working without
  			// the family being suffixed — points at the most-common-use variant.
  			// ─────────────────────────────────────────────────────────────────
  			navy: {
  				DEFAULT: '#104357',  // alias → navy.shade (the 76+ `*-navy` usages)
  				deep: '#08293A',     // rare structural emphasis
  				shade: '#104357',    // typography anchor (body text, headlines)
  				// Saturated zone — distinct higher chroma (link colour):
  				'bright-deep': '#0F5091',  // L=0.41 C=0.15 h=253. Inline link colour on hover (two-axis: colour deepens + border thickens).
  				bright: '#1C6EB4',         // L=0.51 C=0.15 h=252. Inline link colour at rest. Higher chroma than the rest of the navy ramp — reads as "interactive" without leaving the navy neighbourhood. Dark-mode analogue: cyan.glow.
  				tone: '#4D7689',     // secondary text, labels, dim hover
  				tint: '#A7E1FC',     // soft blue fills — THE light-mode highlight accent (selected chips, calendar selected day, list bullets, blockquote hairline, focus outlines)
  				// Atmospheric / wash zone — three variants, ordered by pigment:
  				frame: '#E8F0F4',    // near-neutral (L=0.95 C=0.01). THE workhorse for borders, hairlines, structural framing. "Navy frames everything" — see color rule #5.
  				veil: '#E1F2F9',     // intermediate (L=0.95 C=0.02). For soft text-containing backgrounds — trust asides, "Reviewed by" banners, empty-state fills. Subtle enough not to compete with text, visible enough to register as a contained surface.
  				wash: '#D7F0FB',     // visibly navy-tinted (L=0.94 C=0.03). For hover backgrounds and fills where the navy tint should READ. Don't use behind body text — too much pigment competes with readability.
  			},
  			cyan: {
  				DEFAULT: '#04C9D8',  // alias → cyan.hue (bare `bg-cyan`)
  				shade: '#028E97',    // dark cyan — active text on cyan fills (legacy)
  				hue: '#04C9D8',      // vivid cyan — RARE brand-moment use only
  				tint: '#9DE8EF',     // ⚠️ avoid in light mode (use navy.tint instead)
  				wash: '#D5F2F4',     // ⚠️ avoid in light mode (use navy.wash instead)
  				// Dark-mode-specific (named for role, not painter's vocabulary):
  				glow: '#4CE4F0',     // bright cyan borders/hover on dark surfaces
  				lifted: '#E3F2F7',   // off-white body text in dark mode
  				dim: '#9ED2E1',      // secondary text in dark mode
  			},
  			orange: {
  				shade: '#BD5318',    // dark orange — rare emphasis
  				hue: '#E05E00',      // brand orange — CTA accent (Easter eggs, arrows, small caps)
  				bright: '#FF7F0F',   // boosted hue (rare punch — no canonical role yet)
  				tint: '#FECBAF',     // soft peach — warm UI fills
  				wash: '#FDE6DA',     // peach wash — opinion/featured surfaces
  			},
  			gold: {
  				shade: '#B8893A',    // dark gold — rare
  				hue: '#D4A657',      // brand gold — the primary CTA color
  				tint: '#F0D49F',     // soft gold — atmospheric warmth
  				wash: '#F5EAD5',     // gold wash — confirmation/success bg
  			},
  			green: {
  				shade: '#236925',    // dark green
  				hue: '#3DB540',      // brand green — rare emphasis
  				tint: '#BBE5B8',     // soft green
  				wash: '#E0F1DF',     // green wash
  			},
  		},
  		borderRadius: {
				md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			lg: 'calc(var(--radius) + 1px)',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

export default config;
