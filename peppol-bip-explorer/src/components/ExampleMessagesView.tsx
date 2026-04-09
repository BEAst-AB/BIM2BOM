import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { PeppolExample } from '@/types/bip-peppol';

interface ExampleMessagesViewProps {
  examples: PeppolExample[];
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function partitionDisciplineExamples(list: PeppolExample[]) {
  return {
    traceableParent: list.find((e) => e.catalogueVariant === 'MbomBimParent'),
    traceableChild: list.find((e) => e.catalogueVariant === 'MbomManufacturingChild'),
    standard: list.find((e) => e.catalogueVariant === 'MbomPackageArticle'),
  };
}

export function ExampleMessagesView({ examples }: ExampleMessagesViewProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const examplesByDiscipline = examples.reduce((acc, example) => {
    if (!acc[example.discipline]) {
      acc[example.discipline] = [];
    }
    acc[example.discipline].push(example);
    return acc;
  }, {} as Record<string, PeppolExample[]>);

  const disciplines = Object.keys(examplesByDiscipline);

  const generateXML = (example: PeppolExample): string => {
    const e = escapeXml;
    let xml = `<cac:CatalogueLine>\n`;
    xml += `  <cbc:ID>${e(example.id)}</cbc:ID>\n`;
    xml += `  <cbc:ActionCode>${e(example.actionCode)}</cbc:ActionCode>\n`;
    xml += `  <cbc:OrderableIndicator>${e(example.orderableIndicator)}</cbc:OrderableIndicator>\n`;
    xml += `  <cbc:OrderableUnit>${e(example.orderableUnit)}</cbc:OrderableUnit>\n`;
    xml += `  <cbc:ContentUnitQuantity unitCode="${e(example.contentUnitCode)}">${e(example.contentUnitQuantity)}</cbc:ContentUnitQuantity>\n`;

    if (
      example.catalogueVariant === 'MbomManufacturingChild' &&
      example.parentCatalogueLineId
    ) {
      xml += `  \n  <cac:ComponentRelatedItem>\n`;
      xml += `    <cbc:ID schemeID="CatalogueLineID">${e(example.parentCatalogueLineId)}</cbc:ID>\n`;
      const u = example.componentRelatedUnitCode || example.contentUnitCode;
      xml += `    <cbc:Quantity unitCode="${e(u)}">${e(example.componentRelatedQuantity || example.contentUnitQuantity)}</cbc:Quantity>\n`;
      xml += `  </cac:ComponentRelatedItem>\n`;
    }

    xml += `  \n  <cac:Item>\n`;
    xml += `    <cbc:Description>${e(example.description)}</cbc:Description>\n`;
    xml += `    <cbc:Name>${e(example.itemName)}</cbc:Name>\n`;
    xml += `    \n    <cac:SellersItemIdentification>\n`;
    xml += `      <cbc:ID>${e(example.sellersItemId)}</cbc:ID>\n`;
    xml += `    </cac:SellersItemIdentification>\n`;

    example.properties.forEach((prop) => {
      xml += `    \n    <cac:AdditionalItemProperty>\n`;
      xml += `      <cbc:Name>${e(prop.name)}</cbc:Name>\n`;
      const nc = prop.nameCode || prop.name;
      const lid = prop.listID || 'ORG:BEAst';
      xml += `      <cbc:NameCode listID="${e(lid)}">${e(nc)}</cbc:NameCode>\n`;
      xml += `      <cbc:Value>${e(prop.value)}</cbc:Value>\n`;
      if (prop.valueQuantity) {
        xml += `      <cbc:ValueQuantity unitCode="${e(prop.unitCode || '')}">${e(prop.valueQuantity)}</cbc:ValueQuantity>\n`;
      }
      xml += `    </cac:AdditionalItemProperty>\n`;
    });

    xml += `  </cac:Item>\n`;
    xml += `</cac:CatalogueLine>`;
    return xml;
  };

  const renderXMLWithHighlight = (xml: string, hoveredId: string | null): React.ReactNode => {
    if (!hoveredId) {
      return <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{xml}</pre>;
    }

    const lines = xml.split('\n');
    const result: React.ReactNode[] = [];

    const propertyRanges: Array<{ start: number; end: number }> = [];
    let currentPropertyStart = -1;

    lines.forEach((line, index) => {
      if (line.includes('<cac:AdditionalItemProperty>')) {
        currentPropertyStart = index;
      } else if (line.includes('</cac:AdditionalItemProperty>') && currentPropertyStart !== -1) {
        propertyRanges.push({ start: currentPropertyStart, end: index });
        currentPropertyStart = -1;
      }
    });

    const highlightAttribute = (line: string, attrName: string, highlightColor: string): React.ReactNode => {
      const attrRegex = new RegExp(`(${attrName}="[^"]*")`);
      const match = line.match(attrRegex);

      if (!match) return line;

      const parts = line.split(attrRegex);
      return (
        <>
          {parts.map((part, i) =>
            part === match[1] ? (
              <span key={i} className={`${highlightColor} font-semibold px-1 rounded`}>
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </>
      );
    };

    const blockRange = (startTag: string, endTag: string): { start: number; end: number } | null => {
      const start = lines.findIndex((l) => l.includes(startTag));
      const end = lines.findIndex((l) => l.includes(endTag));
      if (start < 0 || end < 0 || end < start) return null;
      return { start, end };
    };

    const sellersRange = blockRange('<cac:SellersItemIdentification>', '</cac:SellersItemIdentification>');
    const componentRange = blockRange('<cac:ComponentRelatedItem>', '</cac:ComponentRelatedItem>');

    lines.forEach((line, index) => {
      let shouldHighlight = false;
      let highlightColor = '';
      let highlightAttributeOnly = false;
      let attributeName = '';

      if (hoveredId === 'catalogue-line-id' && line.includes('<cbc:ID>') && index === 1) {
        shouldHighlight = true;
        highlightColor = 'bg-indigo-200 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200';
      } else if (hoveredId === 'action-code' && line.includes('<cbc:ActionCode>')) {
        shouldHighlight = true;
        highlightColor = 'bg-slate-200 dark:bg-slate-800/50 text-slate-900 dark:text-slate-200';
      } else if (hoveredId === 'orderable-unit' && line.includes('<cbc:OrderableUnit>')) {
        shouldHighlight = true;
        highlightColor = 'bg-slate-200 dark:bg-slate-800/50 text-slate-900 dark:text-slate-200';
      } else if (hoveredId === 'content-unit-quantity' && line.includes('<cbc:ContentUnitQuantity')) {
        shouldHighlight = true;
        highlightColor = 'bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200';
      } else if (hoveredId === 'component-related' && componentRange && index >= componentRange.start && index <= componentRange.end) {
        shouldHighlight = true;
        highlightColor = 'bg-fuchsia-200 dark:bg-fuchsia-900/50 text-fuchsia-900 dark:text-fuchsia-200';
      } else if (hoveredId === 'item-name' && line.includes('<cbc:Name>')) {
        const beforeLines = lines.slice(0, index);
        let propertyBlockCount = 0;
        for (const l of beforeLines) {
          if (l.includes('<cac:AdditionalItemProperty>')) propertyBlockCount++;
          if (l.includes('</cac:AdditionalItemProperty>')) propertyBlockCount--;
        }
        const inPropertyBlock = propertyBlockCount > 0;
        if (!inPropertyBlock) {
          shouldHighlight = true;
          highlightColor = 'bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200';
        }
      } else if (hoveredId === 'item-description' && line.includes('<cbc:Description>')) {
        shouldHighlight = true;
        highlightColor = 'bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200';
      } else if (hoveredId === 'sellers-item-id' && sellersRange && index >= sellersRange.start && index <= sellersRange.end) {
        shouldHighlight = true;
        highlightColor = 'bg-cyan-200 dark:bg-cyan-900/50 text-cyan-900 dark:text-cyan-200';
      } else if (hoveredId.startsWith('property-')) {
        const parts = hoveredId.split('-');
        const propIndex = parseInt(parts[1], 10);
        const range = propertyRanges[propIndex];

        if (range && index >= range.start && index <= range.end) {
          if (parts.length === 3) {
            const field = parts[2];

            if (field === 'name' && line.includes('<cbc:Name>')) {
              shouldHighlight = true;
              highlightColor = 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200';
            } else if (field === 'namecode' && line.includes('<cbc:NameCode')) {
              shouldHighlight = true;
              highlightColor = 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200';
            } else if (field === 'listid' && line.includes('listID=')) {
              highlightAttributeOnly = true;
              attributeName = 'listID';
              highlightColor = 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200';
            } else if (field === 'value' && line.includes('<cbc:Value>')) {
              shouldHighlight = true;
              highlightColor = 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200';
            } else if (field === 'valuequantity' && line.includes('<cbc:ValueQuantity')) {
              shouldHighlight = true;
              highlightColor = 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200';
            } else if (field === 'unitcode' && line.includes('unitCode=')) {
              highlightAttributeOnly = true;
              attributeName = 'unitCode';
              highlightColor = 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200';
            }
          } else {
            shouldHighlight = true;
            highlightColor = 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200';
          }
        }
      }

      result.push(
        <div
          key={index}
          className={`${shouldHighlight && !highlightAttributeOnly ? `${highlightColor} font-semibold` : ''}`}
        >
          {highlightAttributeOnly ? highlightAttribute(line, attributeName, highlightColor) : line}
        </div>
      );
    });

    return <pre className="text-xs font-mono whitespace-pre-wrap">{result}</pre>;
  };

  const renderExample = (example: PeppolExample, exampleId: string) => {
    const cdePropIndex = example.properties.findIndex((p) => p.name === 'CDEGuid');

    return (
    <div key={exampleId} className="mb-6">
      <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl">{example.itemName}</CardTitle>
          <CardDescription className="mt-2">{example.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <h3 className="font-semibold text-lg border-b pb-2 sticky top-0 bg-background z-10">Rendered Data</h3>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/20 rounded-lg border-l-4 border-slate-500">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-400 uppercase tracking-wide">
                  Catalogue line
                </h4>
                <div
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('catalogue-line-id')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">cbc:ID</p>
                  <p className="font-mono text-sm">{example.id}</p>
                </div>
                <div
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('action-code')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">cbc:ActionCode</p>
                  <p className="font-mono text-sm">{example.actionCode}</p>
                </div>
                <div
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('orderable-unit')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">cbc:OrderableUnit</p>
                  <p className="font-mono text-sm">{example.orderableUnit}</p>
                </div>
                <div
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('content-unit-quantity')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">cbc:ContentUnitQuantity</p>
                  <p className="font-mono text-sm">
                    {example.contentUnitQuantity} {example.contentUnitCode}
                  </p>
                </div>
              </div>

              {example.catalogueVariant === 'MbomManufacturingChild' && example.parentCatalogueLineId && (
                <div className="space-y-3 p-4 bg-fuchsia-50 dark:bg-fuchsia-950/20 rounded-lg border-l-4 border-fuchsia-500">
                  <h4 className="font-semibold text-sm text-fuchsia-700 dark:text-fuchsia-400 uppercase tracking-wide">
                    Hierarchy
                  </h4>
                  <div
                    className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredElement('component-related')}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      cac:ComponentRelatedItem → cbc:ID (CatalogueLineID)
                    </p>
                    <p className="font-mono text-sm">Parent line: {example.parentCatalogueLineId}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3 p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border-l-4 border-cyan-500">
                <h4 className="font-semibold text-sm text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">
                  Identification
                </h4>
                <div
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('sellers-item-id')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    cac:SellersItemIdentification → cbc:ID
                  </p>
                  <Badge className="mb-2 text-xs">Supplier / selling system id</Badge>
                  <p className="font-mono text-sm break-all">{example.sellersItemId}</p>
                </div>
                {example.ifcGuid && cdePropIndex >= 0 && (
                  <div
                    className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredElement(`property-${cdePropIndex}`)}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      CDEGuid (also in AdditionalItemProperty)
                    </p>
                    <p className="font-mono text-xs break-all">{example.ifcGuid}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                  Item
                </h4>
                <div
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('item-name')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">cbc:Name</p>
                  <p className="font-semibold">{example.itemName}</p>
                </div>
                <div
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('item-description')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">cbc:Description</p>
                  <p className="text-sm">{example.description}</p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 uppercase tracking-wide">
                  Properties (cac:AdditionalItemProperty)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Discipline-specific BIP parameters (cbc:NameCode listID ORG:BEAst where applicable)
                </p>

                {example.properties.map((prop, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-background border-2 border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredElement(`property-${i}`)}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-sm text-green-700 dark:text-green-400">
                        Property {i + 1} of {example.properties.length}
                      </div>
                      <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 text-xs">
                        BIP.{prop.name}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm bg-muted/30 p-3 rounded">
                      <div
                        className="flex justify-between items-start gap-2 border-b border-border/50 pb-2 cursor-pointer hover:bg-background/50 px-2 py-1 rounded"
                        onMouseEnter={() => setHoveredElement(`property-${i}-name`)}
                        onMouseLeave={() => setHoveredElement(null)}
                      >
                        <span className="text-muted-foreground font-mono text-xs">cbc:Name</span>
                        <span className="font-medium text-right">{prop.name}</span>
                      </div>
                      <div
                        className="flex justify-between items-start gap-2 border-b border-border/50 pb-2 cursor-pointer hover:bg-background/50 px-2 py-1 rounded"
                        onMouseEnter={() => setHoveredElement(`property-${i}-namecode`)}
                        onMouseLeave={() => setHoveredElement(null)}
                      >
                        <span className="text-muted-foreground font-mono text-xs">cbc:NameCode</span>
                        <span className="font-mono text-xs text-right">{prop.nameCode || prop.name}</span>
                      </div>
                      <div
                        className="flex justify-between items-start gap-2 border-b border-border/50 pb-2 cursor-pointer hover:bg-background/50 px-2 py-1 rounded"
                        onMouseEnter={() => setHoveredElement(`property-${i}-listid`)}
                        onMouseLeave={() => setHoveredElement(null)}
                      >
                        <span className="text-muted-foreground font-mono text-xs">@listID</span>
                        <Badge variant="outline" className="font-mono text-xs max-w-[12rem] truncate">
                          {prop.listID || 'ORG:BEAst'}
                        </Badge>
                      </div>
                      <div
                        className="flex justify-between items-start gap-2 border-b border-border/50 pb-2 cursor-pointer hover:bg-background/50 px-2 py-1 rounded"
                        onMouseEnter={() => setHoveredElement(`property-${i}-value`)}
                        onMouseLeave={() => setHoveredElement(null)}
                      >
                        <span className="text-muted-foreground font-mono text-xs">cbc:Value</span>
                        <span className="font-medium text-right">{prop.value}</span>
                      </div>
                      {prop.valueQuantity && (
                        <div
                          className="flex justify-between items-start gap-2 border-b border-border/50 pb-2 cursor-pointer hover:bg-background/50 px-2 py-1 rounded"
                          onMouseEnter={() => setHoveredElement(`property-${i}-valuequantity`)}
                          onMouseLeave={() => setHoveredElement(null)}
                        >
                          <span className="text-muted-foreground font-mono text-xs">cbc:ValueQuantity</span>
                          <span className="font-mono text-xs text-right">{prop.valueQuantity}</span>
                        </div>
                      )}
                      {prop.unitCode && (
                        <div
                          className="flex justify-between items-start gap-2 cursor-pointer hover:bg-background/50 px-2 py-1 rounded"
                          onMouseEnter={() => setHoveredElement(`property-${i}-unitcode`)}
                          onMouseLeave={() => setHoveredElement(null)}
                        >
                          <span className="text-muted-foreground font-mono text-xs">@unitCode</span>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {prop.unitCode}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">XML Structure</h3>
                <div className="bg-card border border-border rounded-lg p-4 overflow-x-auto max-h-[80vh] overflow-y-auto">
                  {renderXMLWithHighlight(generateXML(example), hoveredElement)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Peppol Examples per Discipline</h2>
        <p className="text-muted-foreground">
          Choose a discipline, then Traceable vs Standard Catalogue; under Traceable, switch between the Engineering BOM
          line and the Manufacturing BIM line.
        </p>
      </div>

      <Tabs defaultValue={disciplines[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {disciplines.map((discipline) => (
            <TabsTrigger key={discipline} value={discipline}>
              {discipline}
            </TabsTrigger>
          ))}
        </TabsList>

        {disciplines.map((discipline) => {
          const { traceableParent, traceableChild, standard } = partitionDisciplineExamples(
            examplesByDiscipline[discipline]
          );
          return (
            <TabsContent key={discipline} value={discipline} className="space-y-4 mt-4">
              <Tabs defaultValue="traceable" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
                  <TabsTrigger value="traceable">Traceable Catalogue</TabsTrigger>
                  <TabsTrigger value="standard">Standard Catalogue</TabsTrigger>
                </TabsList>

                <TabsContent value="traceable" className="space-y-4">
                  <Tabs defaultValue="parent">
                    <TabsList className="mb-4 flex flex-wrap h-auto gap-1 sm:grid sm:grid-cols-2">
                      <TabsTrigger value="parent" className="flex-1 min-w-[10rem]">
                        Engineering BOM
                      </TabsTrigger>
                      <TabsTrigger value="child" className="flex-1 min-w-[10rem]">
                        Manufacturing BIM
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="parent">
                      {traceableParent ? (
                        renderExample(traceableParent, `${discipline}-traceable-parent`)
                      ) : (
                        <p className="text-sm text-muted-foreground">No parent line example.</p>
                      )}
                    </TabsContent>
                    <TabsContent value="child">
                      {traceableChild ? (
                        renderExample(traceableChild, `${discipline}-traceable-child`)
                      ) : (
                        <p className="text-sm text-muted-foreground">No child line example.</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="standard">
                  {standard ? (
                    renderExample(standard, `${discipline}-standard`)
                  ) : (
                    <p className="text-sm text-muted-foreground">No package article example.</p>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
