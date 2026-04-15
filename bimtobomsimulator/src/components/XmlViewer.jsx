import { useEffect, useRef } from "react";

const DEFAULT_BUYING_SYSTEM_XML = `<?xml version="1.0" encoding="utf-8"?>
<BuyOrder>
  <Header>
    <Buyer>Example AB</Buyer>
    <Project>BIM2BOM</Project>
    <Created>2026-02-25</Created>
  </Header>
  <Lines>
    <Line>
      <Name>Vägg A</Name>
      <GUID>3pLKJPvHT21uNqX1l9FcUN</GUID>
      <Length unit="mm">4200</Length>
    </Line>
    <Line>
      <Name>Vägg B</Name>
      <GUID>0Zk_ExampleGuid_123</GUID>
      <Length unit="mm">2800</Length>
    </Line>
  </Lines>
</BuyOrder>
`;

export default function XmlViewer({
  show,
  title = "XML",
  emptyText = "Tryck SKICKA för att generera XML",
  xml = DEFAULT_BUYING_SYSTEM_XML,
  height = 240,
  renderPanel = true,
  dialogRef: dialogRefProp,
  payload,
}) {
  const localDialogRef = useRef(null);
  const dialogRef = dialogRefProp ?? localDialogRef;
  const payloadRef = useRef(null);
  const canOpen = Boolean(show);

  useEffect(() => {
    payloadRef.current = payload;
    console.log("XMLViewer payload updated:", payload);
  }, [payload]);

  const openModal = () => {
    if (!canOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      return;
    }

    dialog.setAttribute("open", "");
  };

  const closeModal = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
      return;
    }
    dialog.removeAttribute("open");
  };

  if (!renderPanel) {
    return (
      <dialog ref={dialogRef} className="xmlDialog">
        <div
          className="panelHeader"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ flex: 1 }}>{title}</div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Stäng"
            title="Stäng"
            style={{ padding: "0.4em 0.6em" }}
          >
            ✕
          </button>
        </div>
        <div className="panelBody" style={{ flex: 1, minHeight: 0 }}>
          {show ? (
            <pre className="xmlPre">{xml}</pre>
          ) : (
            <div className="emptyCell">{emptyText}</div>
          )}
        </div>
      </dialog>
    );
  }

  return (
    <section className="panel" style={{ flex: `0 0 ${height}px` }}>
      <div
        className="panelHeader"
        style={{ display: "flex", alignItems: "center", gap: 12 }}
      >
        <div style={{ flex: 1 }}>{title}</div>
        <button
          type="button"
          onClick={openModal}
          disabled={!canOpen}
          aria-label="Öppna XML i ändringsbart fönster"
          title={canOpen ? "Öppna" : "Generera XML först"}
          style={{ padding: "0.4em 0.6em" }}
        >
          ⤢
        </button>
      </div>
      <div className="panelBody">
        {show ? (
          <pre className="xmlPre">{xml}</pre>
        ) : (
          <div className="emptyCell">{emptyText}</div>
        )}
      </div>

      <dialog ref={dialogRef} className="xmlDialog">
        <div
          className="panelHeader"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ flex: 1 }}>{title}</div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Stäng"
            title="Stäng"
            style={{ padding: "0.4em 0.6em" }}
          >
            ✕
          </button>
        </div>
        <div className="panelBody" style={{ flex: 1, minHeight: 0 }}>
          {show ? (
            <pre className="xmlPre">{xml}</pre>
          ) : (
            <div className="emptyCell">{emptyText}</div>
          )}
        </div>
      </dialog>
    </section>
  );
}
