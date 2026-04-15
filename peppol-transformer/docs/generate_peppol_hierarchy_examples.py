#!/usr/bin/env python3
"""
Peppol Item Hierarchy Examples Generator

This script generates an Excel file showing the complete cac:Item hierarchy
with discipline-specific examples in separate sheets.

Usage:
    python generate_peppol_hierarchy_examples.py

Output:
    Peppol_Item_Hierarchy_Examples.xlsx
"""

import json
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from datetime import datetime


def get_discipline_specific_properties():
    """
    Get realistic, discipline-specific property examples.
    Each property is manually crafted to match the product type.
    
    Returns:
        dict: Properties by discipline with realistic examples
    """
    return {
        'Architecture': [
            # Fire Door properties
            {'prop_title': 'TypeID', 'prop_datatype': 'Label', 'prop_example': 'D-EI60-0910-WH', 
             'prop_comment': 'Product type designation for fire door'},
            {'prop_title': 'FireRating', 'prop_datatype': 'Label', 'prop_example': 'EI60',
             'prop_comment': 'Fire resistance classification - 60 minutes integrity and insulation'},
            {'prop_title': 'Height', 'prop_datatype': 'PositiveLength', 'prop_example': '2100',
             'prop_comment': 'Door height in millimeters'},
            {'prop_title': 'Width', 'prop_datatype': 'PositiveLength', 'prop_example': '900',
             'prop_comment': 'Door width in millimeters'},
            {'prop_title': 'AcousticRating', 'prop_datatype': 'Label', 'prop_example': '33',
             'prop_comment': 'Sound reduction value Rw in dB'},
            {'prop_title': 'Colour', 'prop_datatype': 'Label', 'prop_example': 'RAL 9010',
             'prop_comment': 'Surface color code - Pure White'},
        ],
        'Structural': [
            # Glulam Beam properties
            {'prop_title': 'TypeID', 'prop_datatype': 'Label', 'prop_example': 'GL30C-115X315',
             'prop_comment': 'Glulam beam type designation with dimensions'},
            {'prop_title': 'BSABwr', 'prop_datatype': 'Label', 'prop_example': 'PDB.3',
             'prop_comment': 'BSAB Work Result code for timber structures'},
            {'prop_title': 'Length', 'prop_datatype': 'PositiveLength', 'prop_example': '6000',
             'prop_comment': 'Beam length in millimeters'},
            {'prop_title': 'Height', 'prop_datatype': 'PositiveLength', 'prop_example': '315',
             'prop_comment': 'Beam depth/height in millimeters'},
            {'prop_title': 'Width', 'prop_datatype': 'PositiveLength', 'prop_example': '115',
             'prop_comment': 'Beam width in millimeters'},
            {'prop_title': 'Material', 'prop_datatype': 'Label', 'prop_example': 'Glulam GL30c',
             'prop_comment': 'Material type - Glued laminated timber strength class GL30c'},
        ],
        'Mechanical': [
            # Supply Air Diffuser properties (TD = Tilluftsdon)
            {'prop_title': 'TypeID', 'prop_datatype': 'Label', 'prop_example': 'TD125',
             'prop_comment': 'Supply air diffuser type - 125mm diameter'},
            {'prop_title': 'SystemName', 'prop_datatype': 'Label', 'prop_example': 'Tilluft LB101',
             'prop_comment': 'Ventilation system designation'},
            {'prop_title': 'Flow_l/s', 'prop_datatype': 'VolumetricFlowRate', 'prop_example': '25',
             'prop_comment': 'Air flow rate in liters per second'},
            {'prop_title': 'Diameter', 'prop_datatype': 'PositiveLength', 'prop_example': '125',
             'prop_comment': 'Diffuser diameter in millimeters'},
            {'prop_title': 'ProductSize', 'prop_datatype': 'PositiveLength', 'prop_example': '125',
             'prop_comment': 'Nominal product size'},
            {'prop_title': 'Manufacturer', 'prop_datatype': 'Label', 'prop_example': 'Lindab',
             'prop_comment': 'Product manufacturer'},
        ],
        'Electrical': [
            # LED Panel Light properties
            {'prop_title': 'TypeID', 'prop_datatype': 'Label', 'prop_example': 'LED-PNL-636-4K',
             'prop_comment': 'LED panel light type 600x600, 36W, 4000K'},
            {'prop_title': 'Voltage_V', 'prop_datatype': 'ElectricVoltage', 'prop_example': '230',
             'prop_comment': 'Operating voltage in Volts'},
            {'prop_title': 'PowerElectrical_W', 'prop_datatype': 'Power', 'prop_example': '36',
             'prop_comment': 'Electrical power consumption in Watts'},
            {'prop_title': 'Current_A', 'prop_datatype': 'ElectricCurrent', 'prop_example': '0.16',
             'prop_comment': 'Electrical current in Amperes'},
            {'prop_title': 'IPClass', 'prop_datatype': 'Label', 'prop_example': 'IP44',
             'prop_comment': 'Ingress protection rating against water and dust'},
            {'prop_title': 'Height', 'prop_datatype': 'PositiveLength', 'prop_example': '600',
             'prop_comment': 'Panel height in millimeters'},
        ]
    }


