# MADAR Landing Page UI/UX Audit

**Audit scope:** Shared landing header, Hero, Property Discovery, Personalized Locations, Property Comparison, How It Works, Features, Final CTA, Footer, theme tokens, localization, responsive behavior, and Motion patterns.

**Method:** Source and asset review, including visual inspection of every landing-page image. A browser preview was not available during the audit, so viewport-specific rendered observations are recorded as code-based risks and must be verified in a browser when one is available.

## Global design system

| Section / component | Issue and impact | Severity | Recommended correction | Status |
|---|---|---:|---|---|
| Typography / section headings | Most section headings repeat `text-3xl sm:text-4xl`, which makes sections with different content lengths feel mechanically uniform and gives little hierarchy on wide screens. | Medium | Establish shared heading sizing and responsive line lengths, then allow comparison and CTA headings to use deliberate variants. | Fixed |
| Arabic typography | Eyebrow labels use `tracking-[0.14em]` across locales. Letter spacing is unnatural in Arabic and reduces word cohesion. | Medium | Apply tracking only to English or use neutral tracking in Arabic. Keep Arabic line-height and weight locale-aware. | Fixed |
| Section rhythm | Most sections use the same `py-20 sm:py-28` despite varying visual density; the CTA and footer then jump to separate values. This creates long, repetitive scroll intervals. | Medium | Normalize to a smaller shared vertical rhythm with section-specific adjustments for the full-bleed Hero, map, comparison, and CTA. | Fixed |
| Motion composition | `LandingPage` wraps sections in `SectionMotion`, while several sections animate their own children. The outer opacity/position transition can delay already animated content and makes motion harder to tune as a system. | High | Keep one reveal owner per section; retain section-specific internal interactions and remove redundant whole-section wrappers where they duplicate child entrance effects. | Fixed |
| Motion performance / reduced motion | Discovery uses a `clipPath` entrance and final CTA decorative rings still have `whileInView` targets even when reduced motion is requested. | Medium | Prefer opacity/transform entrances and remove decorative transitions entirely in reduced-motion mode. | Fixed |
| shadcn usage | Interactive controls use existing shadcn `Button`, `Input`, and `Sheet` components. Discovery and step panels remain semantic `article` elements rather than gaining an unnecessary `Card` wrapper. | — | Keep the shared radius, border, and surface treatment consistent; preserve semantic article markup. | Fixed |
| Hero / theme fallback | Hero text is white over a photograph with only a uniform 20% dark overlay. Bright sky and pale architecture can reduce contrast behind text; theme changes do not affect that contrast. | High | Preserve the required full-screen photo and subtle-only overlay; constrain copy over the lower road area, strengthen text shadow, and verify exact crop in both locales. | Improved; visual check open |
| Localization / motion direction | Some entrances and feature hover movements use hardcoded horizontal signs, so equivalent content enters from different logical sides in Arabic and English. | Medium | Derive directional transform signs from locale or use non-directional transforms. | Fixed |
| Responsive verification | No browser automation or browser executable was found during the audit. Horizontal overflow and line wrapping therefore cannot be confirmed visually yet. | Medium | Run browser checks at requested widths when browser tooling is available; until then, use conservative responsive constraints and report this limitation. | Open |

## Header and navigation

| Section / component | Issue and impact | Severity | Recommended correction | Status |
|---|---|---:|---|---|
| Header over Hero | The transparent header uses a floating dark text shadow and the logo mark uses the theme's primary color. In dark mode that primary becomes pale sage, reducing the mark's contrast against portions of the photo. | Medium | Keep the transparent treatment and use a stable, sufficiently dark brand mark surface over the photo. Preserve the scrolled semantic theme surface. | Fixed |
| Mobile controls | The mobile row combines a textual language control, theme control, and menu trigger at 375px. Its width is close to the remaining space beside the wordmark, risking a cramped header in Arabic. | Medium | Confirm the row at 375px for both locales; browser preview was unavailable. | Open |
| Navigation state | Desktop links animate their active underline on hover/focus, but there is no `aria-current`/active section indication during scroll. | Low | Keep the accessible hover/focus indicator; a scroll-active state was not added because it is not needed for navigation and would add state to the header. | Existing hover/focus retained |

## Hero

| Section / component | Issue and impact | Severity | Recommended correction | Status |
|---|---|---:|---|---|
| Hero image | `hero.png` is a 1600×900 opaque photograph: villas occupy the left, Riyadh skyline the center-right, and road foreground the bottom. The image is correctly full-bleed with `fill`, `sizes="100vw"`, `object-cover`, and no pale overlay. | — | Preserve the edge-to-edge image and the existing subtle black-only overlay. Keep its mobile focal position distinct from desktop. | Confirmed correct |
| Hero content | The headline is very large (`clamp(3rem, 5.4vw, 5.15rem)`) and the Arabic layout inherits broad desktop width. At compact heights it can compete with the skyline and consume the road foreground. | Medium | Reduce the maximum scale slightly and constrain copy width per breakpoint while retaining the headline and CTA hierarchy. | Fixed |
| Hero CTAs | The secondary CTA uses a translucent fill and blur over a busy photo; fine edges can lose definition over bright pavement. | Low | Preserve the outline style but strengthen its border and provide a solid-enough translucent dark fill. | Fixed |

