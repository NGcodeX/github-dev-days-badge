# Badge Studio — "I'm Attending" GitHub Dev Days #26 Cameroon

A lightweight, mobile-first web app that generates personalized **"I'm Attending"** badges for **GitHub Dev Days #26 Cameroon** (Yaoundé, Oct 24).

Attendees type their name, upload a portrait, preview the badge live, then download it in full HD (**1080×1350 PNG, 4:5**) or share it straight to WhatsApp / Instagram from their phone.

## Features

- **Live badge preview** — name and photo update instantly, side-by-side on desktop, stacked on mobile.
- **True layered composition** — portraitrendered *under* the `overlay.png` artwork, so foreground elements (green lanyard strap) overlap it naturally.
- **Photo controls** — upload, drag to reposition, zoom slider (1–3x), reset, remove.
- **Bulletproof export** — native Canvas 2D renderer (no DOM serialization), works on desktop and mobile browsers, including iOS Safari.
- **Native share** — Web Share API sheet on supported phones (WhatsApp, Instagram, X…).
- **Dark GitHub aesthetic** — `#0d1117` background, `#39d353` neon-green accents, Lucide icons.

## Tech stack

| Layer   | Choice                                      |
| ------- | ------------------------------------------- |
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS v4                             |
| Export  | Native HTML5 `<canvas>` (Canvas 2D API)     |
| Share   | Web Share API (Level 2, files)              |
| Icons   | Lucide React                                |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
npm run build   # production build
npm run start   # serve the production build
```

## Project structure

```
app/
  page.tsx          # main state, 3-step flow (name → photo → export), footer
  layout.tsx        # metadata + fonts
  globals.css       # theme tokens, slider + backdrop styles
components/
  BadgeCanvas.tsx   # layered 1080×1350 badge (preview only)
  ControlsPanel.tsx # name input + photo upload / crop editor
  PreviewPanel.tsx  # responsive scaled preview wrapper
lib/
  badge.ts          # geometry constants, filename helper, canvas export engine
public/
  overlay.png       # event artwork with transparent photo window
  Badge studio logo.png
```

## How it works

**Geometry.** The photo window was measured from the alpha channel of `overlay.png`: transparent square **x 259–845, y 284–870** (586×586 px). The name slot sits centered below it (`x = 552, y = 888`). All values live in `lib/badge.ts`, so a new artwork edition only needs new numbers.

**Preview.** `BadgeCanvas` is always laid out at full 1080×1350 resolution; `PreviewPanel` only scales a wrapper around it (`ResizeObserver`), so the preview stays crisp on any screen.

**Export.** `renderBadgeToCanvas()` redraws the exact same composition with the Canvas 2D API (cover-fit math mirrors the DOM preview, manual letter-spacing for cross-browser text), then:
- **Download** → `canvas.toBlob()` → `github-dev-days-badge-[name].png`
- **Share** → `navigator.share({ files })` when supported (phones)

No `html-to-image`, no SVG foreignObject — nothing that can break on mobile.

## Customizing for the next edition

1. Replace `public/overlay.png` (keep the transparent window for the photo).
2. Update `PHOTO_LEFT / PHOTO_TOP / PHOTO_SIZE` and `NAME_CENTER_X / NAME_TOP` in `lib/badge.ts`.
3. Update the event label in `app/page.tsx` and the README.

## Deployment

Any Next.js host works (Vercel recommended):

```bash
npm run build
```

No environment variables, no backend — fully static page.

## Credits

Built for **GitHub Dev Days #26 Cameroon** — GitHub Copilot × NGCodex.

By [hinmaka](https://my-portiffy.vercel.app/u/hinmaka)