def get_unit_code(datatype):
    """Get unit code for a datatype."""
    unit_mapping = {
        'PositiveLength': 'MMT',
        'Length': 'MMT',
        'Area': 'MTK',
        'Volume': 'MTQ',
        'Power': 'WTT',
        'ElectricVoltage': 'VLT',
        'ElectricCurrent': 'AMP',
        'VolumetricFlowRate': 'E97',
        'LinearVelocity': 'MTS',
        'Pressure': 'PAL',
        'ThermodynamicTemperature': 'CEL',
        'SoundPressure': '2N',
        'Mass': 'KGM',
        'PlaneAngle': 'DD',
    }
    return unit_mapping.get(datatype, '')


def needs_quantity(datatype):
    """Check if datatype needs ValueQuantity."""
    quantity_types = {
        'PositiveLength', 'Length', 'Area', 'Volume', 'Power',
        'ElectricVoltage', 'ElectricCurrent', 'VolumetricFlowRate',
        'LinearVelocity', 'Pressure', 'ThermodynamicTemperature',
        'SoundPressure', 'Mass', 'PlaneAngle', 'Real', 'Integer'
    }
    return datatype in quantity_types


def extract_numeric(value):
    """Extract numeric portion from value."""
    import re
    match = re.search(r'[\d,\.]+', str(value))
    if match:
        return match.group().replace(',', '.')
    return ''


def get_example_items():
    """Get example item details for each discipline."""
    return {
        'Architecture': {
            'item_name': 'Fire Door EI60 with Frame',
            'description': 'Steel fire door with 60 minute rating, including frame and hardware. White RAL 9010 finish.',
            'brand': 'Nordic Doors',
            'keywords': ['fire door', 'EI60', 'steel door'],
            'sellers_id': 'ND-FD-EI60-0910',
            'manufacturers_id': 'FD-EI60-WH-910',
            'gtin': '7350012345678',
            'manufacturer': 'Nordic Doors AB',
        },
        'Structural': {
            'item_name': 'Glulam Beam GL30c',
            'description': 'Glued laminated timber beam, strength class GL30c. Suitable for exposed structural applications.',
            'brand': 'Moelven Limträ',
            'keywords': ['glulam', 'timber beam', 'GL30c'],
            'sellers_id': 'ML-GL30-115X315',
            'manufacturers_id': 'GL30C-115-315',
            'gtin': '7350023456789',
            'manufacturer': 'Moelven Limträ AB',
        },
        'Mechanical': {
            'item_name': 'Supply Air Diffuser IRIS-125',
            'description': 'Circular supply air diffuser with adjustable pattern. White RAL 9010. Includes mounting frame.',
            'brand': 'Lindab',
            'keywords': ['air diffuser', 'supply air', 'ventilation'],
            'sellers_id': 'LI-IRIS-125-WH',
            'manufacturers_id': 'IRIS-125-RAL9010',
            'gtin': '7350034567890',
            'manufacturer': 'Lindab AB',
        },
        'Electrical': {
            'item_name': 'LED Panel Light 600x600',
            'description': '36W LED panel light, 4000K, 3600lm. Suitable for suspended ceiling installation. IP44 rated.',
            'brand': 'Fagerhult',
            'keywords': ['LED panel', 'office lighting', '600x600'],
            'sellers_id': 'FH-LED-PNL-636',
            'manufacturers_id': 'PANEL-36W-4K',
            'gtin': '7350045678901',
            'manufacturer': 'Fagerhult AB',
        }
    }


