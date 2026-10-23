# LaundrySIA design guide

This file defines how LaundrySIA looks and behaves. It is written so a developer, or an AI coding assistant such as GitHub Copilot, can build every screen from it without guessing. The tokens in section 12 are the single source of truth: if a value appears in two places, the tokens win.

Palette source: Color Hunt, four colors F9E6A8, F2A900, CC6F00, 4D2A00. These four are used exactly as given. Every other color in this file is derived from them, or added on purpose for status and contrast, and is marked as such.

---

## 1. Design intent

**Who uses it.** Dimas is a cashier who serves a queue of customers and has a few seconds per person. Bu Sari is the owner; she is not an accountant. Neither should need training to use the app.

**The job.** Record an order and a payment in under a minute. Let the owner see where the money is without reading a ledger.

**The feeling.** A well-run neighborhood laundry: warm, clean, and orderly. Dark-brown counter, golden light, and a paper claim ticket attached to every bag.

### Principles

1. **One screen, one job.** Each screen has a single primary action, and it is the biggest honey-colored button on the screen.
2. **Plain words.** Name things the way the owner says them: "Receive payment", not "Process transaction". The accounting happens behind the scenes and is never the user's homework.
3. **State is shown three ways.** Color, icon, and words together. Nobody has to guess what a color means, and color-blind users lose nothing.
4. **Money is always legible.** Rupiah amounts are large enough, right-aligned, and use tabular figures so columns line up.
5. **Spend boldness in one place.** The claim ticket (section 10) is the memorable element. Everything around it stays calm and quiet.
6. **Errors teach.** Say what happened and how to fix it. Never apologize, never blame.

---

## 2. Design review: what changed from the first idea

The first idea was the obvious one for this palette: cream page, honey buttons, brown text, orange accents everywhere. Reviewing it against the brief:

| Problem in the first idea | Why it matters | Change made |
|---|---|---|
| Warm color on warm color on every surface | Tiring over an 8-hour shift and looks like a generic template | Page is near-white linen. Cream is used only as a highlight, not as the page background. |
| One accent family for everything | Statuses are hard to tell apart; the app looks monotone | Cool rinse-blue and fresh-green are added for status only, so "washing" and "paid" read instantly. |
| CC6F00 used for text and buttons | It has only 3.6:1 contrast on white, which fails for normal text | CC6F00 is limited to large icons, borders, and chart emphasis. A darker derived shade (Ember text) is used for orange text. |
| Every screen made of identical rounded cards | Flat hierarchy, nothing leads the eye | Each screen gets a different layout: a status board, a two-pane form with a live ticket, a comparison bar. Radii vary by role. |
| Decorative effects: gradients, soft grey shadows, fade-in on every section | Reads as machine-generated | Flat fills, brown-tinted shadows only on floating layers, and one deliberate motion moment (the paid stamp). |

---

## 3. Color

### 3.1 Brand palette (exact values)

| Name | Hex | Role | Use it for | Do not use it for |
|---|---|---|---|---|
| Espresso | `#4D2A00` | Text and structure | All primary text, the sidebar background, dark surfaces, text on Honey | Large decorative areas on the content side |
| Honey | `#F2A900` | The action color | Primary button fill, active navigation item, the one thing to press next | Text on light backgrounds (too light) |
| Ember | `#CC6F00` | Emphasis | Large icons (24px and up), highlight borders, chart emphasis, status track ring | Body text and small text (contrast is too low) |
| Cream | `#F9E6A8` | Soft highlight | Selected rows, "Ready for pickup" badge, empty-state fills, text on the Espresso sidebar | The page background |

### 3.2 Supporting neutrals (derived)

| Name | Hex | Use |
|---|---|---|
| Linen | `#FFFBF0` | Page background |
| Paper | `#FFFFFF` | Cards, tables, inputs, the claim ticket |
| Cream soft | `#FDF4D3` | Table header, hover on rows, quiet fills |
| Sand | `#E8DCC0` | Default borders and dividers |
| Sand strong | `#D4C193` | Input borders, stronger dividers |
| Bark | `#7A6246` | Secondary text and helper text |
| Ember text | `#9A5200` | Orange text and links on light backgrounds |
| Cream muted | `#E8D18F` | Secondary text on the Espresso sidebar |

### 3.3 Status and cool colors (derived, added for contrast)

These keep the app from becoming one warm blur. They appear only as status and feedback, never as decoration.

