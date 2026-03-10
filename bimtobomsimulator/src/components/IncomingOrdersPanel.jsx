export default function IncomingOrdersPanel({
  incomingOrders = [],
  onAcceptIncomingOrder,
}) {
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
            {incomingOrders.length === 0 ? (
              <tr>
                <td colSpan={3} className="emptyCell">
                  No incoming orders yet
                </td>
              </tr>
            ) : (
              incomingOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order?.payload?.SellingSystem || "-"}</td>
                  <td className="mono">{order?.payload?.items?.length ?? 0}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onAcceptIncomingOrder?.(order.id)}
                    >
                      Accept
                    </button>
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
