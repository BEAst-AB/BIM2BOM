import { useState } from "react";
import { getDataGrid } from "../helpers/IXBD Functions.js";

const PROJECT_ID = "46715b0b-8873-4983-82ab-811269331363";

export default function InteraxoConnection() {
  const [accessToken, setAccessToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onTestGetDataGrid = async () => {
    if (!accessToken.trim()) {
      console.warn("InteraxoConnection: missing access token");
      return;
    }

    setIsLoading(true);
    try {
      const result = await getDataGrid(PROJECT_ID, accessToken.trim());
      console.log("getDataGrid result", result);
    } catch (error) {
      console.error("getDataGrid failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">Interaxo connection test</div>
      <div className="panelBody">
        <div className="buyControls" style={{ alignItems: "stretch" }}>
          <label className="buyLabel" style={{ flex: 1, minWidth: 280 }}>
            <span className="buyLabelText">Access token</span>
            <input
              className="buySelect"
              type="text"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Paste access token (e.g. 'Bearer …' if required)"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </label>

          <button
            type="button"
            onClick={onTestGetDataGrid}
            disabled={isLoading}
          >
            {isLoading ? "Loading…" : "Test getDataGrid"}
          </button>
        </div>

        <div className="pageMeta">
          Calls <span className="mono">getDataGrid</span> for project{" "}
          <span className="mono">{PROJECT_ID}</span> and logs the result to the
          console.
        </div>
      </div>
    </section>
  );
}
