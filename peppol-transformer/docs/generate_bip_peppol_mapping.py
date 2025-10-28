#!/usr/bin/env python3
"""
BIP to Peppol Property Mapping Excel Generator

This script generates a comprehensive Excel file mapping all BIP properties
to Peppol's cac:AdditionalItemProperty structure with automatic unit code mapping.

Usage:
    python generate_bip_peppol_mapping.py

Output:
    BIP_Peppol_Complete_Mapping.xlsx
"""

import json
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from datetime import datetime


def get_unit_code_from_datatype(datatype):
    """
    Map BIP datatype to UN/CEFACT Recommendation 20 unit code.
    
    Args:
        datatype (str): BIP property datatype
        
    Returns:
        str: UN/CEFACT unit code or empty string
    """
    # Mapping of BIP datatypes to UN/CEFACT unit codes
    unit_mapping = {
        # Length measurements
        'PositiveLength': 'MMT',  # Millimeter (most common in construction)
        'Length': 'MMT',
        
        # Area and Volume
        'Area': 'MTK',  # Square meter
        'Volume': 'MTQ',  # Cubic meter
        
        # Power
        'Power': 'WTT',  # Watt
        
        # Electrical
        'ElectricVoltage': 'VLT',  # Volt
        'ElectricCurrent': 'AMP',  # Ampere
        
        # Flow rates
        'VolumetricFlowRate': 'E97',  # Liters per second (common for HVAC)
        
        # Velocity
        'LinearVelocity': 'MTS',  # Meters per second
        
        # Pressure
        'Pressure': 'PAL',  # Pascal (or KPA for kilopascal depending on context)
        
        # Temperature
        'ThermodynamicTemperature': 'CEL',  # Celsius
        
        # Sound
        'SoundPressure': '2N',  # Decibel
        
        # Weight/Mass
        'Mass': 'KGM',  # Kilogram
        
        # Angle
        'PlaneAngle': 'DD',  # Degree
        
        # Time
        'Time': 'SEC',  # Second
        
        # Numeric without specific unit
        'Real': '',  # No unit - pure number
        'Integer': '',
        'Parameter Value': '',
        
        # Text types (no units)
        'Label': '',
        'Text': '',
        'String': '',
        'Identifier': '',
        'Boolean': '',
    }
    
    return unit_mapping.get(datatype, '')


def requires_value_quantity(datatype):
    """
    Determine if a datatype requires cbc:ValueQuantity in addition to cbc:Value.
    
    Args:
        datatype (str): BIP property datatype
        
    Returns:
        bool: True if ValueQuantity is needed
    """
    # Datatypes that should have ValueQuantity
    quantity_types = {
        'PositiveLength', 'Length', 'Area', 'Volume', 'Power',
        'ElectricVoltage', 'ElectricCurrent', 'VolumetricFlowRate',
        'LinearVelocity', 'Pressure', 'ThermodynamicTemperature',
        'SoundPressure', 'Mass', 'Real', 'Integer', 'PlaneAngle'
    }
    
    return datatype in quantity_types


def get_discipline_name(prop):
    """
    Determine primary discipline(s) for a property.
    
    Args:
        prop (dict): Property dictionary
        
    Returns:
        str: Comma-separated list of disciplines
    """
    disciplines = []
    
    if prop.get('prop_architect'):
        disciplines.append('Architect')
    if prop.get('prop_construct'):
        disciplines.append('Structural')
    if prop.get('prop_electricity'):
        disciplines.append('Electrical')
    if prop.get('prop_mep'):
        disciplines.append('MEP')
    
    return ', '.join(disciplines) if disciplines else 'None'


def format_example_value(example, datatype):
    """
    Format the example value for cbc:Value (with units).
    
    Args:
        example (str): Example value from property.json
        datatype (str): BIP datatype
        
    Returns:
        str: Formatted example value
    """
    if not example or example.strip() == '':
        return ''
    
    # Clean up the example
    example = example.strip()
    
    # If it already has units, return as-is
    if any(unit in example for unit in ['mm', 'kg', 'W', 'V', 'A', 'l/s', 'm³/h', '°C', 'Pa', 'dB']):
        return example
    
    # Add appropriate unit based on datatype
    unit_suffix = {
        'PositiveLength': ' mm',
        'Length': ' mm',
        'Area': ' m²',
        'Volume': ' m³',
        'Power': ' W',
        'ElectricVoltage': ' V',
        'ElectricCurrent': ' A',
        'VolumetricFlowRate': ' l/s',
        'ThermodynamicTemperature': ' °C',
        'Mass': ' kg',
    }
    
    suffix = unit_suffix.get(datatype, '')
    
    # Only add suffix if example is numeric-like
    if suffix and example.replace('.', '').replace(',', '').replace('-', '').isdigit():
        return f"{example}{suffix}"
    
    return example


