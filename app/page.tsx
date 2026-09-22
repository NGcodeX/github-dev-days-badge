"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import ControlsPanel from "../components/ControlsPanel";
import PreviewPanel from "../components/PreviewPanel";
import {
  badgeFilename,
  canShareFiles,
  canvasToBlob,
  clampPan,
  downloadBlob,
  renderBadgeToCanvas,
  sharePng,
  type BadgeRenderState,
} from "../lib/badge";

export default function Home() {
  const [fullName, setFullName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoAspect, setPhotoAspect] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [busy, setBusy] = useState<null | "download" | "share">(null);
  const [shareAvailable, setShareAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setShareAvailable(canShareFiles());
  }, []);

  const handlePhotoSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, WebP…).");
      return;
    }
    setError(null);
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    const url = URL.createObjectURL(file);
    photoUrlRef.current = url;
    setPhotoUrl(url);
    setPhotoName(file.name);
    setPhotoAspect(1);
    const probe = new Image();
    probe.onload = () => {
      if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
        setPhotoAspect(probe.naturalWidth / probe.naturalHeight);
      }
    };
    probe.src = url;
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }, []);

  const handlePhotoRemove = useCallback(() => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = null;
    setPhotoUrl(null);
    setPhotoName(null);
    setPhotoAspect(1);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }, []);

  const buildState = useCallback(
    (): BadgeRenderState => ({ fullName, photoUrl, zoom, offsetX, offsetY }),
    [fullName, photoUrl, zoom, offsetX, offsetY],
  );

  const handleDownload = useCallback(async () => {
    if (busy) return;
    setBusy("download");
    setError(null);
    try {
      const canvas = await renderBadgeToCanvas(buildState());
      const blob = await canvasToBlob(canvas);
      downloadBlob(blob, badgeFilename(fullName));
    } catch {
      setError("Couldn't generate the PNG on this device. Please try again.");
    } finally {
      setBusy(null);
    }
  }, [busy, buildState, fullName]);

  const handleShare = useCallback(async () => {
    if (busy) return;
    setBusy("share");
    setError(null);
    try {
      const canvas = await renderBadgeToCanvas(buildState());
      const blob = await canvasToBlob(canvas);
      await sharePng(blob, badgeFilename(fullName));
    } catch (err) {
      // User dismissed the share sheet: not an error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Sharing isn't available here • use Download instead.");
    } finally {
      setBusy(null);
    }
  }, [busy, buildState, fullName]);

  return (
    <div className="min-h-full bg-[#0d1117] text-[#e6edf3]">
      {/* Backdrop */}
      <div className="dot-grid pointer-events-none fixed inset-0" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-8 sm:px-6">
        {/* Header */}
        <header className="mb-8 flex flex-col items-center text-center">
          <img
            src="/Badge%20studio%20logo.png"
            alt="Badge Studio logo"
            className="h-auto w-64 sm:w-80"
          />
          <p className="mt-4 max-w-xl text-sm text-[#8b949e] sm:text-base">
            Create your personal{" "}
            <span className="font-medium text-[#e6edf3]">
              I&apos;m Attending
            </span>{" "}
            badge for GitHub Dev Days #26 • Yaoundé, Oct 24.
          </p>
        </header>

        {/* Main: controls + preview (stacked on mobile, side-by-side on desktop) */}
        <main className="grid flex-1 gap-8 lg:grid-cols-[400px_1fr] lg:items-start">
          <div className="flex flex-col gap-6">
            <ControlsPanel
              fullName={fullName}
              onNameChange={setFullName}
              photoUrl={photoUrl}
              photoName={photoName}
              onPhotoSelect={handlePhotoSelect}
              onPhotoRemove={handlePhotoRemove}
              photoAspect={photoAspect}
              zoom={zoom}
              onZoomChange={(z) => {
                setZoom(z);
                const c = clampPan(offsetX, offsetY, z, photoAspect);
                setOffsetX(c.x);
                setOffsetY(c.y);
              }}
              offsetX={offsetX}
              offsetY={offsetY}
              onOffsetChange={(x, y) => {
                const c = clampPan(x, y, zoom, photoAspect);
                setOffsetX(c.x);
                setOffsetY(c.y);
              }}
              onResetPhoto={() => {
                setZoom(1);
                setOffsetX(0);
                setOffsetY(0);
              }}
            />

            {/* Step 3 • export */}
            <section className="rounded-2xl border border-[#39d353]/40 bg-[#161b22] p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#39d353] font-mono text-xs font-bold text-[#0d1117]">
                  3
                </span>
                <h2 className="font-semibold text-[#e6edf3]">
                  Get your badge
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={busy !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#39d353] px-4 py-3.5 font-semibold text-[#0d1117] transition-all hover:bg-[#2eb84a] hover:shadow-[0_0_30px_rgba(57,211,83,0.4)] disabled:cursor-wait disabled:opacity-70"
                >
                  {busy === "download" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Rendering PNG…
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Download My Badge
                    </>
                  )}
                </button>
                {shareAvailable && (
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={busy !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#30363d] px-4 py-3 font-semibold text-[#e6edf3] transition-colors hover:border-[#39d353] disabled:cursor-wait disabled:opacity-70"
                  >
                    {busy === "share" ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Preparing…
                      </>
                    ) : (
                      <>
                        <Share2 size={18} />
                        Share to WhatsApp & more
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="mt-2 text-center font-mono text-xs text-[#8b949e]">
                {badgeFilename(fullName)} &middot; 1080&times;1350 PNG
              </p>
              {error && (
                <p
                  role="alert"
                  className="mt-2 rounded-lg border border-[#f85149]/40 bg-[#f85149]/10 px-3 py-2 text-center text-xs text-[#ffa198]"
                >
                  {error}
                </p>
              )}
            </section>
          </div>

          <div className="lg:sticky lg:top-6">
            <PreviewPanel
              fullName={fullName}
              photoUrl={photoUrl}
              photoAspect={photoAspect}
              zoom={zoom}
              offsetX={offsetX}
              offsetY={offsetY}
            />
          </div>
        </main>

        <footer className="mt-12 text-center text-xs text-[#6e7681]">
           GitHub Copilot
          &times; NGCodex &middot; &middot; By{" "}
          <a
            href="https://my-portiffy.vercel.app/u/hinmaka"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8b949e] underline decoration-[#30363d] underline-offset-2 transition-colors hover:text-[#39d353] hover:decoration-[#39d353]"
          >
            hinmaka
          </a>
        </footer>
      </div>
    </div>
  );
}
