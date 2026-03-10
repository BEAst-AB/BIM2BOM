import { useMemo, useState } from "react";

export default function IncomingOrdersPanel({
  incomingOrders = [],
  onAcceptIncomingOrder,
  onDeclineIncomingOrder,
}) {
  const [dismissedOrderIds, setDismissedOrderIds] = useState([]);

  const visibleOrders = useMemo(
    () => incomingOrders.filter((o) => !dismissedOrderIds.includes(o.id)),
    [incomingOrders, dismissedOrderIds],
  );

  return (
    <section className="panel" style={{ flex: "0 0 240px" }}>
      <div className="panelHeader">Incoming orders</div>
      <div className="panelBody">
        <table className="wallsTable">
          <thead>
            <tr>
              <th>Selling system</th>
              <th style={{ width: 110 }}>Items</th>
              <th style={{ width: 120 }} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {visibleOrders.length === 0 ? (
              <tr>
                <td colSpan={3} className="emptyCell">
                  No incoming orders yet
                </td>
              </tr>
            ) : (
              visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order?.payload?.SellingSystem || "-"}</td>
                  <td className="mono">{order?.payload?.items?.length ?? 0}</td>
                  <td>
                    <div
                      style={{ display: "flex", gap: 8, whiteSpace: "nowrap" }}
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
                        Decline
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
