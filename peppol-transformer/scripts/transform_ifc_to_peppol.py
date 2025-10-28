#!/usr/bin/env python3
"""
IFC to Peppol Catalogue Transformation Script

This script applies the XSLT transformation to convert IFC XML files
into Peppol BIS Catalogue format with BIP property mapping.

Requirements:
    pip install lxml

Usage:
    python transform_ifc_to_peppol.py <input_ifc.xml> [output_catalogue.xml]
    
Example:
    python transform_ifc_to_peppol.py ../A-40-V-000_BIM2BOM.ifc.xml output_catalogue.xml
"""

import sys
import os
from pathlib import Path

try:
    from lxml import etree
except ImportError:
    print("ERROR: lxml library not found.")
    print("Please install it with: pip install lxml")
    sys.exit(1)


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
    
    # Check arguments
    if len(sys.argv) < 2:
        print("Usage: python transform_ifc_to_peppol.py <input_ifc.xml> [output_catalogue.xml]")
        print("\nExample:")
        print("  python transform_ifc_to_peppol.py ../A-40-V-000_BIM2BOM.ifc.xml output.xml")
        sys.exit(1)
    
    # Get input file path
    ifc_xml_path = sys.argv[1]
    if not os.path.exists(ifc_xml_path):
        print(f"ERROR: Input file not found: {ifc_xml_path}")
        sys.exit(1)
    
    # Get output file path (or generate default)
    if len(sys.argv) >= 3:
        output_path = sys.argv[2]
    else:
        input_name = Path(ifc_xml_path).stem
        output_path = f"{input_name}_peppol_catalogue.xml"
    
    # Get XSLT path (in parent directory)
    script_dir = Path(__file__).parent
    xslt_path = script_dir.parent / "Stylesheet-ifc_to_peppol_catalogue.xslt"
    
    if not os.path.exists(xslt_path):
        print(f"ERROR: XSLT stylesheet not found: {xslt_path}")
        print("Please ensure 'Stylesheet-ifc_to_peppol_catalogue.xslt' is in the parent directory.")
        sys.exit(1)
    
    # Print header
    print("=" * 60)
    print("IFC to Peppol Catalogue Transformation")
    print("=" * 60)
    print()
    
    # Perform transformation
    success = transform_ifc_to_peppol(ifc_xml_path, xslt_path, output_path)
    
    if success:
        print("\nNext steps:")
        print("  1. Review the output catalogue XML")
        print("  2. Validate against Peppol BIS schema")
        print("  3. Upload to BEAst Supply validator: https://bis.beast.se/")
        sys.exit(0)
    else:
        print("\nTransformation failed. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()

