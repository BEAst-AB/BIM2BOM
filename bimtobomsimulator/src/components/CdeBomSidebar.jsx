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
          Skicka BOM till inköpssystem
        </button>
        <div className="pageMeta">
          {hasUnsentDraft
            ? "BOM inladdad (ej skickad)"
            : "BOM skickad till inköpssystem"}
        </div>
      </div>

      <IfcWallsTable bomResult={bomResult} />
    </>
  );
}
