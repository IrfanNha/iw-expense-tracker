# Changelog

All notable changes to **IW Expense Tracker** are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.2.3] — 2026-07-03

### ✨ Changed — Desktop Sidebar Overhaul

Complete visual redesign of the desktop sidebar navigation for a cleaner, more mature look.

- **Flat active state** — active items now use a solid `foreground/background` fill instead of the previous `primary/10` tinted background, giving a sharper, more intentional visual
- **Inline icon treatment** — removed heavy icon badge boxes (`bg-muted` squares); icons are now rendered inline with `opacity-60` at rest and `opacity-80` on hover for subtlety
- **Category groupings** — navigation is now organized into labelled sections: *Overview*, *Finance*, *Manage*, *Insights*, *Preferences* — consistent with the mobile drawer layout
- **User identity card** — compact avatar (initial letter) + name/email card in `bg-muted/50` replaces the old plain text header
- **Thinner dividers** — `Separator` component replaced with `border-t border-border/60` for a lighter, more minimal separation
- **Footer refinement** — "Appearance" label with `ThemeToggle`, and sign-out button uses destructive text color on hover without a heavy background block
- **Width reduced** from `w-64` (256 px) to `w-[220px]` for better proportions

### ✨ Changed — Elegant Sidebar Scrollbar

- Added `.sidebar-scroll` CSS utility class in `globals.css`
- Scrollbar is **invisible by default** — appears only when the user hovers over the nav area
- Thumb is **3 px wide**, `border-radius: 999px`, fades in/out with a 0.3s `opacity` transition
- Fully adapted for **dark mode** using a light `oklch(1 0 0 / 0.15)` thumb color

### 🔧 Fixed — Mobile Drawer Performance (Laggy / Jank)

Resolved sluggish drawer animation on lower-end mobile devices.

- **`React.memo`** applied to `DrawerNavItem`, `DrawerSection`, and `PrimaryNavItem` — prevents unnecessary re-renders when only unrelated state changes
- **`useCallback`** on `handleClose` and `handleSignOut` — produces stable references so memoized children are not invalidated on every parent render
- **`transition-all` → `transition-colors`** — narrows the CSS transition scope, reducing per-frame paint cost on the GPU
- All nav data constants (`PRIMARY_NAV`, `DRAWER_SECTIONS`) moved to **module scope** — no longer re-created inside the component on each render

---

## [1.2.2] and earlier

> Changelog not yet recorded for previous versions.