| Meaning | Text | Background | Where |
|---|---|---|---|
| Received | `#6B5B49` | `#F1EBE0` | Order just dropped off |
| Washing (water) | `#1D5E9C` | `#E6F0FA` | Washing status, info messages, keyboard focus ring |
| Drying / ironing (heat) | `#9A5200` | `#FDEBD0` | Drying and ironing status |
| Ready for pickup | `#4D2A00` | `#F9E6A8` | Ready status, "left to pay" chips |
| Paid / completed | `#2F6B3A` | `#E5F2E6` | Paid, completed, success messages |
| Void / error | `#A12B2B` | `#FBE7E4` | Voided orders, errors, destructive buttons |

The status colors tell a small story: cool water, then warm heat, then gold when it is ready, then green when it is done.

### 3.4 Proportions

- About 70 percent Linen and Paper
- About 15 percent Espresso (text and sidebar)
- About 10 percent Honey and Cream
- Under 5 percent Ember, status colors, and charts combined

### 3.5 Contrast (checked against WCAG 2.1 AA)

| Combination | Ratio | Result |
|---|---|---|
| Espresso on Linen | about 12.3 : 1 | Pass (AAA) |
| Espresso on Paper | about 12.7 : 1 | Pass (AAA) |
| Cream on Espresso (sidebar text) | about 10.2 : 1 | Pass (AAA) |
| Cream muted on Espresso | about 8.5 : 1 | Pass (AAA) |
| Espresso on Honey (primary button) | about 6.3 : 1 | Pass (AA) |
| Ember text on Paper | about 5.9 : 1 | Pass (AA) |
| Bark on Linen | about 5.5 : 1 | Pass (AA) |
| White on danger red | about 7.3 : 1 | Pass (AA) |
| Ember `#CC6F00` on Paper | about 3.6 : 1 | Large text and graphics only (3 : 1) |

Rule: never put small text in raw Ember. Use Ember text (`#9A5200`).

---

## 4. Typography

Two families, clearly different:

- **Bricolage Grotesque** for headings, big numbers, and the invoice number. It has character without being decorative.
- **Figtree** for everything else. It is friendly, very legible at small sizes, and supports tabular figures for money.

Both are free on Google Fonts. Fallback stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

| Style | Font | Size and line height | Weight | Use |
|---|---|---|---|---|
| Display number | Bricolage | 36 / 40 | 600 | Dashboard totals |
| Heading 1 | Bricolage | 28 / 34 | 600 | Page title |
| Heading 2 | Bricolage | 20 / 26 | 600 | Section title |
| Heading 3 | Figtree | 16 / 22 | 600 | Card title, table group |
| Body | Figtree | 16 / 24 | 400 | Default text, form fields |
| Body small | Figtree | 14 / 20 | 400 | Table cells, helper text |
| Caption | Figtree | 13 / 18 | 500 | Badges, timestamps (never smaller than 13) |
| Invoice number | Bricolage | 28 / 32 | 600 | Claim ticket |

Rules:

- Sentence case everywhere. No all-caps labels, no eyebrow labels above headings.
- All money and quantities use `font-variant-numeric: tabular-nums` and are right-aligned in tables.
- Money format follows Indonesian convention: `Rp 40.000` (dot as thousands separator, no decimals for rupiah). Weight: `5,5 kg`. Date: `8 Okt 2026` in Indonesian, `8 Oct 2026` in English.
- Body text lines stay under 70 characters. Forms never stretch fields across the whole screen: maximum field width 480px.
- Headings are never decorated by coloring a single word.

---

## 5. Spacing, shape, and elevation

**Spacing scale (4px base):** 4, 8, 12, 16, 24, 32, 48, 64. Related items are 8 to 12 apart. Groups are 24 apart. Sections are 32 to 48 apart.

**Radius by role** (not one radius for everything):

| Element | Radius |
|---|---|
| Inputs, buttons, selects | 8px |
| Table container, board cards | 12px |
| Modals and bottom sheets | 20px |
| Badges and chips | 999px (pill) |
| Claim ticket | 6px, with 10px circular notches |

**Borders carry structure.** Cards use a 1px Sand border on Paper. Shadows are only for things that float above the page: menus, dialogs, toasts.

**Shadow (floating layers only):** `0 8px 24px rgba(77, 42, 0, 0.14)`. It is tinted brown, never neutral grey.

