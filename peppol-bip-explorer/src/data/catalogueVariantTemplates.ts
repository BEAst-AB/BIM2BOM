import type { Discipline, PeppolExample, PeppolProperty } from '@/types/bip-peppol';

const BEAST = 'ORG:BEAst';
const BIP = 'SE:BIP-koder';

const BEAST_PROPERTY_NAMES = new Set(['CDEGuid', 'AuthoringToolId']);

/** Apply correct listID per XML_MESSAGE_REFERENCE §10: ORG:BEAst for BEAst
 *  properties, SE:BIP-koder for BIP properties. */
export function withBeastListId(props: PeppolProperty[]): PeppolProperty[] {
  return props.map((p) => ({
    ...p,
    listID: p.listID || (BEAST_PROPERTY_NAMES.has(p.name) ? BEAST : BIP),
    nameCode: p.nameCode || p.name,
  }));
}

function filterOutCdeGuid(props: PeppolProperty[]): PeppolProperty[] {
  return props.filter((p) => p.name !== 'CDEGuid' && p.nameCode !== 'CDEGuid');
}

function stripCoreIds(props: PeppolProperty[]): PeppolProperty[] {
  return props.filter((p) => p.name !== 'AuthoringToolId' && p.name !== 'CDEGuid');
}

function ensureCoreMbomProps(
  props: PeppolProperty[],
  opts: {
    cdeGuidValue: string;
    authoringToolId: string;
    includeCdeGuid: boolean;
  }
): PeppolProperty[] {
  let next = stripCoreIds(props.map((p) => ({ ...p })));

  if (!opts.includeCdeGuid) {
    next = filterOutCdeGuid(next);
  } else {
    next.unshift({
      name: 'CDEGuid',
      nameCode: 'CDEGuid',
      listID: BEAST,
      value: opts.cdeGuidValue,
      description: 'Common Data Environment unique identifier for the component',
    });
  }

  next.unshift({
    name: 'AuthoringToolId',
    nameCode: 'AuthoringToolId',
    listID: BEAST,
    value: opts.authoringToolId,
    description: 'System specific identifier of the component in the originating BIM tool',
  });

  // Per XML_MESSAGE_REFERENCE §10.1: do NOT populate ItemType, SourceSystem,
  // Traceability, ParentAuthoringToolId, ParentItemID, RecipeArticle, or
  // LeadTime as ORG:BEAst AdditionalItemProperty entries.
  next = next.filter(
    (p) =>
      p.name !== 'ItemType' &&
      p.name !== 'SourceSystem' &&
      p.name !== 'Traceability' &&
      p.name !== 'ParentAuthoringToolId' &&
      p.name !== 'ParentItemID' &&
      p.name !== 'RecipeArticle' &&
      p.name !== 'LeadTime'
  );

  return withBeastListId(next);
}

const disciplineAuthoringPrefix: Record<Discipline, string> = {
  Architecture: 'A',
  Structural: 'K',
  MEP: 'V',
  Electrical: 'E',
};

/** One parsed row from Peppol_Item_Hierarchy_Examples.xlsx before variant expansion. */
export interface BaseSheetExample {
  itemName: string;
  description: string;
  brandName: string;
  lotNumberId: string;
  typeId: string;
  manufacturerName: string;
  properties: PeppolProperty[];
  /** cac:ItemSpecificationDocumentReference URI (CDE link to IFC model). */
  documentReferenceUri?: string;
}

function generateGtin(seed: number): string {
  const base = 7318937170000 + (seed * 137) % 10000;
  return String(base);
}

/**
 * Expand one Excel row into three POC-shaped catalogue line examples per discipline.
 *
 * The generated examples comply with XML_MESSAGE_REFERENCE.md:
 *  - UBL item identification order: Buyers → Sellers → Manufacturers → Standard (§7)
 *  - BuyersItemIdentification carries BIP TypeID (§7.1)
 *  - StandardItemIdentification carries GTIN with schemeID="0160" on seller lines (§7.4)
 *  - ItemSpecificationDocumentReference on parent lines (§9)
 *  - ItemInstance/LotIdentification on seller lines when available (§9B)
 */
