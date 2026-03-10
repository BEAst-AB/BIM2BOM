import { useMemo, useState } from "react";
import { useBom } from "../context/useBom.js";
import CdeBomSidebar from "../components/CdeBomSidebar.jsx";
import { createBeastProp, createBomResult } from "../helpers/bomTemplates.js";

export default function Interaxo() {
  const { setBomResult } = useBom();
  const [hasUnsentDraft, setHasUnsentDraft] = useState(true);

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

  const onPublishToBuyingSystem = () => {
    setBomResult(dummyBom);
    setHasUnsentDraft(false);
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

            <div style={{ marginTop: 12 }}>
              <CdeBomSidebar
                bomResult={dummyBom}
                hasUnsentDraft={hasUnsentDraft}
                onPublishToBuyingSystem={onPublishToBuyingSystem}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
