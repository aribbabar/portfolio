# Performance improvements

Implemented September 5, 2026. No deployment was performed.

## Changes

- Wave geometry is cached on resize. Point counts fall from 8,400 to 2,100 on narrow canvases (660 px or less) and 5,040 on desktop. Color buckets fall from 14 to 8 (99 Path2D allocations per draw instead of 171). Animation is capped at 24 FPS.
- The canvas retains reduced-motion, tab-visibility, and offscreen safeguards. If at least 18 of 24 sampled frames take more than 12 ms to draw, it switches to a still frame for that page visit. A single expensive frame does not trigger the fallback.
- Four complex SVGs are served as lossless WebP exports, at three times their maximum displayed widths. Original vectors remain available in src/assets. Raster exports preserve transparency but have a fixed resolution.
- The noninteractive hero terminal renders as Astro HTML. The contact terminal hydrates within 200 px of the viewport, deferring the React runtime and terminal code.
- The contact boot sequence reveals eight lines at 80 ms intervals instead of typing every character. Input remains enabled; pointer interaction, focus, typing, or reduced motion finishes the animation immediately. It no longer steals focus on completion.

## Asset measurements

The four original SVGs total 2,836,241 bytes uncompressed, or 327,586 bytes with locally calculated gzip. The replacement WebP files total 87,524 bytes: approximately 97% smaller than the raw SVGs and 73% smaller than the gzipped SVGs. These are local file measurements, not production network measurements.

## Browser comparison

Both builds were generated from this checkout: the unchanged baseline was built before source edits. Chrome ran locally with 4x CPU throttling at device scale factor 1. Each observation waited five seconds after navigation completed. One paired run per viewport is shown; these diagnostics are not Lighthouse scores or production Core Web Vitals.

| Viewport | Baseline animation callback time | Updated | Reduction | Baseline callback p95 | Updated p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 390 x 844 | 2,144 ms | 498 ms | 77% | 18.2 ms | 3.7 ms |
| 1440 x 1000 | 2,384 ms | 1,126 ms | 53% | 31.0 ms | 8.4 ms |

Animation callback totals include every requestAnimationFrame callback, including callbacks that skip drawing. Actual canvas draws were 129 versus 116 on mobile, and 105 versus 116 on desktop. Both updated runs retained animation rather than activating the static fallback.

Initial resource inspection showed only the wave JavaScript chunk loading in the updated build; the React runtime and terminal chunks loaded after approaching the contact section. Both baseline terminals hydrated immediately.

## Validation

- npm run check: zero errors, warnings, or hints.
- npm run build: successful static production build.
- Chrome browser assertions passed at mobile and desktop sizes: deferred hydration; enabled input; echo/pwd/clear; command history; tab completion; animation skipped on focus; reduced motion at load and when changed; offscreen pause/resume; density changes after resizing; a forced slow-draw scenario activates the static fallback; static hero content works with JavaScript disabled.
- Browser tests reported no page errors on the instrumented main test pages.
- Desktop and mobile screenshots were visually reviewed for layout and artwork.

The browser harness and raw screenshots were temporary audit tools, not added as project dependencies. Recheck the deployed site under representative mobile network conditions before drawing conclusions about LCP or INP.

## November 2, 2026 audit

Audited the current production build locally at `http://127.0.0.1:4321/` with Lighthouse 13.6.0 and a separate headless Chrome 156 session. No deployment was performed. Lighthouse was installed outside the repository; application dependencies and lockfiles were unchanged.

### Final measurements

| Profile | Performance | FCP | LCP | Total blocking time | Layout shift |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mobile | 97 | 0.8 s | 1.2 s | 200 ms | 0 |
| Desktop | 100 | 0.2 s | 0.3 s | 0 ms | 0 |

Mobile used Lighthouse's standard simulated mobile profile: 412 x 823, device scale factor 1.75, 4x CPU slowdown, 150 ms simulated RTT, and 1,638.4 Kbps throughput. Desktop used the built-in desktop preset. Each audit started at the home page with fresh browser storage, extensions disabled, and error reporting disabled. These are performance-category audits, not accessibility, SEO, or security audits.

