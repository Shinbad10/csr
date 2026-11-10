---
name: VISI CSR
description: Dense Vietnamese operations console for community eye-screening, from đợt khám to theo dõi mổ.
colors:
  navy: "#031da6"
  navy-deep: "#020f5c"
  navy-ink: "#010833"
  navy-soft: "#eef2ff"
  teal: "#02b8a9"
  teal-deep: "#017a70"
  teal-ink: "#017a70"
  teal-soft: "#e6faf7"
  amber: "#d97706"
  amber-deep: "#b45309"
  amber-soft: "#fef6eb"
  rose: "#d41a43"
  rose-deep: "#be123c"
  rose-soft: "#fef1f4"
  green: "#059669"
  green-soft: "#ecfdf5"
  green-deep: "#047857"
  violet: "#7c3aed"
  violet-deep: "#6d28d9"
  violet-soft: "#f5f0ff"
  gold: "#c08a1e"
  gold-deep: "#8a5a00"
  gold-soft: "#fdf6e3"
  gold-line: "#f0dfb3"
  ink: "#0d1025"
  ink-soft: "#45495e"
  mute: "#666b80"
  mute-soft: "#7d8296"
  line: "#eef0f5"
  line-soft: "#f4f5f9"
  line-strong: "#d3dbe8"
  line-heavy: "#c5cede"
  bg: "#f7f8fc"
  surface: "#ffffff"
  surface-soft: "#fafbfd"
  surface-hover: "#f1f4f9"
typography:
  page-title:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  modal-title:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.25
  section-title:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "15.5px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  body-compact:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.45
  field-label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
  micro-label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.12em"
  data-mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 600
    fontFeature: "tnum"
  body-touch:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.45
  section-title-touch:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "14.5px"
    fontWeight: 600
  title-touch:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.25
  stat-sm:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "18px"
    fontWeight: 800
    fontFeature: "tnum"
  stat-md:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "20px"
    fontWeight: 800
    fontFeature: "tnum"
  stat-lg:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
rounded:
  xs: "4px"
  cell: "6px"
  md: "6px"
  lg: "8px"
  xl: "10px"
  card: "10px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    typography: "{typography.body-compact}"
    height: "36px"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.navy-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 14px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.navy}"
  button-danger:
    backgroundColor: "{colors.rose-soft}"
    textColor: "{colors.rose}"
    rounded: "{rounded.md}"
  button-danger-hover:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.surface}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    typography: "{typography.body}"
    height: "40px"
    padding: "7px 12px"
  input-field-sm:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 10px"
  choice-row-selected:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.surface}"
    rounded: "{rounded.cell}"
    height: "32px"
  pill-selected:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber-deep}"
    rounded: "{rounded.pill}"
    height: "32px"
  nav-item-active:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.lg}"
    height: "32px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
  table-header:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.mute}"
    typography: "{typography.micro-label}"
---

# Design System: VISI CSR

## Overview

**Creative North Star: "The Field Clinic Ledger"**

VISI CSR is an Operate-mode tool: staff at screening sites, on the bus fleet (đoàn xe) and at the hospital desk work through long lists of patients, eye measurements and surgery schedules, often on a phone in poor light. The system is a ledger first. Dense tables, compact segmented controls and monospace numbers carry the work. A navy masthead and a navy-to-teal accent pair give it a clinical, institutional identity without decoration getting in the way.

Every screen is Vietnamese. Dates are always `dd/mm/yyyy` (typed as `06031952`, auto-formatted). BHYT codes, mã bệnh nhân, visual acuity (Snellen `20/xx`), refraction values and counts are set in JetBrains Mono with tabular figures so columns line up. Fraunces, a warm serif, is kept for titles only: page titles, modal titles and numbered section headers. Manrope does everything else.

