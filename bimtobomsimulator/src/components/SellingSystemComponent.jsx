import { useMemo, useState } from "react";

const buildItemRows = (items, shouldVisitChildren) => {
  const list = Array.isArray(items) ? items : [];
  const out = [];

  const getStableKey = (item, fallback) => {
    const guid = item?.GUID;
    if (guid != null && String(guid).trim() !== "") return String(guid);
    const id = item?.id;
    if (id != null && String(id).trim() !== "") return String(id);
    return fallback;
  };

  const visit = (item, depth, pathKey) => {
    if (!item) return;
    const rowKey = getStableKey(item, pathKey);
    const children = item?.itemchildren;
    const hasChildren = Array.isArray(children) && children.length > 0;
    const row = { item, depth, rowKey, hasChildren };
    out.push(row);

    if (!hasChildren) return;
    if (
      typeof shouldVisitChildren === "function" &&
      !shouldVisitChildren(row)
    ) {
      return;
    }

    for (let i = 0; i < children.length; i += 1) {
      visit(children[i], depth + 1, `${rowKey}:${i}`);
    }
  };

  for (let i = 0; i < list.length; i += 1) {
    visit(list[i], 0, `root:${i}`);
  }

  return out;
};

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

const getItemKey = (row, index) =>
  row?.rowKey ?? row?.item?.GUID ?? row?.item?.id ?? index;

const normalizeOrderStatus = (value) => {
  const text = value == null ? "" : String(value).trim();
  if (!text) return "-";
  if (text.toLowerCase() === "unchaged") return "Unchanged";
  return text;
};

export default function SellingSystemComponent({
  order,
  addIncomingOrder,
  clearOrder,
  sellingSystemName,
  companyTitle,
}) {
  const rowsAll = useMemo(
    () => buildItemRows(order?.items ?? [], () => true),
    [order],
  );

  const expandableKeys = useMemo(() => {
    const keys = [];
    for (const row of rowsAll) {
      if (row?.hasChildren) keys.push(row.rowKey);
    }
    return keys;
  }, [rowsAll]);

  // `null` means "default expanded" (show all children) until user toggles.
  const [expandedKeys, setExpandedKeys] = useState(null);

  const rowsVisible = useMemo(() => {
    const isExpanded = (rowKey) =>
      expandedKeys === null ? true : expandedKeys.has(rowKey);

    return buildItemRows(order?.items ?? [], (row) => isExpanded(row.rowKey));
  }, [order, expandedKeys]);

  const [priceByKey, setPriceByKey] = useState(() => ({}));
  const [sendStatus, setSendStatus] = useState("");
  const [sentForBuyingSystemId, setSentForBuyingSystemId] = useState(null);
  const [peppolXml, setPeppolXml] = useState("");

  const onPriceChange = (key, value) => {
    setPriceByKey((prev) => ({ ...prev, [key]: value }));
  };

  const toggleRowExpanded = (rowKey) => {
    setExpandedKeys((prev) => {
      const next =
        prev === null ? new Set(expandableKeys) : new Set(prev ?? []);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  const onSend = () => {
    if (!order) return;

    const payload = {
      buyingSystem: order.buyingSystem,
      cdeid: order.cdeid ?? "",
      company: order.company,
      SellingSystem: sellingSystemName,
      items: rowsAll.map((row, index) => {
        const key = getItemKey(row, index);
        const raw = priceByKey[key];
        const parsed = raw === "" || raw == null ? null : Number(raw);
        const price = Number.isFinite(parsed) ? parsed : null;
        return { item: row?.item, price };
      }),
    };

    console.log("SEND", payload);
    addIncomingOrder?.(payload);
    setSendStatus("Sent to CDE");

    const created = new Date().toISOString();
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<PeppolOrder>
  <Header>
    <BuyingSystemId>${payload.buyingSystem ?? ""}</BuyingSystemId>
    <Company>${payload.company ?? ""}</Company>
    <SellingSystem>${payload.SellingSystem ?? ""}</SellingSystem>
    <Created>${created}</Created>
  </Header>
  <Lines>
${(payload.items ?? [])
  .map(
    (line) =>
      `    <Line>
      <Name>${line?.item?.Name ?? ""}</Name>
      <GUID>${line?.item?.GUID ?? ""}</GUID>
      <Price>${line?.price ?? ""}</Price>
    </Line>`,
  )
  .join("\n")}
  </Lines>
</PeppolOrder>
`;

    setPeppolXml(xml);
    setSentForBuyingSystemId(payload.buyingSystem ?? null);
    setPriceByKey({});
    clearOrder?.();
    window.setTimeout(() => setSendStatus(""), 1500);
  };

  const showXml =
    !!order?.buyingSystem &&
    sentForBuyingSystemId === order.buyingSystem &&
    peppolXml;

  return (
    <div className="pageShell sellingSystemPage">
      <div className="pageHeader">
        <div className="pageTitle">{companyTitle}</div>
        <div className="pageMeta">
          {order ? "Order received" : "No order yet"}
        </div>
      </div>

      <div className="pageBody">
        <div className="rightRows">
          <section className="panel">
            <div className="panelHeader">
              <div
                style={{
                  display: "grid",
                  rowGap: 2,
                }}
              >
                <div>
                  Incoming order
                  {order?.buyingSystem ? ` : ${order.buyingSystem}` : ""}
                </div>
                {order ? (
                  <div>Status: {normalizeOrderStatus(order?.status)}</div>
                ) : null}
              </div>
            </div>
            <div className="panelBody">
              {!order ? (
                <div className="emptyCell">
                  Waiting for an order from Buying System
                </div>
              ) : (
                <>
                  <div className="buyControls">
                    <button type="button" onClick={onSend}>
                      Send
                    </button>
                    <div className="pageMeta">{sendStatus}</div>
                  </div>

                  <div className="tableWrap">
                    <table className="wallsTable">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>GUID</th>
                          <th style={{ width: 140 }}>Lenght</th>
                          <th style={{ width: 140 }}>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsVisible.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="emptyCell">
                              Order contains no items
                            </td>
                          </tr>
                        ) : (
                          rowsVisible.map((row, index) => {
                            const key = getItemKey(row, index);
                            const value = priceByKey[key] ?? "";
                            const item = row?.item;
                            const isExpanded =
                              expandedKeys === null
                                ? true
                                : expandedKeys.has(row.rowKey);

                            return (
                              <tr key={key}>
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
                                          toggleRowExpanded(row.rowKey)
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
                                <td className="mono">{readLength(item)}</td>
                                <td>
                                  <input
                                    className="buySelect"
                                    type="number"
                                    value={value}
                                    onChange={(e) =>
                                      onPriceChange(key, e.target.value)
                                    }
                                    placeholder="0"
                                    aria-label={`Price for ${item?.Name ?? "item"}`}
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panelHeader">PEPPOL XML</div>
            <div className="panelBody">
              {showXml ? (
                <pre className="xmlPre">{peppolXml}</pre>
              ) : (
                <div className="emptyCell">
                  Press Send to generate PEPPOL XML
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
