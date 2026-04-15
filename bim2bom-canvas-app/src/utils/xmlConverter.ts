/**
 * XML Converter Utilities
 * Converts between Peppol Catalogue XML and table data formats.
 * Preserves structural XML elements (identifications, pricing, document
 * references, ComponentRelatedItem) that the table editor does not modify.
 */

const NS_CAC = 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2';
const NS_CBC = 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2';

function getElementTextNS(parent: Element, ns: string, localName: string): string {
  const el = parent.getElementsByTagNameNS(ns, localName);
  return el.length > 0 ? (el[0].textContent ?? '') : '';
}

export interface CatalogueLineRow {
  id: string;
  name: string;
  description: string;
  [key: string]: string;
}

/**
 * Parse Peppol Catalogue XML to table data using namespace-aware lookups.
 */
export function parseXMLToTable(xml: string): CatalogueLineRow[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing error: ' + parserError.textContent);
    }

    const catalogueLines = doc.getElementsByTagNameNS(NS_CAC, 'CatalogueLine');
    const tableData: CatalogueLineRow[] = [];

    for (let i = 0; i < catalogueLines.length; i++) {
      const line = catalogueLines[i];
      const lineId = getElementTextNS(line, NS_CBC, 'ID');
      const items = line.getElementsByTagNameNS(NS_CAC, 'Item');
      const item = items.length > 0 ? items[0] : null;

      const name = item ? getElementTextNS(item, NS_CBC, 'Name') : '';
      const description = item ? getElementTextNS(item, NS_CBC, 'Description') : '';

      const properties: Record<string, string> = {};
      if (item) {
        const addProps = item.getElementsByTagNameNS(NS_CAC, 'AdditionalItemProperty');
        for (let j = 0; j < addProps.length; j++) {
          const prop = addProps[j];
          const propName = getElementTextNS(prop, NS_CBC, 'Name');
          const propValue = getElementTextNS(prop, NS_CBC, 'Value');
          if (propName) {
            properties[propName] = propValue;
          }
        }
      }

      tableData.push({ id: lineId, name, description, ...properties });
    }

    return tableData;
  } catch (error) {
    console.error('Failed to parse XML:', error);
    throw error;
  }
}

/**
 * Convert table data back to XML.
 *
 * Strategy: update existing CatalogueLines in-place (preserving structural
 * elements like ComponentRelatedItem, RequiredItemLocationQuantity,
 * BuyersItemIdentification, SellersItemIdentification, etc.) and only
 * create new lines for rows that don't already exist in the document.
 */
export function convertTableToXML(
  tableData: CatalogueLineRow[],
  originalXML: string
): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(originalXML, 'application/xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing error: ' + parserError.textContent);
    }

    const catalogue = doc.documentElement;
    const nsCAT = catalogue.namespaceURI || 'urn:oasis:names:specification:ubl:schema:xsd:Catalogue-2';

    const existingLines = doc.getElementsByTagNameNS(NS_CAC, 'CatalogueLine');
    const lineById = new Map<string, Element>();
    for (let i = 0; i < existingLines.length; i++) {
      const id = getElementTextNS(existingLines[i], NS_CBC, 'ID');
      if (id) lineById.set(id, existingLines[i]);
    }

    const processedIds = new Set<string>();

    tableData.forEach((row) => {
      processedIds.add(row.id);
      const existing = lineById.get(row.id);

      if (existing) {
        updateExistingLine(doc, existing, row);
      } else {
        const newLine = createNewLine(doc, nsCAT, row);
        catalogue.appendChild(newLine);
      }
    });

    const toRemove: Element[] = [];
    for (let i = 0; i < existingLines.length; i++) {
      const id = getElementTextNS(existingLines[i], NS_CBC, 'ID');
      if (!processedIds.has(id)) {
        toRemove.push(existingLines[i]);
      }
    }
    toRemove.forEach(el => el.remove());

    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(doc);
    if (!xmlString.startsWith('<?xml')) {
      xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
    }
    return xmlString;
  } catch (error) {
    console.error('Failed to convert table to XML:', error);
    throw error;
  }
}

