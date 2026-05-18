# SCSS Architecture & Guidelines

## Overview
Modular, maintainable SCSS structure with centralized constants, reusable mixins, and component-focused partials.

---

## Folder Structure

```
src/scss/
├── index.scss              # Main entry point — imports all partials
├── _constants.scss         # ✓ Centralized variables (colors, transitions, shadows, z-indexes, breakpoints)
├── _mixins.scss            # ✓ Reusable SCSS functions (buttons, alerts, modals, responsive)
├── _components.scss        # Forms, buttons, inputs, alerts, dialogs, tables
├── _cards.scss             # Movie cards, item lists, overlays
├── _genres.scss            # Genre badges, titles, tags
├── _layout.scss            # Global layout, header, navigation, theme colors
├── _project.scss           # Project-specific rules (home page, stats, etc.)
├── _torrents.scss          # Torrent section styling
├── _maintenance.scss       # Admin/maintenance page styling
└── README.md               # This file
```

---

## Key Principles

### 1. **Single Source of Truth**
- All theme colors, transitions, shadows, and z-indexes defined in `_constants.scss`
- Changes propagate automatically across all files using `c.$variable-name`

### 2. **DRY (Don't Repeat Yourself)**
- Common patterns extracted as mixins (`@mixin make-button()`, `@mixin hover-lift()`, etc.)
- Avoid inline hardcoded values — use variables instead

### 3. **Semantic Naming**
- Classes use descriptive, consistent naming:
  - `.card-film` — Movie card component
  - `.card-info-film` — Card info overlay/modal
  - `.item-list` — Container for card lists
  - `.btn-primary`, `.btn-danger` — Button variants

### 4. **Component Organization**
- Each partial focuses on one domain (buttons, cards, layout, etc.)
- Related elements grouped together with clear comments (`// SECTION NAME`)

---

## Centralized Variables (`_constants.scss`)

### Colors (Bootstrap-like)
```scss
// Primary palette
$bs-blue: #1089cd;
$bs-red: #dc3545;
$bs-green: #55ba54;
$bs-yellow: #ffc107;  // Used by warning buttons

// Grays
$bs-gray: #6c757d;
$bs-gray-300: #dee2e6;
$bs-gray-900: #212529;

// Theme-specific colors
$color-dark-bg: #202328;        // Dark background
$color-dark-text: #f0f1f3;      // Dark text
$color-dark-secondary: #343a40; // Dark secondary
```

### Transitions (Performance Optimized)
```scss
$transition-fast: 0.15s ease-in-out;    // Button/input quick feedback
$transition-base: 0.2s ease-in-out;     // Standard UI transitions
$transition-slow: 0.3s ease;            // Smooth visual effects
$transition-medium: 0.5s ease-in-out;   // Longer animations
```

### Shadows (Depth Hierarchy)
```scss
$shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.1);     // Subtle
$shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);    // Medium
$shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);     // Large (menus, dropdowns)
$shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.4);    // Extra large (modals)
$shadow-focus: 0 0 0 0.25rem rgba(49, 132, 253, 0.5); // Focus rings
```

### Z-Index Scale (Predictable Layering)
```scss
$z-control: 50;          // Floating action buttons
$z-sticky-top: 100;      // Sticky headers
$z-fixed-nav: 110;       // Fixed navigation menus
$z-modal-backdrop: 999;  // Modal backdrops
$z-modal-overlay: 9999;  // Modal content (highest)
```

### Breakpoints (Mobile-First)
```scss
$breakpoint-xs: 480px;   // Extra small (phones)
$breakpoint-sm: 640px;   // Small (landscape phones)
$breakpoint-md: 768px;   // Medium (tablets)
$breakpoint-lg: 1024px;  // Large (laptops)
$breakpoint-xl: 1280px;  // Extra large (desktops)
$breakpoint-2xl: 1536px; // 2X large (wide screens)
```

