export interface BIPProperty {
  bipProperty: string;
  bipDataType: string;
  bipExample: string;
  bipPriority: number;
  bipComment: string;
  architect: string;
  structural: string;
  electrical: string;
  mep: string;
  peppolName: string;
  peppolNameCode: string;
  peppolListID: string;
  peppolValue: string;
  peppolValueQuantity: string;
  peppolUnitCode: string;
  unitDescription: string;
  requiresValueQuantity: string;
}

export interface DocumentReference {
  id: string;
  documentDescription?: string;
  uri: string;
}

/** POC-aligned catalogue line shapes (Manufacturing BOM / deliverables). */
export type CatalogueVariant = 'MbomBimParent' | 'MbomManufacturingChild' | 'MbomPackageArticle';

export interface PeppolExample {
  /** Running number for cbc:ID on CatalogueLine (unique within demo). */
  id: string;
  catalogueVariant: CatalogueVariant;
  /** Short label for badges, e.g. "MBOM Traceable – Engineering BOM". */
  variantLabel: string;
  /**
   * Shared CDE / IFC traceability token (maps to CDEGuid AdditionalItemProperty and often SellersItemIdentification in POC).
   */
  ifcGuid: string;
  discipline: string;
  itemName: string;
  description: string;
  /** cac:SellersItemIdentification > cbc:ID */
  sellersItemId: string;
  orderableUnit: string;
  contentUnitQuantity: string;
  contentUnitCode: string;
  actionCode: string;
  orderableIndicator: string;
  /** Parent line cbc:ID for cac:ComponentRelatedItem (traceable child only). */
  parentCatalogueLineId?: string;
  componentRelatedQuantity?: string;
  componentRelatedUnitCode?: string;
  itemType?: 'ManufacturingArticle' | 'PackageArticle';
  sourceSystem?: string;
  properties: PeppolProperty[];
  /** Legacy Peppol catalogue-only demo fields (optional). */
  brandName?: string;
  lotNumberId?: string;
  typeId?: string;
  manufacturerName?: string;
  documentReferences?: DocumentReference[];
}

export interface PeppolProperty {
  name: string;
  nameCode: string;
  listID: string;
  value: string;
  valueQuantity?: string;
  unitCode?: string;
  description: string;
  dataType?: string;
}

export type Discipline = 'Architecture' | 'Structural' | 'Electrical' | 'MEP';
