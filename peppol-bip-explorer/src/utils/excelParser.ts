import * as XLSX from 'xlsx';
import type { BIPProperty, PeppolExample, PeppolProperty, Discipline } from '@/types/bip-peppol';
import { expandSheetExampleToVariants, type BaseSheetExample } from '@/data/catalogueVariantTemplates';
import { generateIFCGuid } from './ifcGuid';
import { getHardcodedExamples } from '@/data/hardcodedExamples';

// Helper function to generate TypeID based on discipline
function generateTypeId(discipline: string, itemIndex: number): string {
  switch (discipline) {
    case 'Architecture':
      return `DS${String(itemIndex).padStart(2, '0')}`;
    case 'Structural':
      return `LB${String(itemIndex).padStart(2, '0')}`;
    case 'MEP':
      return `TD${String(itemIndex + 100).padStart(3, '0')}`;
    case 'Electrical':
      return `EA${String(itemIndex + 200).padStart(3, '0')}-i`;
    default:
      return `TYPE${String(itemIndex).padStart(2, '0')}`;
  }
}

export async function parseBIPMapping(): Promise<BIPProperty[]> {
  try {
    const response = await fetch('/data/BIP_Peppol_Complete_Mapping.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    const properties = data.map((row) => ({
      bipProperty: row['BIP Property'] || '',
      bipDataType: row['BIP DataType'] || '',
      bipExample: row['BIP Example'] || '',
      bipPriority: parseInt(row['BIP Priority']) || 0,
      bipComment: row['BIP Comment'] || '',
      architect: row['Architect'] || '',
      structural: row['Structural'] || '',
      electrical: row['Electrical'] || '',
      mep: row['MEP'] || '',
      peppolName: row['Peppol cbc:Name'] || '',
      peppolNameCode: row['Peppol cbc:NameCode'] || '',
      peppolListID: row['Peppol @listID'] || '',
      peppolValue: row['Peppol cbc:Value'] || '',
      peppolValueQuantity: row['Peppol cbc:ValueQuantity'] || '',
      peppolUnitCode: row['Peppol @unitCode'] || '',
      unitDescription: row['Unit Description'] || '',
      requiresValueQuantity: row['Requires ValueQuantity'] || '',
    }));
    
    // Add hardcoded AuthoringToolId property
    properties.push({
      bipProperty: 'AuthoringToolId',
      bipDataType: 'IfcLabel',
      bipExample: '556781',
      bipPriority: 1,
      bipComment: 'System specific identifier of the component in the originating BIM tool.',
      architect: 'Y',
      structural: 'Y',
      electrical: 'Y',
      mep: 'Y',
      peppolName: 'AuthoringToolId',
      peppolNameCode: 'AuthoringToolId',
      peppolListID: '',
      peppolValue: '556781',
      peppolValueQuantity: '',
      peppolUnitCode: '',
      unitDescription: '',
      requiresValueQuantity: 'No',
    });
    
    // Add hardcoded LotNumberID property
    properties.push({
      bipProperty: 'LotNumberID',
      bipDataType: 'IfcLabel',
      bipExample: 'doors_floor_010',
      bipPriority: 0,
      bipComment: 'Identifies the production batch that the item(s) listed in the catalogue line were part of.',
      architect: 'Y',
      structural: 'Y',
      electrical: 'Y',
      mep: 'Y',
      peppolName: 'LotNumberID',
      peppolNameCode: '',
      peppolListID: '',
      peppolValue: 'doors_floor_010',
      peppolValueQuantity: '',
      peppolUnitCode: '',
      unitDescription: '',
      requiresValueQuantity: 'No',
    });
    
    return properties;
  } catch (error) {
    console.error('Error parsing BIP mapping:', error);
    return [];
  }
}