def extract_numeric_value(example):
    """
    Extract numeric value from example string for ValueQuantity.
    
    Args:
        example (str): Example value
        
    Returns:
        str: Numeric portion or empty string
    """
    if not example:
        return ''
    
    # Remove common units and extract number
    import re
    
    # Try to find a number pattern
    match = re.search(r'[\d,\.]+', example)
    if match:
        num = match.group().replace(',', '.')
        return num
    
    return ''


def create_excel_mapping(json_file, output_file):
    """
    Generate Excel file with complete BIP to Peppol property mapping.
    
    Args:
        json_file (str): Path to property.json
        output_file (str): Path for output Excel file
    """
    # Load property data
    with open(json_file, 'r', encoding='utf-8') as f:
        properties = json.load(f)
    
    # Create workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "BIP-Peppol Mapping"
    
    # Define column headers
    headers = [
        'BIP Property',
        'BIP DataType',
        'BIP Example',
        'BIP Priority',
        'BIP Comment',
        'Architect',
        'Structural',
        'Electrical',
        'MEP',
        'Peppol cbc:Name',
        'Peppol cbc:NameCode',
        'Peppol @listID',
        'Peppol cbc:Value',
        'Peppol cbc:ValueQuantity',
        'Peppol @unitCode',
        'Unit Description',
        'Requires ValueQuantity'
    ]
    
    # Write headers
    ws.append(headers)
    
    # Style headers
    header_fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
    header_font = Font(bold=True, color='FFFFFF', size=11)
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    for col in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_alignment
        cell.border = thin_border
    
    # Set column widths
    column_widths = {
        'A': 20,  # BIP Property
        'B': 18,  # BIP DataType
        'C': 25,  # BIP Example
        'D': 10,  # Priority
        'E': 40,  # Comment
        'F': 10,  # Architect
        'G': 10,  # Structural
        'H': 10,  # Electrical
        'I': 10,  # MEP
        'J': 20,  # cbc:Name
        'K': 20,  # cbc:NameCode
        'L': 12,  # @listID
        'M': 25,  # cbc:Value
        'N': 15,  # cbc:ValueQuantity
        'O': 12,  # @unitCode
        'P': 20,  # Unit Description
        'Q': 12,  # Requires ValueQuantity
    }
    
    for col, width in column_widths.items():
        ws.column_dimensions[col].width = width
    
    # Process properties
    row_num = 2
    for prop in properties:
        prop_title = prop.get('prop_title', '')
        prop_datatype = prop.get('prop_datatype', '')
        prop_example = prop.get('prop_example', '')
        prop_priority = prop.get('prop_priority', '')
        prop_comment = prop.get('prop_comment', '')
        
        # Get unit code
        unit_code = get_unit_code_from_datatype(prop_datatype)
        needs_quantity = requires_value_quantity(prop_datatype)
        
        # Format values
        value_example = format_example_value(prop_example, prop_datatype)
        quantity_example = extract_numeric_value(prop_example) if needs_quantity else ''
        
        # Discipline flags
        architect = 'Y' if prop.get('prop_architect', False) else 'N'
        structural = 'Y' if prop.get('prop_construct', False) else 'N'
        electrical = 'Y' if prop.get('prop_electricity', False) else 'N'
        mep = 'Y' if prop.get('prop_mep', False) else 'N'
        
        # Unit description
        unit_descriptions = {
            'MMT': 'Millimeter',
            'MTR': 'Meter',
            'MTK': 'Square meter',
            'MTQ': 'Cubic meter',
            'KGM': 'Kilogram',
            'VLT': 'Volt',
            'AMP': 'Ampere',
            'WTT': 'Watt',
            'E97': 'Liters per second',
            'MTS': 'Meters per second',
            'PAL': 'Pascal',
            'KPA': 'Kilopascal',
            'CEL': 'Celsius',
            '2N': 'Decibel',
            'DD': 'Degree',
            'SEC': 'Second',
        }
        unit_desc = unit_descriptions.get(unit_code, '')
        
        # Write row
        row_data = [
            prop_title,                    # BIP Property
            prop_datatype,                 # BIP DataType
            prop_example,                  # BIP Example
            prop_priority,                 # BIP Priority
            prop_comment,                  # BIP Comment
            architect,                     # Architect
            structural,                    # Structural
            electrical,                    # Electrical
            mep,                          # MEP
            prop_title,                    # Peppol cbc:Name
            prop_title,                    # Peppol cbc:NameCode
            'SE:BIP',                      # Peppol @listID
            value_example,                 # Peppol cbc:Value
            quantity_example,              # Peppol cbc:ValueQuantity
            unit_code,                     # Peppol @unitCode
            unit_desc,                     # Unit Description
            'Yes' if needs_quantity else 'No',  # Requires ValueQuantity
        ]
        
        ws.append(row_data)
        
        # Style data rows
        for col in range(1, len(headers) + 1):
            cell = ws.cell(row=row_num, column=col)
            cell.border = thin_border
            cell.alignment = Alignment(vertical='top', wrap_text=True)
            
            # Highlight discipline columns
            if col in [6, 7, 8, 9]:  # Discipline columns
                if cell.value == 'Y':
                    cell.fill = PatternFill(start_color='D4EDDA', end_color='D4EDDA', fill_type='solid')
                    cell.font = Font(bold=True, color='155724')
            
            # Highlight Peppol mapping columns
            if col in [10, 11, 12, 13, 14, 15]:
                cell.fill = PatternFill(start_color='FFF3CD', end_color='FFF3CD', fill_type='solid')
        
        row_num += 1
    
    # Freeze header row
    ws.freeze_panes = 'A2'
    
    # Add auto-filter
    ws.auto_filter.ref = ws.dimensions
    
    # Add metadata sheet
    meta_ws = wb.create_sheet(title="Metadata")
    meta_ws.append(['Property', 'Value'])
    meta_ws.append(['Generated', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    meta_ws.append(['Total Properties', len(properties)])
    meta_ws.append(['Source', 'property.json'])
    meta_ws.append(['Mapping Standard', 'Peppol BIS BEAst Supply 4.0.5'])
    meta_ws.append(['Unit Code Standard', 'UN/CEFACT Recommendation 20'])
    meta_ws.append(['BIP Version', '1.8+'])
    
    # Style metadata
    for row in meta_ws.iter_rows(min_row=1, max_row=1):
        for cell in row:
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
            cell.font = Font(bold=True, color='FFFFFF')
    
    meta_ws.column_dimensions['A'].width = 20
    meta_ws.column_dimensions['B'].width = 40
    
    # Add unit codes reference sheet
    units_ws = wb.create_sheet(title="Unit Codes")
    units_ws.append(['Unit Code', 'Description', 'Used For'])
    
    unit_reference = [
        ('MMT', 'Millimeter', 'Length, Height, Width, Thickness'),
        ('MTR', 'Meter', 'Large dimensions'),
        ('MTK', 'Square meter', 'Area'),
        ('MTQ', 'Cubic meter', 'Volume'),
        ('KGM', 'Kilogram', 'Weight, Mass'),
        ('VLT', 'Volt', 'Voltage'),
        ('AMP', 'Ampere', 'Current'),
        ('WTT', 'Watt', 'Power'),
        ('E97', 'Liters per second', 'Flow rate (ventilation, water)'),
        ('MQH', 'Cubic meters per hour', 'Flow rate (alternative)'),
        ('MTS', 'Meters per second', 'Velocity'),
        ('PAL', 'Pascal', 'Pressure (ventilation)'),
        ('KPA', 'Kilopascal', 'Pressure (pipes)'),
        ('CEL', 'Degree Celsius', 'Temperature'),
        ('2N', 'Decibel', 'Sound levels'),
        ('DD', 'Degree', 'Angles'),
        ('SEC', 'Second', 'Time'),
    ]
    
    for unit_row in unit_reference:
        units_ws.append(unit_row)
    
    # Style unit codes sheet
    for row in units_ws.iter_rows(min_row=1, max_row=1):
        for cell in row:
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
            cell.font = Font(bold=True, color='FFFFFF')
    
    units_ws.column_dimensions['A'].width = 12
    units_ws.column_dimensions['B'].width = 25
    units_ws.column_dimensions['C'].width = 40
    
    # Save workbook
    wb.save(output_file)
    print(f"[OK] Excel file generated: {output_file}")
    print(f"[OK] Total properties mapped: {len(properties)}")
    print(f"[OK] Sheets created: {', '.join([ws.title for ws in wb.worksheets])}")


def main():
    """Main execution function."""
    import os
    
    # File paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_file = os.path.join(script_dir, 'property.json')
    output_file = os.path.join(script_dir, 'BIP_Peppol_Complete_Mapping.xlsx')
    
    # Check if property.json exists
    if not os.path.exists(json_file):
        print(f"[ERROR] property.json not found at {json_file}")
        print("   Please ensure property.json is in the same directory as this script.")
        return 1
    
    try:
        print("Starting BIP to Peppol mapping Excel generation...")
        print(f"Reading properties from: {json_file}")
        
        create_excel_mapping(json_file, output_file)
        
        print("\n[OK] Generation complete!")
        print(f"\nOpen the file: {output_file}")
        
        return 0
        
    except Exception as e:
        print(f"\n[ERROR] Error during generation: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit(main())