Density goes up on desktop and touch size goes up on mobile. Controls are commonly sized `h-9 sm:h-8` or `h-8 sm:h-6`, and type steps the same way (`14px` on a phone to `12px` from `sm`). This keeps the desktop ledger tight while every target on the phone stays tappable.

**Key Characteristics:**
- Operate mode: dense tables, toolbars, segmented controls; Vietnamese copy; `dd/mm/yyyy`.
- Navy is the one brand voice; teal means alive or done; amber pending; rose error; violet only for "Mắt 2".
- Three faces with fixed jobs: Fraunces titles, Manrope UI, JetBrains Mono for every number, code and column label.
- Flat tonal surfaces on a cool off-white page; shadows are hairline-soft everywhere. No glows, no gradient fills on controls, no decorative blur.
- Mobile first in touch size, desktop first in density.
- Full dark theme through token remapping (navy becomes teal in dark).

## Colors

A cool, institutional palette: one deep ultramarine navy for brand and action, one clinical teal for life and completion, with status hues used strictly as signals.

### Primary
- **VISI Ultramarine** (navy): brand, primary buttons (flat navy, navy-deep on hover), the selected segment in "ChoiceRow", selected calendar day, focus outline, the active item in dropdown menus, links and hover text on secondary buttons. The masthead is a horizontal gradient of navy-ink, navy and navy-deep.
- **Midnight Navy** (navy-deep) and **Ink Navy** (navy-ink): hover / pressed state of navy fills; navy-ink is also the text color on teal fills.
- **Navy Wash** (navy-soft, plus the translucent `--navy-50` 4% and `--navy-100` 8%): selected-row and selected-option backgrounds, focus halo (3px), page-header badge, section-number tiles.

### Secondary
- **Clinic Teal** (teal): positive, live and done. Active top-level nav pill, "Hôm nay" in the calendar, today's date, the icon color inside navy icon tiles, success checks. In dark mode it also takes over navy's role.
- **Deep Teal** (teal-deep, ≥4.7:1) and **Teal Ink** (teal-ink): teal text and icons. `teal-ink` is deep teal on light grounds and switches back to plain teal automatically inside navy or dark blocks (masthead, navy icon tiles, dark mode), where plain teal is the readable one.

### Tertiary (status signals)
- **Pending Amber** (amber, amber-deep, amber-soft): chờ, pending, warnings, and the selected state of multi-select diagnosis pills ("PillGroup").
- **Alert Rose** (rose, rose-deep, rose-soft): errors, invalid dates, destructive buttons, required-field asterisks, Sunday in the calendar. Rose reads ≥4.7:1 even on rose-soft.
- **Confirm Green** (green, green-deep, green-soft): success and "Nhóm A". Text uses green-deep (green alone is 3.8:1 on white).
- **Warm Gold** (gold, gold-deep, gold-soft, gold-line): warm highlight for linked / milestone badges.
- **Second-Eye Violet** (violet, violet-deep, violet-soft): reserved for "Mắt 2" (second-eye surgery) counts, columns and filters. It has no other meaning.

### Neutral
- **Ink** (ink): primary text. **Ink Soft** (ink-soft): labels, secondary values, idle option text.
- **Mute** (mute): helper text, placeholders, table column headers; raised to 5.3:1 on white for WCAG AA. **Mute Soft** (mute-soft): empty-state hints and placeholder values only, ≥3:1.
- **Hairline** (line), **Faint Line** (line-soft), **Firm Line** (line-strong): card borders, row dividers, and input or secondary-button strokes in that order of weight.
- **Cool Paper** (bg): the page ground. **Surface** (surface), **Surface Soft** (surface-soft), **Surface Hover** (surface-hover): cards, table header and footer bands, hover rows.

### Named Rules
**The One Voice Rule.** Navy is the only color that means "act here". Teal never labels a primary action on light mode; it marks what is active, alive or done.

