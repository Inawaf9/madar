# MADAR — integrated Stone & Ink refinement

> Integration phase update: the current functional/API implementation is documented in [INTEGRATION_STATUS.md](frontend-integration/INTEGRATION_STATUS.md). The earlier scope and verification notes below describe the visual-refinement phase only. The Hero now displays the original photo beside the content; its latest layout is preserved by the integration work.

The existing MADAR product structure is the source of truth. `madar-product-preview-2.html` supplies colors, typography direction, and search-panel styling; its page structure and synthetic inventory are not used as the landing page.

The original landing sections are mounted in their original order: HeroSection, PropertyDiscoverySection, PersonalizedLocationsSection, PropertyComparisonSection, HowItWorksSection, FeaturesSection, and FinalCTASection. Existing `/hero.png`, `/intrest-places.png`, `/compare-1.png`, `/compare-2.png`, `/compare-3.png`, and `/cta.png` visuals remain in use. The original hero message and its property/how-it-works destinations are retained. The existing header and footer components again use the original product navigation, translations, and branding, with saved homes linked to the existing `/saved` route.

## Semantic tokens

The source of truth is `app/globals.css`. Tailwind's `@theme inline` maps the semantic variables to utilities.

| Token | Light | Dark |
| --- | --- | --- |
| background | #F4F0E9 | #171A21 |
| foreground | #292A30 | #F2EEE8 |
| card, popover | #FFFCF7 | #252A35 |
| card-foreground, popover-foreground | #292A30 | #F2EEE8 |
| primary, ring | #424D68 | #AAB8D2 |
| primary-foreground | #FFFFFF | #171A21 |
| secondary, muted | #ECE5DB | #303645 |
| secondary-foreground | #292A30 | #F2EEE8 |
| muted-foreground | #696A70 | #B9BDC8 |
| accent | #B98B70 | #C99C82 |
| accent-foreground | #292A30 | #171A21 |
| accent-ink (readable small accent text) | #855B43 | #C99C82 |
| border, input | #D9CFC0 | #424957 |
| destructive | #A33D35 | #F0998F |
| destructive-foreground | #FFFFFF | #171A21 |
| chart-1 | #424D68 | #AAB8D2 |
| chart-2 | #B98B70 | #C99C82 |
| chart-3 | #696A70 | #B9BDC8 |
| chart-4 | #827560 | #B6AB92 |
| chart-5 | #71657F | #B3A4C3 |
| stone-shadow | 0 18px 50px #292a3010 | 0 18px 55px #0003 |

Base radius: 0.875rem. Existing sidebar and comparison tokens alias the corresponding semantic surfaces, foregrounds, borders, primary, and ring. The existing photographic surface token remains fixed slate #424D68 with white text for legacy photographic treatments.

Regional tokens retain their original values in both themes: Riyadh #B77B5B, Jeddah #6D9FB0, Abha #748B6A, Al-Ahsa #A7A16D, AlUla #B18A91, Tabuk #9C8B78. Light showcase surfaces retain the reference's #EAD2C0, #CDE3E8, #D5E0CE, #E8E5CB, #E7D7DD, #DFD8CE respectively. Dark showcase surfaces mix 24% regional color into the card surface. These colors describe regional context and never indicate errors or success.

Illustration and map palette variables are centralized separately from interactive semantic tokens. The architectural illustration adapts to the theme and uses CSS gradients rather than external imagery or image generation.

## Fonts from public/font

`app/fonts.ts` now points directly at the existing WOFF2 files in:

- `public/font/thmanyah typeface/thmanyahsans/woff2/`
- `public/font/thmanyah typeface/thmanyahserifdisplay/woff2/`

Thmanyah Sans uses Light 300, Regular 400, Medium 500, Bold 700, and Black 900. Thmanyah Serif Display configures Regular 400, Bold 700, and Black 900. The supplied Serif Text family and remaining Display weights are present but are not needed by this interface.

Actual filenames and the corresponding local OTF metadata were inspected. All three supplied families have weights 300, 400, 500, 700, 900 with Arabic and Latin glyphs in the inspected counterparts. No ZIP extraction, font downloads, font-package installation, font moves, renames, duplication, or deletion were performed in this refinement. Earlier copies under `app/fonts/` were left untouched and are no longer referenced by the font configuration.

The existing locale root layout attaches the `next/font/local` variables to HTML. Both `font-sans` and `font-heading` resolve to Thmanyah Sans for Arabic and English. Body and form controls inherit that font, as do dialogs and portal content. Synthetic font styles are disabled. Serif Display is explicitly selected for the hero, comparison section heading, and final marketing CTA; ordinary section, card, form, and product headings retain Sans. Sans retains swap/preloading; Display retains swap without preloading.