**Touch targets:** minimum 44 x 44px. Primary buttons and form fields are 48px high, because the cashier may be using a tablet with wet or busy hands.

**Layout widths:** content maximum 1200px. Forms maximum 720px. Sidebar 240px on desktop, 72px rail on tablet.

---

## 6. Layout and navigation

### 6.1 App shell (desktop, 1024px and wider)

A dark Espresso sidebar on the left, a Linen content area on the right. The sidebar gives the app a clear structure and breaks up the warm palette.

```
+--------------+-----------------------------------------------------------+
| LaundrySIA   |  Counter                         [ Search order or name ] |
|              |-----------------------------------------------------------|
| [Counter]    |                                                           |
|  Orders      |   (screen content)                                        |
|  Customers   |                                                           |
|  Payments    |                                                           |
|  ----------  |                                                           |
|  Expenses *  |                                                           |
|  Stock *     |                                                           |
|  Reports *   |                                                           |
|  Settings *  |                                                           |
|              |                                                           |
|  Dimas       |                                                           |
|  Cashier     |                                                           |
+--------------+-----------------------------------------------------------+
  * shown to managers only (hidden from cashiers, not greyed out)
```

- Sidebar background Espresso. Item text Cream muted. Active item: Honey fill with Espresso text and a filled icon weight.
- The user's name and role sit at the bottom of the sidebar with a Log out button.
- Left-aligned content everywhere. Numbers right-aligned in tables.

### 6.2 Tablet (640 to 1023px)

The sidebar collapses to a 72px rail with icons and short labels beneath. Layouts become two columns where they were three.

### 6.3 Mobile (under 640px)

A bottom tab bar replaces the sidebar. The center tab, New order, is a raised Honey button.

```
+------------------------------------+
|  Counter                      (Di) |
|------------------------------------|
|                                    |
|   (content, one column)            |
|                                    |
|------------------------------------|
| Counter  Orders  [ + ]  Clients More|
+------------------------------------+
```

Tables turn into stacked rows, each showing the most important three fields.

---

## 7. Screens

Each screen has a different structure on purpose. Do not build them all out of the same card grid.

### 7.1 Login

Centered panel on Linen, 400px wide. Shop name in Heading 1, two fields (Username, Password with a show/hide toggle), one Honey button "Log in". Error text appears under the field it belongs to. No decorative illustration needed.

### 7.2 Counter (cashier home): the status board

A board with one column per status. The cashier sees the whole shop at a glance and moves orders along.

```
Counter                                              [ + New order ]
3 orders today. 1 ready for pickup.

 Received (1)       Washing (1)        Drying / ironing (0)   Ready (1)
+--------------+   +--------------+   (Nothing drying         +--------------+
| 003          |   | 002          |    right now.)            | 001          |
| Melati kos   |   | Ibu Rina     |                           | Pak Budi     |
| 10 kg        |   | 3 kg express |                           | Rp 25.000    |
| Unpaid       |   | Paid         |                           | left to pay  |
| [Start wash] |   | [Move on]    |                           | [Receive     |
+--------------+   +--------------+                           |  payment]    |
                                                              +--------------+
```

- Card left edge (4px) uses the status color. The card also carries an icon and a text badge.
- Every card has a button for the next step. Dragging between columns is optional, never the only way.
- Cards that still have a balance show a Cream "Left to pay" chip.
- On mobile the columns become horizontal swipe tabs with counts.

### 7.3 New order: a form with a live claim ticket

Left: the form. Right: a live preview of the claim ticket that fills in as the cashier types. The cashier and the customer can both see what is being recorded.

```
New order
+-----------------------------------------+   +---------------------------+
| Customer                                |   |  Sari Laundry             |
| [ Search name or phone          v ]     |   |  INV-20261008-001         |
| Pak Budi, 0812xxxx                      |   |  - - - - - - - - - - - -  |
|                                         |   |  Wash + iron   5 kg       |
| Items                                   |   |  at Rp 8.000   Rp 40.000  |
| Service         Weight     Price  Total |   |  - - - - - - - - - - - -  |
| [Wash + iron v] [- 5,0 kg +]  8.000 ... |   |  Total         Rp 40.000  |
| [ + Add another service ]               |   |  Paid now      Rp 15.000  |
|                                         |   |  Left to pay   Rp 25.000  |
| Pickup  [ Fri 10 Okt v ]                |   +---------------------------+
| Note    [                      ]        |
|                                         |
| Payment now                             |
| [ Pay in full ] [ Deposit ] [ Pay later]|
| Amount [ 15.000 ]    Method [ Cash v ]  |
|                                         |
| [ Cancel ]               [ Save order ] |
+-----------------------------------------+
```

