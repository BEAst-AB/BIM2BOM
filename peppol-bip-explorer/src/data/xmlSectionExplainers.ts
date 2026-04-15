/**
 * Explainer text for each section/chunk of the generated XML.
 * References correspond to POC-Leverables/XML_MESSAGE_REFERENCE.md sections.
 */

export interface XmlSectionExplainer {
  id: string;
  title: string;
  refSection: string;
  description: string;
}

export const XML_SECTION_EXPLAINERS: Record<string, XmlSectionExplainer> = {
  'catalogue-line': {
    id: 'catalogue-line',
    title: 'Catalogue Line',
    refSection: '§4',
    description:
      'Each catalogue line describes one item. The line ID must be unique within the document and serves as the target for ComponentRelatedItem references from child lines.',
  },
  'action-code': {
    id: 'action-code',
    title: 'Action Code',
    refSection: '§4.2',
    description:
      'Controls how the receiving system processes this line. "Add" is used in all POC files since they represent initial catalogue exchanges.',
  },
  'orderable-unit': {
    id: 'orderable-unit',
    title: 'Orderable Unit',
    refSection: '§4.4',
    description:
      'The UN/ECE Recommendation 20 unit code in which the item can be ordered. MTR = metre (parent walls), MTK = square metre (child components).',
  },
  'content-unit-quantity': {
    id: 'content-unit-quantity',
    title: 'Content Unit Quantity',
    refSection: '§4.5',
    description:
      'The primary quantity for this line in the orderable unit. This is the headline quantity from the BIM model for pricing/ordering. Supplementary quantities are in AdditionalItemProperty.',
  },
  'component-related': {
    id: 'component-related',
    title: 'Component Related Item',
    refSection: '§5',
    description:
      'Links child recipe/manufacturing articles back to their parent wall line. schemeID="CatalogueLineID" makes explicit this is a line-internal reference. In traceable catalogues, this is combined with a shared CDEGuid for double-linking (catalogue-level + model-level).',
  },
  'item-description': {
    id: 'item-description',
    title: 'Item Description',
    refSection: '§8.1',
    description:
      'Free-text description complementing the model reference. When an ItemSpecificationDocumentReference is present, the description should mention the originating IFC/project context so humans don\'t rely on the URI alone.',
  },
  'item-name': {
    id: 'item-name',
    title: 'Item Name',
    refSection: '§8.2',
    description:
      'Short name for ERP systems and order lines. May carry discriminators matching the model or location (plan level, storey code) so order lines stay aligned with the BIM instance.',
  },
  'buyers-item-id': {
    id: 'buyers-item-id',
    title: "Buyer's Item Identification",
    refSection: '§7.1',
    description:
      'The BIP TypeID from the BIP property set. YV01 for wall types (UC1/UC2), IV01 for unique wall instances (UC3/MBOM). The seller echoes the same TypeID in responses.',
  },
  'sellers-item-id': {
    id: 'sellers-item-id',
    title: "Seller's Item Identification",
    refSection: '§7.2',
    description:
      'Normally the seller\'s article number (e.g. VE-YV01-350). Re-using the IFC GlobalId here is a specialised traceability pattern for selected lines where the project deliberately mirrors the BIM instance ID.',
  },
  'manufacturers-item-id': {
    id: 'manufacturers-item-id',
    title: "Manufacturer's Item Identification",
    refSection: '§7.3',
    description:
      'Identifies the item according to the manufacturer. Used on parent wall lines with a generic type reference. Not present on child recipe/component lines.',
  },
  'standard-item-id': {
    id: 'standard-item-id',
    title: 'Standard Item Identification (GTIN)',
    refSection: '§7.4',
    description:
      'A GTIN (GS1 Global Trade Item Number) with schemeID="0160". Every cac:Item in seller catalogues should include a GTIN so offers are traceable at product level. Values in the POC are illustrative 13-digit codes.',
  },
  'document-reference': {
    id: 'document-reference',
    title: 'Item Specification Document Reference',
    refSection: '§9',
    description:
      'The formal model reference pointing to the IFC file on a CDE. Essential for BIM2BOM: the catalogue carries quantities extracted from a specific model revision. Prefer a stable, version-specific URI.',
  },
  'lot-identification': {
    id: 'lot-identification',
    title: 'Item Instance / Lot Identification',
    refSection: '§9B',
    description:
      'Carries per-instance metadata such as manufacturing lot or delivery batch numbers. Most relevant in seller responses and manufacturing BOMs where physical materials have been allocated. Absent in buyer requests.',
  },
  'additional-properties': {
    id: 'additional-properties',
    title: 'Additional Item Properties',
    refSection: '§10',
    description:
      'Properties grouped by listID: "ORG:BEAst" for BEAst Supply properties (AuthoringToolId, CDEGuid), and "SE:BIP-koder" for BIP properties (thickness, height, etc.). Per §10.1, do NOT populate ItemType, SourceSystem, Traceability, or similar BEAst names.',
  },
};
