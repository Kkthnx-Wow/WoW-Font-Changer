import { lazy, Suspense, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AppProvider, useApp } from "./context/AppContext";
import { useI18n } from "./i18n";
import { Header } from "./components/Header";
import { FontCard } from "./components/FontCard";
import { SlotList } from "./components/SlotList";
import { Footer } from "./components/Footer";

const SettingsDrawer = lazy(() =>
  import("./components/SettingsDrawer").then((m) => ({
    default: m.SettingsDrawer,
  })),
);

function WidgetShell() {
  const { setFontFromPath, settingsOpen, setSettingsOpen } = useApp();
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Native drag and drop only exists under the Tauri runtime. Guard it so the
    // app still renders (instead of hard-crashing) in a plain browser.
    if (!("__TAURI_INTERNALS__" in window)) return;

    let unlisten: (() => void) | undefined;
    let disposed = false;

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
          if (path) void setFontFromPath(path);
        }
      })
      .then((fn) => {
        // The effect may have been torn down before the listener resolved.
        if (disposed) fn();
        else unlisten = fn;
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [setFontFromPath]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, setSettingsOpen]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-3">
        <FontCard />
        <SlotList />
      </main>
      <Footer />

      {isDragging && (
        <div className="fade-in pointer-events-none absolute inset-2 z-40 flex items-center justify-center rounded-xl border-2 border-dashed border-gold bg-bg/90">
          <p className="text-[15px] font-semibold text-gold">
            {t.dropzone.dropOverlay}
          </p>
        </div>
      )}

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
