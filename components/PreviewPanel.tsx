"use client";

import { useEffect, useRef, useState } from "react";
import BadgeCanvas, { type BadgeCanvasProps } from "./BadgeCanvas";
import { BADGE_HEIGHT, BADGE_WIDTH } from "../lib/badge";

type PreviewPanelProps = Omit<BadgeCanvasProps, "exportRef">;

/**
 * Responsive live preview. The badge itself is always laid out at the
 * full 1080x1350 export resolution; only this wrapper is scaled down to
 * fit the screen, so mobile and desktop both stay crisp and the PNG
 * export is unaffected.
 */
export default function PreviewPanel(props: PreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.32);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / BADGE_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-[#e6edf3]">Live preview</h2>
        <span className="rounded-full border border-[#30363d] bg-[#0d1117] px-3 py-1 font-mono text-xs text-[#39d353]">
          1080 x 1350 &middot; 4:5
        </span>
      </div>

      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-2xl border border-[#30363d] bg-[#0d1117] shadow-[0_0_60px_rgba(57,211,83,0.12)]"
      >
        <div
          className="relative w-full"
          style={{ height: Math.round(BADGE_HEIGHT * scale) }}
        >
          <div
            className="absolute left-0 top-0"
            style={{
              width: BADGE_WIDTH,
              height: BADGE_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <BadgeCanvas {...props} />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-[#8b949e]">
        What you see is what you download • full HD, ready for LinkedIn, X
        and WhatsApp.
      </p>
    </div>
  );
}
