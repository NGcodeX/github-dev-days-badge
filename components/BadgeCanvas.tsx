"use client";

import type { RefObject } from "react";
import { User } from "lucide-react";
import {
  BADGE_HEIGHT,
  BADGE_WIDTH,
  NAME_CENTER_X,
  NAME_TOP,
  PHOTO_LEFT,
  PHOTO_SIZE,
  PHOTO_TOP,
  coverSize,
  nameFontSize,
  toRenderedOffset,
} from "../lib/badge";

export type BadgeCanvasProps = {
  /** Optional ref to the full-resolution node (e.g. for screenshots/tests). */
  exportRef?: RefObject<HTMLDivElement | null>;
  fullName: string;
  /** Object URL of the uploaded portrait, or null for the placeholder. */
  photoUrl: string | null;
  zoom: number;
  /** Image width / height ratio (drives the cover-fit content size). */
  photoAspect: number;
  /** Pan offsets in virtual-box units (see lib/badge.ts). */
  offsetX: number;
  offsetY: number;
};

/**
 * Layered "I'm Attending" badge, always laid out at the full 1080x1350
 * export resolution. On screen only a scaled wrapper shrinks it, so the
 * downloaded PNG is pixel-perfect.
 *
 * Layering (absolute positioning + z-index):
 *  - z-[1]: attendee portrait, fitted exactly into the transparent
 *    square window of the overlay (x 259-845, y 284-870).
 *  - z-[2]: overlay.png artwork (background, event info, QR code).
 *    Its foreground elements (green lanyard strap) overlap the
 *    portrait naturally.
 *  - z-[3]: dynamic attendee name over the name slot, plain sober text.
 */
export default function BadgeCanvas({
  exportRef,
  fullName,
  photoUrl,
  zoom,
  photoAspect,
  offsetX,
  offsetY,
}: BadgeCanvasProps) {
  const displayName = fullName.trim() || "Your Name";
  const isPlaceholderName = fullName.trim().length === 0;

  const ox = toRenderedOffset(offsetX, PHOTO_SIZE);
  const oy = toRenderedOffset(offsetY, PHOTO_SIZE);
  const content = coverSize(PHOTO_SIZE, zoom, photoAspect);

  return (
    <div
      ref={exportRef}
      role="img"
      aria-label={`I'm attending badge preview for ${displayName}`}
      className="relative overflow-hidden bg-[#0d1117]"
      style={{ width: BADGE_WIDTH, height: BADGE_HEIGHT }}
    >
      {/* Layer 1 (z-1): attendee portrait inside the frame window. */}
      <div
        className="absolute z-[1] overflow-hidden bg-[#0d1117]"
        style={{
          left: PHOTO_LEFT,
          top: PHOTO_TOP,
          width: PHOTO_SIZE,
          height: PHOTO_SIZE,
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Attendee portrait"
            draggable={false}
            className="absolute left-1/2 top-1/2"
              style={{
                width: content.w,
                height: content.h,
                maxWidth: "none",
                transform: `translate(-50%, -50%) translate(${ox}px, ${oy}px)`,
              }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4">
            <span className="flex h-32 w-32 items-center justify-center rounded-full bg-[#161b22] ring-4 ring-[#30363d]">
              <User size={72} color="#8b949e" strokeWidth={1.25} />
            </span>
            <span className="font-mono text-[24px] uppercase tracking-[0.3em] text-[#8b949e]">
              Your photo
            </span>
          </div>
        )}
      </div>

      {/* Layer 2 (z-2): event artwork frame over the portrait. */}
      <img
        src="/overlay.png"
        alt=""
        draggable={false}
        className="absolute inset-0 z-[2] h-full w-full object-cover"
      />

      {/* Layer 3 (z-3): attendee name • plain sober text, no background. */}
      <div
        className="absolute z-[3] -translate-x-1/2"
        style={{
          left: NAME_CENTER_X,
          top: NAME_TOP,
          maxWidth: BADGE_WIDTH * 0.8,
        }}
      >
        <p
          className={`whitespace-nowrap font-mono font-bold uppercase leading-none tracking-[0.06em] text-[#0d1117] ${
            isPlaceholderName ? "opacity-40" : ""
          }`}
          style={{ fontSize: nameFontSize(displayName) }}
        >
          {displayName}
        </p>
      </div>
    </div>
  );
}
