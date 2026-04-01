import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileX, FileCheck, AlertCircle, X, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ParsedCatalogueLine {
  id: string;
  buyersItemId?: string;
  itemName?: string;
  description?: string;
  brandName?: string;
  typeId?: string;
  manufacturerName?: string;
  lotNumberId?: string;
  properties: ParsedProperty[];
  documentReferences: ParsedDocumentReference[];
}

interface ParsedProperty {
  name: string;
  nameCode?: string;
  listID?: string;
  value?: string;
  valueQuantity?: string;
  unitCode?: string;
}

interface ParsedDocumentReference {
  id: string;
  documentDescription?: string;
  uri?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  content: string;
  parsedLines: ParsedCatalogueLine[];
  error: string | null;
}

export function CatalogueTester() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const selectedFile = useMemo(() => {
    return files.find(f => f.id === selectedFileId) || null;
  }, [files, selectedFileId]);

  const parseXmlCatalogue = useCallback((xmlString: string): ParsedCatalogueLine[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid XML format: ' + parseError.textContent);
    }

    const catalogueLines: ParsedCatalogueLine[] = [];
    
    // Find all CatalogueLine elements (handle different namespace prefixes)
    const lineElements = xmlDoc.querySelectorAll('CatalogueLine');
    
    lineElements.forEach((lineEl, index) => {
      const getTextContent = (parent: Element, selector: string): string | undefined => {
        // Try direct children first with various namespace prefixes
        const el = parent.querySelector(selector) || 
                   parent.querySelector(`cbc\\:${selector}`) ||
                   parent.querySelector(`cac\\:${selector}`);
        return el?.textContent?.trim() || undefined;
      };

      const findElement = (parent: Element, ...selectors: string[]): Element | null => {
        for (const selector of selectors) {
          const el = parent.querySelector(selector) ||
                     parent.querySelector(`cbc\\:${selector}`) ||
                     parent.querySelector(`cac\\:${selector}`);
          if (el) return el;
        }
        return null;
      };

      // Get line ID
      const lineId = getTextContent(lineEl, 'ID') || `${index + 1}`;
      
      // Find Item element
      const itemEl = findElement(lineEl, 'Item');
      if (!itemEl) return;

      // Get BuyersItemIdentification > ID
      const buyersItemIdEl = findElement(itemEl, 'BuyersItemIdentification');
      const buyersItemId = buyersItemIdEl ? getTextContent(buyersItemIdEl, 'ID') : undefined;

      // Get basic item info
      const itemName = getTextContent(itemEl, 'Name');
      const description = getTextContent(itemEl, 'Description');
      const brandName = getTextContent(itemEl, 'BrandName');

      // Get ManufacturersItemIdentification > ID (TypeID)
      const mfgItemIdEl = findElement(itemEl, 'ManufacturersItemIdentification');
      const typeId = mfgItemIdEl ? getTextContent(mfgItemIdEl, 'ID') : undefined;

      // Get ManufacturerParty > PartyName > Name
      const mfgPartyEl = findElement(itemEl, 'ManufacturerParty');
      let manufacturerName: string | undefined;
      if (mfgPartyEl) {
        const partyNameEl = findElement(mfgPartyEl, 'PartyName');
        if (partyNameEl) {
          manufacturerName = getTextContent(partyNameEl, 'Name');
        }
      }

      // Get ItemInstance > LotIdentification > LotNumberID
      const itemInstanceEl = findElement(itemEl, 'ItemInstance');
      let lotNumberId: string | undefined;
      if (itemInstanceEl) {
        const lotIdEl = findElement(itemInstanceEl, 'LotIdentification');
        if (lotIdEl) {
          lotNumberId = getTextContent(lotIdEl, 'LotNumberID');
        }
      }

      // Parse AdditionalItemProperty elements
      const properties: ParsedProperty[] = [];
      const propElements = itemEl.querySelectorAll('AdditionalItemProperty');
      propElements.forEach((propEl) => {
        const name = getTextContent(propEl, 'Name') || '';
        const nameCodeEl = findElement(propEl, 'NameCode');
        const nameCode = nameCodeEl?.textContent?.trim();
        const listID = nameCodeEl?.getAttribute('listID') || undefined;
        const value = getTextContent(propEl, 'Value');
        const valueQuantityEl = findElement(propEl, 'ValueQuantity');
        const valueQuantity = valueQuantityEl?.textContent?.trim();
        const unitCode = valueQuantityEl?.getAttribute('unitCode') || undefined;

        properties.push({
          name,
          nameCode,
          listID,
          value,
          valueQuantity,
          unitCode,
        });
      });

      // Parse ItemSpecificationDocumentReference elements
      const documentReferences: ParsedDocumentReference[] = [];
      const docRefElements = itemEl.querySelectorAll('ItemSpecificationDocumentReference');
      docRefElements.forEach((docEl) => {
        const id = getTextContent(docEl, 'ID') || '';
        const documentDescription = getTextContent(docEl, 'DocumentDescription');
        const attachmentEl = findElement(docEl, 'Attachment');
        let uri: string | undefined;
        if (attachmentEl) {
          const extRefEl = findElement(attachmentEl, 'ExternalReference');
          if (extRefEl) {
            uri = getTextContent(extRefEl, 'URI');
          }
        }

        documentReferences.push({ id, documentDescription, uri });
      });

      catalogueLines.push({
        id: lineId,
        buyersItemId,
        itemName,
        description,
        brandName,
        typeId,
        manufacturerName,
        lotNumberId,
        properties,
        documentReferences,
      });
    });

    return catalogueLines;
  }, []);

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    
    const currentFileCount = files.length;
    let isFirstNewFile = true;
    
    Array.from(fileList).forEach((file) => {
      // Skip non-XML files
      if (!file.name.endsWith('.xml') && file.type !== 'text/xml' && file.type !== 'application/xml') {
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          const parsed = parseXmlCatalogue(content);
          const newFile: UploadedFile = {
            id: newFileId,
            name: file.name,
            content,
            parsedLines: parsed,
            error: parsed.length === 0 ? 'No CatalogueLine elements found' : null
          };
          
          setFiles(prev => [...prev, newFile]);
          
          // Auto-select first file if none selected
          if (currentFileCount === 0 && isFirstNewFile) {
            setSelectedFileId(newFileId);
            isFirstNewFile = false;
          }
        } catch (err) {
          const newFile: UploadedFile = {
            id: newFileId,
            name: file.name,
            content,
            parsedLines: [],
            error: err instanceof Error ? err.message : 'Failed to parse XML'
          };
          
          setFiles(prev => [...prev, newFile]);
          
          if (currentFileCount === 0 && isFirstNewFile) {
            setSelectedFileId(newFileId);
            isFirstNewFile = false;
          }
        }
      };
      reader.readAsText(file);
    });
  }, [files.length, parseXmlCatalogue]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    // Reset input so same file can be re-uploaded
    event.target.value = '';
  }, [processFiles]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    processFiles(event.dataTransfer.files);
  }, [processFiles]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(files.length > 1 ? files.find(f => f.id !== fileId)?.id || null : null);
    }
  }, [selectedFileId, files]);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setSelectedFileId(null);
    setHoveredElement(null);
  }, []);

  const selectFile = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
    setHoveredElement(null);
  }, []);

  const renderXmlWithHighlight = (lineIndex: number): React.ReactNode => {
    if (!selectedFile) return null;
    const line = selectedFile.parsedLines[lineIndex];
    if (!line) return null;

    // Reconstruct the XML for this catalogue line for display
    let xml = `<cac:CatalogueLine>\n`;
    xml += `  <cbc:ID>${line.id}</cbc:ID>\n`;
    xml += `  \n  <cac:Item>\n`;
    
    if (line.buyersItemId) {
      xml += `    \n    <cac:BuyersItemIdentification>\n`;
      xml += `      <cbc:ID>${line.buyersItemId}</cbc:ID>\n`;
      xml += `    </cac:BuyersItemIdentification>\n`;
    }
    
    if (line.itemName) {
      xml += `    \n    <cbc:Name>${line.itemName}</cbc:Name>\n`;
    }
    if (line.description) {
      xml += `    <cbc:Description>${line.description}</cbc:Description>\n`;
    }
    if (line.brandName) {
      xml += `    <cbc:BrandName>${line.brandName}</cbc:BrandName>\n`;
    }
    
    if (line.typeId) {
      xml += `    \n    <cac:ManufacturersItemIdentification>\n`;
      xml += `      <cbc:ID>${line.typeId}</cbc:ID>\n`;
      xml += `    </cac:ManufacturersItemIdentification>\n`;
    }
    
    if (line.manufacturerName) {
      xml += `    \n    <cac:ManufacturerParty>\n`;
      xml += `      <cac:PartyName>\n`;
      xml += `        <cbc:Name>${line.manufacturerName}</cbc:Name>\n`;
      xml += `      </cac:PartyName>\n`;
      xml += `    </cac:ManufacturerParty>\n`;
    }
    
    if (line.lotNumberId) {
      xml += `    \n    <cac:ItemInstance>\n`;
      xml += `      <cac:LotIdentification>\n`;
      xml += `        <cbc:LotNumberID>${line.lotNumberId}</cbc:LotNumberID>\n`;
      xml += `      </cac:LotIdentification>\n`;
      xml += `    </cac:ItemInstance>\n`;
    }
    
    line.properties.forEach((prop) => {
      xml += `    \n    <cac:AdditionalItemProperty>\n`;
      xml += `      <cbc:Name>${prop.name}</cbc:Name>\n`;
      if (prop.listID && prop.nameCode) {
        xml += `      <cbc:NameCode listID="${prop.listID}">${prop.nameCode}</cbc:NameCode>\n`;
      }
      if (prop.value) {
        xml += `      <cbc:Value>${prop.value}</cbc:Value>\n`;
      }
      if (prop.valueQuantity) {
        xml += `      <cbc:ValueQuantity unitCode="${prop.unitCode || ''}">${prop.valueQuantity}</cbc:ValueQuantity>\n`;
      }
      xml += `    </cac:AdditionalItemProperty>\n`;
    });
    
    line.documentReferences.forEach((doc) => {
      xml += `    \n    <cac:ItemSpecificationDocumentReference>\n`;
      xml += `      <cbc:ID>${doc.id}</cbc:ID>\n`;
      if (doc.documentDescription) {
        xml += `      <cbc:DocumentDescription>${doc.documentDescription}</cbc:DocumentDescription>\n`;
      }
      if (doc.uri) {
        xml += `      <cac:Attachment>\n`;
        xml += `        <cac:ExternalReference>\n`;
        xml += `          <cbc:URI>${doc.uri}</cbc:URI>\n`;
        xml += `        </cac:ExternalReference>\n`;
        xml += `      </cac:Attachment>\n`;
      }
      xml += `    </cac:ItemSpecificationDocumentReference>\n`;
    });
    
    xml += `  </cac:Item>\n`;
    xml += `</cac:CatalogueLine>`;

    // Apply highlighting similar to ExampleMessagesView
    const prefix = `line-${lineIndex}-`;
    const currentHover = hoveredElement?.startsWith(prefix) ? hoveredElement.slice(prefix.length) : null;

    if (!currentHover) {
      return <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{xml}</pre>;
    }

    const lines = xml.split('\n');
    const result: React.ReactNode[] = [];

    // Pre-calculate property ranges
    const propertyRanges: Array<{ start: number; end: number }> = [];
    let currentPropertyStart = -1;
    
    lines.forEach((l, index) => {
      if (l.includes('<cac:AdditionalItemProperty>')) {
        currentPropertyStart = index;
      } else if (l.includes('</cac:AdditionalItemProperty>') && currentPropertyStart !== -1) {
        propertyRanges.push({ start: currentPropertyStart, end: index });
        currentPropertyStart = -1;
      }
    });

    lines.forEach((l, index) => {
      let shouldHighlight = false;
      let highlightColor = '';
      
      if (currentHover === 'catalogue-line-id' && l.includes('<cbc:ID>') && index === 1) {
        shouldHighlight = true;
        highlightColor = 'bg-indigo-200 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200';
      } else if (currentHover === 'item-name' && l.includes('<cbc:Name>')) {
        const beforeLines = lines.slice(0, index);
        let propertyBlockCount = 0;
        for (const bl of beforeLines) {
          if (bl.includes('<cac:AdditionalItemProperty>')) propertyBlockCount++;
          if (bl.includes('</cac:AdditionalItemProperty>')) propertyBlockCount--;
        }
        const inPropertyBlock = propertyBlockCount > 0;
        const inPartyBlock = l.includes('PartyName');
        
        if (!inPropertyBlock && !inPartyBlock) {
          shouldHighlight = true;
          highlightColor = 'bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200';
        }
      } else if (currentHover === 'item-description' && l.includes('<cbc:Description>')) {
        shouldHighlight = true;
        highlightColor = 'bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200';
      } else if (currentHover === 'item-brand' && l.includes('<cbc:BrandName>')) {
        shouldHighlight = true;
        highlightColor = 'bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200';
      } else if (currentHover === 'buyers-item-id') {
        if (l.includes('BuyersItemIdentification') || 
            (index > 0 && lines.slice(0, index + 1).some(x => x.includes('<cac:BuyersItemIdentification>')) && 
             !lines.slice(0, index).some(x => x.includes('</cac:BuyersItemIdentification>')))) {
          shouldHighlight = true;
          highlightColor = 'bg-cyan-200 dark:bg-cyan-900/50 text-cyan-900 dark:text-cyan-200';
        }
      } else if (currentHover === 'manufacturer-id') {
        if (l.includes('ManufacturersItemIdentification') || 
            (index > 0 && lines.slice(0, index + 1).some(x => x.includes('<cac:ManufacturersItemIdentification>')) && 
             !lines.slice(0, index).some(x => x.includes('</cac:ManufacturersItemIdentification>')))) {
          shouldHighlight = true;
          highlightColor = 'bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-200';
        }
      } else if (currentHover === 'manufacturer-name') {
        if (l.includes('ManufacturerParty') || l.includes('PartyName') ||
            (index > 0 && lines.slice(0, index + 1).some(x => x.includes('<cac:ManufacturerParty>')) && 
             !lines.slice(0, index).some(x => x.includes('</cac:ManufacturerParty>')))) {
          shouldHighlight = true;
          highlightColor = 'bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-200';
        }
      } else if (currentHover === 'lot-number-id') {
        if (l.includes('ItemInstance') || l.includes('LotIdentification') || l.includes('LotNumberID') ||
            (index > 0 && lines.slice(0, index + 1).some(x => x.includes('<cac:ItemInstance>')) && 
             !lines.slice(0, index).some(x => x.includes('</cac:ItemInstance>')))) {
          shouldHighlight = true;
          highlightColor = 'bg-purple-200 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200';
        }
      } else if (currentHover.startsWith('property-')) {
        const propIndex = parseInt(currentHover.split('-')[1]);
        const range = propertyRanges[propIndex];
        if (range && index >= range.start && index <= range.end) {
          shouldHighlight = true;
          highlightColor = 'bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200';
        }
      } else if (currentHover.startsWith('document-ref-')) {
        const docIndex = parseInt(currentHover.split('-')[2]);
        const docRefStarts = lines
          .map((x, i) => ({ line: x, index: i }))
          .filter(({ line: x }) => x.includes('<cac:ItemSpecificationDocumentReference>'));
        
        if (docRefStarts[docIndex]) {
          const startIndex = docRefStarts[docIndex].index;
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
      }

      result.push(
        <div key={index} className={`${shouldHighlight ? `${highlightColor} font-semibold` : ''}`}>
          {l}
        </div>
      );
    });

    return <pre className="text-xs font-mono whitespace-pre-wrap">{result}</pre>;
  };

  const renderCatalogueLine = (line: ParsedCatalogueLine, lineIndex: number) => {
    const prefix = `line-${lineIndex}-`;
    
    return (
      <Card key={lineIndex} className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl">{line.itemName || `Catalogue Line ${line.id}`}</CardTitle>
          {line.description && <CardDescription className="mt-2">{line.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Rendered Data */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg border-b pb-2 sticky top-0 bg-background z-10">Parsed Data</h3>
              
              {/* Catalogue Line ID */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950/20 rounded-lg border-l-4 border-slate-500">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-400 uppercase tracking-wide">
                  Catalogue Line Identifier
                </h4>
                <div 
                  className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredElement(`${prefix}catalogue-line-id`)}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-2">cbc:ID (CatalogueLine)</p>
                  <p className="font-mono text-sm">{line.id}</p>
                </div>
              </div>

              {/* IFC Object Identifier */}
              {line.buyersItemId && (
                <div className="space-y-3 p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border-l-4 border-cyan-500">
                  <h4 className="font-semibold text-sm text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">
                    IFC Object Identifier
                  </h4>
                  <div 
                    className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredElement(`${prefix}buyers-item-id`)}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      cac:Item → cac:BuyersItemIdentification → cbc:ID
                    </p>
                    <p className="font-mono text-sm">{line.buyersItemId}</p>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              {(line.itemName || line.description || line.brandName) && (
                <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                    Basic Information
                  </h4>
                  
                  {line.itemName && (
                    <div 
                      className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredElement(`${prefix}item-name`)}
                      onMouseLeave={() => setHoveredElement(null)}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">cbc:Name</p>
                      <p className="font-semibold">{line.itemName}</p>
                    </div>
                  )}

                  {line.description && (
                    <div 
                      className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredElement(`${prefix}item-description`)}
                      onMouseLeave={() => setHoveredElement(null)}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">cbc:Description</p>
                      <p className="text-sm">{line.description}</p>
                    </div>
                  )}

                  {line.brandName && (
                    <div 
                      className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredElement(`${prefix}item-brand`)}
                      onMouseLeave={() => setHoveredElement(null)}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">cbc:BrandName</p>
                      <p className="font-medium">{line.brandName}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manufacturer Information */}
              {(line.typeId || line.manufacturerName) && (
                <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-semibold text-sm text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                    Manufacturer Party
                  </h4>
                  
                  {line.typeId && (
                    <div 
                      className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredElement(`${prefix}manufacturer-id`)}
                      onMouseLeave={() => setHoveredElement(null)}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        cac:ManufacturersItemIdentification → cbc:ID
                      </p>
                      <p className="font-mono text-sm">{line.typeId}</p>
                    </div>
                  )}

                  {line.manufacturerName && (
                    <div 
                      className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredElement(`${prefix}manufacturer-name`)}
                      onMouseLeave={() => setHoveredElement(null)}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        cac:ManufacturerParty → cac:PartyName → cbc:Name
                      </p>
                      <p className="font-medium">{line.manufacturerName}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Lot Identification */}
              {line.lotNumberId && (
                <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-sm text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                    Lot Identification
                  </h4>
                  <div 
                    className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredElement(`${prefix}lot-number-id`)}
                    onMouseLeave={() => setHoveredElement(null)}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      cac:ItemInstance → cac:LotIdentification → cbc:LotNumberID
                    </p>
                    <p className="font-mono text-sm">{line.lotNumberId}</p>
                  </div>
                </div>
              )}

              {/* Properties */}
              {line.properties.length > 0 && (
                <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 uppercase tracking-wide">
                    Properties (cac:AdditionalItemProperty)
                  </h4>
                  
                  {line.properties.map((prop, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-background border-2 border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500 transition-all cursor-pointer"
                      onMouseEnter={() => setHoveredElement(`${prefix}property-${i}`)}
                      onMouseLeave={() => setHoveredElement(null)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold text-sm text-green-700 dark:text-green-400">
                          Property {i + 1} of {line.properties.length}
                        </div>
                        <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                          {prop.name}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm bg-muted/30 p-3 rounded">
                        <div className="flex justify-between items-start gap-2 border-b border-border/50 pb-2">
                          <span className="text-muted-foreground font-mono text-xs">cbc:Name</span>
                          <span className="font-medium text-right">{prop.name}</span>
                        </div>
                        {prop.listID && prop.nameCode && (
                          <>
                            <div className="flex justify-between items-start gap-2 border-b border-border/50 pb-2">
                              <span className="text-muted-foreground font-mono text-xs">cbc:NameCode</span>
                              <span className="font-mono text-xs text-right">{prop.nameCode}</span>
                            </div>
                            <div className="flex justify-between items-start gap-2 border-b border-border/50 pb-2">
                              <span className="text-muted-foreground font-mono text-xs">└─ @listID</span>
                              <Badge variant="outline" className="font-mono text-xs">{prop.listID}</Badge>
                            </div>
                          </>
                        )}
                        {prop.value && (
                          <div className="flex justify-between items-start gap-2 border-b border-border/50 pb-2">
                            <span className="text-muted-foreground font-mono text-xs">cbc:Value</span>
                            <span className="font-medium text-right">{prop.value}</span>
                          </div>
                        )}
                        {prop.valueQuantity && (
                          <>
                            <div className="flex justify-between items-start gap-2 border-b border-border/50 pb-2">
                              <span className="text-muted-foreground font-mono text-xs">cbc:ValueQuantity</span>
                              <span className="font-mono text-right">{prop.valueQuantity}</span>
                            </div>
                            {prop.unitCode && (
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-muted-foreground font-mono text-xs">└─ @unitCode</span>
                                <Badge variant="outline" className="font-mono text-xs">{prop.unitCode}</Badge>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Document References */}
              {line.documentReferences.length > 0 && (
                <div className="space-y-3 p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg border-l-4 border-violet-500">
                  <h4 className="font-semibold text-sm text-violet-700 dark:text-violet-400 uppercase tracking-wide">
                    Document References
                  </h4>
                  
                  {line.documentReferences.map((doc, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-background border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredElement(`${prefix}document-ref-${i}`)}
                      onMouseLeave={() => setHoveredElement(null)}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        cac:ItemSpecificationDocumentReference
                      </p>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">ID:</span> {doc.id}</p>
                        {doc.documentDescription && (
                          <p><span className="text-muted-foreground">Description:</span> {doc.documentDescription}</p>
                        )}
                        {doc.uri && (
                          <p className="truncate"><span className="text-muted-foreground">URI:</span> {doc.uri}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - XML */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 sticky top-0 bg-background z-10">XML Structure</h3>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
                {renderXmlWithHighlight(lineIndex)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Peppol Catalogue XML
          </CardTitle>
          <CardDescription>
            Upload one or more XML files containing Peppol Catalogue Lines to parse and visualize
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('xml-upload')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Drop your XML files here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse (multiple files supported)</p>
            <input
              id="xml-upload"
              type="file"
              accept=".xml,text/xml,application/xml"
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
            <Button variant="outline">
              Select XML Files
            </Button>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Uploaded Files ({files.length})
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFiles}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
              
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => selectFile(file.id)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
                        min-w-[200px] max-w-[300px]
                        ${selectedFileId === file.id 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50 bg-muted/30'
                        }
                        ${file.error ? 'border-destructive/50' : ''}
                      `}
                    >
                      {file.error ? (
                        <FileX className="h-4 w-4 text-destructive flex-shrink-0" />
                      ) : (
                        <FileCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.error ? 'Error' : `${file.parsedLines.length} line(s)`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Alert for Selected File */}
      {selectedFile?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Parsing Error</AlertTitle>
          <AlertDescription>{selectedFile.error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State - No Files */}
      {files.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Upload XML files to visualize their catalogue lines
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State - Files but None Selected */}
      {files.length > 0 && !selectedFile && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Select a file above to view its catalogue lines
            </p>
          </CardContent>
        </Card>
      )}

      {/* Parsed Catalogue Lines for Selected File */}
      {selectedFile && selectedFile.parsedLines.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Parsed Catalogue Lines</h2>
            <Badge variant="secondary" className="text-sm">
              {selectedFile.name} • {selectedFile.parsedLines.length} line(s)
            </Badge>
          </div>
          {selectedFile.parsedLines.map((line, index) => renderCatalogueLine(line, index))}
        </div>
      )}
    </div>
  );
}
