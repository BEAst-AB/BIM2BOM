import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { PeppolExample } from '@/types/bip-peppol';

interface ExampleMessagesViewProps {
  examples: PeppolExample[];
}

export function ExampleMessagesView({ examples }: ExampleMessagesViewProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  // Group examples by discipline
  const examplesByDiscipline = examples.reduce((acc, example) => {
    if (!acc[example.discipline]) {
      acc[example.discipline] = [];
    }
    acc[example.discipline].push(example);
    return acc;
  }, {} as Record<string, PeppolExample[]>);

  const disciplines = Object.keys(examplesByDiscipline);

  const generateXML = (example: PeppolExample): string => {
    let xml = `<cac:CatalogueLine>\n`;
    xml += `  <cbc:ID>${example.id}</cbc:ID>\n`;
    xml += `  \n  <cac:Item>\n`;
    xml += `    \n    <cac:BuyersItemIdentification>\n`;
    xml += `      <cbc:ID>${example.ifcGuid}</cbc:ID>\n`;
    xml += `    </cac:BuyersItemIdentification>\n`;
    xml += `    \n    <cbc:Name>${example.itemName}</cbc:Name>\n`;
    xml += `    <cbc:Description>${example.description}</cbc:Description>\n`;
    xml += `    <cbc:BrandName>${example.brandName}</cbc:BrandName>\n`;
    
    if (example.typeId) {
      xml += `    \n    <cac:ManufacturersItemIdentification>\n`;
      xml += `      <cbc:ID>${example.typeId}</cbc:ID>\n`;
      xml += `    </cac:ManufacturersItemIdentification>\n`;
    }
    
    if (example.manufacturerName) {
      xml += `    \n    <cac:ManufacturerParty>\n`;
      xml += `      <cac:PartyName>\n`;
      xml += `        <cbc:Name>${example.manufacturerName}</cbc:Name>\n`;
      xml += `      </cac:PartyName>\n`;
      xml += `    </cac:ManufacturerParty>\n`;
    }
    
    if (example.lotNumberId) {
      xml += `    \n    <cac:ItemInstance>\n`;
      xml += `      <cac:LotIdentification>\n`;
      xml += `        <cbc:LotNumberID>${example.lotNumberId}</cbc:LotNumberID>\n`;
      xml += `      </cac:LotIdentification>\n`;
      xml += `    </cac:ItemInstance>\n`;
    }
    
    example.properties.forEach((prop, i) => {
      xml += `    \n    <cac:AdditionalItemProperty>\n`;
      xml += `      <cbc:Name>${prop.name}</cbc:Name>\n`;
      if (prop.listID) {
        xml += `      <cbc:NameCode listID="${prop.listID}">${prop.nameCode}</cbc:NameCode>\n`;
      }
      xml += `      <cbc:Value>${prop.value}</cbc:Value>\n`;
      if (prop.valueQuantity) {
        xml += `      <cbc:ValueQuantity unitCode="${prop.unitCode}">${prop.valueQuantity}</cbc:ValueQuantity>\n`;
      }
      xml += `    </cac:AdditionalItemProperty>\n`;
    });
    
    example.documentReferences.forEach((doc) => {
      xml += `    \n    <cac:ItemSpecificationDocumentReference>\n`;
      xml += `      <cbc:ID>${doc.id}</cbc:ID>\n`;
      if (doc.documentDescription) {
        xml += `      <cbc:DocumentDescription>${doc.documentDescription}</cbc:DocumentDescription>\n`;
      }
      xml += `      <cac:Attachment>\n`;
      xml += `        <cac:ExternalReference>\n`;
      xml += `          <cbc:URI>${doc.uri}</cbc:URI>\n`;
      xml += `        </cac:ExternalReference>\n`;
      xml += `      </cac:Attachment>\n`;
      xml += `    </cac:ItemSpecificationDocumentReference>\n`;
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
    
    // Pre-calculate which lines belong to which AdditionalItemProperty
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

    lines.forEach((line, index) => {
      let shouldHighlight = false;
      let highlightColor = '';
      let highlightAttributeOnly = false;
      let attributeName = '';
      
      // Check if this line contains the hovered element
      if (hoveredId === 'catalogue-line-id' && line.includes('<cbc:ID>') && index === 1) {
        shouldHighlight = true;
        highlightColor = 'bg-indigo-200 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200';
      } else if (hoveredId === 'item-name' && line.includes('<cbc:Name>')) {
        // Only highlight the item name (not property names or party names)
        // Check if we're NOT inside an AdditionalItemProperty block
        const beforeLines = lines.slice(0, index);
        let propertyBlockCount = 0;
        for (const l of beforeLines) {
          if (l.includes('<cac:AdditionalItemProperty>')) propertyBlockCount++;
          if (l.includes('</cac:AdditionalItemProperty>')) propertyBlockCount--;
        }
        const inPropertyBlock = propertyBlockCount > 0;
        const inPartyBlock = line.includes('PartyName');
        
        if (!inPropertyBlock && !inPartyBlock) {
          shouldHighlight = true;
          highlightColor = 'bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200';
        }
      } else if (hoveredId === 'item-description' && line.includes('<cbc:Description>')) {
        shouldHighlight = true;
        highlightColor = 'bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200';
      } else if (hoveredId === 'item-brand' && line.includes('<cbc:BrandName>')) {
        shouldHighlight = true;
        highlightColor = 'bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200';
      } else if (hoveredId === 'buyers-item-id') {
        if (line.includes('BuyersItemIdentification') || 
            (index > 0 && lines.slice(0, index + 1).some(l => l.includes('<cac:BuyersItemIdentification>')) && 
             !lines.slice(0, index).some(l => l.includes('</cac:BuyersItemIdentification>')))) {
          shouldHighlight = true;
          highlightColor = 'bg-cyan-200 dark:bg-cyan-900/50 text-cyan-900 dark:text-cyan-200';
        }
      } else if (hoveredId === 'manufacturer-id') {
        if (line.includes('ManufacturersItemIdentification') || 
            (index > 0 && lines.slice(0, index + 1).some(l => l.includes('<cac:ManufacturersItemIdentification>')) && 
             !lines.slice(0, index).some(l => l.includes('</cac:ManufacturersItemIdentification>')))) {
          shouldHighlight = true;
          highlightColor = 'bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-200';
        }
      } else if (hoveredId === 'manufacturer-name') {
        if (line.includes('ManufacturerParty') || line.includes('PartyName') ||
            (index > 0 && lines.slice(0, index + 1).some(l => l.includes('<cac:ManufacturerParty>')) && 
             !lines.slice(0, index).some(l => l.includes('</cac:ManufacturerParty>')))) {
          shouldHighlight = true;
          highlightColor = 'bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-200';
        }
      } else if (hoveredId === 'lot-number-id') {
        if (line.includes('ItemInstance') || line.includes('LotIdentification') || line.includes('LotNumberID') ||
            (index > 0 && lines.slice(0, index + 1).some(l => l.includes('<cac:ItemInstance>')) && 
             !lines.slice(0, index).some(l => l.includes('</cac:ItemInstance>')))) {
          shouldHighlight = true;
          highlightColor = 'bg-purple-200 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200';
        }
      } else if (hoveredId.startsWith('document-ref-')) {
        const docIndex = parseInt(hoveredId.split('-')[2]);
        // Find document reference blocks in XML
        const docRefStarts = lines
          .map((l, i) => ({ line: l, index: i }))
          .filter(({ line }) => line.includes('<cac:ItemSpecificationDocumentReference>'));
        
        if (docRefStarts[docIndex]) {
          const startIndex = docRefStarts[docIndex].index;
          // Find the end of this document reference
          let endIndex = startIndex;
          for (let i = startIndex + 1; i < lines.length; i++) {
            if (lines[i].includes('</cac:ItemSpecificationDocumentReference>')) {
              endIndex = i;
              break;
            }
          }
          
          if (index >= startIndex && index <= endIndex) {
            shouldHighlight = true;
            highlightColor = 'bg-violet-200 dark:bg-violet-900/50 text-violet-900 dark:text-violet-200';
          }
        }
      } else if (hoveredId.startsWith('property-')) {
        const parts = hoveredId.split('-');
        const propIndex = parseInt(parts[1]);
        const range = propertyRanges[propIndex];
        
        if (range && index >= range.start && index <= range.end) {
          // Check for specific field within the property
          if (parts.length === 3) {
            const field = parts[2]; // name, namecode, listid, value, valuequantity, unitcode
            
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
            // Whole property highlight
            shouldHighlight = true;
            highlightColor = 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200';
          }
        }
      }

      result.push(
        <div key={index} className={`${shouldHighlight && !highlightAttributeOnly ? `${highlightColor} font-semibold` : ''}`}>
          {highlightAttributeOnly ? highlightAttribute(line, attributeName, highlightColor) : line}
        </div>
      );
    });

    return <pre className="text-xs font-mono whitespace-pre-wrap">{result}</pre>;
  };

  const renderExample = (example: PeppolExample, exampleId: string) => (
    <div key={exampleId} className="mb-6">
      <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl">{example.itemName}</CardTitle>
          <CardDescription className="mt-2">{example.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Rendered Data */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg border-b pb-2 sticky top-0 bg-background z-10">Rendered Data</h3>
              
              {/* Section: Catalogue Line ID */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/20 rounded-lg border-l-4 border-slate-500">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-400 uppercase tracking-wide">
                  Catalogue Line Identifier
                </h4>
                
                <div 
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('catalogue-line-id')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-medium text-muted-foreground">cbc:ID (CatalogueLine)</p>
                    <div className="relative group">
                      <Badge className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-help transition-colors text-xs">
                        Running Number
                      </Badge>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-200 dark:border-gray-700 shadow-lg">
                        <p className="font-semibold">Catalogue Line Running Number</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <p className="font-mono text-sm">{example.id}</p>
                </div>
              </div>

              {/* Section: IFC Object Identifier */}
              <div className="space-y-3 p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border-l-4 border-cyan-500">
                <h4 className="font-semibold text-sm text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">
                  IFC Object Identifier
                </h4>
                
                <div 
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('buyers-item-id')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      cac:Item → cac:BuyersItemIdentification → cbc:ID
                    </p>
                    <div className="relative group">
                      <Badge className="bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 hover:bg-cyan-200 dark:hover:bg-cyan-800 cursor-help transition-colors text-xs">
                        IFC Object GUID
                      </Badge>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-200 dark:border-gray-700 shadow-lg">
                        <p className="font-semibold">IFC Object's Unique GUID</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <p className="font-mono text-sm">{example.ifcGuid}</p>
                </div>
              </div>

              {/* Section: Basic Item Information */}
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                  Basic Information
                </h4>
                
                <div 
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('item-name')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-medium text-muted-foreground">cbc:Name</p>
                    <div className="relative group">
                      <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-help transition-colors text-xs">
                        IFC Object Name
                      </Badge>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-200 dark:border-gray-700 shadow-lg">
                        <p className="font-semibold">IFC Object's Name</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <p className="font-semibold">{example.itemName}</p>
                </div>

                <div 
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('item-description')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-medium text-muted-foreground">cbc:Description</p>
                    <div className="relative group">
                      <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-help transition-colors text-xs">
                        BIP.TypeDescription
                      </Badge>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-200 dark:border-gray-700 shadow-lg">
                        <div className="space-y-1">
                          <div><span className="font-semibold">IFC Property set:</span> <span className="font-mono">BIP</span></div>
                          <div><span className="font-semibold">IFC Property name:</span> <span className="font-mono">TypeDescription</span></div>
                          <div><span className="font-semibold">IFC Property value:</span> <span className="font-mono">{example.description}</span></div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm">{example.description}</p>
                </div>

                <div 
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement('item-brand')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-medium text-muted-foreground">cbc:BrandName</p>
                    <div className="relative group">
                      <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-help transition-colors text-xs">
                        BIP.Manufacturer
                      </Badge>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-200 dark:border-gray-700 shadow-lg">
                        <div className="space-y-1">
                          <div><span className="font-semibold">IFC Property set:</span> <span className="font-mono">BIP</span></div>
                          <div><span className="font-semibold">IFC Property name:</span> <span className="font-mono">Manufacturer</span></div>
                          <div><span className="font-semibold">IFC Property value:</span> <span className="font-mono">{example.brandName}</span></div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <p className="font-medium">{example.brandName}</p>
                </div>
              </div>

              {/* Section: Manufacturer Information */}
              {(example.typeId || example.manufacturerName) && (
                <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-semibold text-sm text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                    Manufacturer party
                  </h4>
                  
                  {example.typeId && (
                    <div 
                      className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredElement('manufacturer-id')}
                      onMouseLeave={() => setHoveredElement(null)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          cac:Item → cac:ManufacturersItemIdentification → cbc:ID (TypeID)
                        </p>
                        <div className="relative group">
                          <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-800 cursor-help transition-colors text-xs">
                            BIP.TypeID
                          </Badge>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-200 dark:border-gray-700 shadow-lg">
                            <div className="space-y-1">
                              <div><span className="font-semibold">IFC Property set:</span> <span className="font-mono">BIP</span></div>
                              <div><span className="font-semibold">IFC Property name:</span> <span className="font-mono">TypeID</span></div>
                              <div><span className="font-semibold">IFC Property value:</span> <span className="font-mono">{example.typeId}</span></div>
                              <div className="text-xs text-muted-foreground mt-1">System-specific identifier of the component type</div>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                      <p className="font-mono text-sm">{example.typeId}</p>
                    </div>
                  )}

                  {example.manufacturerName && (
                    <div 
                      className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredElement('manufacturer-name')}
                      onMouseLeave={() => setHoveredElement(null)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          cac:ManufacturerParty → cac:PartyName → cbc:Name
                        </p>
                        <div className="relative group">
                          <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-800 cursor-help transition-colors text-xs">
                            BIP.Manufacturer
                          </Badge>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-200 dark:border-gray-700 shadow-lg">
                            <div className="space-y-1">
                              <div><span className="font-semibold">IFC Property set:</span> <span className="font-mono">BIP</span></div>
                              <div><span className="font-semibold">IFC Property name:</span> <span className="font-mono">Manufacturer</span></div>
                              <div><span className="font-semibold">IFC Property value:</span> <span className="font-mono">{example.manufacturerName}</span></div>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                      <p className="font-medium">{example.manufacturerName}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Section: Lot Identification */}
              {example.lotNumberId && (
                <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-sm text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                    Lot Identification
                  </h4>
                  
                  <div 
                    className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredElement('lot-number-id')}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        cac:ItemInstance → cac:LotIdentification → cbc:LotNumberID
                      </p>
                      <div className="relative group">
                        <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 cursor-help transition-colors text-xs">
                          BIP.LotNumberID
                        </Badge>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-200 dark:border-gray-700 shadow-lg">
                          <div className="space-y-1">
                            <div><span className="font-semibold">IFC Property set:</span> <span className="font-mono">BIP</span></div>
                            <div><span className="font-semibold">IFC Property name:</span> <span className="font-mono">LotNumberID</span></div>
                            <div><span className="font-semibold">IFC Property value:</span> <span className="font-mono">{example.lotNumberId}</span></div>
                            <div><span className="font-semibold">IFC Property dataType:</span> <span className="font-mono">IfcLabel</span></div>
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <p className="font-mono text-sm">{example.lotNumberId}</p>
                  </div>
                </div>
              )}

              {/* Section: Additional Item Properties */}
              <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 uppercase tracking-wide">
                  Properties (cac:AdditionalItemProperty)
                </h4>
                <p className="text-xs text-muted-foreground">All properties available in the property set called BIP</p>
                
                {example.properties.map((prop, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-background border-2 border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredElement(`property-${i}`)}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <div 
                      className="flex items-center justify-between mb-3"
                    >
                      <div className="font-semibold text-sm text-green-700 dark:text-green-400">
                        Property {i + 1} of {example.properties.length}
                      </div>
                      <div className="relative group">
                        <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-800 cursor-help transition-colors">
                          BIP.{prop.name}
                        </Badge>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-200 dark:border-gray-700 shadow-lg">
                          <div className="space-y-1">
                            <div><span className="font-semibold">IFC Property set:</span> <span className="font-mono">BIP</span></div>
                            <div><span className="font-semibold">IFC Property name:</span> <span className="font-mono">{prop.name}</span></div>
                            <div><span className="font-semibold">IFC Property value:</span> <span className="font-mono">{prop.value || prop.valueQuantity || 'N/A'}</span></div>
                            {prop.dataType && <div><span className="font-semibold">IFC Property dataType:</span> <span className="font-mono">{prop.dataType}</span></div>}
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-gray-900"></div>
                        </div>
                      </div>
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
                      {prop.listID && (
                        <>
                          <div 
                            className="flex justify-between items-start gap-2 border-b border-border/50 pb-2 cursor-pointer hover:bg-background/50 px-2 py-1 rounded"
                            onMouseEnter={() => setHoveredElement(`property-${i}-namecode`)}
                            onMouseLeave={() => setHoveredElement(null)}
                          >
                            <span className="text-muted-foreground font-mono text-xs">cbc:NameCode</span>
                            <span className="font-mono text-xs text-right">{prop.nameCode}</span>
                          </div>
                          <div 
                            className="flex justify-between items-start gap-2 border-b border-border/50 pb-2 cursor-pointer hover:bg-background/50 px-2 py-1 rounded"
                            onMouseEnter={() => setHoveredElement(`property-${i}-listid`)}
                            onMouseLeave={() => setHoveredElement(null)}
                          >
                            <span className="text-muted-foreground font-mono text-xs">└─ @listID</span>
                            <Badge variant="outline" className="font-mono text-xs">{prop.listID}</Badge>
                          </div>
                        </>
                      )}
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
                          <span className="text-muted-foreground font-mono text-xs">└─ @unitCode</span>
                          <Badge variant="secondary" className="font-mono text-xs">{prop.unitCode}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Section: Document References */}
              {example.documentReferences && example.documentReferences.length > 0 && (
                <div className="space-y-3 p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg border-l-4 border-violet-500">
                  <h4 className="font-semibold text-sm text-violet-700 dark:text-violet-400 uppercase tracking-wide">
                    Document References
                  </h4>
                  <p className="text-xs text-muted-foreground">External references to documents related to this item</p>
                  
                  {example.documentReferences.map((doc, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-background border-2 border-violet-300 dark:border-violet-700 hover:border-violet-500 dark:hover:border-violet-500 transition-all cursor-pointer"
                      onMouseEnter={() => setHoveredElement(`document-ref-${i}`)}
                      onMouseLeave={() => setHoveredElement(null)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-sm text-violet-700 dark:text-violet-400">
                            Document {i + 1} of {example.documentReferences.length}
                          </div>
                        </div>
                        
                        <div 
                          className="p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <span className="text-muted-foreground font-mono text-xs">cbc:ID</span>
                          <p className="font-mono text-sm mt-1">{doc.id}</p>
                        </div>

                        {doc.documentDescription && (
                          <div 
                            className="p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <span className="text-muted-foreground font-mono text-xs">cbc:DocumentDescription</span>
                            <p className="text-sm mt-1">{doc.documentDescription}</p>
                          </div>
                        )}

                        <div 
                          className="p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <span className="text-muted-foreground font-mono text-xs">cac:ExternalReference → cbc:URI</span>
                          <p className="font-mono text-xs mt-1 break-all text-violet-600 dark:text-violet-400">{doc.uri}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - XML (Sticky) */}
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

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Peppol Examples per Discipline</h2>
        <p className="text-muted-foreground">
          Interactive view showing data and XML side by side
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

        {disciplines.map((discipline) => (
          <TabsContent key={discipline} value={discipline} className="space-y-4">
            {examplesByDiscipline[discipline].map((example, index) =>
              renderExample(example, `${discipline}-${index}`)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
