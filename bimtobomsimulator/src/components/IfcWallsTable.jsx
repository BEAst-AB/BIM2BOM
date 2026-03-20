import { useMemo, useState } from "react";

const getItemStableKey = (item, fallback) => {
  const guid = item?.GUID;
  if (guid != null && String(guid).trim() !== "") return String(guid);
  const id = item?.id;
  if (id != null && String(id).trim() !== "") return String(id);
  return fallback;
};

const buildRows = (items, isExpanded) => {
  const roots = Array.isArray(items) ? items : [];
  const out = [];

  const visit = (item, depth, groupIndex, pathKey) => {
    if (!item || typeof item !== "object") return;
    const rowKey = getItemStableKey(item, pathKey);
    const children = Array.isArray(item.itemchildren) ? item.itemchildren : [];
    const hasChildren = children.length > 0;
    out.push({ item, depth, rowKey, hasChildren, groupIndex });

    if (!hasChildren) return;
    if (typeof isExpanded === "function" && !isExpanded(rowKey)) return;

    for (let i = 0; i < children.length; i += 1) {
      visit(children[i], depth + 1, groupIndex, `${rowKey}:${i}`);
    }
  };

  for (let i = 0; i < roots.length; i += 1) {
    visit(roots[i], 0, i, `root:${i}`);
  }

  return out;
};

const renderOptionalValue = (value, emptyText = "-") => {
  if (value == null) return emptyText;
  if (typeof value === "string" && value.trim() === "") return emptyText;
  return String(value);
};

const formatSellerLabel = (value) => {
  const text = value == null ? "" : String(value).trim();
  if (!text) return value;
  if (text === "Company 1") return "Säljare 1";
  if (text === "Company 2") return "Säljare 2";
  return value;
};

export default function IfcWallsTable({ bomResult }) {
  const items = useMemo(
    () => (Array.isArray(bomResult) ? bomResult : (bomResult?.items ?? [])),
    [bomResult],
  );

  const STATUS_UNCHANGED = "Unchanged";
  const STATUS_NEW = "New";

  const normalizeStatus = (value) => {
    const text = value == null ? "" : String(value).trim();
    if (!text) return "";
    if (text.toLowerCase() === "unchaged") return STATUS_UNCHANGED;
    return text;
  };

  const rowsAll = useMemo(() => buildRows(items, () => true), [items]);

  const [statusByRowKey, setStatusByRowKey] = useState(() => ({}));

  const expandableKeys = useMemo(() => {
    const keys = [];
    for (const row of rowsAll) {
      if (row?.hasChildren) keys.push(row.rowKey);
    }
    return keys;
  }, [rowsAll]);

  // null => default expanded
  const [expandedKeys, setExpandedKeys] = useState(null);

  const rowsVisible = useMemo(() => {
    const expanded = (rowKey) =>
      expandedKeys === null ? true : expandedKeys.has(rowKey);
    return buildRows(items, expanded);
  }, [items, expandedKeys]);

  const toggleExpanded = (rowKey) => {
    setExpandedKeys((prev) => {
      const next =
        prev === null ? new Set(expandableKeys) : new Set(prev ?? []);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

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
              <th>Status</th>
              <th>Seller</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="emptyCell">
                  No BOM data loaded yet
                </td>
              </tr>
            ) : (
              rowsVisible.map((row, index) => {
                const item = row?.item;
                const isExpanded =
                  expandedKeys === null ? true : expandedKeys.has(row.rowKey);

                const background =
                  row.groupIndex % 2 === 0 ? "#ffffff" : "#f9f9f9";

                return (
                  <tr
                    key={row.rowKey ?? item?.GUID ?? item?.id ?? index}
                    style={{ background }}
                  >
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          paddingLeft:
                            (row?.depth ?? 0) > 0 ? 18 * row.depth : undefined,
                        }}
                      >
                        {row?.hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(row.rowKey)}
                            aria-label={
                              isExpanded
                                ? "Collapse children"
                                : "Expand children"
                            }
                            title={isExpanded ? "Collapse" : "Expand"}
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
                            style={{ display: "inline-block", width: 18 }}
                          />
                        )}
                        <span>{item?.Name || "-"}</span>
                      </div>
                    </td>
                    <td className="mono">{item?.GUID || "-"}</td>
                    <td>
                      <select
                        className="buySelect"
                        value={
                          normalizeStatus(statusByRowKey?.[row.rowKey]) ||
                          normalizeStatus(item?.status) ||
                          STATUS_UNCHANGED
                        }
                        onChange={(event) => {
                          const nextStatus = event.target.value;
                          setStatusByRowKey((prev) => ({
                            ...(prev ?? {}),
                            [row.rowKey]: nextStatus,
                          }));

                          if (!item || typeof item !== "object") return;
                          item.status = nextStatus;
                        }}
                      >
                        <option value={STATUS_UNCHANGED}>
                          {STATUS_UNCHANGED}
                        </option>
                        <option value={STATUS_NEW}>{STATUS_NEW}</option>
                      </select>
                    </td>
                    <td>
                      {renderOptionalValue(formatSellerLabel(item?.Seller))}
                    </td>
                    <td className="mono">{renderOptionalValue(item?.price)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
