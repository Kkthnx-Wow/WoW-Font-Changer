import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Dropzone } from "./components/Dropzone";
import { Footer } from "./components/Footer";

const SettingsDrawer = lazy(() =>
  import("./components/SettingsDrawer").then((m) => ({
    default: m.SettingsDrawer,
  })),
);

function WidgetShell() {
  const { setFontFromPath, settingsOpen, setSettingsOpen } = useApp();
  const [isDragging, setIsDragging] = useState(false);

  const handleFontDrop = useCallback(
    (path: string) => {
      void setFontFromPath(path);
    },
    [setFontFromPath],
  );

  useEffect(() => {
    // Native drag and drop only exists under the Tauri runtime. Guard it so the
    // app still renders (instead of hard-crashing) in a plain browser.
    if (!("__TAURI_INTERNALS__" in window)) return;

    let unlisten: (() => void) | undefined;

    void getCurrentWindow()
      .onDragDropEvent((event) => {
        const payload = event.payload;
        if (payload.type === "over") {
          setIsDragging(true);
        } else if (payload.type === "leave") {
          setIsDragging(false);
        } else if (payload.type === "drop") {
          setIsDragging(false);
          const path = payload.paths[0];
          if (path) {
            void handleFontDrop(path);
          }
        }
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  }, [handleFontDrop]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, setSettingsOpen]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-charcoal via-charcoal to-[#08090d]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(212,175,55,0.06),transparent_55%)]" />
      <Header />
      <Dropzone isDragging={isDragging} />
      <Footer />
      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsDrawer />
        </Suspense>
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <WidgetShell />
    </AppProvider>
  );
}

export default App;
