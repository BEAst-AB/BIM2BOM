import { useMemo, useState } from "react";
import { useBom } from "../context/useBom.js";
import { createBeastProp, createBomResult } from "../helpers/bomTemplates.js";

export default function Interaxo() {
  const { setBomResult } = useBom();
  const [sentAt, setSentAt] = useState(null);

  const dummyBom = useMemo(() => {
    const items = [
      createBeastProp({
        id: "interaxo-1",
        GUID: "INTERAXO_GUID_001",
        Name: "Interaxo wall A",
        RevitID: "INT-001",
        propertySet: "INTERAXO",
        property: [
          { Name: "Length", Value: 4200, Unit: "mm" },
          { Name: "Material", Value: "Concrete", Unit: "" },
        ],
      }),
      createBeastProp({
        id: "interaxo-2",
        GUID: "INTERAXO_GUID_002",
        Name: "Interaxo wall B",
        RevitID: "INT-002",
        propertySet: "INTERAXO",
        property: [
          { Name: "Length", Value: 2800, Unit: "mm" },
          { Name: "Material", Value: "Steel", Unit: "" },
        ],
      }),
    ];

    return createBomResult({ cdeid: "interaxo", items });
  }, []);

  const onSendDummyToBuyingSystem = () => {
    setBomResult(dummyBom);
    setSentAt(Date.now());
  };

  return (
    <div className="pageShell">
      <div className="pageHeader">
        <div className="pageTitle">Interaxo</div>
        <div className="pageMeta">Dummy integration</div>
      </div>

      <div className="pageBody">
        <div className="pagePane">
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Interaxo</div>
            <div className="pageMeta">
              This page is a placeholder for future Interaxo integration.
            </div>

            <div className="pageActions" style={{ marginTop: 12 }}>
              <button type="button" onClick={onSendDummyToBuyingSystem}>
                Send dummy BOM to Buying System
              </button>
              <div className="pageMeta">
                Sends {dummyBom.items.length} items with cdeid "interaxo"
                {sentAt
                  ? ` (last sent ${new Date(sentAt).toLocaleTimeString()})`
                  : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
