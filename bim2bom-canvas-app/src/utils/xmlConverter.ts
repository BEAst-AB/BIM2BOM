/**
 * XML Converter Utilities
 * Converts between XML and table data formats
 */

export interface CatalogueLineRow {
  id: string;
  name: string;
  description: string;
  [key: string]: string; // Additional properties
}

/**
 * Parse XML to table data
 */
export function parseXMLToTable(xml: string): CatalogueLineRow[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing error: ' + parserError.textContent);
    }
    
    // Extract CatalogueLines
    const catalogueLines = doc.querySelectorAll('CatalogueLine');
    const tableData: CatalogueLineRow[] = [];
    
    Array.from(catalogueLines).forEach((line) => {
      const lineId = line.querySelector('ID')?.textContent || '';
      const item = line.querySelector('Item');
      const name = item?.querySelector('Name')?.textContent || '';
      const description = item?.querySelector('Description')?.textContent || '';
      
      // Extract additional properties
      const properties: Record<string, string> = {};
      item?.querySelectorAll('AdditionalItemProperty').forEach(prop => {
        const propName = prop.querySelector('Name')?.textContent || '';
        const propValue = prop.querySelector('Value')?.textContent || '';
        if (propName) {
          properties[propName] = propValue;
        }
      });

      tableData.push({
        id: lineId,
        name,
        description,
        ...properties,
      });
    });
    
    return tableData;
  } catch (error) {
    console.error('Failed to parse XML:', error);
    throw error;
  }
}

/**
 * Convert table data back to XML
 */
export function convertTableToXML(
  tableData: CatalogueLineRow[],
  originalXML: string
): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(originalXML, 'application/xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing error: ' + parserError.textContent);
    }
    
    // Get namespace info from original XML
    const catalogue = doc.documentElement;
    const nsmap = {
      NS_CATALOGUE: catalogue.namespaceURI || 'urn:oasis:names:specification:ubl:schema:xsd:Catalogue-2',
      NS_CAC: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      NS_CBC: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    };
    
    // Remove existing CatalogueLines
    const existingLines = doc.querySelectorAll('CatalogueLine');
    existingLines.forEach(line => line.remove());
    
    // Create new CatalogueLines from table data
    tableData.forEach((row) => {
      const catalogueLine = doc.createElementNS(nsmap.NS_CAC, 'CatalogueLine');
      
      // ID
      const lineId = doc.createElementNS(nsmap.NS_CBC, 'ID');
      lineId.textContent = row.id;
      catalogueLine.appendChild(lineId);
      
      // ActionCode
      const actionCode = doc.createElementNS(nsmap.NS_CBC, 'ActionCode');
      actionCode.textContent = 'Add';
      catalogueLine.appendChild(actionCode);
      
      // OrderableIndicator
      const orderable = doc.createElementNS(nsmap.NS_CBC, 'OrderableIndicator');
      orderable.textContent = 'true';
      catalogueLine.appendChild(orderable);
      
      // Item
      const item = doc.createElementNS(nsmap.NS_CAC, 'Item');
      
      // Name
      if (row.name) {
        const name = doc.createElementNS(nsmap.NS_CBC, 'Name');
        name.textContent = row.name;
        item.appendChild(name);
      }
      
      // Description
      if (row.description) {
        const description = doc.createElementNS(nsmap.NS_CBC, 'Description');
        description.textContent = row.description;
        item.appendChild(description);
      }
      
      // Additional properties (all fields except id, name, description)
      Object.keys(row).forEach(key => {
        if (key !== 'id' && key !== 'name' && key !== 'description' && row[key]) {
          const addProp = doc.createElementNS(nsmap.NS_CAC, 'AdditionalItemProperty');
          
          const propName = doc.createElementNS(nsmap.NS_CBC, 'Name');
          propName.textContent = key;
          addProp.appendChild(propName);
          
          const nameCode = doc.createElementNS(nsmap.NS_CBC, 'NameCode');
          nameCode.setAttribute('listID', 'SE:BIP');
          nameCode.textContent = key;
          addProp.appendChild(nameCode);
          
          const value = doc.createElementNS(nsmap.NS_CBC, 'Value');
          value.textContent = row[key];
          addProp.appendChild(value);
          
          item.appendChild(addProp);
        }
      });
      
      catalogueLine.appendChild(item);
      catalogue.appendChild(catalogueLine);
    });
    
    // Convert back to string
    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(doc);
    
    // Add XML declaration if not present
    if (!xmlString.startsWith('<?xml')) {
      xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
    }
    
    return xmlString;
  } catch (error) {
    console.error('Failed to convert table to XML:', error);
    throw error;
  }
}





