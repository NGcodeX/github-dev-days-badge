"use client";

import { useRef, useState } from "react";
import {
  ImagePlus,
  RotateCcw,
  Trash2,
  Upload,
  User,
  ZoomIn,
} from "lucide-react";
import {
  EDITOR_SIZE,
  VIRTUAL_BOX,
  clampPan,
  coverSize,
  toRenderedOffset,
} from "../lib/badge";

export type ControlsPanelProps = {
  fullName: string;
  onNameChange: (value: string) => void;
  photoUrl: string | null;
  photoName: string | null;
  onPhotoSelect: (file: File) => void;
  onPhotoRemove: () => void;
  photoAspect: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  offsetX: number;
  offsetY: number;
  onOffsetChange: (x: number, y: number) => void;
  onResetPhoto: () => void;
};

export default function ControlsPanel({
  fullName,
  onNameChange,
  photoUrl,
  photoName,
  onPhotoSelect,
  onPhotoRemove,
  photoAspect,
  zoom,
  onZoomChange,
  offsetX,
  offsetY,
  onOffsetChange,
  onResetPhoto,
}: ControlsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const scale = EDITOR_SIZE / VIRTUAL_BOX;
  const ox = toRenderedOffset(offsetX, EDITOR_SIZE);
  const oy = toRenderedOffset(offsetY, EDITOR_SIZE);
  const content = coverSize(EDITOR_SIZE, zoom, photoAspect);

  function beginDrag(e: React.PointerEvent) {
    if (!photoUrl) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY };
    setDragging(true);
  }

  function moveDrag(e: React.PointerEvent) {
    if (!dragging) return;
    const dxVirtual = (e.clientX - dragStart.current.x) / scale;
    const dyVirtual = (e.clientY - dragStart.current.y) / scale;
    const clamped = clampPan(
      dragStart.current.ox + dxVirtual,
      dragStart.current.oy + dyVirtual,
      zoom,
      photoAspect,
    );
    onOffsetChange(clamped.x, clamped.y);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step 1 • name */}
      <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#39d353] font-mono text-xs font-bold text-[#0d1117]">
            1
          </span>
          <h2 className="font-semibold text-[#e6edf3]">Your name</h2>
        </div>
        <p className="mb-3 text-sm text-[#8b949e]">
          Live preview • it appears on the badge as you type.
        </p>
        <div className="relative">
          <User
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]"
          />
          <input
            type="text"
            value={fullName}
            maxLength={30}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Souleymane"
            autoComplete="name"
            className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] py-3 pl-10 pr-16 text-[#e6edf3] placeholder:text-[#6e7681] focus:border-[#39d353] focus:outline-none focus:ring-2 focus:ring-[#39d353]/30"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#6e7681]">
            {fullName.length}/30
          </span>
        </div>
      </section>

      {/* Step 2 • photo */}
      <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#39d353] font-mono text-xs font-bold text-[#0d1117]">
            2
          </span>
          <h2 className="font-semibold text-[#e6edf3]">Your photo</h2>
        </div>
        <p className="mb-3 text-sm text-[#8b949e]">
          Upload a portrait. Drag to reposition, slide to zoom.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPhotoSelect(file);
            e.target.value = "";
          }}
        />

        <div className="flex flex-col items-center gap-4">
          {/* Crop / reposition editor */}
          <div
            onPointerDown={beginDrag}
            onPointerMove={moveDrag}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            title={photoUrl ? "Drag to reposition" : undefined}
            className={`relative shrink-0 overflow-hidden rounded-xl bg-[#0d1117] ring-4 ${
              photoUrl
                ? "cursor-move touch-none ring-[#39d353]/70"
                : "ring-[#30363d]"
            }`}
            style={{ width: EDITOR_SIZE, height: EDITOR_SIZE }}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Photo adjustment preview"
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2"
                style={{
                  width: content.w,
                  height: content.h,
                  maxWidth: "none",
                  transform: `translate(-50%, -50%) translate(${ox}px, ${oy}px)`,
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-[#8b949e] transition-colors hover:text-[#39d353]"
              >
                <ImagePlus size={36} strokeWidth={1.5} />
                <span className="px-6 text-center text-xs">
                  Click to upload a photo
                </span>
              </button>
            )}
          </div>

          <div className="flex w-full flex-1 flex-col gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#39d353] px-4 py-2.5 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-[#2eb84a]"
            >
              <Upload size={16} />
              {photoUrl ? "Change photo" : "Upload photo"}
            </button>

            {photoName && (
              <p className="truncate text-xs text-[#8b949e]" title={photoName}>
                {photoName}
              </p>
            )}

            <label className="flex items-center gap-2 text-sm text-[#8b949e]">
              <ZoomIn size={16} className="shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                disabled={!photoUrl}
                onChange={(e) => onZoomChange(Number(e.target.value))}
                className="neon-range w-full disabled:opacity-40"
                aria-label="Photo zoom"
              />
              <span className="w-10 shrink-0 text-right font-mono text-xs">
                {zoom.toFixed(2)}x
              </span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onResetPhoto}
                disabled={!photoUrl}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#30363d] px-3 py-2 text-xs font-medium text-[#e6edf3] transition-colors hover:border-[#39d353] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw size={14} />
                Reset crop
              </button>
              <button
                type="button"
                onClick={onPhotoRemove}
                disabled={!photoUrl}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#30363d] px-3 py-2 text-xs font-medium text-[#f85149] transition-colors hover:border-[#f85149] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
