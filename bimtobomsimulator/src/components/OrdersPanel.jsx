import { useMemo, useState } from "react";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString();
  }
};

const normalizeStatus = (value) => {
  const text = value == null ? "" : String(value).trim();
  if (!text) return "-";
  return text.toLowerCase() === "unchaged" ? "Unchanged" : text;
};

const formatStatusLabel = (value) => {
  const text = value == null ? "" : String(value).trim();
  if (!text || text === "-") return "-";
  if (text.toLowerCase() === "unchaged" || text === "Unchanged")
    return "Oförändrad";
  if (text === "New") return "Ny";
  if (text === "Updated") return "Uppdaterad";
  return text;
};

const formatCompanyLabel = (value) => {
  const text = value == null ? "" : String(value).trim();
  if (!text) return "-";
  if (text === "Company 1") return "Säljare 1";
  if (text === "Company 2") return "Säljare 2";
  return text;
};

export default function OrdersPanel({
  orders = [],
  selectedItems = [],
  onAddSelectedToOrder,
  onSendOrderUpdate,
}) {
  const rows = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);
  const [selectedKey, setSelectedKey] = useState(null);

  const selectedOrder = useMemo(() => {
    if (!selectedKey) return null;
    return rows.find((order) => {
      const key = order?.orderNumber ?? order?.buyingSystem;
      return String(key) === String(selectedKey);
    });
  }, [rows, selectedKey]);

  return (
    <section className="panel">
      <div className="panelHeader">Ordrar</div>
      <div className="panelBody">
        {rows.length === 0 ? (
          <div className="emptyCell">Inga ordrar skapade ännu</div>
        ) : (
          <div className="tableWrap">
            <table className="wallsTable">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>Skapad</th>
                  <th style={{ width: 140 }}>Ordernr</th>
                  <th style={{ width: 160 }}>Säljare</th>
                  <th style={{ width: 140 }}>Status</th>
                  <th style={{ width: 90 }}>Objekt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order, index) => (
                  <tr
                    key={order?.buyingSystem ?? index}
                    onClick={() =>
                      setSelectedKey(order?.orderNumber ?? order?.buyingSystem)
                    }
                    style={{
                      cursor: "pointer",
                      background:
                        String(selectedKey) ===
                        String(order?.orderNumber ?? order?.buyingSystem)
                          ? "var(--ui-accent-soft)"
                          : undefined,
                    }}
                    aria-selected={
                      String(selectedKey) ===
                      String(order?.orderNumber ?? order?.buyingSystem)
                    }
                  >
                    <td className="mono">{formatDateTime(order?.createdAt)}</td>
                    <td className="mono">{order?.orderNumber ?? "-"}</td>
                    <td>{formatCompanyLabel(order?.company)}</td>
                    <td>{formatStatusLabel(normalizeStatus(order?.status))}</td>
                    <td className="mono">
                      {Array.isArray(order?.items) ? order.items.length : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedOrder ? (
          <div className="pageActions" style={{ marginTop: 12 }}>
            <div className="pageMeta" style={{ flex: 1 }}>
              Vald order: {selectedOrder?.orderNumber ?? "-"} • Objekt i urval:{" "}
              {Array.isArray(selectedItems) ? selectedItems.length : 0}
            </div>
            <button
              type="button"
              onClick={() => onAddSelectedToOrder?.(selectedOrder)}
              disabled={
                !Array.isArray(selectedItems) || selectedItems.length === 0
              }
            >
              Lägg till valda objekt
            </button>
            <button
              type="button"
              onClick={() => onSendOrderUpdate?.(selectedOrder)}
              disabled={!selectedOrder}
            >
              Skicka uppdatering
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
