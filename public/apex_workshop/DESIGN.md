---
name: Apex Workshop
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#006242'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d55'
  on-tertiary-container: '#bdffdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-kpi:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  metadata:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is crafted for a premium automotive SaaS environment, specifically tailored for motorcycle workshop management. The brand personality is **reliable, professional, and precise**, balancing high-level operational efficiency with a clean, inviting aesthetic.

The design style follows a **Corporate / Modern** approach with **Minimalist** influences. It prioritizes clarity and data density without overwhelming the user. The interface utilizes solid surfaces and structural grid alignment to evoke a sense of mechanical order. A touch of **Glassmorphism** is reserved exclusively for high-level summary cards and floating navigation elements to add a premium, contemporary feel to the analytical layers of the application.

Targeting workshop owners and service advisors, the emotional response should be one of "controlled momentum"—the feeling that every repair, part, and payment is organized and moving forward.

## Colors

This design system utilizes a palette that reflects automotive precision. The background is a crisp, soft white (`#F8FAFC`) to minimize eye fatigue during long operational hours. 

- **Primary Blue:** Used for primary actions, brand presence, and active states (Dikerjakan).
- **Secondary Orange:** Highlights operational urgency, pending tasks, or specific motorcycle diagnostic alerts.
- **Semantic Palette:** Success (Soft Green), Critical (Soft Red), and Warning (Soft Yellow/Amber) follow standard industry patterns but are tuned for high legibility against light surfaces.
- **Surface Neutrals:** A range of cool grays (`#F1F5F9` to `#E2E8F0`) defines borders and container tiers.
- **Typography:** A dark navy (`#1E293B`) is used instead of pure black to maintain a premium feel and better contrast control.

## Typography

The design system uses **Inter** for all roles to ensure maximum readability and a systematic, clean aesthetic. 

- **KPIs & Metrics:** Use `display-kpi` for large numerical data (e.g., total daily revenue or active service bays).
- **Hierarchy:** Clear distinction is made between operational labels (uppercase `label-sm`) and general content. 
- **Density:** `body-md` is the workhorse for table data and form inputs, optimized for information-dense workshop dashboards.
- **Responsiveness:** Large headlines scale down on mobile devices to prevent awkward wrapping in narrow columns.

## Layout & Spacing

The system is built on a strict **8px grid** to ensure consistency across all components.

- **Grid Model:** A 12-column fluid grid for desktop, a 6-column grid for tablet, and a 2-column or single-column stack for mobile.
- **Margins & Gutters:** Desktop layouts use 32px external margins with 16px gutters between cards. Mobile uses 16px margins to maximize screen real estate.
- **Padding:** Internal card padding is standardized at `md` (16px) for standard data and `lg` (24px) for hero sections or summary blocks.
- **Density:** In data-heavy views (Parts Inventory, Service Logs), vertical spacing can be reduced to `xs` (4px) or `sm` (8px) within list items to increase visibility.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Subtle Shadows**.

- **Base Layer:** The background is `#F8FAFC`.
- **Surface Layer:** Cards and containers use a white background (`#FFFFFF`) with a 1px border in `#E2E8F0`. This creates a crisp, "engineered" look.
- **Shadows:** A single, soft shadow style is used for all standard cards: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`. This provides a gentle lift without looking overly digital.
- **Glassmorphism:** High-level summary widgets or "floating" action bars utilize a backdrop-filter (blur: 12px) and 80% opacity white fill. This differentiates analytical "overviews" from operational "work areas."
- **Interactive States:** On hover, cards may increase shadow slightly or shift border color to Primary Blue to indicate interactivity.

## Shapes

The shape language is professional and modern, using varied corner radii to distinguish between containers and interactive elements.

- **Cards:** Use `rounded-xl` (1.5rem / 24px) or `rounded-lg` (1rem / 16px) for major dashboard sections to create a friendly, premium appearance.
- **Interactive Elements:** Buttons and Input Fields use a tighter `10px` radius (defined as a custom utility) to maintain a more "technical" and precise look compared to the larger containers.
- **Badges/Chips:** Use full pill shapes (`rounded-full`) for status indicators (Selesai, Terlambat) to make them instantly recognizable as distinct from buttons.

## Components

### Buttons
- **Primary:** Solid `#2563EB` with white text. 10px rounded corners.
- **Secondary:** Outline style with 1px `#E2E8F0` border and `#1E293B` text.
- **Ghost:** No background/border, used for "Cancel" or "Back" actions.

### Cards & Summary Widgets
- All cards must have a 1px `#E2E8F0` border.
- Summary widgets (Glassmorphism) should include a 1px inner white stroke to enhance the "glass" edge.

### Status Chips
- **Selesai:** Light green background, dark green text.
- **Menunggu:** Light gray background, medium gray text.
- **Dikerjakan:** Light blue background, primary blue text.
- **Terlambat:** Light red background, dark red text.
- All chips use `label-sm` typography and pill-shaped corners.

### Inputs & Tables
- **Inputs:** 10px rounded corners, 1px `#E2E8F0` border. On focus, the border transitions to Primary Blue with a subtle 2px glow.
- **Tables:** Clean lines, no vertical borders. Header row uses `label-sm` with a light gray background (`#F1F5F9`).

### Iconography
- **Style:** Linear, 2px stroke weight.
- **Thematic Elements:** Use automotive-specific icons (Wrench, Gear, Oil Drop, Motorcycle, Clipboard) with consistent line endings (rounded).
- **Color:** Icons should match the text color context (`secondary` or `muted`) unless they are active status indicators.