import { useMemo, useState } from "react";

const getItemStableKey = (item, fallback) => {
  const guid = item?.GUID;
  if (guid != null && String(guid).trim() !== "") return String(guid);
  const id = item?.id;
  if (id != null && String(id).trim() !== "") return String(id);
  return fallback;
};

const toNumberOrNull = (value) => {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildOrderRows = ({ lines, isExpanded }) => {
  const resolvedLines = Array.isArray(lines) ? lines : [];
  const priceByKey = new Map();
  const topItems = [];

  for (let i = 0; i < resolvedLines.length; i += 1) {
    const line = resolvedLines[i];
    const item = line?.item ?? line;
    if (!item || typeof item !== "object") continue;
    const key = getItemStableKey(item, `line:${i}`);
    topItems.push({ item, key });
    const price = toNumberOrNull(line?.price);
    if (price != null) priceByKey.set(key, price);
  }

  const childKeys = new Set();
  const markChildren = (parent) => {
    const children = parent?.itemchildren;
    if (!Array.isArray(children) || children.length === 0) return;
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      const childKey = getItemStableKey(child, `child:${i}`);
      childKeys.add(childKey);
      markChildren(child);
    }
  };

  for (const entry of topItems) markChildren(entry.item);

  const rootItems = topItems.filter((entry) => !childKeys.has(entry.key));
  const rows = [];
  const visited = new Set();

  const visit = (item, depth, pathKey) => {
    if (!item || typeof item !== "object") return;
    const rowKey = getItemStableKey(item, pathKey);
    const children = Array.isArray(item.itemchildren) ? item.itemchildren : [];
    const hasChildren = children.length > 0;

    // Avoid duplicates when the selling payload includes both parent+child as separate lines.
    // Still allow duplicates when there is no stable GUID/id.
    if ((item?.GUID || item?.id) && visited.has(rowKey)) return;
    if (item?.GUID || item?.id) visited.add(rowKey);

    const price = priceByKey.get(rowKey) ?? null;
    rows.push({ item, depth, rowKey, hasChildren, price });

    if (!hasChildren) return;
    if (typeof isExpanded === "function" && !isExpanded(rowKey)) return;

    for (let i = 0; i < children.length; i += 1) {
      visit(children[i], depth + 1, `${rowKey}:${i}`);
    }
  };

  for (let i = 0; i < rootItems.length; i += 1) {
    visit(rootItems[i].item, 0, `root:${i}`);
  }

  let totalPrice = 0;
  for (const row of rows) {
    if (row.price != null) totalPrice += row.price;
  }

  return { rows, totalPrice };
};

export default function IncomingOrdersPanel({
  incomingOrders = [],
  onAcceptIncomingOrder,
  onDeclineIncomingOrder,
}) {
  const [dismissedOrderIds, setDismissedOrderIds] = useState([]);
  // orderId -> Set(rowKey); missing/null means "default expanded"
  const [expandedByOrderId, setExpandedByOrderId] = useState(() => ({}));

  const visibleOrders = useMemo(
    () => incomingOrders.filter((o) => !dismissedOrderIds.includes(o.id)),
    [incomingOrders, dismissedOrderIds],
  );

  const toggleExpanded = (orderId, rowKey, lines) => {
    setExpandedByOrderId((prev) => {
      const current = prev?.[orderId] ?? null;
      const next = current === null ? new Set() : new Set(current);

      // If this is the first toggle and we were in "default expanded",
      // initialize by expanding all expandable keys, then toggle the target.
      if (current === null) {
        const { rows } = buildOrderRows({
          lines,
          isExpanded: () => true,
        });
        for (const row of rows) {
          if (row?.hasChildren) next.add(row.rowKey);
        }
      }

      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);

      return { ...(prev ?? {}), [orderId]: next };
    });
  };

  const formatTotal = (value) => {
    const number = toNumberOrNull(value);
    if (number == null) return "-";
    try {
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(number);
    } catch {
      return String(number);
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">Ordersvar</div>
      <div className="panelBody">
        {visibleOrders.length === 0 ? (
          <div className="emptyCell">Inga ordersvar ännu</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visibleOrders.map((order) => {
              const payload = order?.payload ?? {};
              const lines = payload?.items ?? [];
              const expandedSet = expandedByOrderId?.[order.id] ?? null;
              const { rows, totalPrice } = buildOrderRows({
                lines,
                isExpanded: (rowKey) =>
                  expandedSet === null ? true : expandedSet.has(rowKey),
              });

              return (
                <div key={order.id} className="panel">
                  <div
                    className="panelHeader"
                    style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
                  >
                    <span className="mono">CDE: {payload?.cdeid || "-"}</span>
                    <span>Selling system: {payload?.SellingSystem || "-"}</span>
                    <span className="mono">
                      Total price: {formatTotal(totalPrice)}
                    </span>
                  </div>

                  <div className="panelBody">
                    <div className="tableWrap">
                      <table className="wallsTable">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>GUID</th>
                            <th style={{ width: 140 }}>Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="emptyCell">
                                Order contains no items
                              </td>
                            </tr>
                          ) : (
                            rows.map((row, index) => {
                              const item = row.item;
                              const isExpanded =
                                expandedSet === null
                                  ? true
                                  : expandedSet.has(row.rowKey);

                              return (
                                <tr key={row.rowKey ?? index}>
                                  <td>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        paddingLeft:
                                          (row?.depth ?? 0) > 0
                                            ? 18 * row.depth
                                            : undefined,
                                      }}
                                    >
                                      {row?.hasChildren ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleExpanded(
                                              order.id,
                                              row.rowKey,
                                              lines,
                                            )
                                          }
                                          aria-label={
                                            isExpanded
                                              ? "Collapse children"
                                              : "Expand children"
                                          }
                                          title={
                                            isExpanded ? "Collapse" : "Expand"
                                          }
                                          style={{
                                            padding: "0 4px",
                                            minWidth: 18,
                                            lineHeight: "18px",
                                          }}
                                        >
                                          {isExpanded ? "▼" : "▶"}
                                        </button>
                                      ) : (
                                        <span
                                          style={{
                                            display: "inline-block",
                                            width: 18,
                                          }}
                                        />
                                      )}
                                      <span>{item?.Name || "-"}</span>
                                    </div>
                                  </td>
                                  <td className="mono">{item?.GUID || "-"}</td>
                                  <td className="mono">
                                    {row?.price == null
                                      ? "-"
                                      : formatTotal(row.price)}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                        marginTop: 10,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onAcceptIncomingOrder?.(order.id)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDismissedOrderIds((prev) =>
                            prev.includes(order.id)
                              ? prev
                              : [...prev, order.id],
                          );
                          onDeclineIncomingOrder?.(order.id);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