export async function parsePeppolExamples(): Promise<PeppolExample[]> {
  try {
    const response = await fetch('/data/Peppol_Item_Hierarchy_Examples.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    
    console.log('Sheet names:', workbook.SheetNames);
    
    const examples: PeppolExample[] = [];
    
    // Map sheet names to disciplines - skip the first sheet (Overview)
    const sheetMapping: Record<string, Discipline> = {
      'A': 'Architecture',
      'K': 'Structural',
      'Vent': 'MEP',
      'EL': 'Electrical'
    };
    
    // Process all sheets except the first one (Overview)
    workbook.SheetNames.slice(1).forEach((sheetName, sheetIndex) => {
      const worksheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Determine discipline from sheet name
      const discipline: Discipline = sheetMapping[sheetName] || 'Architecture';
      
      // Find the header row (contains "Level", "Element / Attribute", "Example Value", "Description")
      let headerRowIndex = -1;
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row && row[0] === 'Level' && row[1]?.toString().includes('Element')) {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex === -1) {
        console.log(`No header found in sheet ${sheetName}`);
        return;
      }
      
      // Parse the structured data
      let itemName = '';
      let description = '';
      let brandName = '';
      let lotNumberId = '';
      let typeId = '';
      let manufacturerName = '';
      const properties: PeppolProperty[] = [];
      let currentProperty: Partial<PeppolProperty> | null = null;
      
      // Process data rows
      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 2) continue;
        
        const element = String(row[1] || '').trim();
        const value = String(row[2] || '').trim();
        const desc = String(row[3] || '').trim();
        
        if (!element) continue;
        
        // Check if this row starts a new AdditionalItemProperty
        if (element.includes('cac:AdditionalItemProperty')) {
          // Save previous property if exists
          if (currentProperty && currentProperty.name) {
            properties.push(currentProperty as PeppolProperty);
          }
          // Start a new property (we'll get the name in the next row)
          currentProperty = {
            name: '',
            nameCode: '',
            listID: '',
            value: '',
            description: '',
          };
          continue;
        }
        
        // If we have a current property being built, populate its fields
        if (currentProperty) {
          if (element === 'cbc:Name' && !currentProperty.name) {
            currentProperty.name = value;
            currentProperty.description = desc;
          } else if (element === 'cbc:NameCode') {
            currentProperty.nameCode = value;
          } else if (element === '@listID') {
            currentProperty.listID = value;
          } else if (element === 'cbc:Value' && !currentProperty.value) {
            currentProperty.value = value;
          } else if (element === 'cbc:ValueQuantity') {
            currentProperty.valueQuantity = value;
          } else if (element === '@unitCode') {
            currentProperty.unitCode = value;
          }
        } else {
          // Parse basic item information (before any properties)
          if (element === 'cbc:Name' && !itemName) {
            itemName = value;
          } else if (element === 'cbc:Description' && !description) {
            description = value;
          } else if (element === 'cbc:BrandName') {
            brandName = value;
            // Ensure manufacturer name matches brand name
            if (!manufacturerName) manufacturerName = value;
          } else if (element === 'cbc:LotNumberID') {
            lotNumberId = value;
          } else if (element === 'cbc:ID' && i > 0 && data[i-1] && 
                     String(data[i-1][1] || '').includes('ManufacturersItemIdentification')) {
            typeId = value;
          } else if (element === 'cbc:Name' && i > 0 && data[i-1] && 
                     String(data[i-1][1] || '').includes('PartyName')) {
            manufacturerName = value;
            // Ensure brand name matches manufacturer name
            if (!brandName) brandName = value;
          }
        }
      }
      
      // Save last property
      if (currentProperty && currentProperty.name) {
        properties.push(currentProperty as PeppolProperty);
      }
      
      // Update FireRating properties with bsDD URI
      properties.forEach(prop => {
        if (prop.name === 'Fire Rating' || prop.nameCode === 'FireRating') {
          prop.listID = 'https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3/prop/FireRating';
        }
      });

      if (brandName && !manufacturerName) {
        manufacturerName = brandName;
      } else if (manufacturerName && !brandName) {
        brandName = manufacturerName;
      }

      if (itemName) {
        typeId = generateTypeId(discipline, sheetIndex + 1);

        const base: BaseSheetExample = {
          itemName,
          description,
          brandName,
          lotNumberId,
          typeId,
          manufacturerName,
          properties: properties.filter((p) => p.name),
          documentReferenceUri: 'https://cde.example.com/models/A-40-V-000_BIM2BOM.ifc',
        };

        const cdeGuid = generateIFCGuid();
        const expanded = expandSheetExampleToVariants(base, discipline, cdeGuid, sheetIndex);
        examples.push(...expanded);

        console.log(`Expanded ${sheetName} (${discipline}):`, {
          itemName,
          variants: expanded.length,
          propertiesCount: base.properties.length,
        });
      }
    });
    
    console.log('Total examples parsed:', examples.length);
    return examples;
  } catch (error) {
    console.error('Error parsing Peppol examples, falling back to hardcoded examples:', error);
    return getHardcodedExamples();
  }
}
