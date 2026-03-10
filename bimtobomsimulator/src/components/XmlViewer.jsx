const DEFAULT_BUYING_SYSTEM_XML = `<?xml version="1.0" encoding="utf-8"?>
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

export default function XmlViewer({
  show,
  title = "XML",
  emptyText = "Press BUY to generate XML",
  xml = DEFAULT_BUYING_SYSTEM_XML,
}) {
  return (
    <section className="panel">
      <div className="panelHeader">{title}</div>
      <div className="panelBody">
        {show ? (
          <pre className="xmlPre">{xml}</pre>
        ) : (
          <div className="emptyCell">{emptyText}</div>
        )}
      </div>
    </section>
  );
}
