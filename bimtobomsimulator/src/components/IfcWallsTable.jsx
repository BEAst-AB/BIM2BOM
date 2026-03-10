export default function IfcWallsTable({
  bomResult,
  incomingOrders = [],
  onAcceptIncomingOrder,
}) {
  const items = bomResult ?? [];

  return (
    <div className="sidebar">
      <div className="sidebarHeader">
        <div className="sidebarTitle">BOM Result</div>
        <div className="sidebarMeta">{items.length} found</div>
      </div>

      <div className="tableWrap">
        <table className="wallsTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>GUID</th>
              <th>Seller</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="emptyCell">
                  No BOM data loaded yet
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.GUID ?? item.id ?? index}>
                  <td>{item.Name || "-"}</td>
                  <td className="mono">{item.GUID || "-"}</td>
                  <td>{item.Seller || "-"}</td>
                  <td className="mono">{item.price || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
                    <td className="mono">
                      {order?.payload?.items?.length ?? 0}
                    </td>
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
    </div>
  );
}
