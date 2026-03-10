import { useMemo, useState } from "react";

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

const getItemKey = (item, index) => item?.GUID ?? item?.id ?? index;

export default function SellingSystemComponent({
  order,
  addIncomingOrder,
  clearOrder,
  sellingSystemName,
  companyTitle,
}) {
  const items = useMemo(() => order?.items ?? [], [order]);

  const [priceByKey, setPriceByKey] = useState(() => ({}));
  const [sendStatus, setSendStatus] = useState("");
  const [sentForBuyingSystemId, setSentForBuyingSystemId] = useState(null);
  const [peppolXml, setPeppolXml] = useState("");

  const onPriceChange = (key, value) => {
    setPriceByKey((prev) => ({ ...prev, [key]: value }));
  };

  const onSend = () => {
    if (!order) return;

    const payload = {
      buyingSystem: order.buyingSystem,
      cdeid: order.cdeid ?? "",
      company: order.company,
      SellingSystem: sellingSystemName,
      items: items.map((item, index) => {
        const key = getItemKey(item, index);
        const raw = priceByKey[key];
        const parsed = raw === "" || raw == null ? null : Number(raw);
        const price = Number.isFinite(parsed) ? parsed : null;
        return { item, price };
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
    <div className="pageShell">
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
              Incoming order
              {order?.buyingSystem ? ` : ${order.buyingSystem}` : ""}
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
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="emptyCell">
                              Order contains no items
                            </td>
                          </tr>
                        ) : (
                          items.map((item, index) => {
                            const key = getItemKey(item, index);
                            const value = priceByKey[key] ?? "";

                            return (
                              <tr key={key}>
                                <td>{item?.Name || "-"}</td>
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