- Payment type is three large selectable cards, not a dropdown.
- The weight field has minus and plus steppers (0.5 kg steps) and accepts typing.
- Pickup date defaults to the service's normal turnaround.
- Payment method defaults to Cash.
- "Save order" is the only Honey button. After saving, show the finished ticket with Print and New order buttons.

### 7.4 Order detail

```
Orders  >  INV-20261008-001
+--------------------------------+   +---------------------------------+
|  (claim ticket, section 10)    |   | Progress                        |
|                                |   | Received - Washing - Drying -   |
|                                |   | Ready - Picked up               |
+--------------------------------+   | [ Move to Drying / ironing ]    |
                                     |                                 |
                                     | Payments                        |
                                     | 8 Okt   Cash    Rp 15.000       |
                                     | [ Receive payment ]             |
                                     |                                 |
                                     | Manager only: [ Void order ]    |
                                     +---------------------------------+
```

Cashiers who cannot void see the plain sentence "Ask a manager to void this order." instead of a disabled button.

### 7.5 Manager dashboard: earned versus received

The central idea of the SIA course made visible: money earned is not the same as money received.

```
Today, 8 Oktober                                   [ This month v ]

 Earned today     Rp 146.000  ################################
 Cash received    Rp  51.000  ###########
                  Rp 95.000 still to collect          [ See who owes ]

+----------------------------+   +------------------------+
| To collect (3)             |   | Running low (1)        |
| Melati kos    Rp 70.000  3d|   | Detergent  2 kg left   |
| Pak Budi      Rp 25.000  1d|   | [ Record purchase ]    |
+----------------------------+   +------------------------+
| Revenue, last 7 days (bars: Honey, today in Ember)      |
+---------------------------------------------------------+
```

- The comparison bars are the hero of this screen. Two horizontal bars on the same scale, with the gap labeled in words.
- "To collect" is a short list sorted by age, not a table.
- Charts use Honey bars with today in Ember. Always label axes and values; never rely on color alone.

### 7.6 Expenses and purchases (manager)

A simple list on the left with a form on the right. Fields: date, category, amount, note. A supply purchase adds item and quantity. After saving, the toast says "Expense saved. Cash is now Rp 380.000."

### 7.7 Reports (manager)

Choose a report with large tabs: Income statement, Cash flow, Balance sheet, Who owes. Choose a period with presets (Today, This week, This month, Custom). Each report starts with a one-sentence plain-language summary, such as "You earned Rp 4.200.000 and spent Rp 2.900.000 this month, so profit is Rp 1.300.000." The formal table sits below it. Export buttons (PDF, Excel) are secondary buttons at the top right.

---

## 8. Components

### 8.1 Buttons

| Type | Look | Use |
|---|---|---|
| Primary | Honey fill, Espresso text, 48px high, 8px radius. Hover `#E09B00`, pressed `#D49400` | One per screen: Save order, Receive payment |
| Secondary | Paper fill, 1.5px Espresso border, Espresso text | Cancel, Print, Export |
| Text | No fill, Ember text (`#9A5200`), underline on hover | Low-priority actions, links |
| Danger | `#A12B2B` fill, white text | Only inside the void confirmation |

Labels are a verb plus a noun: "Save order", "Receive payment", "Add customer". Not "Submit", not "OK". No arrows in button text. Disabled buttons use Cream soft fill and Bark text, and a nearby sentence explains why.

### 8.2 Form fields

- Height 48px, Paper fill, 1.5px Sand strong border, 8px radius, 16px text.
- The label sits above the field, always visible, 14px weight 500. Never use a placeholder as the label.
- Helper text is 13px Bark under the field. Error text is 13px danger red with an icon, under the field, and the border turns red.
- Money fields: numeric keyboard on mobile (`inputmode="numeric"`), thousands dots added as you type, "Rp" shown as a fixed prefix, right-aligned.
- Selects use the native element, styled to match, for reliability on every device.
- Search fields (customer, order) are comboboxes: results appear as you type, arrow keys move, Enter selects, and the phone number is shown next to each name.

### 8.3 Payment type cards

