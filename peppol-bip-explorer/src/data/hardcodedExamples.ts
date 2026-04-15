/**
 * Hardcoded Peppol example data compliant with XML_MESSAGE_REFERENCE.md.
 *
 * These examples are used when the external Excel file is unavailable.
 * Each discipline gets a realistic construction example that demonstrates
 * the three catalogue variants (parent, traceable child, standard package).
 */

import type { Discipline, PeppolExample, PeppolProperty } from '@/types/bip-peppol';
import { expandSheetExampleToVariants, type BaseSheetExample } from './catalogueVariantTemplates';
import { generateIFCGuid } from '@/utils/ifcGuid';

interface HardcodedDisciplineExample {
  discipline: Discipline;
  base: BaseSheetExample;
}

const HARDCODED_EXAMPLES: HardcodedDisciplineExample[] = [
  {
    discipline: 'Architecture',
    base: {
      itemName: 'YV01 350 - Yttre barande yttervagg (Plan 010)',
      description:
        'Yttre barande yttervagg, 350 mm. Materials: Tegel fasad 110 / Luft 30 / Vindskydd 9 / Regelstomme C24 195 + mineralull / Angbroms / Installationsregel 45 + isolering / Gips 13',
      brandName: 'Wienerberger',
      lotNumberId: 'LOT-2026-0042',
      typeId: 'IV01',
      manufacturerName: 'Wienerberger',
      documentReferenceUri: 'https://cde.example.com/models/A-40-V-000_BIM2BOM.ifc',
      properties: [
        {
          name: 'TypeID',
          nameCode: 'TypeID',
          listID: 'SE:BIP-koder',
          value: 'IV01',
          description: 'BIP type identifier matching BuyersItemIdentification',
        },
        {
          name: 'thickness',
          nameCode: 'thickness',
          listID: 'SE:BIP-koder',
          value: '350 mm',
          valueQuantity: '350',
          unitCode: 'MMT',
          description: 'Wall thickness from BIM model',
        },
        {
          name: 'height',
          nameCode: 'height',
          listID: 'SE:BIP-koder',
          value: '5628 mm',
          valueQuantity: '5628',
          unitCode: 'MMT',
          description: 'Wall height from BIM model',
        },
        {
          name: 'length',
          nameCode: 'length',
          listID: 'SE:BIP-koder',
          value: '16060 mm',
          valueQuantity: '16060',
          unitCode: 'MMT',
          description: 'Wall length from BIM model',
        },
        {
          name: 'net area',
          nameCode: 'net area',
          listID: 'SE:BIP-koder',
          value: '79.81 m2',
          valueQuantity: '79.81',
          unitCode: 'MTK',
          description: 'Net surface area of the wall',
        },
        {
          name: 'is load bearing',
          nameCode: 'is load bearing',
          listID: 'SE:BIP-koder',
          value: 'Yes',
          description: 'Whether the wall is structurally load-bearing',
        },
        {
          name: 'is external',
          nameCode: 'is external',
          listID: 'SE:BIP-koder',
          value: 'Yes',
          description: 'Whether the wall is an external (facade) wall',
        },
        {
          name: 'floor',
          nameCode: 'floor',
          listID: 'SE:BIP-koder',
          value: '010',
          description: 'Floor/storey designation from BIM model',
        },
        {
          name: 'MMI',
          nameCode: 'MMI',
          listID: 'SE:BIP-koder',
          value: '375',
          valueQuantity: '375',
          unitCode: 'C62',
          description: 'Model Maturity Index; >= 375 means data is reliable for procurement',
        },
        {
          name: 'ObjectType',
          nameCode: 'ObjectType',
          listID: 'SE:BIP-koder',
          value: 'Yttervagg',
          description: 'BIP object type classification from BIM model',
        },
      ],
    },
  },
  {
    discipline: 'Structural',
    base: {
      itemName: 'LB01 GL30c - Limtrabalkar (Plan 010)',
      description:
        'Limtrabalk GL30c, 215x585 mm. Barande konstruktionselement for takstol med dimensionering enligt Eurocode 5.',
      brandName: 'Moelven',
      lotNumberId: 'LOT-2026-K001',
      typeId: 'LB01',
      manufacturerName: 'Moelven',
      documentReferenceUri: 'https://cde.example.com/models/K-40-S-000_BIM2BOM.ifc',
      properties: [
        {
          name: 'TypeID',
          nameCode: 'TypeID',
          listID: 'SE:BIP-koder',
          value: 'LB01',
          description: 'BIP type identifier for structural beam',
        },
        {
          name: 'thickness',
          nameCode: 'thickness',
          listID: 'SE:BIP-koder',
          value: '215 mm',
          valueQuantity: '215',
          unitCode: 'MMT',
          description: 'Beam width',
        },
        {
          name: 'height',
          nameCode: 'height',
          listID: 'SE:BIP-koder',
          value: '585 mm',
          valueQuantity: '585',
          unitCode: 'MMT',
          description: 'Beam depth',
        },
        {
          name: 'length',
          nameCode: 'length',
          listID: 'SE:BIP-koder',
          value: '12500 mm',
          valueQuantity: '12500',
          unitCode: 'MMT',
          description: 'Beam length',
        },
        {
          name: 'is load bearing',
          nameCode: 'is load bearing',
          listID: 'SE:BIP-koder',
          value: 'Yes',
          description: 'Structural element is load-bearing',
        },
        {
          name: 'floor',
          nameCode: 'floor',
          listID: 'SE:BIP-koder',
          value: '010',
          description: 'Floor/storey designation',
        },
        {
          name: 'MMI',
          nameCode: 'MMI',
          listID: 'SE:BIP-koder',
          value: '400',
          valueQuantity: '400',
          unitCode: 'C62',
          description: 'Model Maturity Index',
        },
      ],
    },
  },
  {
    discipline: 'MEP',
    base: {
      itemName: 'TD101 - Ventilationsaggregat (Plan 020)',
      description:
        'Ventilationsaggregat med varmeatervinnare, 3000 m3/h. FTX-system for kontorslokal med rotorvarmeatervinning.',
      brandName: 'Systemair',
      lotNumberId: '',
      typeId: 'TD101',
      manufacturerName: 'Systemair',
      documentReferenceUri: 'https://cde.example.com/models/V-56-V-000_BIM2BOM.ifc',
      properties: [
        {
          name: 'TypeID',
          nameCode: 'TypeID',
          listID: 'SE:BIP-koder',
          value: 'TD101',
          description: 'BIP type identifier for ventilation unit',
        },
        {
          name: 'is external',
          nameCode: 'is external',
          listID: 'SE:BIP-koder',
          value: 'No',
          description: 'Indoor installation',
        },
        {
          name: 'floor',
          nameCode: 'floor',
          listID: 'SE:BIP-koder',
          value: '020',
          description: 'Floor/storey designation',
        },
        {
          name: 'MMI',
          nameCode: 'MMI',
          listID: 'SE:BIP-koder',
          value: '375',
          valueQuantity: '375',
          unitCode: 'C62',
          description: 'Model Maturity Index',
        },
      ],
    },
  },
  {
    discipline: 'Electrical',
    base: {
      itemName: 'EA201-i - Installationskabel (Plan 010)',
      description:
        'Installationskabel FKLR 3x2.5 mm2. Halogenfri kabel for elinstallation i kontorsbyggnad, brandklass Cca-s1b,d1,a1.',
      brandName: 'Nexans',
      lotNumberId: '',
      typeId: 'EA201',
      manufacturerName: 'Nexans',
      documentReferenceUri: 'https://cde.example.com/models/E-60-E-000_BIM2BOM.ifc',
      properties: [
        {
          name: 'TypeID',
          nameCode: 'TypeID',
          listID: 'SE:BIP-koder',
          value: 'EA201',
          description: 'BIP type identifier for electrical cable',
        },
        {
          name: 'floor',
          nameCode: 'floor',
          listID: 'SE:BIP-koder',
          value: '010',
          description: 'Floor/storey designation',
        },
        {
          name: 'MMI',
          nameCode: 'MMI',
          listID: 'SE:BIP-koder',
          value: '375',
          valueQuantity: '375',
          unitCode: 'C62',
          description: 'Model Maturity Index',
        },
      ],
    },
  },
];

export function getHardcodedExamples(): PeppolExample[] {
  const examples: PeppolExample[] = [];

  HARDCODED_EXAMPLES.forEach((item, index) => {
    const cdeGuid = generateIFCGuid();
    const expanded = expandSheetExampleToVariants(item.base, item.discipline, cdeGuid, index);
    examples.push(...expanded);
  });

  return examples;
}
