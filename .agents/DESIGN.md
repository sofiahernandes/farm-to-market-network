# AgriTech Design System

## Direction

**Unified Apple Fluid Interface & Botanical Ledger.** A physical, responsive, and high-craft interface connecting regional family farmers directly with urban households. All visual tokens, typography, layout primitives, and component styles live in a single source of truth (`frontend/app/globals.css` + `frontend/components/ui.tsx`) so changes propagate consistently across every route without scattered inline styles.

## Foundations

- **Full-Opacity 5-Color Palette (`#ffffff`, `#2a5515`, `#bb153f`, `#d7f437`, `#ff9138`):**
  Every color in the palette is rendered at **100% full opacity** — zero diluted `rgba()` tints or washed-out backgrounds. Visual hierarchy and breathing room are achieved through deliberate **surface proportion** and structural borders:
  - **Pure White (`#ffffff` — ~75% Dominant Canvas & Card Surfaces):** Page canvas, cards, inputs, modals, and sheets remain crisp `#ffffff` so content breathes effortlessly.
  - **Botanical Forest (`#2a5515` — ~15% Structural Architecture & Ink):** Grounds brand authority, all primary/body typography, crisp structural borders (`1.5px` and `2px solid #2a5515`), solid offset shadows, and inverted hero/trust bands (`.trust-strip`, `.cta-section`, `.harvest-board`, `.site-footer`).
  - **Ruby Crimson (`#bb153f` — ~5% Primary Commitments & Focus):** Drives primary interactive commitments (`.button-primary`), active navigation pills, focus rings, and alert badges with crisp `#ffffff` text.
  - **Harvest Lime (`#d7f437` — ~3% High-Visibility Highlights):** Energizes active status pills (`.status-success`, `.harvest-status-live`), step markers, cart counters, and featured tags paired with `#2a5515` ink.
  - **Warm Tangerine (`#ff9138` — ~2% Warm Accents & Warnings):** Highlights harvest metadata, category indicators, warning badges (`.status-warning`), and warm botanical artwork accents.
- **Single Source of Truth (`frontend/app/globals.css`):**
  - **Design Tokens (`:root`):** Centralized palette (`--palette-*`), semantic roles (`--bg-*`, `--ink-*`, `--action-*`), typography scale (`--text-xs` to `--text-display`), spacing scale (`--space-1` to `--space-8`), radii (`--radius-xs` to `--radius-pill`), borders (`--border-thin`, `--border-thick`, `--border-accent`), and solid offset elevation (`--shadow-sm`, `--shadow-md`, `--shadow-lg`).
  - **Layout & Composition Primitives:** Reusable classes (`.stack-xs`, `.stack-sm`, `.stack-md`, `.stack-lg`, `.cluster-sm`, `.cluster-md`, `.row-between`, `.row-baseline`, `.section-divider`, `.section-divider-auto`, `.section-label`, `.inset-box`, `.list-row`, `.payout-row`, `.stepper-control`, `.stepper-value`, `.form-city-uf`, `.push-end`) eliminate ad-hoc `style={{ ... }}` across pages.
- **Type:** System UI font stack (`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif`) with `font-optical-sizing: auto`. Tracking is size-specific (negative `-0.03em` to `-0.014em` on display and headings, `0` on body copy, positive `+0.015em` to `+0.04em` on micro labels), and leading scales inversely (`1.04` on hero display to `1.5` on body copy). Layout and spacing use `rem`/`em` to respect Dynamic Type.
- **Fluid Motion & Direct Manipulation:**
  - Buttons and interactive cards respond immediately on `pointer-down` (`:active { transform: scale(0.97) }`) with `touch-action: manipulation` to eliminate tap delay.
  - Interactive sheets (`FluidSheet` in `frontend/components/ui.tsx`) use `frontend/lib/apple-fluid.ts` for 1:1 pointer tracking (`setPointerCapture`), interruptible `requestAnimationFrame` springs (`damping: 0.8–1.0`, `response: 0.3–0.4s`), velocity handoff, exponential momentum projection (`project()`), and progressive boundary resistance (`rubberband()`).
- **Icons & Mark:** Anchored by the custom vector seed-and-sprout monogram (`LogoIcon` in `frontend/components/icons.tsx`) using 100% solid `#2a5515`, `#ffffff`, `#d7f437`, and `#ff9138`.

## Accessibility & User Signals

- **`prefers-reduced-motion: reduce`:** Replaces spring/transform animations with gentle `200ms ease` opacity/color cross-fades and disables scale/translate transforms.
- **`prefers-contrast: more`:** Enforces `2px solid #2a5515` borders across all interactive and card surfaces.
- All Portuguese product copy and domain workflows remain intact.
