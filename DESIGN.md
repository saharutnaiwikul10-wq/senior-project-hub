# Design Brief

## Direction

ครุฑาสาร (Garuda Charter) — an academic registry for Thai senior projects: proposals, milestones, submissions, and evaluations treated with the gravity of a university thesis archive.

## Tone

Refined institutional — warm paper surfaces, deep ink-navy structure, and a brass seal accent; serious and trustworthy without the cold blue SaaS cliché.

## Differentiation

Status is the hero: every project, milestone, and score carries a colored seal-style badge and a numeric progress bar, so the whole app reads like a stamped, trackable dossier rather than a generic dashboard.

## Color Palette

| Token      | OKLCH        | Role                                      |
| ---------- | ------------ | ----------------------------------------- |
| background | 0.985 0.004 95 | Warm paper canvas (light)               |
| foreground | 0.22 0.03 260 | Ink-navy body text                       |
| card       | 1 0 0        | Elevated white dossier cards              |
| primary    | 0.42 0.13 258 | Ink navy (กรมท่า) — nav, primary actions  |
| accent     | 0.72 0.14 78  | Brass seal — highlights, active state     |
| muted      | 0.955 0.008 250 | Quiet section fills                     |
| success    | 0.55 0.14 152 | ผ่าน (passed), เสร็จ (done)              |
| warning    | 0.72 0.15 78  | รออนุมัติ (pending), ใกล้ถึงกำหนด        |
| info       | 0.55 0.13 240 | ส่งแล้ว (submitted)                       |
| progress   | 0.6 0.14 220  | กำลังดำเนินการ (in-progress)              |
| draft      | 0.62 0.02 255 | ฉบับร่าง (draft) — neutral slate          |
| destructive | 0.53 0.2 27  | ไม่ผ่าน (failed), เลยกำหนด                |

## Typography

- Display: Space Grotesk (bundled) — headings, project titles, numeric stats
- Body: Noto Sans Thai → IBM Plex Sans Thai → Sarabun → Leelawadee UI (OS Thai stack) with Space Grotesk fallback — all Thai UI text
- Mono: JetBrains Mono (bundled) — project codes, IDs, dates, scores
- Scale: hero `text-3xl md:text-4xl font-bold tracking-tight`, h2 `text-xl md:text-2xl font-bold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm md:text-base`

## Elevation & Depth

Flat paper base with three shadow tiers — `shadow-subtle` on resting cards, `shadow-elevated` on hover/popovers, `shadow-inset-soft` on inputs; borders carry most structure, shadows add only gentle lift.

## Structural Zones

| Zone    | Background        | Border      | Notes                                              |
| ------- | ----------------- | ----------- | -------------------------------------------------- |
| Header  | `bg-card`         | `border-b`  | Sticky app bar; role badge + search + user menu    |
| Sidebar | `bg-sidebar`      | `border-r`  | Persistent nav hierarchy for the data-dense tool   |
| Content | `bg-background`   | —           | Alternate `bg-muted/40` between dashboard sections |
| Footer  | `bg-muted/40`     | `border-t`  | Quiet meta line, small text                        |

## Spacing & Rhythm

Tight, information-dense rhythm: `gap-4`/`gap-6` between cards, `p-5` card padding, `gap-2` inside badges/rows, `space-y-1` for label-value stacks; sections separated by `py-8` with `border-t`.

## Component Patterns

- Buttons: `rounded-md`, primary uses `bg-gradient-primary` with `shadow-subtle`, secondary is outlined, hover lifts with `shadow-elevated` and `transition-smooth`
- Cards: `rounded-lg bg-card border shadow-subtle`, hover `shadow-elevated` + `border-primary/40`; project cards clickable
- Badges: pill `rounded-full` with status token background at low opacity + solid token text; seal-style dot prefix
- Progress bars: `h-2 rounded-full bg-muted` track with token-colored fill, animated `progress-grow`, `tabular` percent label

## Motion

- Entrance: `animate-fade-in-up` staggered 40–80ms across card grids
- Hover: `transition-smooth` (300ms) on border, shadow, and background; no bounce
- Decorative: `animate-progress-grow` on progress bars, `animate-fade-in` on popovers/status changes

## Constraints

- Thai is the primary UI language; all labels, statuses, and copy in Thai with Latin subtitles where useful
- Status colors must stay distinguishable and AA-contrast in both light and dark modes
- No email notifications and no PDF export/print surfaces — do not design zones for them
- 3–5 core hues only: ink navy, brass, plus semantic status colors; no rainbow charts

## Signature Detail

The "seal badge" — a circular brass-ringed status stamp with a Thai status word and Latin gloss, echoing a stamped academic dossier and giving every record a scannable, official identity.