function updateExistingLine(doc: Document, line: Element, row: CatalogueLineRow): void {
  const items = line.getElementsByTagNameNS(NS_CAC, 'Item');
  if (items.length === 0) return;
  const item = items[0];

  const nameEls = item.getElementsByTagNameNS(NS_CBC, 'Name');
  if (nameEls.length > 0) {
    nameEls[0].textContent = row.name;
  }

  const descEls = item.getElementsByTagNameNS(NS_CBC, 'Description');
  if (descEls.length > 0) {
    descEls[0].textContent = row.description;
  } else if (row.description) {
    const desc = doc.createElementNS(NS_CBC, 'cbc:Description');
    desc.textContent = row.description;
    item.insertBefore(desc, item.firstChild);
  }

  const existingProps = item.getElementsByTagNameNS(NS_CAC, 'AdditionalItemProperty');
  const propByName = new Map<string, Element>();
  for (let i = 0; i < existingProps.length; i++) {
    const pn = getElementTextNS(existingProps[i], NS_CBC, 'Name');
    if (pn) propByName.set(pn, existingProps[i]);
  }

  const extraKeys = Object.keys(row).filter(k => k !== 'id' && k !== 'name' && k !== 'description');
  for (const key of extraKeys) {
    const existing = propByName.get(key);
    if (existing) {
      const valEls = existing.getElementsByTagNameNS(NS_CBC, 'Value');
      if (valEls.length > 0) {
        valEls[0].textContent = row[key];
      }
    } else if (row[key]) {
      const addProp = createAdditionalItemProperty(doc, key, row[key]);
      item.appendChild(addProp);
    }
  }
}

function createNewLine(doc: Document, _nsCAT: string, row: CatalogueLineRow): Element {
  const catalogueLine = doc.createElementNS(NS_CAC, 'cac:CatalogueLine');

  const lineId = doc.createElementNS(NS_CBC, 'cbc:ID');
  lineId.textContent = row.id;
  catalogueLine.appendChild(lineId);

  const actionCode = doc.createElementNS(NS_CBC, 'cbc:ActionCode');
  actionCode.textContent = 'Add';
  catalogueLine.appendChild(actionCode);

  const orderable = doc.createElementNS(NS_CBC, 'cbc:OrderableIndicator');
  orderable.textContent = 'true';
  catalogueLine.appendChild(orderable);

  const orderableUnit = doc.createElementNS(NS_CBC, 'cbc:OrderableUnit');
  orderableUnit.textContent = 'MTR';
  catalogueLine.appendChild(orderableUnit);

  const item = doc.createElementNS(NS_CAC, 'cac:Item');

  if (row.description) {
    const description = doc.createElementNS(NS_CBC, 'cbc:Description');
    description.textContent = row.description;
    item.appendChild(description);
  }

  if (row.name) {
    const name = doc.createElementNS(NS_CBC, 'cbc:Name');
    name.textContent = row.name;
    item.appendChild(name);
  }

  Object.keys(row).forEach(key => {
    if (key !== 'id' && key !== 'name' && key !== 'description' && row[key]) {
      item.appendChild(createAdditionalItemProperty(doc, key, row[key]));
    }
  });

  catalogueLine.appendChild(item);
  return catalogueLine;
}

function createAdditionalItemProperty(doc: Document, key: string, value: string): Element {
  const BEAST_PROPS = new Set(['CDEGuid', 'AuthoringToolId']);

  const addProp = doc.createElementNS(NS_CAC, 'cac:AdditionalItemProperty');

  const propName = doc.createElementNS(NS_CBC, 'cbc:Name');
  propName.textContent = key;
  addProp.appendChild(propName);

  const nameCode = doc.createElementNS(NS_CBC, 'cbc:NameCode');
  nameCode.setAttribute('listID', BEAST_PROPS.has(key) ? 'ORG:BEAst' : 'SE:BIP-koder');
  nameCode.textContent = key;
  addProp.appendChild(nameCode);

  const val = doc.createElementNS(NS_CBC, 'cbc:Value');
  val.textContent = value;
  addProp.appendChild(val);

  return addProp;
}