export function expandSheetExampleToVariants(
  base: BaseSheetExample,
  discipline: Discipline,
  cdeGuid: string,
  lineIdOffset: number
): PeppolExample[] {
  const prefix = disciplineAuthoringPrefix[discipline];

  const parentAuthoring = String(1192287 + lineIdOffset);
  const childAuthoring = `${prefix}-MFG-${String(lineIdOffset + 1).padStart(3, '0')}`;
  const pkgAuthoring = `${prefix}-PKG-${String(lineIdOffset + 1).padStart(3, '0')}`;
  const pkgSellersId = `${prefix}-ART-PKG-${String(lineIdOffset + 1).padStart(3, '0')}`;

  const parentProps = ensureCoreMbomProps(base.properties, {
    cdeGuidValue: cdeGuid,
    authoringToolId: parentAuthoring,
    includeCdeGuid: true,
  });

  const childProps = ensureCoreMbomProps(base.properties, {
    cdeGuidValue: cdeGuid,
    authoringToolId: childAuthoring,
    includeCdeGuid: true,
  });

  const packageProps = ensureCoreMbomProps(base.properties, {
    cdeGuidValue: cdeGuid,
    authoringToolId: pkgAuthoring,
    includeCdeGuid: false,
  });

  const parentLineId = '1';
  const childLineId = '2';
  const packageLineId = '3';

  const typeId = base.typeId || 'IV01';
  const docRefUri = base.documentReferenceUri || 'https://cde.example.com/models/A-40-V-000_BIM2BOM.ifc';

  const parent: PeppolExample = {
    id: parentLineId,
    catalogueVariant: 'MbomBimParent',
    variantLabel: 'MBOM Traceable – Engineering BOM',
    ifcGuid: cdeGuid,
    discipline,
    itemName: base.itemName,
    description: base.description || 'Huvudobjekt från BIM-modell med underliggande tillverkningsartiklar.',
    buyersItemId: typeId,
    sellersItemId: cdeGuid,
    manufacturersItemId: `${typeId}xx`,
    standardItemId: generateGtin(lineIdOffset),
    orderableUnit: 'MTR',
    contentUnitQuantity: '16.06',
    contentUnitCode: 'MTR',
    actionCode: 'Add',
    orderableIndicator: 'true',
    properties: parentProps,
    brandName: base.brandName || undefined,
    lotNumberId: base.lotNumberId || undefined,
    typeId,
    manufacturerName: base.manufacturerName || undefined,
    documentReferences: [
      {
        id: 'IFC-MODEL-REF',
        documentDescription: 'IFC model file - Originating BIM model',
        uri: docRefUri,
      },
    ],
  };

  const child: PeppolExample = {
    id: childLineId,
    catalogueVariant: 'MbomManufacturingChild',
    variantLabel: 'MBOM Traceable – Manufacturing BIM',
    ifcGuid: cdeGuid,
    discipline,
    itemName: base.itemName,
    description:
      base.description + ' Tillverkningsartikel med 1:1 spårbarhet via delad CDEGuid.',
    buyersItemId: typeId,
    sellersItemId: cdeGuid,
    standardItemId: generateGtin(lineIdOffset + 100),
    orderableUnit: 'MTK',
    contentUnitQuantity: '90.31',
    contentUnitCode: 'MTK',
    actionCode: 'Add',
    orderableIndicator: 'true',
    parentCatalogueLineId: parentLineId,
    componentRelatedQuantity: '90.31',
    componentRelatedUnitCode: 'MTK',
    itemType: 'ManufacturingArticle',
    sourceSystem: 'Selling System',
    properties: childProps,
    typeId,
    lotNumberId: base.lotNumberId || undefined,
  };

  const pkg: PeppolExample = {
    id: packageLineId,
    catalogueVariant: 'MbomPackageArticle',
    variantLabel: 'MBOM Standard – package article',
    ifcGuid: '',
    discipline,
    itemName: `${base.itemName} (paket)`,
    description: `Paketartikel utan BIM-instans-spårbarhet. ${base.description}`,
    buyersItemId: typeId,
    sellersItemId: pkgSellersId,
    standardItemId: generateGtin(lineIdOffset + 200),
    orderableUnit: 'MTK',
    contentUnitQuantity: '90.31',
    contentUnitCode: 'MTK',
    actionCode: 'Add',
    orderableIndicator: 'true',
    itemType: 'PackageArticle',
    sourceSystem: 'Selling System',
    properties: packageProps,
    typeId,
  };

  return [parent, child, pkg];
}
