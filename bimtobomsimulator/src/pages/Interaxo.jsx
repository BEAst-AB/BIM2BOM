import { useMemo } from "react";
import { useBom } from "../context/useBom.js";
import CdeBomSidebar from "../components/CdeBomSidebar.jsx";
import InteraxoConnection from "../components/InteraxoConnection.jsx";
import { createBeastProp, createBomResult } from "../helpers/bomTemplates.js";

export default function Interaxo() {
  const { bomByCdeid, setBomResult } = useBom();

  const dummyBom = useMemo(() => {
    const items = [
      createBeastProp({
        id: "interaxo-1",
        GUID: "INTERAXO_GUID_001",
        Name: "Interaxo vägg A",
        RevitID: "INT-001",
        propertySet: "INTERAXO",
        property: [
          { Name: "Length", Value: 4200, Unit: "mm" },
          { Name: "Material", Value: "Betong", Unit: "" },
        ],
      }),
      createBeastProp({
        id: "interaxo-2",
        GUID: "INTERAXO_GUID_002",
        Name: "Interaxo vägg B",
        RevitID: "INT-002",
        propertySet: "INTERAXO",
        property: [
          { Name: "Length", Value: 2800, Unit: "mm" },
          { Name: "Material", Value: "Stål", Unit: "" },
        ],
      }),
    ];

    return createBomResult({ cdeid: "interaxo", items });
  }, []);

  const onPublishToBuyingSystem = () => {
    setBomResult(dummyBom);
  };

  const publishedBom = bomByCdeid?.interaxo;
  const hasUnsentDraft = !publishedBom;
  const tableBom = hasUnsentDraft ? dummyBom : publishedBom;

  return (
    <div className="pageShell">
      <div className="pageHeader">
        <div className="pageTitle">Interaxo</div>
        <div className="pageMeta">Testintegrering</div>
      </div>

      <div className="pageBody">
        <div className="pagePane">
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Interaxo</div>
            <div className="pageMeta">
              Den här sidan är en platshållare för framtida
              Interaxo-integration.
            </div>

            <div style={{ marginTop: 12 }}>
              <InteraxoConnection />
            </div>

            <div style={{ marginTop: 12 }}>
              <CdeBomSidebar
                bomResult={tableBom}
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
