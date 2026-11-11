# AgriTech Design System

## Direction

**Modern Agrarian Ledger (Caderno do Produtor Moderno).** A crisp, authentic, and purposeful visual identity connecting regional producers directly with local families. Free from stereotypical AI tropes (no warm-cream or beige wash, no fake CSS wicker baskets, no emojis as iconography, no kickers/eyebrows, and no unblurred offset shadows). It communicates verified origin, harvest timing, and fair trade through deliberate typography, crisp hairline containers, and an authoritative botanical palette.

## Foundations

- **Colour:** Deep pine forest (`#0d3820`) grounds brand authority; foliage green (`#155c34`) drives primary user actions; fresh botanical mist (`#f8faf7`) forms a clean, luminous page ground; pure white (`#ffffff`) provides crisp surface clarity; supportive sage (`#edf4ec`) highlights secondary groupings. All text pairings strictly meet WCAG AA contrast (≥ 4.5:1 for body and placeholders, ≥ 3:1 for large display).
- **Type:** Robust system grotesk stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`) tuned for speed, density, and legibility across all DPIs. Headings use `text-wrap: balance` with tight tracking (-0.025em to -0.035em); body copy uses `text-wrap: pretty` to eliminate stragglers and orphans. Minimum body text is 14px (16px base); micro labels stay at 12px minimum.
- **Shape:** Architectural, consistent geometry. Controls use 10px radius; cards use 14px radius; feature sections use 18px radius. Free from irregular CSS morph blobs.
- **Elevation:** Single, clean depth hierarchy. Default cards use a subtle 1px border (`#e2e8e1`) with minimal resting shadow (`0 1px 3px rgba(13, 56, 32, 0.04)`); elevated and hover states gain soft, diffused natural depth (`0 8px 24px -4px rgba(13, 56, 32, 0.08)`). Hard zero-blur block shadows are banned.
- **Icons & Mark:** The brand is anchored by a bespoke vector seed-and-sprout monogram (`LogoIcon`). All interface iconography is authored in consistent 1.8px line weight in `frontend/components/icons.tsx`. Emojis and unicode characters are strictly excluded from functional iconography.

## Layout & Hierarchy

- Constrain tasks with `--content-max` (1180px) and `--content-narrow` (840px).
- Public landing pages lead with the tangible Weekly Harvest Board (displaying real batch data, verified producers, units, and delivery dates) rather than decorative placeholder cartoons.
- Headings speak for themselves; banned kickers/eyebrows above headings are removed.
- Cards never contain nested cards; list items inside panels are structured as borderless or divider-separated rows.

## Interaction & Accessibility

- Interactive controls have high-contrast focus rings (`2px solid var(--action)`, 2px offset).
- Inputs, buttons, and selects provide tactile, smooth 160ms ease transitions; reduced-motion users (`prefers-reduced-motion: reduce`) receive immediate state changes without animation.
- All product copy and workflows in Portuguese are preserved intact.
