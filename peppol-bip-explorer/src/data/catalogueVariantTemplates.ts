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
}

/**
 * Expand one Excel row into three POC-shaped catalogue line examples per discipline.
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

  const parent: PeppolExample = {
    id: parentLineId,
    catalogueVariant: 'MbomBimParent',
    variantLabel: 'MBOM Traceable – Engineering BOM',
    ifcGuid: cdeGuid,
    discipline,
    itemName: base.itemName,
    description: base.description || 'Huvudobjekt från BIM-modell med underliggande tillverkningsartiklar.',
    sellersItemId: cdeGuid,
    orderableUnit: 'MTR',
    contentUnitQuantity: '16.06',
    contentUnitCode: 'MTR',
    actionCode: 'Add',
    orderableIndicator: 'true',
    properties: parentProps,
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
    sellersItemId: cdeGuid,
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
  };

  const pkg: PeppolExample = {
    id: packageLineId,
    catalogueVariant: 'MbomPackageArticle',
    variantLabel: 'MBOM Standard – package article',
    ifcGuid: '',
    discipline,
    itemName: `${base.itemName} (paket)`,
    description: `Paketartikel utan BIM-instans-spårbarhet. ${base.description}`,
    sellersItemId: pkgSellersId,
    orderableUnit: 'MTK',
    contentUnitQuantity: '90.31',
    contentUnitCode: 'MTK',
    actionCode: 'Add',
    orderableIndicator: 'true',
    itemType: 'PackageArticle',
    sourceSystem: 'Selling System',
    properties: packageProps,
  };

  return [parent, child, pkg];
}
