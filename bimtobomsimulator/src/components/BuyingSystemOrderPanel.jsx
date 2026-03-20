import { useMemo, useState } from "react";
import { useBom } from "../context/useBom.js";
import { createBeastProp } from "../helpers/bomTemplates.js";

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

const createManualItemId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  const nowPart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `manual-${nowPart}-${randomPart}`;
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

const normalizeStatus = (value) => {
  const text = value == null ? "" : String(value).trim();
  if (!text) return "Unchanged";
  return text.toLowerCase() === "unchaged" ? "Unchanged" : text;
};

const deepClone = (value) => {
  if (value == null) return value;
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // Fallback below.
    }
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

export default function BuyingSystemOrderPanel({
  cdeid: cdeidProp,
  existingOrderNumbers,
  selectedItems,
  onRequestSent,
  xmlCreated,
  onOpenXml,
}) {
  const {
    bomResult,
    setSelectedBomItems,
    setSellingSystem1Order,
    setSellingSystem2Order,
  } = useBom();

  const [selectedCompany, setSelectedCompany] = useState("Company 1");
  const [manualItemsByLineName, setManualItemsByLineName] = useState(
    () => ({}),
  );

  const groupedSummary = useMemo(
    () => groupByNameAndSumLength(selectedItems),
    [selectedItems],
  );

  const addManualItemForLine = (lineName) => {
    const item = createBeastProp({
      id: createManualItemId(),
      Name: "",
      GUID: "",
      property: [],
      itemchildren: [],
      Unit: "pcs",
      Quantity: "",
      Seller: "",
      price: "",
    });

    setManualItemsByLineName((prev) => {
      const next = { ...(prev ?? {}) };
      const list = Array.isArray(next[lineName]) ? next[lineName] : [];
      next[lineName] = [...list, item];
      return next;
    });
  };

  const updateManualItem = (lineName, id, patch) => {
    setManualItemsByLineName((prev) => {
      const list = prev?.[lineName];
      if (!Array.isArray(list) || list.length === 0) return prev;
      const nextList = list.map((item) =>
        item?.id === id ? { ...item, ...patch } : item,
      );
      return { ...prev, [lineName]: nextList };
    });
  };

  const createOrderNumber = () => {
    const used =
      existingOrderNumbers instanceof Set
        ? existingOrderNumbers
        : new Set(
            Array.isArray(existingOrderNumbers) ? existingOrderNumbers : [],
          );

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const n = Math.floor(Math.random() * 1_000_000);
      const sixDigits = String(n).padStart(6, "0");
      if (!used.has(sixDigits)) return sixDigits;
    }

    const fallback = String(Math.floor(Math.random() * 1_000_000)).padStart(
      6,
      "0",
    );
    return fallback;
  };

  const onBuy = () => {
    const baseItems = selectedItems ?? [];
    const seenNames = new Set();
    const itemsToBuy = baseItems.map((item) => {
      const name = (item?.Name ?? "-").toString();
      const extras = manualItemsByLineName?.[name] ?? [];
      if (!Array.isArray(extras) || extras.length === 0) return item;
      if (seenNames.has(name)) return item;
      seenNames.add(name);

      const parentStatus = normalizeStatus(item?.status ?? item?.Status);
      const normalizedExtras = extras.map((extra) => ({
        ...extra,
        status: parentStatus,
      }));

      const existingChildren = Array.isArray(item?.itemchildren)
        ? item.itemchildren
        : [];

      return {
        ...item,
        itemchildren: [...existingChildren, ...normalizedExtras],
      };
    });

    setSelectedBomItems(itemsToBuy);

    const resolvedCdeId = (
      cdeidProp ?? (Array.isArray(bomResult) ? "" : (bomResult?.cdeid ?? ""))
    ).toString();

    const createdAt = Date.now();
    const orderNumber = createOrderNumber();

    const itemsSnapshot = deepClone(itemsToBuy);

    const order = {
      buyingSystem: createBuyingSystemId(),
      orderNumber,
      status: "New",
      company: selectedCompany,
      cdeid: resolvedCdeId,
      items: itemsSnapshot,
      createdAt,
    };

    if (selectedCompany === "Company 1") {
      const snapshot = deepClone(order);
      setSellingSystem1Order(snapshot);
      onRequestSent?.(snapshot);
      return;
    }

    if (selectedCompany === "Company 2") {
      const snapshot = deepClone(order);
      setSellingSystem2Order(snapshot);
      onRequestSent?.(snapshot);
      return;
    }

    // Company 3 (or anything else) isn't wired to a selling system yet.
    console.log("BUY (no route)", { company: selectedCompany, order });
  };

  return (
    <section className="panel">
      <div className="panelHeader">Skapa order</div>
      <div className="panelBody">
        <div className="buyControls">
          <label className="buyLabel">
            <span className="buyLabelText">Välj säljare</span>
            <select
              className="buySelect"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <option value="Company 1">Säljare 1</option>
              <option value="Company 2">Säljare 2</option>
            </select>
          </label>
          <button type="button" onClick={onBuy}>
            Skicka begäran
          </button>
        </div>

        <div
          className="pageMeta"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          {xmlCreated ? "XML skapad" : "Tryck SKICKA för att generera XML"}
          <button
            type="button"
            onClick={onOpenXml}
            disabled={!xmlCreated}
            aria-label="Öppna XML i ändringsbart fönster"
            title={xmlCreated ? "Öppna" : "Generera XML först"}
            style={{ padding: "0.4em 0.6em" }}
          >
            ⤢
          </button>
        </div>

        <div className="tableWrap">
          <table className="wallsTable">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Antal</th>
                <th>Namn</th>
                <th style={{ width: 140 }}>Total längd</th>
                <th style={{ width: 140 }} />
              </tr>
            </thead>
            <tbody>
              {selectedItems?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="emptyCell">
                    Välj objekt till vänster för att förbereda en inköpsorder
                  </td>
                </tr>
              ) : (
                groupedSummary.flatMap((line) => {
                  const extras = manualItemsByLineName?.[line.Name] ?? [];
                  const rows = [
                    <tr key={line.Name}>
                      <td className="mono">{line.Count}</td>
                      <td>{line.Name}</td>
                      <td className="mono">{line.TotalLength}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => addManualItemForLine(line.Name)}
                          style={{ padding: "0.35em 0.6em" }}
                        >
                          Lägg till objekt
                        </button>
                      </td>
                    </tr>,
                  ];

                  if (Array.isArray(extras) && extras.length > 0) {
                    for (let i = 0; i < extras.length; i += 1) {
                      const extra = extras[i];
                      const extraKey = extra?.id ?? `${line.Name}-extra-${i}`;

                      rows.push(
                        <tr key={extraKey}>
                          <td colSpan={4} style={{ paddingLeft: 16 }}>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                              }}
                            >
                              <span className="pageMeta">Objekt {i + 1}</span>
                              <input
                                className="buySelect"
                                type="text"
                                value={extra?.Name ?? ""}
                                onChange={(e) =>
                                  updateManualItem(line.Name, extra?.id, {
                                    Name: e.target.value,
                                  })
                                }
                                placeholder="Namn"
                                aria-label={`Manuellt objektnamn för ${line.Name}`}
                              />
                              <input
                                className="buySelect"
                                type="number"
                                value={extra?.Quantity ?? ""}
                                onChange={(e) =>
                                  updateManualItem(line.Name, extra?.id, {
                                    Quantity: e.target.value,
                                  })
                                }
                                placeholder="Kvantitet"
                                aria-label={`Manuell objektkvantitet för ${line.Name}`}
                              />
                              <select
                                className="buySelect"
                                value={extra?.Unit ?? "pcs"}
                                onChange={(e) =>
                                  updateManualItem(line.Name, extra?.id, {
                                    Unit: e.target.value,
                                  })
                                }
                                aria-label={`Manuell objektenhet för ${line.Name}`}
                              >
                                <option value="m">m</option>
                                <option value="m2">m2</option>
                                <option value="m3">m3</option>
                                <option value="pcs">pcs</option>
                              </select>
                            </div>
                          </td>
                        </tr>,
                      );
                    }
                  }

                  return rows;
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
