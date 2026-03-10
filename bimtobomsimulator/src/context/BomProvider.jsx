import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BomContext } from "./BomContext.js";

const createIncomingOrderId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  const nowPart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `in-${nowPart}-${randomPart}`;
};

const applyBomOverrides = (items, overridesByGuid) => {
  const list = items ?? [];
  if (!overridesByGuid || Object.keys(overridesByGuid).length === 0)
    return list;

  return list.map((item) => {
    const guid = item?.GUID;
    if (!guid) return item;
    const override = overridesByGuid[guid];
    if (!override) return item;

    return {
      ...item,
      Seller: override.Seller,
      price: override.price,
    };
  });
};

export function BomProvider({ children }) {
  const [bomResult, setBomResultState] = useState([]);
  const [selectedBomItems, setSelectedBomItems] = useState([]);
  const [buySummaryLines, setBuySummaryLines] = useState([]);
  const [sellingSystem1Order, setSellingSystem1Order] = useState(null);
  const [sellingSystem2Order, setSellingSystem2Order] = useState(null);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [bomOverridesByGuid, setBomOverridesByGuid] = useState(() => ({}));

  const bomOverridesRef = useRef(bomOverridesByGuid);

  useEffect(() => {
    bomOverridesRef.current = bomOverridesByGuid;
  }, [bomOverridesByGuid]);

  // Keep this function stable so IfcViewer doesn't reload when context updates.
  const setBomResult = useCallback((next) => {
    setBomResultState((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      return applyBomOverrides(resolved, bomOverridesRef.current);
    });
  }, []);

  const addIncomingOrder = (payload) => {
    setIncomingOrders((prev) => [
      ...prev,
      {
        id: createIncomingOrderId(),
        receivedAt: Date.now(),
        payload,
      },
    ]);
  };

  const acceptIncomingOrder = (incomingId) => {
    setIncomingOrders((prev) => {
      const index = prev.findIndex((o) => o.id === incomingId);
      if (index === -1) return prev;

      const order = prev[index];
      const payload = order?.payload;

      // Update the CDE BOM table by matching GUID and copying in Seller + price.
      // Keep the incoming payload intact; never replace the BOM item objects.
      if (payload && Array.isArray(payload.items)) {
        const updatesByGuid = {};
        const seller = payload.company ?? payload.SellingSystem ?? "";

        for (const line of payload.items) {
          const guid = line?.item?.GUID;
          if (!guid) continue;
          updatesByGuid[guid] = {
            Seller: seller,
            price: line?.price ?? "",
          };
        }

        if (Object.keys(updatesByGuid).length > 0) {
          setBomOverridesByGuid((prevOverrides) => ({
            ...prevOverrides,
            ...updatesByGuid,
          }));

          const merged = { ...bomOverridesRef.current, ...updatesByGuid };
          setBomResultState((bomPrev) => applyBomOverrides(bomPrev, merged));
        }
      }

      setAcceptedOrders((acceptedPrev) => [...acceptedPrev, order]);

      const next = prev.slice();
      next.splice(index, 1);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      bomResult,
      setBomResult,
      selectedBomItems,
      setSelectedBomItems,
      buySummaryLines,
      setBuySummaryLines,
      sellingSystem1Order,
      setSellingSystem1Order,
      sellingSystem2Order,
      setSellingSystem2Order,
      incomingOrders,
      addIncomingOrder,
      acceptIncomingOrder,
      acceptedOrders,
    }),
    [
      bomResult,
      selectedBomItems,
      buySummaryLines,
      sellingSystem1Order,
      sellingSystem2Order,
      incomingOrders,
      acceptedOrders,
      setBomResult,
    ],
  );

  return <BomContext.Provider value={value}>{children}</BomContext.Provider>;
}