## Property Discovery

| Section / component | Issue and impact | Severity | Recommended correction | Status |
|---|---|---:|---|---|
| Section heading | This section alone defines a local `SectionHeading`; equivalent heading markup elsewhere has drifted in width, tracking, and spacing. | Medium | Share the heading treatment or align the section heading primitives across the landing page. | Fixed |
| Discovery cards | Both methods are presented as equally weighted cards, but the second card uses `bg-muted/45` while the first uses `bg-background`; this makes the external-link route look secondary even though it is meant to be an equally valid start. | Medium | Use a shared surface and matched border, padding, and action hierarchy for both choices. | Fixed |
| Mock controls | The two principal actions are disabled buttons. Users can mistake the controls for broken functionality even though the section is explicitly a conceptual demo. | High | Keep the mock limitation clear, visually identify the panels as examples, and avoid styling disabled controls as ready-to-use actions. | Fixed |
| Directional entrances | Cards enter from fixed physical left/right positions rather than logical start/end. | Low | Mirror the entrance direction for RTL or use a small direction-neutral vertical reveal. | Fixed |
| Eyebrow label | Its Arabic tracking is unnecessarily wide (global issue). | Medium | Use untracked Arabic eyebrow text. | Fixed |

## Personalized Locations

| Section / component | Issue and impact | Severity | Recommended correction | Status |
|---|---|---:|---|---|
| Map visual | `intrest-places.png` is a 1448×1086 light illustrative map with embedded route lines and markers. It is correctly displayed with `object-contain`; its light artwork stays visible in dark mode due to the framed light surface. | — | Preserve the full illustration and its caption that the data is illustrative. | Confirmed correct |
| Map framing | The map has an outer border frame plus an inner bordered surface and the surrounding card, producing nested frames around an already detailed illustration. | Low | Retain one clear image boundary and simplify the extra decorative frame. | Fixed |
| Responsive balance | On mobile, the map card follows a long text-and-chip block, so the main product visual arrives late in the section. | Low | Reduced section/card padding; confirm the final order and spacing at mobile widths in a browser. | Improved; visual check open |
| Sample metric tiles | Tiles show travel/proximity examples but visually resemble computed product results; the disclaimer is tiny and separated from the figures. | Medium | Keep the illustrative label close to the metrics and improve its readable size/contrast. | Fixed |

## Property Comparison

| Section / component | Issue and impact | Severity | Recommended correction | Status |
|---|---|---:|---|---|
| Comparison table on mobile | The comparison surface has `min-w-[700px]` inside horizontal scrolling. It preserves columns but gives no visible cue that more content exists, so users may miss the second and third properties. | High | Keep the comparable columns intact, add a localized scroll cue and clearer edge affordance, and ensure keyboard users can scroll the region. | Fixed |
| Data legibility | Several labels, table values, and tags use 9–10px type. This is too small for comfortable mobile scanning, especially in Arabic. | High | Raise supporting data to at least 12px where space permits and preserve compactness through padding, not tiny type. | Fixed |
| Dark theme surface | The section uses semantic `bg-primary`; in dark mode this becomes a light sage panel while surrounding sections remain dark. It reads as a sharp brightness reversal and makes the dark theme feel less coherent. | Medium | Use a stable deep teal comparison surface with semantic foregrounds, or use a contained dark surface token that remains consistent across themes. | Fixed |
| Table structure | The visual grid communicates a comparison, but rows and columns are generic `div`s rather than table semantics. Screen readers lose header-to-value relationships. | High | Use semantic table markup or appropriate row/column header roles while retaining the responsive visual grid. | Fixed |
| Sample indicator contrast | The mock disclaimer uses `text-primary-foreground/60`; in the light-mode primary palette, low-opacity white over `#19343A` is weak for small text. | Medium | Use full-opacity primary foreground or a more legible token combination for small supporting text. | Fixed |
| Image crops | The three 1600×900 photos are visually coherent modern Riyadh homes and share a wide ratio, suitable for the current card crops. | — | Keep `object-cover`; retain localized descriptive alt text. | Confirmed correct |

## How It Works