Three side-by-side cards, 56px high: Pay in full, Deposit, Pay later. Selected card: Cream fill with a 2px Ember border and a check icon. The others: Paper fill with a Sand border.

### 8.4 Status badges

Pill, 28px high, icon plus text, using the colors in section 3.3. A badge is never color only.

| Status | Icon (Lucide) | Text |
|---|---|---|
| Received | `inbox` | Received |
| Washing | `droplets` | Washing |
| Drying / ironing | `flame` | Drying / ironing |
| Ready | `package-check` | Ready for pickup |
| Completed | `circle-check` | Completed |
| Void | `ban` | Void |

Use one icon family only: Lucide, stroke 1.75, 20px in UI and 24px for large icons.

### 8.5 Tables

- Header row: Cream soft fill, Espresso 14px weight 600. Sticky on scroll.
- Rows: 56px high, Paper fill, 1px Sand divider, hover Cream soft. No zebra striping.
- Money columns right-aligned with tabular figures. Status column uses badges.
- Row actions are text buttons with an icon, not a cryptic three-dot menu.
- Under 640px, rows become stacked cards.

### 8.6 Toasts and messages

Toasts appear bottom-right on desktop and bottom-center on mobile. Success disappears after 5 seconds. Errors stay until dismissed. Toasts repeat the action's name: the button said "Save order", the toast says "Order saved."

### 8.7 Dialogs

20px radius, floating shadow, and a dimmed Espresso overlay at 50 percent. The first field or the safest button has focus. Escape closes. Destructive dialogs state the consequence in plain words.

### 8.8 Empty, loading, and error states

- **Empty:** a short sentence that tells the user what to do. Example: "No orders yet today. Select New order to add the first one." Include the relevant button.
- **Loading:** skeleton blocks in Cream soft that match the final layout. No spinner-only screens, except on buttons while saving.
- **Error:** what happened, then how to fix it. Example: "Weight is required. Enter the weight in kg." The error is next to the field and also summarized at the top of long forms.

---

## 9. Progress track (order status)

Shows where the laundry is in the shop. Used on the order detail screen and, in a smaller form, on the customer-facing receipt link if you add one later.

```
 (check)---------(check)---------(o)-----------( )-----------( )
 Received        Washing          Drying        Ready          Picked up
                                  you are here
```

- Five stops in a horizontal line on desktop and a vertical line on mobile.
- Done: Espresso filled circle with a white check. Current: Honey circle with a 3px Ember ring. Upcoming: empty circle with a Sand strong outline.
- The connector line is Espresso up to the current stop and Sand after it.
- Each stop always has a text label under it (14px). The current stop adds the words "you are here" in Bark.
- The button below always names the next step: "Move to Drying / ironing".

---

## 10. The claim ticket (signature element)

This is the one place the design is deliberately memorable. A paper claim ticket is what every real laundry hands the customer, so the app's main object looks like one. It appears on the New order preview, the order detail screen, and the printed receipt.

```
   __________________________
  /  Sari Laundry            \
  |  Jl. Mawar 12            |
  |  INV-20261008-001        |
  |  8 Okt 2026              |
  o - - - - - - - - - - - - -o     perforation, with a notch on each side
  |  Pak Budi                |
  |  Wash + iron    5 kg     |
  |                Rp 40.000 |
  o - - - - - - - - - - - - -o
  |  Paid now      Rp 15.000 |
  |  Left to pay   Rp 25.000 |
  \__________________________/
```

Specification:

- Paper fill with a 1.5px Sand border, 6px radius, and a 6px Honey strip along the top edge (like the tag on a garment).
- Width 360px on screen. Padding 20px.
- The perforation is a 1.5px dashed Sand strong line with 20px circular notches cut into both sides, filled with the page color (Linen).
- Shop name: Heading 3. Invoice number: Bricolage 28/32, the largest text on the ticket, so it can be read across the counter.
- Item rows use Body small with right-aligned amounts.
- "Left to pay" sits in a Cream chip when the balance is above zero.
- When the balance is zero, a green outlined stamp reading "Paid" appears at a slight angle (minus 6 degrees) over the totals. This is the single animated moment (section 11).
- When an order is void, the ticket gets a red diagonal "Void" stamp and the amounts are struck through.
- On the printed receipt the ticket becomes black on white with the same structure (section 15).

Do not reuse the ticket look for other cards. Its distinctiveness comes from being used only for orders.

