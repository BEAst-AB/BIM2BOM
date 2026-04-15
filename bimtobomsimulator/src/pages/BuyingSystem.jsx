import { useMemo, useRef, useState } from "react";
import { useBom } from "../context/useBom.js";
import BuyingSystemOrderPanel from "../components/BuyingSystemOrderPanel.jsx";
import IncomingOrdersPanel from "../components/IncomingOrdersPanel.jsx";
import OrdersPanel from "../components/OrdersPanel.jsx";
import XmlViewer from "../components/XmlViewer.jsx";

const getRowKey = (item, index) => item?.GUID ?? item?.id ?? index;

const readUnit = (item) => {
  const unit = item?.Unit ?? item?.unit;
  if (unit != null && String(unit).trim() !== "") return String(unit);

  const properties = item?.property ?? [];
  const unitProp = properties.find((p) => {
    const name = (p?.Name ?? "").toString().trim().toLowerCase();
    return name === "unit";
  });
  const propUnit = unitProp?.Value;
  if (propUnit != null && String(propUnit).trim() !== "")
    return String(propUnit);
  return "m";
};

const readQuantity = (item) => {
  const raw = item?.Quantity ?? item?.quantity;
  if (raw != null && String(raw).trim() !== "") return String(raw);

  const properties = item?.property ?? [];
  const lengthProp = properties.find((p) => {
    const name = (p?.Name ?? "").toString().trim().toLowerCase();
    return name === "length" || name === "lenght";
  });
  const value = lengthProp?.Value;
  if (value == null || value === "") return "-";

  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) return "-";
  // assume mm -> m
  return String(parsed > 1000 ? parsed / 1000 : parsed);
};

const readStatus = (item) => {
  const STATUS_UNCHANGED = "Unchanged";
  const raw = item?.status ?? item?.Status;

  const unwrap = (value) => {
    if (value == null) return "";
    if (typeof value === "object") {
      if ("value" in value) return String(value.value ?? "");
      if ("Value" in value) return String(value.Value ?? "");
    }
    return String(value);
  };

  const direct = unwrap(raw).trim();
  if (direct)
    return direct.toLowerCase() === "unchaged" ? STATUS_UNCHANGED : direct;

  const properties = item?.property ?? [];
  const statusProp = properties.find((p) => {
    const name = (p?.Name ?? "").toString().trim().toLowerCase();
    return name === "status";
  });
  const fromProp = unwrap(statusProp?.Value).trim();
  if (fromProp)
    return fromProp.toLowerCase() === "unchaged" ? STATUS_UNCHANGED : fromProp;

  return STATUS_UNCHANGED;
};

const formatStatusLabel = (value) => {
  const text = value == null ? "" : String(value).trim();
  if (!text) return "-";
  if (text.toLowerCase() === "unchaged" || text === "Unchanged")
    return "Oförändrad";
  if (text === "New") return "Ny";
  if (text === "Updated") return "Uppdaterad";
  return text;
};

const deepClone = (value) => {
  if (value == null) return value;
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // Fallback below.
    }
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