def create_hierarchy_sheet(ws, discipline, example_items):
    """
    Create a sheet showing Peppol Item hierarchy for a discipline.
    
    Args:
        ws: Worksheet
        discipline (str): Discipline name
        example_items (dict): Example item details
    """
    # Get discipline-specific property examples
    discipline_properties = get_discipline_specific_properties()
    example_props = discipline_properties.get(discipline, [])
    item_info = example_items[discipline]
    
    # Define styles
    header_fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
    header_font = Font(bold=True, color='FFFFFF', size=12)
    
    element_fill = PatternFill(start_color='D4E3F4', end_color='D4E3F4', fill_type='solid')
    element_font = Font(bold=True, size=11)
    
    property_fill = PatternFill(start_color='FFF3CD', end_color='FFF3CD', fill_type='solid')
    property_font = Font(bold=True, size=10, color='856404')
    
    value_font = Font(size=10)
    comment_font = Font(size=9, italic=True, color='666666')
    
    thin_border = Border(
        left=Side(style='thin', color='CCCCCC'),
        right=Side(style='thin', color='CCCCCC'),
        top=Side(style='thin', color='CCCCCC'),
        bottom=Side(style='thin', color='CCCCCC')
    )
    
    # Column setup
    ws.column_dimensions['A'].width = 5   # Level indicator
    ws.column_dimensions['B'].width = 35  # Element/Attribute
    ws.column_dimensions['C'].width = 40  # Value
    ws.column_dimensions['D'].width = 50  # Description/Comment
    
    # Title
    row = 1
    title_cell = ws.cell(row=row, column=1)
    title_cell.value = f"Peppol cac:Item Structure - {discipline} Example"
    ws.merge_cells(f'A{row}:D{row}')
    title_cell.fill = header_fill
    title_cell.font = Font(bold=True, color='FFFFFF', size=14)
    title_cell.alignment = Alignment(horizontal='center', vertical='center')
    row += 2
    
    # Header row
    headers = ['Level', 'Element / Attribute', 'Example Value', 'Description']
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=row, column=col)
        cell.value = header
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = thin_border
    row += 1
    
    def write_element(level, element_name, value, description, fill=None, font=None, indent=0):
        """Helper to write a row."""
        nonlocal row
        
        # Level indicator
        level_cell = ws.cell(row=row, column=1)
        level_cell.value = '  ' * indent + ('▸' if level > 0 else '■')
        level_cell.alignment = Alignment(horizontal='right', vertical='top')
        level_cell.border = thin_border
        
        # Element name
        name_cell = ws.cell(row=row, column=2)
        name_cell.value = element_name
        name_cell.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True, indent=indent)
        name_cell.border = thin_border
        if fill:
            name_cell.fill = fill
        if font:
            name_cell.font = font
        
        # Value
        value_cell = ws.cell(row=row, column=3)
        value_cell.value = value
        value_cell.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)
        value_cell.border = thin_border
        if font:
            value_cell.font = font
        
        # Description
        desc_cell = ws.cell(row=row, column=4)
        desc_cell.value = description
        desc_cell.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)
        desc_cell.font = comment_font
        desc_cell.border = thin_border
        
        row += 1
    
    # Root element
    write_element(0, 'cac:Item', '', 'Item information container', element_fill, element_font)
    
    # Basic item information
    write_element(1, 'cbc:Name', item_info['item_name'], 
                  'Item name (Required)', None, value_font, 1)
    
    write_element(1, 'cbc:Description', item_info['description'],
                  'Detailed product description', None, value_font, 1)
    
    write_element(1, 'cbc:BrandName', item_info['brand'],
                  'Brand name', None, value_font, 1)
    
    for keyword in item_info['keywords']:
        write_element(1, 'cbc:Keyword', keyword,
                      'Searchable keyword/synonym', None, value_font, 1)
    
    # Identifications
    write_element(1, 'cac:SellersItemIdentification', '',
                  'Seller\'s product identification', element_fill, element_font, 1)
    write_element(2, 'cbc:ID', item_info['sellers_id'],
                  'Seller\'s article number', None, value_font, 2)
    row += 1
    
    write_element(1, 'cac:ManufacturersItemIdentification', '',
                  'Manufacturer\'s product identification', element_fill, element_font, 1)
    write_element(2, 'cbc:ID', item_info['manufacturers_id'],
                  'Manufacturer\'s article number', None, value_font, 2)
    row += 1
    
    write_element(1, 'cac:StandardItemIdentification', '',
                  'Standard identification (GTIN)', element_fill, element_font, 1)
    write_element(2, 'cbc:ID', item_info['gtin'],
                  'GTIN/EAN code', None, value_font, 2)
    write_element(2, '@schemeID', 'GTIN',
                  'Identifier scheme', None, comment_font, 2)
    row += 1
    
    # Manufacturer Party
    write_element(1, 'cac:ManufacturerParty', '',
                  'Manufacturer information', element_fill, element_font, 1)
    write_element(2, 'cac:PartyName', '',
                  'Party name container', None, element_font, 2)
    write_element(3, 'cbc:Name', item_info['manufacturer'],
                  'Manufacturer name', None, value_font, 3)
    row += 1
    
    # Additional Item Properties (BIP Properties)
    write_element(1, '--- BIP Properties via cac:AdditionalItemProperty ---', '',
                  f'{len(example_props)} example properties for {discipline}',
                  property_fill, property_font, 1)
    row += 1
    
    for idx, prop in enumerate(example_props, 1):
        prop_title = prop['prop_title']
        prop_example = prop['prop_example']
        prop_datatype = prop['prop_datatype']
        prop_comment = prop['prop_comment']
        
        # Property container
        write_element(1, f'cac:AdditionalItemProperty ({idx}/{len(example_props)})', '',
                      f'Property: {prop_title}', property_fill, property_font, 1)
        
        # Property elements
        write_element(2, 'cbc:Name', prop_title,
                      'Property name', None, value_font, 2)
        
        write_element(2, 'cbc:NameCode', prop_title,
                      'Property code (same as name)', None, value_font, 2)
        write_element(3, '@listID', 'SE:BIP-koder',
                      'Fixed value for BIP properties', None, comment_font, 3)
        
        # Format value with units
        formatted_value = prop_example
        if prop_datatype in ['PositiveLength', 'Length']:
            formatted_value = f"{prop_example} mm"
        elif prop_datatype == 'Power':
            formatted_value = f"{prop_example} W"
        elif prop_datatype == 'ElectricVoltage':
            formatted_value = f"{prop_example} V"
        elif prop_datatype == 'ElectricCurrent':
            formatted_value = f"{prop_example} A"
        elif prop_datatype == 'VolumetricFlowRate':
            formatted_value = f"{prop_example} l/s"
        
        write_element(2, 'cbc:Value', formatted_value,
                      f'{prop_comment}', None, value_font, 2)
        
        # ValueQuantity if needed
        if needs_quantity(prop_datatype):
            numeric_val = prop_example  # Already numeric
            write_element(2, 'cbc:ValueQuantity', numeric_val,
                          'Numeric value for calculations', None, value_font, 2)
            
            unit_code = get_unit_code(prop_datatype)
            if unit_code:
                write_element(3, '@unitCode', unit_code,
                              f'UN/CEFACT unit code', None, comment_font, 3)
        
        row += 1
    
    # Summary section
    row += 1
    write_element(0, '--- Structure Summary ---', '',
                  '', PatternFill(start_color='E8E8E8', end_color='E8E8E8', fill_type='solid'),
                  Font(bold=True))
    
    summary_data = [
        ('Total Elements', str(row - 5), 'Number of XML elements in this example'),
        ('Required Elements', 'cbc:Name only', 'Mandatory fields'),
        ('BIP Properties', str(len(example_props)), f'Example properties for {discipline}'),
        ('Cardinality', '0..n', 'Multiple AdditionalItemProperty allowed'),
    ]
    
    for label, value, desc in summary_data:
        write_element(1, label, value, desc, None, value_font, 1)


