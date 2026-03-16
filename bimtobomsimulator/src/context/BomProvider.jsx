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

  const applyToItem = (item) => {
    if (!item || typeof item !== "object") return item;

    const children = Array.isArray(item.itemchildren)
      ? item.itemchildren
      : null;
    const nextChildren = children
      ? children.map((child) => applyToItem(child))
      : null;

    const key = getItemStableKey(item, "");
    const override = key ? overridesByGuid[key] : null;

    if (!override && !nextChildren) return item;

    return {
      ...item,
      ...(nextChildren ? { itemchildren: nextChildren } : {}),
      ...(override
        ? {
            Seller: override.Seller,
            price: override.price,
          }
        : {}),
    };
  };

  return list.map((item) => applyToItem(item));
};

const normalizeBomResult = (value) => {
  if (Array.isArray(value)) {
    return { cdeid: "", items: value };
  }

  if (value && typeof value === "object") {
    const cdeid = value.cdeid ?? "";
    const items = Array.isArray(value.items) ? value.items : [];
    const { items: _items, cdeid: _cdeid, ...rest } = value;
    return { ...rest, cdeid, items };
  }

  return { cdeid: "", items: [] };
};

const getItemStableKey = (item, fallback) => {
  const guid = item?.GUID;
  if (guid != null && String(guid).trim() !== "") return String(guid);
  const id = item?.id;
  if (id != null && String(id).trim() !== "") return String(id);
  return fallback;
};

const mergeIncomingChildrenByGuid = (items, childrenByGuid) => {
  if (!childrenByGuid || Object.keys(childrenByGuid).length === 0) return items;
  const list = Array.isArray(items) ? items : [];

  return list.map((item, index) => {
    if (!item || typeof item !== "object") return item;
    const guid = getItemStableKey(item, "");
    const incomingChildren = guid ? childrenByGuid[guid] : null;
    if (!Array.isArray(incomingChildren) || incomingChildren.length === 0)
      return item;

    const existingChildren = Array.isArray(item.itemchildren)
      ? item.itemchildren
      : [];

    const existingKeys = new Set(
      existingChildren.map((child, childIndex) =>
        getItemStableKey(child, `existing:${index}:${childIndex}`),
      ),
    );

    const mergedChildren = [...existingChildren];
    for (let i = 0; i < incomingChildren.length; i += 1) {
      const child = incomingChildren[i];
      const key = getItemStableKey(child, `incoming:${index}:${i}`);
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      mergedChildren.push(child);
    }

    return {
      ...item,
      itemchildren: mergedChildren,
    };
  });
};

