#!/usr/bin/env python3
"""
IFC to Peppol Catalogue Transformation Script

This script applies the XSLT transformation to convert IFC XML files
into Peppol BIS Catalogue format with BIP property mapping.

Requirements:
    pip install lxml openpyxl

Usage:
    python transform_ifc_to_peppol.py <input_ifc.xml> [output_catalogue.xml] [--stylesheet <xslt_file>] [--excel]
    
Example:
    python transform_ifc_to_peppol.py ../A-40-V-000_BIM2BOM.ifc.xml output_catalogue.xml
    python transform_ifc_to_peppol.py ../A-40-V-000_BIM2BOM.ifc.xml output.xml --stylesheet stylesheets/custom.xslt
    python transform_ifc_to_peppol.py ../A-40-V-000_BIM2BOM.ifc.xml output.xml --excel
"""

import sys
import os
import argparse
from pathlib import Path

try:
    from lxml import etree
except ImportError:
    print("ERROR: lxml library not found.")
    print("Please install it with: pip install lxml")
    sys.exit(1)

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill
    from openpyxl.utils import get_column_letter
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False


def generate_excel_from_catalogue(xml_path, excel_path):
    """
    Generate Excel file from Peppol catalogue XML.
    
    Args:
        xml_path: Path to Peppol catalogue XML file
        excel_path: Path for output Excel file
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        print(f"\nGenerating Excel file: {excel_path}")
        
        # Parse XML
        doc = etree.parse(xml_path)
        
        # Namespaces
        ns = {
            'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
            'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
        }
        
        # Create workbook
        wb = Workbook()
        wb.remove(wb.active)  # Remove default sheet
        
        # === SHEET 1: Headers ===
        headers_sheet = wb.create_sheet("Headers")
        
        # Header styling
        header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True, size=11)
        header_alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        
        # Add catalogue headers
        header_data = [
            ["Catalogue Header", "Value"],
            ["Customization ID", doc.xpath('//cbc:CustomizationID/text()', namespaces=ns)[0] if doc.xpath('//cbc:CustomizationID/text()', namespaces=ns) else ""],
            ["Profile ID", doc.xpath('//cbc:ProfileID/text()', namespaces=ns)[0] if doc.xpath('//cbc:ProfileID/text()', namespaces=ns) else ""],
            ["Catalogue ID", doc.xpath('//cbc:ID/text()', namespaces=ns)[0] if doc.xpath('//cbc:ID/text()', namespaces=ns) else ""],
            ["Action Code", doc.xpath('//cbc:ActionCode/text()', namespaces=ns)[0] if doc.xpath('//cbc:ActionCode/text()', namespaces=ns) else ""],
            ["Name", doc.xpath('//cbc:Name/text()', namespaces=ns)[0] if doc.xpath('//cbc:Name/text()', namespaces=ns) else ""],
            ["Issue Date", doc.xpath('//cbc:IssueDate/text()', namespaces=ns)[0] if doc.xpath('//cbc:IssueDate/text()', namespaces=ns) else ""],
            ["Validity Start", doc.xpath('//cac:ValidityPeriod/cbc:StartDate/text()', namespaces=ns)[0] if doc.xpath('//cac:ValidityPeriod/cbc:StartDate/text()', namespaces=ns) else ""],
            ["Validity End", doc.xpath('//cac:ValidityPeriod/cbc:EndDate/text()', namespaces=ns)[0] if doc.xpath('//cac:ValidityPeriod/cbc:EndDate/text()', namespaces=ns) else ""],
            ["Contract ID", doc.xpath('//cac:ReferencedContract/cbc:ID/text()', namespaces=ns)[0] if doc.xpath('//cac:ReferencedContract/cbc:ID/text()', namespaces=ns) else ""],
        ]
        
        for row_idx, row_data in enumerate(header_data, 1):
            for col_idx, value in enumerate(row_data, 1):
                cell = headers_sheet.cell(row=row_idx, column=col_idx, value=value)
                if row_idx == 1:
                    cell.fill = header_fill
                    cell.font = header_font
                    cell.alignment = header_alignment
        
        headers_sheet.column_dimensions['A'].width = 25
        headers_sheet.column_dimensions['B'].width = 60
        
        # === SHEET 2+: Catalogue Lines ===
        catalogue_lines = doc.xpath('//cac:CatalogueLine', namespaces=ns)
        
        # Group by LotNumberID
        lots = {}
        no_lot_lines = []
        
        for line in catalogue_lines:
            lot_id_elements = line.xpath('.//cac:ItemInstance/cac:LotIdentification/cbc:LotNumberID/text()', namespaces=ns)
            
            if lot_id_elements:
                lot_id = lot_id_elements[0]
                if lot_id not in lots:
                    lots[lot_id] = []
                lots[lot_id].append(line)
            else:
                no_lot_lines.append(line)
        
        # Create sheets for each lot or single catalogue sheet
        if lots:
            # Multiple sheets by lot
            for lot_id, lines in sorted(lots.items()):
                sheet = wb.create_sheet(f"Lot_{lot_id}")
                _populate_catalogue_sheet(sheet, lines, ns, header_fill, header_font, header_alignment)
            
            # Add sheet for items without lot
            if no_lot_lines:
                sheet = wb.create_sheet("No_Lot")
                _populate_catalogue_sheet(sheet, no_lot_lines, ns, header_fill, header_font, header_alignment)
        else:
            # Single catalogue sheet
            sheet = wb.create_sheet("Catalogue")
            _populate_catalogue_sheet(sheet, catalogue_lines, ns, header_fill, header_font, header_alignment)
        
        # Save workbook
        wb.save(excel_path)
        print(f"[SUCCESS] Excel file created: {excel_path}")
        print(f"  Sheets created: {len(wb.sheetnames)}")
        print(f"  Total catalogue lines: {len(catalogue_lines)}")
        
        return True
        
    except Exception as e:
        print(f"\nERROR: Failed to generate Excel file")
        print(f"  {e}")
        import traceback
        traceback.print_exc()
        return False


def _populate_catalogue_sheet(sheet, lines, ns, header_fill, header_font, header_alignment):
    """Helper function to populate a catalogue sheet with lines."""
    
    # Column headers
    columns = [
        "Line ID", "Name", "Description", "Brand Name", "Keywords",
        "Manufacturer ID", "Manufacturer Name", "Lot Number",
        "Properties (Name: Value)"
    ]
    
    # Write headers
    for col_idx, col_name in enumerate(columns, 1):
        cell = sheet.cell(row=1, column=col_idx, value=col_name)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_alignment
    
    # Write data
    for row_idx, line in enumerate(lines, 2):
        # Line ID
        line_id = line.xpath('./cbc:ID/text()', namespaces=ns)[0] if line.xpath('./cbc:ID/text()', namespaces=ns) else ""
        sheet.cell(row=row_idx, column=1, value=line_id)
        
        # Name
        name = line.xpath('.//cbc:Name/text()', namespaces=ns)[0] if line.xpath('.//cbc:Name/text()', namespaces=ns) else ""
        sheet.cell(row=row_idx, column=2, value=name)
        
        # Description
        desc = line.xpath('.//cbc:Description/text()', namespaces=ns)[0] if line.xpath('.//cbc:Description/text()', namespaces=ns) else ""
        sheet.cell(row=row_idx, column=3, value=desc)
        
        # Brand Name
        brand = line.xpath('.//cbc:BrandName/text()', namespaces=ns)[0] if line.xpath('.//cbc:BrandName/text()', namespaces=ns) else ""
        sheet.cell(row=row_idx, column=4, value=brand)
        
        # Keywords (join multiple)
        keywords = line.xpath('.//cbc:Keyword/text()', namespaces=ns)
        sheet.cell(row=row_idx, column=5, value=", ".join(keywords))
        
        # Manufacturer ID
        mfr_id = line.xpath('.//cac:ManufacturersItemIdentification/cbc:ID/text()', namespaces=ns)[0] if line.xpath('.//cac:ManufacturersItemIdentification/cbc:ID/text()', namespaces=ns) else ""
        sheet.cell(row=row_idx, column=6, value=mfr_id)
        
        # Manufacturer Name
        mfr_name = line.xpath('.//cac:ManufacturerParty/cac:PartyName/cbc:Name/text()', namespaces=ns)[0] if line.xpath('.//cac:ManufacturerParty/cac:PartyName/cbc:Name/text()', namespaces=ns) else ""
        sheet.cell(row=row_idx, column=7, value=mfr_name)
        
        # Lot Number
        lot = line.xpath('.//cac:ItemInstance/cac:LotIdentification/cbc:LotNumberID/text()', namespaces=ns)[0] if line.xpath('.//cac:ItemInstance/cac:LotIdentification/cbc:LotNumberID/text()', namespaces=ns) else ""
        sheet.cell(row=row_idx, column=8, value=lot)
        
        # Properties (concatenated)
        properties = []
        for prop in line.xpath('.//cac:AdditionalItemProperty', namespaces=ns):
            prop_name = prop.xpath('./cbc:Name/text()', namespaces=ns)[0] if prop.xpath('./cbc:Name/text()', namespaces=ns) else ""
            prop_value = prop.xpath('./cbc:Value/text()', namespaces=ns)[0] if prop.xpath('./cbc:Value/text()', namespaces=ns) else ""
            if prop_name and prop_value:
                properties.append(f"{prop_name}: {prop_value}")
        
        sheet.cell(row=row_idx, column=10, value="\n".join(properties[:10]))  # Limit to first 10 properties
    
    # Auto-size columns
    for col_idx in range(1, 11):
        column_letter = get_column_letter(col_idx)
        if col_idx == 10:
            sheet.column_dimensions[column_letter].width = 60
        elif col_idx in [2, 3]:
            sheet.column_dimensions[column_letter].width = 40
        elif col_idx == 5:
            sheet.column_dimensions[column_letter].width = 30
        else:
            sheet.column_dimensions[column_letter].width = 20


def transform_ifc_to_peppol(ifc_xml_path, xslt_path, output_path):
    """
    Transform IFC XML to Peppol Catalogue using XSLT.
    
    Args:
        ifc_xml_path: Path to input IFC XML file
        xslt_path: Path to XSLT stylesheet
        output_path: Path for output Peppol catalogue XML
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        print(f"Loading XSLT stylesheet: {xslt_path}")
        xslt_doc = etree.parse(xslt_path)
        transform = etree.XSLT(xslt_doc)
        
        print(f"Loading IFC XML: {ifc_xml_path}")
        ifc_doc = etree.parse(ifc_xml_path)
        
        print("Applying transformation...")
        result = transform(ifc_doc)
        
        # Check for transformation errors
        if transform.error_log:
            print("\nTransformation warnings/errors:")
            for entry in transform.error_log:
                print(f"  - {entry}")
        
        print(f"Writing output to: {output_path}")
        with open(output_path, 'wb') as f:
            f.write(etree.tostring(
                result,
                pretty_print=True,
                xml_declaration=True,
                encoding='UTF-8'
            ))
        
        print(f"\n[SUCCESS] Transformation successful!")
        print(f"  Output file: {output_path}")
        
        # Show statistics
        catalogue_lines = result.xpath('//cac:CatalogueLine', 
                                      namespaces={'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2'})
        print(f"  Catalogue lines created: {len(catalogue_lines)}")
        
        return True
        
    except etree.XSLTParseError as e:
        print(f"\nERROR: Failed to parse XSLT stylesheet")
        print(f"  {e}")
        return False
        
    except etree.XMLSyntaxError as e:
        print(f"\nERROR: Invalid XML syntax in input file")
        print(f"  {e}")
        return False
        
    except FileNotFoundError as e:
        print(f"\nERROR: File not found")
        print(f"  {e}")
        return False
        
    except Exception as e:
        print(f"\nERROR: Unexpected error during transformation")
        print(f"  {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main entry point for the script."""
    
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description='Transform IFC XML to Peppol Catalogue format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python transform_ifc_to_peppol.py ../A-40-V-000_BIM2BOM.ifc.xml
  python transform_ifc_to_peppol.py ../A-40-V-000_BIM2BOM.ifc.xml output.xml
  python transform_ifc_to_peppol.py ../A-40-V-000_BIM2BOM.ifc.xml output.xml --stylesheet stylesheets/custom.xslt
        """
    )
    
    parser.add_argument('input_file', help='Input IFC XML file')
    parser.add_argument('output_file', nargs='?', help='Output Peppol catalogue XML file (optional)')
    parser.add_argument('--stylesheet', '-s', help='Custom XSLT stylesheet path (optional)')
    parser.add_argument('--excel', '-e', action='store_true', help='Generate Excel file alongside XML')
    
    args = parser.parse_args()
    
    # Check Excel availability if requested
    if args.excel and not EXCEL_AVAILABLE:
        print("ERROR: openpyxl library not found.")
        print("Please install it with: pip install openpyxl")
        sys.exit(1)
    
    # Get input file path
    ifc_xml_path = args.input_file
    if not os.path.exists(ifc_xml_path):
        print(f"ERROR: Input file not found: {ifc_xml_path}")
        sys.exit(1)
    
    # Get output file path (or generate default)
    if args.output_file:
        output_path = args.output_file
    else:
        input_name = Path(ifc_xml_path).stem
        output_path = f"{input_name}_peppol_catalogue.xml"
    
    # Get XSLT path
    script_dir = Path(__file__).parent
    
    if args.stylesheet:
        # Use custom stylesheet
        xslt_path = Path(args.stylesheet)
        if not xslt_path.is_absolute():
            xslt_path = script_dir.parent / args.stylesheet
    else:
        # Use default stylesheet
        xslt_path = script_dir.parent / "stylesheets" / "default-stylesheet-bip_to_peppol.xslt"
    
    if not os.path.exists(xslt_path):
        print(f"ERROR: XSLT stylesheet not found: {xslt_path}")
        print("Please ensure the stylesheet exists.")
        sys.exit(1)
    
    # Print header
    print("=" * 60)
    print("IFC to Peppol Catalogue Transformation")
    print("=" * 60)
    print(f"Stylesheet: {xslt_path.name}")
    print()
    
    # Perform transformation
    success = transform_ifc_to_peppol(ifc_xml_path, xslt_path, output_path)
    
    if success:
        # Generate Excel if requested
        if args.excel:
            excel_path = Path(output_path).with_suffix('.xlsx')
            excel_success = generate_excel_from_catalogue(output_path, excel_path)
            
            if not excel_success:
                print("\nWARNING: Excel generation failed, but XML was created successfully.")
        
        print("\nNext steps:")
        print("  1. Review the output catalogue XML")
        if args.excel:
            print("  2. Open the Excel file for easy viewing")
            print("  3. Validate against Peppol BIS schema")
            print("  4. Upload to BEAst Supply validator: https://bis.beast.se/")
        else:
            print("  2. Validate against Peppol BIS schema")
            print("  3. Upload to BEAst Supply validator: https://bis.beast.se/")
        sys.exit(0)
    else:
        print("\nTransformation failed. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()

