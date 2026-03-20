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
      <div className="panelHeader">Interaxo anslutningstest</div>
      <div className="panelBody">
        <div className="buyControls" style={{ alignItems: "stretch" }}>
          <label className="buyLabel" style={{ flex: 1, minWidth: 280 }}>
            <span className="buyLabelText">Åtkomsttoken</span>
            <input
              className="buySelect"
              type="text"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Klistra in åtkomsttoken (t.ex. 'Bearer …' om det krävs)"
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
            {isLoading ? "Läser in…" : "Testa getDataGrid"}
          </button>
        </div>

        <div className="pageMeta">
          Anropar <span className="mono">getDataGrid</span> för projekt{" "}
          <span className="mono">{PROJECT_ID}</span> och loggar resultatet till
          konsolen.
        </div>
      </div>
    </section>
  );
}
