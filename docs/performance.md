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