def create_excel_with_hierarchy(output_file):
    """
    Generate Excel file with Peppol Item hierarchy examples.
    
    Args:
        output_file (str): Path for output Excel file
    """
    # Get example items
    example_items = get_example_items()
    
    # Create workbook
    wb = openpyxl.Workbook()
    wb.remove(wb.active)  # Remove default sheet
    
    # Create discipline sheets
    disciplines = ['Architecture', 'Structural', 'Mechanical', 'Electrical']
    
    for discipline in disciplines:
        ws = wb.create_sheet(title=discipline)
        create_hierarchy_sheet(ws, discipline, example_items)
    
    # Create overview sheet
    overview_ws = wb.create_sheet(title="Overview", index=0)
    
    # Overview content
    header_fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
    header_font = Font(bold=True, color='FFFFFF', size=14)
    
    overview_ws.merge_cells('A1:D1')
    title_cell = overview_ws.cell(row=1, column=1)
    title_cell.value = "Peppol cac:Item Hierarchy - Discipline Examples"
    title_cell.fill = header_fill
    title_cell.font = header_font
    title_cell.alignment = Alignment(horizontal='center', vertical='center')
    
    overview_ws.column_dimensions['A'].width = 20
    overview_ws.column_dimensions['B'].width = 50
    
    overview_data = [
        ('', ''),
        ('Purpose:', 'This workbook demonstrates the complete Peppol cac:Item hierarchy'),
        ('', 'with real examples from different construction disciplines.'),
        ('', ''),
        ('Structure:', 'Each sheet shows a complete XML structure example including:'),
        ('', '• Basic item information (name, description, identifiers)'),
        ('', '• Manufacturer details'),
        ('', '• BIP properties via cac:AdditionalItemProperty'),
        ('', ''),
        ('Disciplines:', ''),
        ('• Architecture', 'Fire doors, windows, building elements'),
        ('• Structural', 'Beams, columns, structural components'),
        ('• Mechanical', 'HVAC equipment, ventilation, plumbing'),
        ('• Electrical', 'Lighting, electrical equipment, installations'),
        ('', ''),
        ('Standards:', ''),
        ('• Peppol BIS', 'Business Interoperability Specifications'),
        ('• BEAst Supply 4.0.5', 'Swedish construction supply chain extension'),
        ('• BIP 1.8+', 'BIM In Production property standard'),
        ('• UN/CEFACT Rec. 20', 'Unit codes'),
        ('', ''),
        ('Usage:', 'Use these examples as templates for:'),
        ('', '• Creating Peppol catalogues'),
        ('', '• Understanding the XML structure'),
        ('', '• Mapping product data to Peppol format'),
        ('', '• Training and documentation'),
        ('', ''),
        ('Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
        ('Source:', 'Realistic, discipline-specific curated examples'),
    ]
    
    row = 3
    for label, value in overview_data:
        cell_a = overview_ws.cell(row=row, column=1)
        cell_b = overview_ws.cell(row=row, column=2)
        
        cell_a.value = label
        cell_b.value = value
        
        if label.endswith(':'):
            cell_a.font = Font(bold=True, size=11)
            cell_b.font = Font(bold=True, size=11)
        elif label.startswith('•'):
            cell_a.font = Font(size=10)
            cell_b.font = Font(size=10)
        else:
            cell_a.font = Font(size=10)
            cell_b.font = Font(size=10)
        
        cell_a.alignment = Alignment(horizontal='right', vertical='top')
        cell_b.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)
        
        row += 1
    
    # Save workbook
    wb.save(output_file)
    print(f"[OK] Excel hierarchy file generated: {output_file}")
    print(f"[OK] Sheets created: {', '.join([ws.title for ws in wb.worksheets])}")
    print(f"[OK] Each sheet contains a complete Peppol cac:Item structure example")


def main():
    """Main execution function."""
    import os
    
    # File paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(script_dir, 'Peppol_Item_Hierarchy_Examples.xlsx')
    
    try:
        print("Generating Peppol Item Hierarchy Examples...")
        print("Using discipline-specific realistic property examples...")
        
        create_excel_with_hierarchy(output_file)
        
        print("\n[OK] Generation complete!")
        print(f"\nOpen the file: {output_file}")
        print("\nEach sheet shows a complete cac:Item structure with:")
        print("  - Item identification and description")
        print("  - Manufacturer information")
        print("  - 6 discipline-specific BIP properties")
        print("  - Proper XML hierarchy with indentation")
        
        return 0
        
    except Exception as e:
        print(f"\n[ERROR] Error during generation: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit(main())