**The Eye Pairing Rule.** Right eye "MP" is always teal and left eye "MT" is always navy (the dot beside each eye's row). Never swap them and never reuse them as status.

**The Violet Is Mắt 2 Rule.** `var(--violet)` appears only for second-eye surgery. Anything else violet is a bug.

**The Token Or Nothing Rule.** Color comes from `var(--token)`. Dark mode works by remapping tokens under `.dark`, so a raw hex or Tailwind palette class is a hole in dark mode.

## Typography

**Display Font:** Fraunces (with ui-serif, Georgia)
**Body Font:** Manrope (with ui-sans-serif, system-ui)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, SFMono-Regular)

All three load with the `vietnamese` subset.

**Character:** a soft, slightly literary serif sets the record's titles while a geometric, sturdy sans and a precise mono do the clerical work; the serif feels like the hospital's letterhead, the mono like its register.

### Hierarchy
- **Page title** (Fraunces 600, 17px mobile / 19px from `sm`, tracking -0.015em): one per page in "PageHeader", set in a single color (ink) — no italic or colored accent words.
- **Modal title** (Fraunces 700, 17px / 21px): dialog headers, truncated on one line.
- **Section title** (Fraunces 600, 14.5px / 15.5px): numbered form sections in the phiếu khám, preceded by a mono `01`, `02` tile.
- **Body** (Manrope 500, 13px, line-height 1.5): input text, table cells, list options (12.5px in popovers).
- **Compact body** (Manrope 600-700, 12-12.5px): buttons, nav items, toolbar controls, segmented options from `sm`.
- **Field label** (Manrope 600, 13px mobile / 11.5-12px desktop, ink-soft).
- **Micro label** (JetBrains Mono 700, 11px, uppercase, tracking 0.12em): table column headers, status badges, small counters.
- **Data** (JetBrains Mono 600-700, tabular numerals): dates, BHYT codes, IDs, acuity, refraction, totals. Big KPI figures go to 15-26px in mono.

### Named Rules
**The 11px Floor Rule.** Nothing a user must read goes below 11px. 11px is the micro-label size; 10.5px and smaller are drift.

**The Numbers Are Mono Rule.** Any value that is compared down a column (a date, a code, a count, a measurement) is JetBrains Mono with `tabular-nums`.

**The Serif Is For Titles Rule.** Fraunces never sets body, labels, buttons or numbers.

## Layout

A single-column app shell: a 52px navy masthead (plus the iOS safe-area inset) with horizontal grouped nav, then a scrolling main area on the Cool Paper ground. Main padding is 12px on mobile and 24px from `sm`, with bottom padding that respects `env(safe-area-inset-bottom)`.

Table pages ("Buổi khám", "Hồ sơ", "Quản trị") and work pages ("Khám", "Tư vấn", "Theo dõi", "Đoàn xe") are full-bleed: the frame does not scroll, the header and filters stay fixed and only the table or form body scrolls. Every page opens with the "PageHeader" card; on mobile its description hides and its actions wrap onto a second row instead of scrolling sideways.

Spacing runs on a 4px base, with 8, 12, 16 and 24px as the common steps. Gaps inside controls are 4-8px; card padding is 12px mobile and 16-20px desktop; modal bodies are 20px and 24px.

**The Touch Up, Dense Down Rule.** Size controls for the phone first and tighten from `sm`: `h-9 sm:h-8`, `h-8 sm:h-6`, `text-[14px] sm:text-[12px]`. On touch screens under 768px, inputs render at 16px so iOS does not zoom.

## Elevation & Depth

Mostly flat. Depth comes from tone (white surfaces on Cool Paper, surface-soft bands for table headers and modal footers) and hairline borders. Shadows are faint and neutral-tinted from ink. There is no colored glow: primary buttons, the selected segment and navy icon tiles are flat navy with at most a 1–2px shadow; selection is shown by fill. Popovers and modals use a large soft shadow and a translucent slate scrim with a slight blur.

