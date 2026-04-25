# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Slick** is a jQuery-based responsive carousel/slider plugin. The main source is `slick/slick.js`. Styles are in `slick/slick.css` (core layout) and `slick/slick-theme.css` (default theme), with SCSS and LESS preprocessor sources alongside them.

This fork (`taupecat/slick`) is branched from the upstream `kenwheeler/slick`. The active branch `vanilla-js` is intended to port the library away from jQuery to vanilla JavaScript.

## Development

There is no npm build pipeline or test runner. Development is done by editing `slick/slick.js` and opening `index.html` in a browser. `index.html` loads jQuery from CDN and initializes several carousel configurations for manual visual testing.

CSS source: edit `slick/slick.scss` or `slick/slick.less` and compile manually (Compass config is in `slick/config.rb`). Do not edit `slick.css` or `slick-theme.css` directly if working from a preprocessor source.

The Makefile uses the legacy `component` package manager and is not relevant to most development.

## Testing

There is no automated test suite. All testing is manual:
- Open `index.html` in a browser to exercise multiple carousel configurations
- For bug reports or PRs, a working jsFiddle is required ([baseline fiddle](https://jsfiddle.net/o1yehw0g/1/)) demonstrating the issue across all carousel modes and with varying slide counts

## Code Architecture

`slick/slick.js` is a single-file UMD module (~3,000 lines) that exposes itself as a jQuery plugin (`$.fn.slick`). It follows a constructor pattern: `new Slick(element, options)` where all instance state is stored on `_` (e.g., `_.currentSlide`, `_.slideCount`).

### Initialization flow
`$.fn.slick` → `new Slick()` → `init()` → `buildOut()` → `loadSlider()` → `setPosition()`

### Key subsystems
- **Layout/dimensions**: `setDimensions()`, `setPosition()`, `setHeight()` — recalculate on resize and after slide changes
- **Animation**: `animateSlide()` (CSS transforms), `fadeSlide()`/`fadeSlideOut()` — chosen based on `fade` option and `useCSS`/`useTransform` flags
- **Navigation**: `changeSlide()` → `slideHandler()` — central slide transition logic; handles infinite cloning, animation queuing
- **Responsive**: `registerBreakpoints()` + `checkResponsive()` — merges per-breakpoint option overrides; supports `"unslick"` as a breakpoint setting to disable the carousel
- **Touch/drag**: `swipeStart/Move/End`, `dragHandler` — unified pointer handling with configurable `swipeToSlide`/`draggable` options
- **Lazy loading**: `lazyLoad()`, `progressiveLazyLoad()` — triggered on slide change and init
- **Public API**: Methods are defined twice — internal name (e.g., `next`) and a `slick`-prefixed alias (e.g., `slickNext`); both are callable via `$(el).slick('methodName', args)`

### Events
Custom jQuery events fired on the slider element: `init`, `beforeChange`, `afterChange`, `breakpoint`, `destroy`, `edge`, `reInit`, `setPosition`, `swipe`, `lazyLoaded`, `lazyLoadError`. Events must be bound before calling `.slick()`.

### DOM structure after init
Slick wraps the original slide elements in a `.slick-track` inside a `.slick-list`, inserts clones for infinite looping, and appends `.slick-prev`/`.slick-next` arrows and a `.slick-dots` list as siblings to `.slick-list`.
