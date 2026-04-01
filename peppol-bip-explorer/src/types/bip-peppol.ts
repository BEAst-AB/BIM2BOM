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

export interface PeppolExample {
  id: string; // Running number for cbc:ID on CatalogueLine
  ifcGuid: string; // IFC Object GUID for cac:BuyersItemIdentification > cbc:ID
  discipline: string;
  itemName: string;
  description: string;
  brandName: string;
  lotNumberId: string; // LotNumberID for batch identification
  typeId: string; // TypeID for cac:ManufacturersItemIdentification > cbc:ID
  manufacturerName: string;
  properties: PeppolProperty[];
  documentReferences: DocumentReference[];
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
