import { useMemo, useRef, useState } from "react";
import { useBom } from "../context/useBom.js";

const getRowKey = (item, index) => item?.GUID ?? item?.id ?? index;

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

export default function BuyingSystem() {
  const {
    bomResult,
    setSelectedBomItems,
    setSellingSystem1Order,
    setSellingSystem2Order,
  } = useBom();
  const items = useMemo(() => bomResult ?? [], [bomResult]);

  const shellRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRafRef = useRef(0);
  const [leftWidth, setLeftWidth] = useState(() => {
    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1200;
    const target = Math.round(viewportWidth * 0.4);
    const minLeft = 360;
    const maxLeft = 900;
    return Math.min(maxLeft, Math.max(minLeft, target));
  });

  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [selectedCompany, setSelectedCompany] = useState("Company 1");
  const [showXml, setShowXml] = useState(false);

  const selectedCount = selectedKeys.size;

  const selectedList = useMemo(() => {
    if (selectedKeys.size === 0) return [];
    const selected = [];
    for (let i = 0; i < items.length; i += 1) {
      const key = getRowKey(items[i], i);
      if (selectedKeys.has(key)) selected.push(items[i]);
    }
    return selected;
  }, [items, selectedKeys]);

  const toggleRow = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onGetSelected = () => {
    setSelectedBomItems(selectedList);
  };

  const onBuy = () => {
    const itemsToBuy = selectedList;
    setSelectedBomItems(itemsToBuy);
    setShowXml(true);

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

  const requestLayoutResize = () => {
    if (resizeRafRef.current) return;
    resizeRafRef.current = window.requestAnimationFrame(() => {
      resizeRafRef.current = 0;
      window.dispatchEvent(new Event("resize"));
    });
  };

  const onSplitterPointerDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = leftWidth;

    const shellWidth = shellRef.current?.clientWidth ?? 0;
    const minLeft = 360;
    const minRight = 360;
    const maxLeft = shellWidth ? Math.max(minLeft, shellWidth - minRight) : 900;

    dragRef.current = { startX, startWidth, minLeft, maxLeft };
    document.body.style.userSelect = "none";

    const onMove = (e) => {
      const drag = dragRef.current;
      if (!drag) return;
      const next = drag.startWidth + (e.clientX - drag.startX);
      const clamped = Math.min(drag.maxLeft, Math.max(drag.minLeft, next));
      setLeftWidth(clamped);
      requestLayoutResize();
    };

    const onUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      requestLayoutResize();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const fakeXml = `<?xml version="1.0" encoding="utf-8"?>
<BuyOrder>
  <Header>
    <Buyer>Example AB</Buyer>
    <Project>BIM2BOM</Project>
    <Created>2026-02-25</Created>
  </Header>
  <Lines>
    <Line>
      <Name>Wall A</Name>
      <GUID>3pLKJPvHT21uNqX1l9FcUN</GUID>
      <Length unit="mm">4200</Length>
    </Line>
    <Line>
      <Name>Wall B</Name>
      <GUID>0Zk_ExampleGuid_123</GUID>
      <Length unit="mm">2800</Length>
    </Line>
  </Lines>
</BuyOrder>
`;

  const groupedSummary = useMemo(
    () => groupByNameAndSumLength(selectedList),
    [selectedList],
  );

  return (
    <div className="pageShell">
      <div className="pageHeader">
        <div className="pageTitle">Buying System</div>
        <div className="pageMeta">{items.length} BOM items</div>
      </div>

      <div className="pageBody" ref={shellRef}>
        <div className="splitShell">
          <div className="splitLeft" style={{ width: `${leftWidth}px` }}>
            <div className="splitColumn">
              <div className="tableWrap">
                <table className="wallsTable">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }} aria-label="Select" />
                      <th>Name</th>
                      <th>GUID</th>
                      <th>Lenght</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="emptyCell">
                          No BOM data loaded yet (open CDE first)
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => {
                        const key = getRowKey(item, index);
                        const checked = selectedKeys.has(key);

                        return (
                          <tr key={key}>
                            <td>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleRow(key)}
                                aria-label={`Select ${item?.Name ?? "row"}`}
                              />
                            </td>
                            <td>{item?.Name || "-"}</td>
                            <td className="mono">{item?.GUID || "-"}</td>
                            <td className="mono">{readLength(item)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pageActions">
                <button type="button" onClick={onGetSelected}>
                  Get selected ({selectedCount})
                </button>
                <div className="pageMeta">
                  Selected list: {selectedList.length}
                </div>
              </div>
            </div>
          </div>

          <div
            className="paneSplitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize buying columns"
            onPointerDown={onSplitterPointerDown}
          />

          <div className="splitRight">
            <div className="rightRows">
              <section className="panel">
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
                        {selectedList.length === 0 ? (
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

              <section className="panel">
                <div className="panelHeader">XML</div>
                <div className="panelBody">
                  {showXml ? (
                    <pre className="xmlPre">{fakeXml}</pre>
                  ) : (
                    <div className="emptyCell">Press BUY to generate XML</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