### Shadow Vocabulary
- **Hairline** (`box-shadow: 0 1px 2px rgba(13,16,37,0.04)`): cards, page header, secondary buttons at rest.
- **Soft** (`box-shadow: 0 1px 3px rgba(13,16,37,0.04), 0 1px 2px rgba(13,16,37,0.03)`): secondary button hover.
- **Raised** (`box-shadow: 0 4px 12px rgba(13,16,37,0.06), 0 2px 4px rgba(13,16,37,0.03)`): card hover.
- **Floating** (`box-shadow: 0 12px 32px rgba(13,16,37,0.08)`): calendar and popovers.
- **Navy Lift** (`--navy-shadow`: `0 1px 2px rgba(3,29,166,0.18)`, hover `0 2px 4px`): the only shadow a navy fill may carry.

### Named Rules
**The No Glow Rule.** No colored halos, gradient fills, sparkle icons or animated decoration on controls. Emphasis comes from flat navy fill, weight and position.

## Shapes

Tight, console-like corners — never pill-shaped controls. Buttons, inputs, tabs, segmented tracks and selectable chips use 6px; small badges and status labels 4px; cards, page header and popovers 10px; modals 12px. (In Tailwind v4 the `@theme` radius tokens override the defaults: `rounded-sm` 4px, `rounded-md` 6px, `rounded-lg` 8px, `rounded-xl` 10px, `rounded-2xl` 12px.) `rounded-full` is only for true circles: status dots, avatars, toggles and progress bars. Borders are 1px throughout; selection is shown by fill, not by thicker strokes.

## Components

### Buttons
Confident and compact.
- **Shape:** gently rounded (10px), 6px icon gap, weight 700, no wrap.
- **Primary:** flat navy, white text, 6px radius, 1px navy lift. Hover turns navy-deep; active drops to 94% opacity.
- **Secondary:** white surface, firm-line border, hairline shadow; hover turns text navy and lifts to the soft shadow.
- **Outline:** transparent with firm-line stroke and ink-soft text; hover fills navy wash with a navy border.
- **Teal:** teal fill with navy-ink text, for positive confirmations; hover goes teal-deep with white text and lifts 1px.
- **Danger:** rose-soft fill, rose text, translucent rose border; hover fills solid rose with white text.
- **Focus:** a global 2px navy outline at 2px offset on `:focus-visible` (teal in dark mode). Do not remove it.

### Segmented choice ("ChoiceRow")
- **Style:** a surface-soft track with a hairline border, 8px radius, 2px inner padding. Segments are 36px tall on mobile and 32px from `sm`.
- **State:** the selected segment is solid navy with white text; idle segments are ink-soft text. Tapping the selected segment clears it. Used for Có/Không and hướng xử trí.

### Chips ("PillGroup", "StatusBadge")
- **Multi-select chips:** 32px chips with a 6px radius, 1px firm-line border on white. Selected turns amber-soft with amber-deep text and an amber border, plus an "X". 
- **Status badge:** 6px radius, mono 11px uppercase with 0.05em tracking, a 5px dot in the current color, fill and text taken from the status hue's soft and deep tokens.

### Cards / Containers
- **Corner Style:** 10-14px for content cards, 18px for the page header.
- **Background:** surface on the Cool Paper page.
- **Shadow Strategy:** hairline at rest; raised on hover only where the card is interactive.
- **Border:** 1px hairline (line).
- **Internal Padding:** 12px mobile, 16-20px desktop. Numbered sections start with a "SectionHeader" row divided by a faint line.

