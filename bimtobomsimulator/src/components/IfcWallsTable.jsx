export default function IfcWallsTable({ bomResult }) {
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
    </div>
  );
}