---

## 11. Motion

The rule: motion answers something the user did. There are no entrance animations on page load, no staggered fades, no hover bounce on cards.

| Moment | Motion | Duration |
|---|---|---|
| Payment saved and balance reaches zero | The "Paid" stamp drops onto the ticket (scale from 1.3 to 1, opacity from 0 to 1) | 250ms ease-out |
| Order moves to the next status | The progress track fills to the new stop | 300ms ease |
| Toast appears or disappears | Slide 12px and fade | 180ms |
| Dialog opens | Fade the overlay, scale the dialog from 0.97 | 160ms |
| Button hover and press | Color change only | 120ms |

Respect `prefers-reduced-motion: reduce`: replace all of the above with an instant change. Nothing animates continuously.

---

## 12. Design tokens (copy into `globals.css`)

```css
:root {
  /* Brand palette: exact values from Color Hunt */
  --espresso: #4D2A00;
  --ember: #CC6F00;
  --honey: #F2A900;
  --cream: #F9E6A8;

  /* Derived neutrals */
  --linen: #FFFBF0;
  --paper: #FFFFFF;
  --cream-soft: #FDF4D3;
  --cream-muted: #E8D18F;
  --sand: #E8DCC0;
  --sand-strong: #D4C193;
  --bark: #7A6246;
  --ember-text: #9A5200;

  /* Honey states */
  --honey-hover: #E09B00;
  --honey-pressed: #D49400;

  /* Status colors (text on background) */
  --received-fg: #6B5B49;  --received-bg: #F1EBE0;
  --washing-fg:  #1D5E9C;  --washing-bg:  #E6F0FA;
  --drying-fg:   #9A5200;  --drying-bg:   #FDEBD0;
  --ready-fg:    #4D2A00;  --ready-bg:    #F9E6A8;
  --paid-fg:     #2F6B3A;  --paid-bg:     #E5F2E6;
  --danger-fg:   #A12B2B;  --danger-bg:   #FBE7E4;
  --danger:      #A12B2B;

  /* Focus */
  --focus: #1D5E9C;

  /* Semantic aliases: use these in components */
  --bg-page: var(--linen);
  --bg-surface: var(--paper);
  --bg-selected: var(--cream);
  --bg-hover: var(--cream-soft);
  --text: var(--espresso);
  --text-muted: var(--bark);
  --text-link: var(--ember-text);
  --border: var(--sand);
  --border-input: var(--sand-strong);
  --action: var(--honey);
  --action-text: var(--espresso);

  /* Type */
  --font-display: var(--font-bricolage), system-ui, sans-serif;
  --font-body: var(--font-figtree), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  /* Spacing (4px base) */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-6: 24px; --s-8: 32px; --s-12: 48px; --s-16: 64px;

  /* Radius by role */
  --r-control: 8px;
  --r-card: 12px;
  --r-modal: 20px;
  --r-ticket: 6px;
  --r-pill: 999px;

  /* Elevation: floating layers only */
  --shadow-float: 0 8px 24px rgba(77, 42, 0, 0.14);

  /* Sizes */
  --tap: 44px;
  --field-h: 48px;
  --sidebar-w: 240px;
}

body {
  background: var(--bg-page);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
}

h1, h2 { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.01em; }

.money, td.num { font-variant-numeric: tabular-nums; text-align: right; }

:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.sidebar :focus-visible { outline-color: var(--cream); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

Loading the fonts in Next.js (`app/layout.js`):

```js
import { Bricolage_Grotesque, Figtree } from "next/font/google";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${bricolage.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Suggested component file names: `Button`, `Field`, `MoneyInput`, `CustomerSearch`, `PaymentTypeCards`, `StatusBadge`, `ProgressTrack`, `ClaimTicket`, `OrderBoard`, `EarnedVsReceived`, `DataTable`, `Toast`, `Dialog`.

---

## 13. Content and microcopy

Words are part of the interface. The user is a cashier or shop owner, not an accountant.

Voice rules:

- Plain verbs, sentence case, no filler, no jokes in error messages.
- Name things the way the owner says them. The same action keeps the same name across the whole flow.
- Never expose accounting terms to the cashier. Debits, credits, and journals appear only in the manager's ledger view.
- Errors do not apologize and are never vague.

| Situation | Write | Avoid |
|---|---|---|
| Save button on a new order | Save order | Submit |
| After saving | Order saved. Invoice INV-20261008-001. | Success! |
| Payment saved | Payment saved. Balance is now Rp 25.000. | Transaction completed |
| Missing field | Weight is required. Enter the weight in kg. | Invalid input |
| Duplicate phone | A customer with this phone number already exists. Select them instead. | Error 409 |
| Void confirmation | Void INV-20261008-001? The order stays in your records, marked void. Reason (required): | Are you sure? |
| Empty orders | No orders yet today. Select New order to add the first one. | Nothing here |
| Order not found | No order matches "003". Check the number or search by customer name. | No results |
| Low stock | Detergent is running low: 2 kg left. | Warning: inventory threshold reached |
| Cashier cannot void | Ask a manager to void this order. | Access denied |

### Indonesian labels

If the app is shown in Indonesian, use these terms (keep the same tone: short and plain).

| English | Indonesian |
|---|---|
| New order | Pesanan baru |
| Customer | Pelanggan |
| Receive payment | Terima pembayaran |
| Left to pay | Sisa bayar |
| Pay in full / Deposit / Pay later | Lunas / Uang muka / Bayar nanti |
| Received | Diterima |
| Washing | Sedang dicuci |
| Drying / ironing | Dikeringkan / disetrika |
| Ready for pickup | Siap diambil |
| Completed | Selesai |
| Void order | Batalkan pesanan |
| Expenses | Pengeluaran |
| Who owes | Piutang |
| Reports | Laporan |

---

## 14. Accessibility and usability rules

Build to this floor on every screen:

1. Text contrast meets 4.5 : 1 (3 : 1 for large text and icons). Use the pairs in section 3.5 and nothing else.
2. A visible keyboard focus ring (3px rinse-blue, 2px offset) on every interactive element.
3. Every status and every error uses text and an icon, not color alone.
4. Touch targets are at least 44 x 44px, with 8px between neighbors.
5. Every field has a visible label. Errors are linked to their field and announced to screen readers.
6. Body text is 16px. Nothing is smaller than 13px.
7. The page works at 200 percent zoom and from 360px wide.
8. Respect `prefers-reduced-motion`.
9. Set `lang` on the page (`id` or `en`) so screen readers and spell-checkers behave.

Speed for the cashier:

- At most one primary button per screen.
- Defaults chosen for the common case: payment method Cash, pickup date from the service turnaround, the last-used service pre-selected.
- Keyboard shortcuts: `/` focuses search, `N` opens New order, `Enter` saves a valid form.
- Destructive actions (void) always ask for confirmation and a reason. Everything else is saved immediately and can be corrected.
- Hide what a role cannot use rather than showing it disabled. Where a cashier might wonder, say who can do it.

---

## 15. Print and receipt

- Two sizes: 80mm thermal roll (default) and A5 invoice.
- Thermal printing is black on white only. Keep the ticket structure: shop name, invoice number in the largest type, perforation line made with dashes, items, totals, paid and left to pay.
- The "Paid" stamp prints as a bordered word. The "Void" stamp prints as a bordered word with a diagonal line.
- Use the browser print dialog with a dedicated `@media print` stylesheet: hide the sidebar and buttons, set the page width to 80mm, and use 12px minimum type.
- Add a line at the bottom for the shop's phone number and pickup rules, editable by the manager in Settings.

---

## 16. Do and don't, and the design check

### Do

- Keep Honey for the single next action on the screen.
- Use Espresso for text, never pure black or grey.
- Give each screen the layout its job needs.
- Use the claim ticket for orders and nothing else.
- Show money large, aligned, and in Rupiah format.

### Don't

- Don't use a cream or amber page background.
- Don't put small text in raw Ember (`#CC6F00`).
- Don't use gradients, glows, or neutral grey shadows.
- Don't use all-caps labels, tiny labels above headings, or arrows in button text.
- Don't make every block an identical rounded card.
- Don't animate sections in on load.
- Don't expose accounting vocabulary to the cashier.

### Design check before each screen is called done

1. Can a new cashier find the primary action in under 3 seconds?
2. Is there exactly one Honey button?
3. Are all statuses shown with color, icon, and words?
4. Does it pass keyboard-only use, with a visible focus ring?
5. Do all text and background pairs match section 3.5?
6. Does it work at 360px wide and on a tablet?
7. Is the copy plain, consistent, and free of accounting jargon?
8. Does this screen look different in structure from the one before it?