Two baseline mobile runs scored 94 and 100, with 1.4 s LCP and 0–300 ms blocking time. Intermediate optimized runs scored 100 and 98; the final corrected build scored 97. Desktop scored 100 both before and after. This variation does not support claiming a guaranteed score or CPU improvement. These are local lab observations, not production field Core Web Vitals or a measurement of INP. Lighthouse results can be affected by the test environment, as explained in the [Chrome documentation](https://developer.chrome.com/docs/devtools/lighthouse).

### Findings and implemented improvements

- **Oversized image delivery was the clearest opportunity.** The initial mobile audit estimated 84,029 bytes of avoidable image payload. The asteroid, brain, palette, and gamepad now use Astro-generated WebP variants with responsive `srcset` and high quality (90). Original assets remain available in `src/assets`; higher-resolution variants remain available for dense displays. These transforms run during the static build, following the [Astro assets API](https://v6.docs.astro.build/en/reference/modules/astro-assets/).
- **Measured image bytes fell by 70.3%.** The four raster images downloaded in the mobile audit totaled 87,524 bytes before and 25,966 bytes after: 61,558 bytes saved. This is the sum of image resource bodies in Lighthouse's network log, excluding response headers. It is not a 70% reduction in the entire page. The final mobile run transferred 88,186 bytes across all recorded resources.
- **Offscreen CSS animation now pauses.** A shared visibility observer pauses the hero asteroids and cursor, education signal bars, and experience bars when their panels leave view or the document becomes hidden. The existing canvas retains its separate offscreen, hidden-tab, reduced-motion, and slow-device safeguards. Browser checks verified that offscreen panels pause and the visible panel resumes. One-time entrance animations are unaffected.
- **Timeline pointer work is limited to useful updates.** The first node reference is cached; once the pointer is outside the 120 px interaction band, the glow clears without updating its position on every move. Updates remain limited to one requestAnimationFrame callback per frame.
- **Deferred React loading remains intact.** The final home-page audits fetched only the 4,861-byte wave script (2,660 bytes transferred). The React runtime and interactive terminal code were absent from initial script requests and remain deferred until the contact terminal approaches the viewport.
- **Experience uses a shared left edge.** The section heading, Side Quests panel, and date text share the same left edge. A compact desktop date column keeps the timeline toward the left; phone layouts retain their narrower date column.

### Remaining opportunities and limits

The animated wave remains the largest attributed JavaScript CPU consumer during the loading audit. Its existing 24 FPS cap and safeguards are useful; this pass did not change its geometry or reduce the visible animation. The final audit still identifies a small image-delivery opportunity and the stylesheet as render-blocking. The stylesheet is approximately 52 KB uncompressed and 10 KB transferred; splitting it needs evidence of a practical gain before adding complexity.

The largest remaining uncertainty is performance on actual mobile devices and production hosting. A real-device interaction profile and production field measurements would provide better evidence before changing the canvas further. No live-site CDN, cache-header, or geographic latency measurements were taken.

### Verification and reproduction

- Astro check: 0 errors, warnings, or hints.
- Static production build: passed; image variants generated at build time.
- Browser checks: date alignment and no horizontal overflow at desktop and 390 px; artwork loaded and visually inspected; animation pause/resume verified while navigating between home and experience.
- Final Lighthouse reports completed without run warnings.

Run the production build and `astro preview`, then use the [official Lighthouse CLI](https://github.com/GoogleChrome/lighthouse/blob/main/readme.md):

```sh
npx lighthouse@13.6.0 http://127.0.0.1:4321/ --chrome-flags="--headless --disable-extensions" --only-categories=performance --no-enable-error-reporting --output=json --output=html --output-path=./mobile-audit
npx lighthouse@13.6.0 http://127.0.0.1:4321/ --chrome-flags="--headless --disable-extensions" --preset=desktop --only-categories=performance --no-enable-error-reporting --output=json --output=html --output-path=./desktop-audit
```