export default function BuyingSystem() {
  const {
    bomResult,
    setSelectedBomItems,
    buyingOrders,
    addBuyingOrder,
    updateBuyingOrder,
    setSellingSystem1Order,
    setSellingSystem2Order,
    incomingOrders,
    acceptIncomingOrder,
    declineIncomingOrder,
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

  const TAB_CREATE = "create";
  const TAB_ORDERS = "orders";
  const TAB_INCOMING = "incoming";

  const [activeTab, setActiveTab] = useState(TAB_CREATE);

  const orders = buyingOrders;

  const existingOrderNumbers = useMemo(() => {
    const set = new Set();
    for (const order of Array.isArray(orders) ? orders : []) {
      const value = order?.orderNumber;
      if (value == null || value === "") continue;
      set.add(String(value));
    }
    return set;
  }, [orders]);

  const getItemStableKey = (item, fallback) =>
    item?.GUID ?? item?.id ?? fallback;

  const mergeOrderItemsUnique = (baseItems, extraItems) => {
    const baseList = Array.isArray(baseItems) ? baseItems : [];
    const extraList = Array.isArray(extraItems) ? extraItems : [];
    if (extraList.length === 0) return baseList;

    const keys = new Set(
      baseList.map((item, index) => String(getItemStableKey(item, index))),
    );
    const merged = [...baseList];
    for (let i = 0; i < extraList.length; i += 1) {
      const item = extraList[i];
      const key = String(getItemStableKey(item, `extra:${i}`));
      if (keys.has(key)) continue;
      keys.add(key);
      merged.push(item);
    }
    return merged;
  };

  const sendOrderToSellingSystem = (order) => {
    if (!order) return;
    const snapshot = deepClone(order);
    if (order.company === "Company 1") {
      setSellingSystem1Order(snapshot);
      return;
    }
    if (order.company === "Company 2") {
      setSellingSystem2Order(snapshot);
    }
  };

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
        <div className="pageTitle">Inköpssystem</div>
        <div className="pageMeta">
          {items.length} BOM-objekt från {cdeid || "-"}
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
                      <th style={{ width: 44 }} aria-label="Välj" />
                      <th>Namn</th>
                      <th>GUID</th>
                      <th>Kvantitet</th>
                      <th style={{ width: 90 }}>Enhet</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="emptyCell">
                          Ingen BOM-data inladdad ännu (öppna CDE först)
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
                                aria-label={`Välj ${item?.Name ?? "rad"}`}
                              />
                            </td>
                            <td>{item?.Name || "-"}</td>
                            <td className="mono">{item?.GUID || "-"}</td>
                            <td className="mono">{readQuantity(item)}</td>
                            <td className="mono">{readUnit(item)}</td>
                            <td>{formatStatusLabel(readStatus(item))}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pageActions">
                <button type="button" onClick={onGetSelected}>
                  Hämta valda ({selectedCount})
                </button>
                <div className="pageMeta">
                  Vald lista: {selectedList.length}
                </div>
              </div>
            </div>
          </div>

          <div
            className="paneSplitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Ändra storlek på inköpskolumner"
            onPointerDown={onSplitterPointerDown}
          />

          <div className="splitRight">
            <div className="rightRows rightRowsBuying">
              <div
                className="buyingTabsBar"
                role="tablist"
                aria-label="Inköpssystem-flikar"
              >
                <button
                  type="button"
                  role="tab"
                  className="buyingTabButton"
                  aria-selected={activeTab === TAB_CREATE}
                  onClick={() => setActiveTab(TAB_CREATE)}
                >
                  Skapa order
                </button>
                <button
                  type="button"
                  role="tab"
                  className="buyingTabButton"
                  aria-selected={activeTab === TAB_ORDERS}
                  onClick={() => setActiveTab(TAB_ORDERS)}
                >
                  Ordrar
                </button>
                <button
                  type="button"
                  role="tab"
                  className="buyingTabButton"
                  aria-selected={activeTab === TAB_INCOMING}
                  onClick={() => setActiveTab(TAB_INCOMING)}
                >
                  Ordersvar
                </button>
              </div>

              <div className="buyingTabPanel" role="tabpanel">
                {activeTab === TAB_CREATE ? (
                  <BuyingSystemOrderPanel
                    cdeid={cdeid}
                    existingOrderNumbers={existingOrderNumbers}
                    selectedItems={selectedList}
                    onRequestSent={(order) => {
                      setXmlOrder(order);
                      setShowXml(true);
                      addBuyingOrder(order);
                    }}
                    xmlCreated={showXml}
                    onOpenXml={openXmlModal}
                  />
                ) : null}

                {activeTab === TAB_ORDERS ? (
                  <OrdersPanel
                    orders={orders}
                    selectedItems={selectedList}
                    onAddSelectedToOrder={(order) => {
                      const next = {
                        ...(order ?? {}),
                        items: mergeOrderItemsUnique(
                          order?.items,
                          selectedList,
                        ),
                        updatedAt: Date.now(),
                      };
                      updateBuyingOrder(next);
                    }}
                    onSendOrderUpdate={(order) => {
                      const next = {
                        ...(order ?? {}),
                        status: "Updated",
                        items: mergeOrderItemsUnique(
                          order?.items,
                          selectedList,
                        ),
                        updatedAt: Date.now(),
                      };
                      updateBuyingOrder(next);
                      sendOrderToSellingSystem(next);
                    }}
                  />
                ) : null}

                {activeTab === TAB_INCOMING ? (
                  <IncomingOrdersPanel
                    incomingOrders={incomingOrders}
                    onAcceptIncomingOrder={acceptIncomingOrder}
                    onDeclineIncomingOrder={declineIncomingOrder}
                  />
                ) : null}
              </div>

              <XmlViewer
                show={showXml}
                emptyText="Tryck SKICKA för att generera XML"
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