### Alert Colors (Semantic)
```scss
$alert-info-color: #084298;
$alert-info-bg: rgba(207, 226, 255, 0.15);
$alert-info-border: rgba(182, 212, 254, 0.2);

// Same pattern for: success, warning, danger
```

---

## Available Mixins (`_mixins.scss`)

### `@mixin make-button($color, $background)`
Generate button variants with hover/focus states.
```scss
.btn-custom {
    @include make-button(white, $bs-blue);  // Defines color, background, hover, focus
}
```

### `@mixin make-all-button($buttons-map)`
Generate multiple button classes from a map.
```scss
$buttons: (
    "primary": ("color": white, "bkg": $bs-blue),
    "danger": ("color": white, "bkg": $bs-red),
);
@include make-all-button($buttons);
```

### `@mixin make-alert($color, $background, $border)`
Generate alert variants.
```scss
.alert-info {
    @include make-alert($alert-info-color, $alert-info-bg, $alert-info-border);
}
```

### `@mixin hover-lift($scale, $shadow)`
Combine scale and shadow for hover effects.
```scss
.card-film {
    @include hover-lift(1.07, $shadow-lg);  // Scales 7%, applies shadow
}
```

### `@mixin modal-overlay()`
Standardize modal visibility/opacity patterns.
```scss
.card-info-film {
    @include modal-overlay(hidden);  // Initial state: hidden
    &.visible { // Automatically handled in mixin
        visibility: visible;
        opacity: 1;
    }
}
```

### `@mixin truncate()`
Single-line text truncation.
```scss
.card-title {
    @include truncate();  // Adds overflow, text-overflow, white-space
}
```

### `@mixin respond-to($breakpoint)`
Mobile-first responsive breakpoints.
```scss
.container {
    width: 100%;  // Mobile default
    @include respond-to("md") { width: 80%; }
    @include respond-to("lg") { width: 70%; }
}
```

---

## Partial Descriptions

### `_components.scss`
Contains all UI components:
- `.btn`, `.btn-*` — Button variants and styles
- `input`, `select` — Form inputs with validation states
- `.alert` — Alert containers and colors
- `dialog` — Modal dialogs (dark theme)
- `.btn-group` — Button groups
- Tables — Table styling with hover effects

**Canonical Owner:** Buttons, forms, alerts, modals
**Policy:** New button/form/dialog styles go here first

### `_cards.scss`
Movie card components and overlays:
- `.item-list` — Container for cards
- `.card-film` — Individual movie card with hover effects
- `.card-info-film` — Card info overlay (modal-like)
- `.recent-movies-container` — Recent movies grid

**Canonical Owner:** Movie cards, card lists, overlays
**Note:** Uses `@include hover-lift()` for consistent effects

### `_genres.scss`
Genre-related styling:
- `.popup-genre` — Genre badges (top-left of cards)
- `.genre-title` — Genre page titles
- `.home-container` — Genre cloud container
- `.genre-tag` — Individual genre tag/link

**Canonical Owner:** Genre styling, genre pages

### `_layout.scss`
Global layout and navigation:
- `:root` — CSS custom properties (theme colors)
- `body` — Global fonts, transitions
- `header`, `nav` — Navigation bar
- `.menu` — Dropdown menus (theme toggle, options)
- `#control` — Floating action button
- Scrollbar styling

**Canonical Owner:** Global layout, header, navigation
**Note:** Theme colors (CSS vars) bridge between SCSS and JavaScript theme toggle

### `_project.scss`
Project-specific rules:
- `#form-editor` — Editor form styling
- `.statistics-container` — Stats page
- `.home-container` — Home page sections
- `.quick-stats` — Stat cards

**Canonical Owner:** Project-specific pages
**Policy:** Move generic patterns to other partials; keep only project-specific overrides

### `_torrents.scss`
Torrent download section:
- `#films-torrent`, `#series-torrent` — Torrent containers
- `.torrent-container` — Layout
- Link styling for torrent options

