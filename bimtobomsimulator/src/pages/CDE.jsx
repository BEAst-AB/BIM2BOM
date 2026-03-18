import { useCallback, useRef, useState } from "react";
import IfcViewer from "../components/IfcViewer.jsx";
import CdeBomSidebar from "../components/CdeBomSidebar.jsx";
import { useBom } from "../context/useBom.js";

export default function CDE() {
  const {
    bomByCdeid,
    draftBomByCdeid,
    setDraftBomForCdeid,
    clearDraftBomForCdeid,
    setBomResult,
  } = useBom();
  const cdeid = "CDE1";

  const publishedBom = bomByCdeid?.[cdeid] ?? null;
  const draftBomResult = draftBomByCdeid?.[cdeid] ?? null;
  const hasUnsentDraft = !!draftBomResult;

  const onBomLoaded = useCallback(
    (result) => {
      const normalized = Array.isArray(result)
        ? { cdeid, items: result }
        : { ...(result ?? {}), cdeid, items: result?.items ?? [] };

      // Avoid resetting the CDE table every time you navigate back to this page.
      // If a BOM is already published and there's no active unsent draft, ignore reloads.
      if (publishedBom && !draftBomResult) return;
      setDraftBomForCdeid(cdeid, normalized);
    },
    [cdeid, publishedBom, draftBomResult, setDraftBomForCdeid],
  );

  const onPublishToBuyingSystem = useCallback(() => {
    if (!draftBomResult) return;
    setBomResult(draftBomResult);
    clearDraftBomForCdeid(cdeid);
  }, [cdeid, clearDraftBomForCdeid, draftBomResult, setBomResult]);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1200;
    const target = Math.round(viewportWidth * 0.35);
    const minSidebar = 260;
    const maxSidebar = 900;
    return Math.min(maxSidebar, Math.max(minSidebar, target));
  });
  const shellRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRafRef = useRef(0);

  const requestCanvasResize = () => {
    if (resizeRafRef.current) return;
    resizeRafRef.current = window.requestAnimationFrame(() => {
      resizeRafRef.current = 0;
      window.dispatchEvent(new Event("resize"));
    });
  };

  const onSplitterPointerDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const shellWidth = shellRef.current?.clientWidth ?? 0;
    const minSidebar = 260;
    const minViewer = 320;
    const maxSidebar = shellWidth
      ? Math.max(minSidebar, shellWidth - minViewer)
      : 900;

    dragRef.current = { startX, startWidth, minSidebar, maxSidebar };

    document.body.style.userSelect = "none";

    const onMove = (e) => {
      const drag = dragRef.current;
      if (!drag) return;

      const next = drag.startWidth + (drag.startX - e.clientX);
      const clamped = Math.min(
        drag.maxSidebar,
        Math.max(drag.minSidebar, next),
      );
      setSidebarWidth(clamped);
      requestCanvasResize();
    };

    const onUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      requestCanvasResize();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div className="appShell cdePage" ref={shellRef}>
      <div className="viewerPane">
        <IfcViewer
          ifcUrl="/web-ifc/A-40-V-000_BIM2BOM.ifc"
          onBomLoaded={onBomLoaded}
        />
      </div>
      <div
        className="paneSplitter"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize walls table"
        onPointerDown={onSplitterPointerDown}
      />
      <div className="sidebarPane" style={{ width: `${sidebarWidth}px` }}>
        {(() => {
          const tableBom = hasUnsentDraft ? draftBomResult : publishedBom;

          return (
            <CdeBomSidebar
              hasUnsentDraft={hasUnsentDraft}
              onPublishToBuyingSystem={onPublishToBuyingSystem}
              bomResult={tableBom}
            />
          );
        })()}
      </div>
    </div>
  );
}
