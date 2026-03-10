import { useMemo, useState } from "react";
import { useBom } from "../context/useBom.js";

const readLengthNumber = (item) => {
  const properties = item?.property ?? [];
  const lengthProp = properties.find((p) => {
    const name = (p?.Name ?? "").toString().trim().toLowerCase();
    return name === "length" || name === "lenght";
  });

  const value = lengthProp?.Value;
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

const createBuyingSystemId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  const nowPart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `buy-${nowPart}-${randomPart}`;
};

const groupByNameAndSumLength = (selectedItems) => {
  const map = new Map();

  for (const item of selectedItems ?? []) {
    const name = (item?.Name ?? "-").toString();
    const entry = map.get(name) ?? { Name: name, Count: 0, TotalLength: 0 };
    entry.Count += 1;
    entry.TotalLength += readLengthNumber(item);
    map.set(name, entry);
  }

  return Array.from(map.values()).sort((a, b) => a.Name.localeCompare(b.Name));
};

export default function BuyingSystemOrderPanel({
  selectedItems,
  onRequestSent,
  xmlCreated,
  onOpenXml,
}) {
  const {
    setSelectedBomItems,
    setSellingSystem1Order,
    setSellingSystem2Order,
  } = useBom();

  const [selectedCompany, setSelectedCompany] = useState("Company 1");

  const groupedSummary = useMemo(
    () => groupByNameAndSumLength(selectedItems),
    [selectedItems],
  );

  const onBuy = () => {
    const itemsToBuy = selectedItems ?? [];
    setSelectedBomItems(itemsToBuy);
    onRequestSent?.();

    const order = {
      buyingSystem: createBuyingSystemId(),
      company: selectedCompany,
      items: itemsToBuy,
    };

    if (selectedCompany === "Company 1") {
      setSellingSystem1Order(order);
      return;
    }

    if (selectedCompany === "Company 2") {
      setSellingSystem2Order(order);
      return;
    }

    // Company 3 (or anything else) isn't wired to a selling system yet.
    console.log("BUY (no route)", { company: selectedCompany, order });
  };

  return (
    <section className="panel">
      <div className="panelHeader">Create order</div>
      <div className="panelBody">
        <div className="buyControls">
          <label className="buyLabel">
            <span className="buyLabelText">Select Company</span>
            <select
              className="buySelect"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <option>Company 1</option>
              <option>Company 2</option>
            </select>
          </label>
          <button type="button" onClick={onBuy}>
            Send request
          </button>
        </div>

        <div
          className="pageMeta"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          {xmlCreated ? "XML created" : "Press BUY to generate XML"}
          <button
            type="button"
            onClick={onOpenXml}
            disabled={!xmlCreated}
            aria-label="Open XML in resizable window"
            title={xmlCreated ? "Open" : "Generate XML first"}
            style={{ padding: "0.4em 0.6em" }}
          >
            ⤢
          </button>
        </div>

        <div className="tableWrap">
          <table className="wallsTable">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Count</th>
                <th>Name</th>
                <th style={{ width: 140 }}>Total lenght</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="emptyCell">
                    Select items on the left to prepare a buy order
                  </td>
                </tr>
              ) : (
                groupedSummary.map((line) => (
                  <tr key={line.Name}>
                    <td className="mono">{line.Count}</td>
                    <td>{line.Name}</td>
                    <td className="mono">{line.TotalLength}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