## Themes and shared UI

The existing next-themes provider and toggle behavior were retained: light, dark, and system preference, persistent selection, class-based theme, pre-hydration handling, and the existing React 19 workaround. No provider or theme-toggle changes were needed in this refinement.

Core colors remain the exact approved palette above. Cards now consistently use the semantic border and Stone & Ink shadow instead of a separate foreground ring. Inputs and selects use background/input tokens, 44px default control heights, and rounded-xl corners. Default buttons are 44px, large buttons 48px, and standard icon buttons 44px; explicit compact variants and existing local size overrides remain. Outline buttons share card surfaces and secondary hover treatment in both themes. A shared photo variant supports readable secondary actions over the existing hero image; photographic overlay colors are centralized as `--photo-overlay: #292A3040` and `--photo-shade: #292A3099`.

Icons that previously used `text-secondary` were updated to primary because secondary now means a surface color. Small accent-colored text uses the existing readable accent-ink derivative. SectionHeading has an optional editorial flag; its default remains Sans. Existing reduced-motion handling is preserved.

The product header keeps its current controls and callbacks. On narrow mobile screens the language switcher remains available in the existing menu; long profile names truncate and the desktop profile button starts at the medium breakpoint. Select values can shrink inside narrow layouts. Existing comparison-table horizontal scrolling remains intentional and contained.

## Search and product flows

The existing saved-reference filter in `features/product/saved.tsx` is unchanged: it filters the current saved data by title, source, and external property ID. Its state, data types, loading/error/empty presentations, save/delete callbacks, and routes remain. Only its surrounding search panel and title bidirectional isolation were refined.

The landing discovery section keeps both original entry paths: search criteria and the saved-reference workflow. It reuses the existing PropertySearchForm, CitySelector, and PurposeSelector and keeps city, purpose, q, and maxPrice state. The property-type control that appeared in the original discovery design is now an editable local selection. No existing advanced filter implementation was found or removed.

City begins empty and is required; there is no all-cities option or silent Riyadh default. Rent/buy controls remain visible, with rent selected visibly. Budget labels/options reflect yearly rent or purchase price; changing purpose resets the budget. Filter choices are local UI state, not a request to an API. Existing local city choices are not a validated provider coverage list or an API city-slug contract.

Submitting criteria reports that live search has not been performed. It never manufactures inventory or presents a successful backend search. The existing `/properties` organization link and `/saved` reference-saving link remain available. The HTML-style demo inventory, preview favorites, preview comparison bar, and preview provider are no longer mounted in the landing flow. Those earlier files were retained untouched rather than deleted; the original comparison illustration and its interactive column selection remain, clearly labeled as illustrative.

Existing account, user-ID, saved references, location, profile, and comparison flows were not rewritten. Existing API hooks and clients were left in place without adding integrations or invoking them as verification.

## Modified files in this refinement

- `app/fonts.ts`
- `app/globals.css`
- `components/landing/features-section.tsx`
- `components/landing/final-cta-section.tsx`
- `components/landing/hero-section.tsx`
- `components/landing/how-it-works-section.tsx`
- `components/landing/landing-page.tsx`
- `components/landing/personalized-locations-section.tsx`
- `components/landing/property-comparison-section.tsx`
- `components/landing/property-discovery-section.tsx`
- `components/landing/property-search-form.tsx`
- `components/landing/section-heading.tsx`
- `components/product/product-shell.tsx`
- `components/site/site-brand.tsx`
- `components/site/site-footer.tsx`
- `components/site/site-header.tsx`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/select.tsx`
- `docs/MADAR_VISUAL_IDENTITY.md`
- `features/product/saved.tsx`
- `messages/ar.json`
- `messages/en.json`

No new project files were created and no project files were removed in this refinement. Fonts, public images, routes, package files, dependencies, and backend files were not modified.

## Verification and remaining limits

Static TypeScript and ESLint checks were used. No tests, builds, dev-server startup, browser automation, commits, or pushes were performed. No API or authentication integration was added. Backend files and unrelated uncommitted changes were preserved.

The actual rendered layout, font metrics, theme flash/hydration behavior, and responsiveness have not been checked in a running browser. Live property search remains unavailable by scope; it requires a separate future integration task. Regional colors remain available centrally without adding the HTML regional showcase to the original landing page.