| Section / component | Issue and impact | Severity | Recommended correction | Status |
|---|---|---:|---|---|
| Step cards | All three steps use the same card template and equal emphasis, so the scroll progress line has little visual relationship to the individual illustrations. | Medium | Keep the three-step sequence but strengthen the numbered progression and make the connector align visibly with icon centers. | Fixed |
| Card interaction | Cards gain a hover shadow but have no focusable content; the shadow cue is mouse-only and suggests interaction where none exists. | Low | Remove misleading hover treatment or provide an equivalent focus state only if the cards become interactive. | Fixed |
| Mobile connector | The progress line is hidden below desktop, leaving no visual sequence cue on mobile. | Low | Add a quiet vertical connector between step markers on mobile, without affecting natural scrolling. | Fixed |
| Heading | Centered title and body use the same narrow heading scale as other sections despite a distinct storytelling section. | Low | Apply the shared hierarchy while retaining intentional centered alignment. | Fixed |

## Features

| Section / component | Issue and impact | Severity | Recommended correction | Status |
|---|---|---:|---|---|
| Feature list motion | Entries alternate fixed physical horizontal directions, and each item moves in the opposite direction again on hover. This feels inconsistent in RTL and causes unnecessary motion on a dense list. | Medium | Use a consistent short opacity/vertical reveal and a subtle surface/icon response; derive any horizontal direction from locale. | Fixed |
| Feature affordance | Feature rows look like clickable cards because of icon hover transitions, but they have no links or actions. | Low | Use static row styling with clear informational hierarchy and reserve hover movement for actual interactive controls. | Fixed |
| Sticky copy | The left description stuck at `top-32`, which could leave the title cramped against the viewport on shorter laptop heights. | Low | The redesigned feature layout keeps its introduction in normal document flow. | Fixed |

## Final CTA

| Section / component | Issue and impact | Severity | Recommended correction | Status |
|---|---|---:|---|---|
| CTA artwork | `cta.png` is a 1672×941 transparent PNG with pale architectural illustration and thin gold linework concentrated on the left side. It is correctly rendered with `object-contain` and no white wrapper. | — | Preserve alpha transparency and avoid card-like image backgrounds. | Confirmed correct |
| CTA art on mobile | At narrow widths, the full wide artwork sits below the text and may become too small to read as architecture while increasing section height. | Medium | Cap the mobile art width and reduce the image slot’s vertical contribution; preserve aspect ratio. | Fixed |
| CTA panel color | `bg-secondary` is mid-tone green, but supporting copy is set at 70–75% opacity, which can reduce contrast on this colored surface. | Medium | Use full-opacity semantic text for small CTA note and body, while retaining hierarchy through size and weight. | Fixed |
| Decorative motion | Large circular lines animate in even with reduced-motion preference, and can compete with the illustration. | Medium | Disable them for reduced motion and soften their size/opacity. | Fixed |

## Footer

| Section / component | Issue and impact | Severity | Recommended correction | Status |
|---|---|---:|---|---|
| Footer hierarchy | Footer brand description, demo disclaimer, and link list have only subtle size differences; the legal/footer baseline is small but adequate. | Low | Current typography retained to keep the footer quiet; no hierarchy change was needed. | Reviewed; retained |
| Link interaction | Links animate upward on hover but do not define a visible keyboard focus style. | Medium | Add an explicit `focus-visible` ring/underline and retain a non-motion color cue. | Fixed |
| Copyright year | The year is hardcoded to 2026 and will become stale automatically. | Low | Next 16's Cache Components rejects `new Date()` during this client component's prerender; keep the present year and revisit through a server-rendered footer boundary. | Open |

## Final status

The redesign fixes the high-impact composition, hierarchy, spacing, comparison readability, and motion issues that could be addressed safely in this pass. Hero and map viewport appearance, the mobile header at narrow widths, and automatic footer year remain open for follow-up. Browser-based visual verification was unavailable; the implementation was checked with ESLint, TypeScript, the production build, and HTTP smoke checks for both locale routes.

### Implemented redesign

- **Hero:** Kept the architectural photo full-bleed and moved the copy toward the vertical center, reducing the sense that the message sits detached at the bottom.
- **Discovery:** Moved the heading and description into a compact editorial row, reduced option panel padding, strengthened field labels and values, and retained both equally styled demo paths with a shared no-submit notice.
- **Personalized locations:** Gave the map more grid width, reduced outer framing and card padding, and brought optional-place chips and readable example metrics closer to the illustration.
- **Comparison:** Rebuilt the comparison with semantic table headers, emphasized price in each property header, increased the data type size, removed decorative scoring bars, and retained keyboard scrolling with a mobile scroll prompt.
- **How it works:** Replaced the generic card row with a connected numbered timeline that becomes a vertical progression on mobile.
- **Features:** Reorganized the six existing capabilities into a lead feature panel, a secondary external-listing panel, and four concise supporting items.
- **Final CTA:** Removed decorative circles, tightened the panel, and enlarged the transparent architectural artwork while preserving its alpha channel.
- **System:** Added stable semantic tokens for dark comparison surfaces and the Hero brand mark; removed the duplicated whole-section Motion wrapper so each section owns its entrance behavior.