export function BomProvider({ children }) {
  const [bomResult, setBomResultState] = useState(() => ({
    cdeid: "",
    items: [],
  }));
  const [bomByCdeid, setBomByCdeid] = useState(() => ({}));
  const [draftBomByCdeid, setDraftBomByCdeid] = useState(() => ({}));
  const [selectedBomItems, setSelectedBomItems] = useState([]);
  const [buySummaryLines, setBuySummaryLines] = useState([]);
  const [sellingSystem1Order, setSellingSystem1Order] = useState(null);
  const [sellingSystem2Order, setSellingSystem2Order] = useState(null);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [bomOverridesByCdeid, setBomOverridesByCdeid] = useState(() => ({}));

  const bomOverridesRef = useRef(bomOverridesByCdeid);

  useEffect(() => {
    bomOverridesRef.current = bomOverridesByCdeid;
  }, [bomOverridesByCdeid]);

  // Keep this function stable so IfcViewer doesn't reload when context updates.
  const setBomResult = useCallback((next) => {
    setBomResultState((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      const normalized = normalizeBomResult(resolved);
      const resolvedCdeid = (normalized?.cdeid ?? "").toString().trim();
      const overridesByGuid = bomOverridesRef.current?.[resolvedCdeid] ?? {};
      const applied = {
        ...normalized,
        items: applyBomOverrides(normalized.items, overridesByGuid),
      };

      setBomByCdeid((prevByCde) => ({
        ...prevByCde,
        [resolvedCdeid]: applied,
      }));

      return applied;
    });
  }, []);

  const setDraftBomForCdeid = useCallback((cdeid, nextDraft) => {
    const resolvedCdeid = (cdeid ?? "").toString().trim();
    const normalized = normalizeBomResult(nextDraft);
    setDraftBomByCdeid((prev) => ({
      ...prev,
      [resolvedCdeid]: {
        ...normalized,
        cdeid: resolvedCdeid,
      },
    }));
  }, []);

  const clearDraftBomForCdeid = useCallback((cdeid) => {
    const resolvedCdeid = (cdeid ?? "").toString().trim();
    setDraftBomByCdeid((prev) => {
      if (!prev || !(resolvedCdeid in prev)) return prev;
      const next = { ...prev };
      delete next[resolvedCdeid];
      return next;
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

  const declineIncomingOrder = (incomingId) => {
    setIncomingOrders((prev) => {
      const index = prev.findIndex((o) => o.id === incomingId);
      if (index === -1) return prev;
      const next = prev.slice();
      next.splice(index, 1);
      return next;
    });
  };

  const acceptIncomingOrder = (incomingId) => {
    setIncomingOrders((prev) => {
      const index = prev.findIndex((o) => o.id === incomingId);
      if (index === -1) return prev;

      const order = prev[index];
      const payload = order?.payload;
      const targetCdeid = (payload?.cdeid ?? "").toString().trim();

      if (!targetCdeid) {
        console.warn(
          "acceptIncomingOrder: payload missing cdeid; skipping BOM update",
          payload,
        );
      }

      // Update the CDE BOM table by matching GUID and copying in Seller + price.
      // Keep the incoming payload intact; never replace the BOM item objects.
      if (targetCdeid && payload && Array.isArray(payload.items)) {
        const updatesByGuid = {};
        const childrenByGuid = {};
        const seller = payload.company ?? payload.SellingSystem ?? "";

        for (const line of payload.items) {
          const item = line?.item ?? line;
          const incomingChildren = item?.itemchildren;
          const guid = getItemStableKey(item, "");
          if (!guid) continue;

          if (Array.isArray(incomingChildren) && incomingChildren.length > 0) {
            childrenByGuid[guid] = incomingChildren;
          }

          updatesByGuid[guid] = {
            Seller: seller,
            price: line?.price ?? "",
          };
        }

        const hasOverrides = Object.keys(updatesByGuid).length > 0;
        const hasChildren = Object.keys(childrenByGuid).length > 0;

        if (hasOverrides || hasChildren) {
          const existingOverrides =
            bomOverridesRef.current?.[targetCdeid] ?? {};
          const mergedOverrides = hasOverrides
            ? { ...existingOverrides, ...updatesByGuid }
            : existingOverrides;

          if (hasOverrides) {
            setBomOverridesByCdeid((prevOverrides) => ({
              ...prevOverrides,
              [targetCdeid]: mergedOverrides,
            }));
          }

          // Update the per-CDE BOM table.
          setBomByCdeid((prevByCde) => {
            const current = prevByCde[targetCdeid];
            if (!current) return prevByCde;
            const normalized = normalizeBomResult(current);
            const mergedChildren = mergeIncomingChildrenByGuid(
              normalized.items,
              childrenByGuid,
            );
            return {
              ...prevByCde,
              [targetCdeid]: {
                ...normalized,
                items: applyBomOverrides(mergedChildren, mergedOverrides),
              },
            };
          });

          // Update the BuyingSystem BOM only if it belongs to the same CDE.
          setBomResultState((bomPrev) => {
            const normalized = normalizeBomResult(bomPrev);
            if (((normalized?.cdeid ?? "").toString() || "") !== targetCdeid)
              return bomPrev;
            return {
              ...normalized,
              items: applyBomOverrides(
                mergeIncomingChildrenByGuid(normalized.items, childrenByGuid),
                mergedOverrides,
              ),
            };
          });
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
      bomByCdeid,
      draftBomByCdeid,
      setBomResult,
      setDraftBomForCdeid,
      clearDraftBomForCdeid,
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
      declineIncomingOrder,
      acceptedOrders,
    }),
    [
      bomResult,
      bomByCdeid,
      draftBomByCdeid,
      selectedBomItems,
      buySummaryLines,
      sellingSystem1Order,
      sellingSystem2Order,
      incomingOrders,
      acceptedOrders,
      setBomResult,
      setDraftBomForCdeid,
      clearDraftBomForCdeid,
    ],
  );

  return <BomContext.Provider value={value}>{children}</BomContext.Provider>;
}
