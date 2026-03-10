import IfcWallsTable from "./IfcWallsTable.jsx";

export default function CdeBomSidebar({
  bomResult,
  hasUnsentDraft,
  onPublishToBuyingSystem,
}) {
  return (
    <>
      <div className="pageActions" style={{ padding: 12 }}>
        <button
          type="button"
          onClick={onPublishToBuyingSystem}
          disabled={!hasUnsentDraft}
        >
          Send BOM to Buying System
        </button>
        <div className="pageMeta">
          {hasUnsentDraft
            ? "BOM loaded (not sent)"
            : "BOM sent to Buying System"}
        </div>
      </div>

      <IfcWallsTable bomResult={bomResult} />
    </>
  );
}
