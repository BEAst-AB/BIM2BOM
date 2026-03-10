import { useMemo, useRef, useState } from "react";
import { useBom } from "../context/useBom.js";
import BuyingSystemOrderPanel from "../components/BuyingSystemOrderPanel.jsx";
import IncomingOrdersPanel from "../components/IncomingOrdersPanel.jsx";
import XmlViewer from "../components/XmlViewer.jsx";

const getRowKey = (item, index) => item?.GUID ?? item?.id ?? index;

const readLength = (item) => {
  const properties = item?.property ?? [];
  const lengthProp = properties.find((p) => {
    const name = (p?.Name ?? "").toString().trim().toLowerCase();
    return name === "length" || name === "lenght";
  });

  const value = lengthProp?.Value;
  if (value == null || value === "") return "-";
  return String(value);
};

export default function BuyingSystem() {
  const {
    bomResult,
    setSelectedBomItems,
    incomingOrders,
    acceptIncomingOrder,
  } = useBom();
  const items = useMemo(() => {
    if (Array.isArray(bomResult)) return bomResult;
    return bomResult?.items ?? [];
  }, [bomResult]);

  const cdeid = useMemo(() => {
    if (Array.isArray(bomResult)) return "";
    return (bomResult?.cdeid ?? "").toString();
  }, [bomResult]);

  const shellRef = useRef(null);
  const xmlDialogRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRafRef = useRef(0);
  const [leftWidth, setLeftWidth] = useState(() => {
    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1200;
    const target = Math.round(viewportWidth * 0.4);
    const minLeft = 360;
    const maxLeft = 900;
    return Math.min(maxLeft, Math.max(minLeft, target));
  });

  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [showXml, setShowXml] = useState(false);
  const [xmlOrder, setXmlOrder] = useState(null);

  const openXmlModal = () => {
    if (!showXml) return;
    const dialog = xmlDialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      return;
    }
    dialog.setAttribute("open", "");
  };

  const selectedCount = selectedKeys.size;

  const selectedList = useMemo(() => {
    if (selectedKeys.size === 0) return [];
    const selected = [];
    for (let i = 0; i < items.length; i += 1) {
      const key = getRowKey(items[i], i);
      if (selectedKeys.has(key)) selected.push(items[i]);
    }
    return selected;
  }, [items, selectedKeys]);

  const toggleRow = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onGetSelected = () => {
    setSelectedBomItems(selectedList);
  };

  const requestLayoutResize = () => {
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
    const startWidth = leftWidth;

    const shellWidth = shellRef.current?.clientWidth ?? 0;
    const minLeft = 360;
    const minRight = 360;
    const maxLeft = shellWidth ? Math.max(minLeft, shellWidth - minRight) : 900;

    dragRef.current = { startX, startWidth, minLeft, maxLeft };
    document.body.style.userSelect = "none";

    const onMove = (e) => {
      const drag = dragRef.current;
      if (!drag) return;
      const next = drag.startWidth + (e.clientX - drag.startX);
      const clamped = Math.min(drag.maxLeft, Math.max(drag.minLeft, next));
      setLeftWidth(clamped);
      requestLayoutResize();
    };

    const onUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      requestLayoutResize();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div className="pageShell buyingSystemPage">
      <div className="pageHeader">
        <div className="pageTitle">Buying System</div>
        <div className="pageMeta">
          {items.length} BOM items from {cdeid || "-"}
        </div>
      </div>

      <div className="pageBody" ref={shellRef}>
        <div className="splitShell">
          <div className="splitLeft" style={{ width: `${leftWidth}px` }}>
            <div className="splitColumn">
              <div className="tableWrap">
                <table className="wallsTable">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }} aria-label="Select" />
                      <th>Name</th>
                      <th>GUID</th>
                      <th>Lenght</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="emptyCell">
                          No BOM data loaded yet (open CDE first)
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => {
                        const key = getRowKey(item, index);
                        const checked = selectedKeys.has(key);

                        return (
                          <tr key={key}>
                            <td>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleRow(key)}
                                aria-label={`Select ${item?.Name ?? "row"}`}
                              />
                            </td>
                            <td>{item?.Name || "-"}</td>
                            <td className="mono">{item?.GUID || "-"}</td>
                            <td className="mono">{readLength(item)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pageActions">
                <button type="button" onClick={onGetSelected}>
                  Get selected ({selectedCount})
                </button>
                <div className="pageMeta">
                  Selected list: {selectedList.length}
                </div>
              </div>
            </div>
          </div>

          <div
            className="paneSplitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize buying columns"
            onPointerDown={onSplitterPointerDown}
          />

          <div className="splitRight">
            <div className="rightRows rightRowsBuying">
              <BuyingSystemOrderPanel
                cdeid={cdeid}
                selectedItems={selectedList}
                onRequestSent={(order) => {
                  setXmlOrder(order);
                  setShowXml(true);
                }}
                xmlCreated={showXml}
                onOpenXml={openXmlModal}
              />

              <IncomingOrdersPanel
                incomingOrders={incomingOrders}
                onAcceptIncomingOrder={acceptIncomingOrder}
              />

              <XmlViewer
                show={showXml}
                emptyText="Press BUY to generate XML"
                renderPanel={false}
                dialogRef={xmlDialogRef}
                payload={xmlOrder}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