**Canonical Owner:** Torrent page styling

### `_maintenance.scss`
Admin/maintenance pages:
- `.maintenance-list` — Maintenance options
- `.container-advance-search` — Advanced search form
- `.head-result` — Result headers

**Canonical Owner:** Admin/maintenance page styling

---

## Workflow: Adding New Styles

### ✅ DO:
1. **Check `_constants.scss` first** — Is there already a variable for this color/transition/shadow?
2. **Use existing mixins** — Button? Use `@mixin make-button()`. Modal? Use `@mixin modal-overlay()`.
3. **Add to correct partial** — New button style? → `_components.scss`. New card variant? → `_cards.scss`.
4. **Use semantic names** — `.card-title-large` (not `.title-big`), `.btn-action-primary` (not `.btn-action1`).

### ❌ DON'T:
1. **Hardcode colors** — Use `c.$bs-blue` or `c.$color-dark-bg`
2. **Hardcode transitions** — Use `c.$transition-*` variables
3. **Hardcode z-indexes** — Use `c.$z-*` scale
4. **Duplicate button code** — Use `@extend .btn` or `@include make-button()`
5. **Add styles to wrong partial** — Keep files organized and focused

---

## Compilation

### Development (Expanded Output)
```bash
sass --watch src/scss:public/css --style expanded
```
Generates readable CSS with source maps for debugging.

### Production (Compressed)
```bash
sass src/scss/index.scss public/css/styles.css --style compressed
```
Minimizes CSS file size (~40% reduction vs. expanded).

---

## Theme Customization

### Dark Theme (Default)
CSS custom properties in `:root`:
```css
--color-bg-primary: #212529;
--color-text-primary: #ffffff;
--color-accent: #e50914;
```

### Light Theme
CSS custom properties in `[data-theme="light"]`:
```css
--color-bg-primary: #f4f4f4;
--color-text-primary: #141414;
--color-accent: #e50914;
```

**How it works:**
1. JavaScript toggles `[data-theme="light"]` on `<html>`
2. CSS custom properties cascade and update
3. SCSS uses these CSS vars for theme-specific colors
4. No SCSS recompilation needed for theme toggle

---

## Performance Optimization

### ✓ Optimizations Applied:
- Variables replace hardcoded values (~50+ fewer repetitions)
- Mixins reduce code duplication (~30+ lines saved)
- Z-index scale prevents layering conflicts
- Transition variables ensure consistent timing (faster parsing)
- Shadow variables reduce memory footprint

### ✓ Responsive Design:
- Mobile-first approach with `$breakpoint-*` scale
- Breakpoints honor viewport-first design
- `@mixin respond-to()` simplifies media queries

---

## Maintenance Tips

1. **Update theme?** → Modify `_constants.scss` CSS vars (dark/light sections)
2. **New button style?** → Add to `$buttons` map in `_components.scss`, regenerate with `@include make-all-button()`
3. **Refactoring colors?** → Search/replace in `_constants.scss`, changes cascade automatically
4. **Audit unused variables?** → Check `UNUSED_BS_VARIABLES.md` and `OPTIMIZATION_REPORT.md`
5. **Scale down CSS file?** → Compile with `--style compressed` for production

---

## Future Enhancements

1. **CSS Grid Utilities** — Centralize grid templates
2. **Spacing Scale** — Define consistent margin/padding increments
3. **Typography Scale** — Define font-size/line-height tiers
4. **Animation Library** — Centralize keyframe animations
5. **Color Functions** — Leverage `color.adjust()` for variants

---

## Related Files
- `OPTIMIZATION_REPORT.md` — Detailed changes and metrics
- `UNUSED_BS_VARIABLES.md` — Candidate variables for removal
- `package.json` — Build scripts (if using npm)

---

**Last Updated:** May 18, 2026
**Maintained By:** Frontend Team
**Status:** ✅ Active & Optimized
