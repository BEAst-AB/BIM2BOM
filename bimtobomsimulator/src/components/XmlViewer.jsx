import { useRef } from "react";

const DEFAULT_BUYING_SYSTEM_XML = `<?xml version="1.0" encoding="utf-8"?>
<BuyOrder>
  <Header>
    <Buyer>Example AB</Buyer>
    <Project>BIM2BOM</Project>
    <Created>2026-02-25</Created>
  </Header>
  <Lines>
    <Line>
      <Name>Wall A</Name>
      <GUID>3pLKJPvHT21uNqX1l9FcUN</GUID>
      <Length unit="mm">4200</Length>
    </Line>
    <Line>
      <Name>Wall B</Name>
      <GUID>0Zk_ExampleGuid_123</GUID>
      <Length unit="mm">2800</Length>
    </Line>
  </Lines>
</BuyOrder>
`;

export default function XmlViewer({
  show,
  title = "XML",
  emptyText = "Press BUY to generate XML",
  xml = DEFAULT_BUYING_SYSTEM_XML,
  height = 240,
  renderPanel = true,
  dialogRef: dialogRefProp,
}) {
  const localDialogRef = useRef(null);
  const dialogRef = dialogRefProp ?? localDialogRef;
  const canOpen = Boolean(show);

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
            aria-label="Close"
            title="Close"
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
          aria-label="Open XML in resizable window"
          title={canOpen ? "Open" : "Generate XML first"}
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
            aria-label="Close"
            title="Close"
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