### Inputs / Fields
- **Style:** white surface, 1px firm-line stroke, 10px radius, 13px Manrope, 40px tall by default and 32px in toolbars and filters.
- **Focus:** border turns navy with a 3px navy-wash halo (open dropdowns use a 2px navy-100 ring).
- **Error:** rose border, rose text, rose-soft fill and a 2px translucent rose ring (date field).
- **Disabled:** 60-70% opacity, pointer events off, mute text.
- **Dropdowns and combobox ("Dropdown", "InputGoiY", "MultiSelect"):** custom popovers portaled to the body that flip upward when space runs out. Popovers are 18px-rounded; options are 14px-rounded rows; selected is navy wash, navy text, bold, with a teal-deep check. A search box appears above 8 options. Full keyboard support (↑/↓/Home/End/Esc).
- **Date field ("DateField"):** mono, auto-formats `dd/mm/yyyy`, with a 280px three-level calendar (day, month, year). Birth dates open on the year grid around 1960 and block the future.

### Navigation
- **Style:** navy gradient masthead, Fraunces logotype, grouped nav items as 32px buttons with 8px corners in Manrope 700 12.5px.
- **States:** idle white at 80%; hover white on a 10% white wash; a single active link fills solid teal with navy-ink text; an active group gets a 15% white wash with teal text. Group dropdowns are white popovers where the active item is a flat navy row with a teal icon.
- **Mobile:** collapses into a drawer.

### Data table ("DataTable")
The signature surface. Headers are micro labels (mono 11px, uppercase, 0.12em) on surface-soft in mute, or white on navy for the `navy` variant; sortable headers hover to navy. Rows divide with faint lines and hover to the navy wash; the header sticks with a soft shadow. Optional per-column filter inputs sit in a surface-soft row at 28px. Empty states show a 14px-rounded icon tile and a Fraunces 16px title.

### Modal
16px radius surface with a hairline border and floating shadow over a translucent slate scrim with slight blur. The header holds an optional navy-gradient icon tile with a teal icon, a Fraunces title and a mute subtitle; the footer is a surface-soft band with right-aligned actions. Focus is trapped and returned on close; Esc closes; outside click does not close by default. The overlay respects iOS safe areas.

## Do's and Don'ts

### Do:
- **Do** take every color from a `var(--token)` so the `.dark` remap reaches it.
- **Do** set dates as `dd/mm/yyyy` and every compared number, code or date in JetBrains Mono with `tabular-nums`.
- **Do** keep MP teal and MT navy, and keep violet (`var(--violet)`) for "Mắt 2" only.
- **Do** size controls touch-first and tighten from `sm` (`h-9 sm:h-8`, `h-8 sm:h-6`).
- **Do** use mute (`#666b80`) for helper text and keep mute-soft for placeholders and empty hints.
- **Do** keep the 11px floor for anything a user reads.
- **Do** use the shared field primitives ("Field", "Dropdown", "ChoiceRow", "PillGroup", "DateField", "InputGoiY") instead of native `<select>` or one-off inputs.

### Don't:
- **Don't** use raw Tailwind palette classes (`emerald-700`, `amber-700`, `slate-*`, `purple-*`, `blue-50`) for meaning; use the amber, rose, green, teal and navy tokens.
- **Don't** hard-code hex in components (`#031da6`, `#7c3aed`, `#e11d48`, `#16a34a`); add or reuse a token. The fixed masthead navies (`#002b7f`, `#010833`, `#020f5c`) are the only exception: they stay dark in both themes.
- **Don't** use `bg-white` or `bg-white dark:bg-slate-900` for surfaces; use `var(--surface)`, which already handles dark mode.
- **Don't** use plain `--teal` for text or icons on light grounds (2.5:1); use `text-[var(--teal-ink)]`.
- **Don't** reference a `var(--token)` that is not defined in `globals.css` for both `:root` and `.dark`.
- **Don't** set text at 10.5px or smaller.
- **Don't** use emoji or Unicode glyphs (⚠ ⚡ 👁️ 💡) as icons; use a lucide icon or plain text.
- **Don't** apply these rules to `src/lib/email.ts`: email HTML needs inline styles and mail-safe fonts, so it is exempt.
- **Don't** put the navy glow on passive elements, or use teal as the primary call to action on light mode.
