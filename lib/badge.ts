/** Final export resolution: 4:5 ratio (1080 x 1350). */
export const BADGE_WIDTH = 1080;
export const BADGE_HEIGHT = 1350;

/**
 * Photo window geometry, measured from the alpha channel of overlay.png:
 * transparent square x 259-845, y 284-870 (586 x 586 px).
 * The attendee portrait sits EXACTLY in this window, UNDER the overlay,
 * so foreground artwork (green lanyard strap) overlaps it naturally.
 */
export const PHOTO_LEFT = 259;
export const PHOTO_TOP = 284;
export const PHOTO_SIZE = 586;

/**
 * Name slot: centred under the photo window (window centre x = 552),
 * on the clean gradient strip between the strap and the headline.
 * Rendered as plain sober text • no pill, no background.
 */
export const NAME_CENTER_X = 552;
export const NAME_TOP = 888;

/**
 * Pan offsets are stored in a resolution-independent "virtual" box of
 * VIRTUAL_BOX units so the small crop editor and the full-res badge stay
 * perfectly in sync: renderedOffset = virtual * (renderedSize / VIRTUAL_BOX).
 */
export const VIRTUAL_BOX = 400;
export const EDITOR_SIZE = 220;

/**
 * Per-axis pan bounds (virtual units) for the cover-fitted photo inside
 * its square window. Bounds derive from the real image aspect ratio, so
 * a wide (16:9) photo can slide horizontally at zoom 1, a tall (9:16)
 * one vertically — you always get access to the whole image, never just
 * the centre crop.
 */
export function panBounds(
  zoom: number,
  aspect: number,
): { maxX: number; maxY: number } {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const maxX = (VIRTUAL_BOX * (zoom * Math.max(1, safeAspect) - 1)) / 2;
  const maxY = (VIRTUAL_BOX * (zoom * Math.max(1, 1 / safeAspect) - 1)) / 2;
  return { maxX: Math.max(0, maxX), maxY: Math.max(0, maxY) };
}

export function clampPan(
  x: number,
  y: number,
  zoom: number,
  aspect: number,
): { x: number; y: number } {
  const { maxX, maxY } = panBounds(zoom, aspect);
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}

export function toRenderedOffset(virtual: number, renderedSize: number): number {
  return virtual * (renderedSize / VIRTUAL_BOX);
}

/**
 * Cover-fitted content size (same units as `container`) for an image of
 * the given aspect ratio at the given zoom. The rendered <img> uses
 * exactly this size — centred, then panned — so the element IS the full
 * image sliding under a fixed window (never an empty tile). Mirrors the
 * math in renderBadgeToCanvas.
 */
export function coverSize(
  container: number,
  zoom: number,
  aspect: number,
): { w: number; h: number } {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const box = container * zoom;
  return {
    w: box * Math.max(1, safeAspect),
    h: box * Math.max(1, 1 / safeAspect),
  };
}

/** Shrink the name font so long names never overflow the artwork. */
export function nameFontSize(name: string): number {
  const len = name.trim().length;
  if (len > 24) return 30;
  if (len > 18) return 36;
  return 46;
}

export function slugifyName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "attendee";
}

export function badgeFilename(name: string): string {
  return `github-dev-days-badge-${slugifyName(name)}.png`;
}

/* ------------------------------------------------------------------ */
/* Native canvas export engine (no DOM serialization, works on mobile) */
/* ------------------------------------------------------------------ */

export type BadgeRenderState = {
  fullName: string;
  /** Object URL (blob:) or data URL of the uploaded portrait, or null. */
  photoUrl: string | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Could not load image (${src.slice(0, 32)}…)`));
    img.src = src;
  });
}

function monoStack(): string {
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-geist-mono")
      .trim();
    if (v) return v;
  } catch {
    // Fall through to the generic stack below.
  }
  return "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
}

/** Draws centred text with manual letter-spacing (canvas letterSpacing
 *  is not supported on all mobile browsers). */
function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  spacing: number,
): void {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = centerX - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
}

/**
 * Redraws the exact badge composition (same geometry as BadgeCanvas)
 * onto a 1080x1350 canvas using only the native Canvas 2D API:
 *  1. dark base + attendee portrait fitted into the frame window
 *     (cover-fit with the same zoom / pan as the live preview),
 *  2. overlay.png artwork on top (strap overlaps the portrait),
 *  3. sober attendee name.
 * Same-origin + blob: images never taint the canvas, so this works in
 * every browser, including mobile Safari/Chrome.
 */
export async function renderBadgeToCanvas(
  state: BadgeRenderState,
): Promise<HTMLCanvasElement> {
  const { fullName, photoUrl, zoom, offsetX, offsetY } = state;

  const canvas = document.createElement("canvas");
  canvas.width = BADGE_WIDTH;
  canvas.height = BADGE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not supported in this browser.");

  // Layer 0: dark base (visible through the window when no photo).
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, BADGE_WIDTH, BADGE_HEIGHT);

  // Layer 1: portrait, cover-fitted into the window (mirrors the DOM preview).
  if (photoUrl) {
    const photo = await loadImage(photoUrl);
    const iw = photo.naturalWidth;
    const ih = photo.naturalHeight;
    if (!iw || !ih) throw new Error("Could not read the uploaded photo.");
    const box = PHOTO_SIZE * zoom;
    const s = Math.max(box / iw, box / ih);
    const dw = iw * s;
    const dh = ih * s;
    const ox = toRenderedOffset(offsetX, PHOTO_SIZE);
    const oy = toRenderedOffset(offsetY, PHOTO_SIZE);
    // Centre the zoomed box in the window, then apply the pan offset
    // (mirrors the CSS: translate(-50%,-50%) then translate(ox,oy)).
    const dx = PHOTO_LEFT + ox + (PHOTO_SIZE - dw) / 2;
    const dy = PHOTO_TOP + oy + (PHOTO_SIZE - dh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(PHOTO_LEFT, PHOTO_TOP, PHOTO_SIZE, PHOTO_SIZE);
    ctx.clip();
    ctx.drawImage(photo, dx, dy, dw, dh);
    ctx.restore();
  }

  // Layer 2: overlay artwork on top.
  const overlay = await loadImage("/overlay.png");
  ctx.drawImage(overlay, 0, 0, BADGE_WIDTH, BADGE_HEIGHT);

  // Layer 3: sober name.
  const display = (fullName.trim() || "Your Name").toUpperCase();
  const size = nameFontSize(display);
  ctx.fillStyle = "#0d1117";
  ctx.font = `700 ${size}px ${monoStack()}`;
  ctx.textBaseline = "top";
  drawSpacedText(ctx, display, NAME_CENTER_X, NAME_TOP, size * 0.06);

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  if (typeof canvas.toBlob === "function") {
    return new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("PNG encoding failed.")),
        "image/png",
      ),
    );
  }
  // Fallback for very old browsers without toBlob.
  const dataUrl = canvas.toDataURL("image/png");
  const bin = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return Promise.resolve(new Blob([bytes], { type: "image/png" }));
}

/** Triggers a file download. On phones without download support
 *  (iOS Safari) the image simply opens • use Share there instead. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function canShareFiles(): boolean {
  try {
    if (typeof navigator === "undefined" || !("canShare" in navigator)) {
      return false;
    }
    return navigator.canShare({
      files: [new File([""], "check.png", { type: "image/png" })],
    });
  } catch {
    return false;
  }
}

/** Opens the native share sheet (WhatsApp, Instagram, …). Perfect for phones. */
export async function sharePng(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });
  await navigator.share({
    files: [file],
    title: "GitHub Dev Days #26 • I'm Attending",
  });
}
