#!/usr/bin/env python3
"""
IFC to Peppol Catalogue Transformer using ifcopenshell

This script uses ifcopenshell to parse IFC files directly and generates
Peppol BIS Catalogue format XML, using the XSLT stylesheet as a reference
template for structure and mapping rules.

Requirements:
    pip install ifcopenshell lxml

Usage:
    python transform_ifc_to_peppol.py <input_ifc_file> [output_catalogue.xml]
    
Example:
    python transform_ifc_to_peppol.py ../../models/A-40-V-000_BIM2BOM.ifc
    python transform_ifc_to_peppol.py ../../models/A-40-V-000_BIM2BOM.ifc output_catalogue.xml
"""

import sys
import os
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any

try:
    import ifcopenshell
except ImportError:
    print("ERROR: ifcopenshell library not found.")
    print("Please install it with: pip install ifcopenshell")
    sys.exit(1)

try:
    from lxml import etree
except ImportError:
    print("ERROR: lxml library not found.")
    print("Please install it with: pip install lxml")
    sys.exit(1)


# Namespaces for Peppol XML
NS_CATALOGUE = "urn:oasis:names:specification:ubl:schema:xsd:Catalogue-2"
NS_CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
NS_CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"

# IFC building element types to process
# Matches BIM2BOM.ids specification and XSLT stylesheet behavior
# Includes all elements that typically have BIP property sets
IFC_ELEMENT_TYPES = [
    'IfcWall',
    'IfcWallStandardCase',  # Common wall type variant
    'IfcDoor',
    'IfcWindow',
    'IfcSlab',
    'IfcBeam',
    'IfcColumn',
    'IfcRoof',
    'IfcStair',
    'IfcStairFlight',  # Stair flight elements
    'IfcRailing',
    'IfcPlate',
    'IfcMember',
    'IfcChimney',
    'IfcCovering',  # Floor coverings, ceiling panels, etc.
    'IfcCurtainWall',  # Curtain wall systems
    'IfcFurniture',  # Furniture and fixtures
    'IfcFlowTerminal',  # Flow terminals (sinks, faucets, etc.)
    'IfcOpeningElement',  # Openings in walls/floors
    'IfcBuildingElementProxy',  # Generic/proxy elements
]


def get_unit_code(property_name: str) -> str:
    """
    Get unit code based on property name pattern.
    Matches logic from stylesheet template.
    """
    lower_name = property_name.lower()
    
    if any(keyword in lower_name for keyword in ['height', 'length', 'width', 'thickness', 'diameter']):
        return 'MMT'  # Millimeters
    elif 'area' in lower_name:
        return 'MTK'  # Square meters
    elif 'volume' in lower_name:
        return 'MTQ'  # Cubic meters
    elif 'weight' in lower_name:
        return 'KGM'  # Kilograms
    else:
        return ''


def format_value(property_name: str, value: str) -> str:
    """
    Format property value with unit suffix.
    Matches logic from stylesheet template.
    """
    if not value:
        return ''
    
    lower_name = property_name.lower()
    lower_value = value.lower()
    
    # Boolean values
    if lower_value == 'true' or value == '1':
        return 'Yes'
    elif lower_value == 'false' or value == '0':
        return 'No'
    
    # Dimension values (height, length, width, thickness, diameter)
    if any(keyword in lower_name for keyword in ['height', 'length', 'width', 'thickness', 'diameter']):
        if 'mm' not in value.lower():
            return f'{value} mm'
    
    # Area values
    if 'area' in lower_name and 'm' not in value.lower():
        return f'{value} m²'
    
    # Volume values
    if 'volume' in lower_name and 'm' not in value.lower():
        return f'{value} m³'
    
    # Weight values
    if 'weight' in lower_name and 'kg' not in value.lower():
        return f'{value} kg'
    
    return value


def extract_bip_properties(element) -> Optional[Tuple[Dict[str, str], float]]:
    """
    Extract BIP property set from an IFC element.
    
    Returns:
        Tuple of (properties_dict, mmi_value) if BIP property set found, None otherwise
    """
    if not hasattr(element, 'IsDefinedBy'):
        return None
    
    properties = {}
    mmi_value = None
    
    for definition in element.IsDefinedBy:
        if definition.is_a('IfcRelDefinesByProperties'):
            prop_def = definition.RelatingPropertyDefinition
            
            if prop_def.is_a('IfcPropertySet') and prop_def.Name == 'BIP':
                # Extract all properties
                for prop in prop_def.HasProperties:
                    if prop.is_a('IfcPropertySingleValue'):
                        prop_name = prop.Name
                        if prop.NominalValue:
                            prop_value = prop.NominalValue.wrappedValue
                            # Convert to string
                            if isinstance(prop_value, (int, float)):
                                prop_value = str(prop_value)
                            elif prop_value is None:
                                prop_value = ''
                            else:
                                prop_value = str(prop_value)
                            properties[prop_name] = prop_value
                            
                            if prop_name == 'MMI':
                                try:
                                    mmi_value = float(prop_value) if prop_value else None
                                except (ValueError, TypeError):
                                    mmi_value = None
                
                return (properties, mmi_value)
    
    return None


def extract_project_metadata(model) -> Dict[str, str]:
    """
    Extract project metadata from IFC file header.
    """
    metadata = {
        'projectNumber': None,
        'projectName': None,
        'organizationName': None,
        'issueDate': None,
    }
    
    # Try to get from file header
    if hasattr(model, 'file') and model.file:
        header = model.file.header
        
        # Get timestamp
        if hasattr(header, 'file_name') and header.file_name:
            if hasattr(header.file_name, 'time_stamp'):
                timestamp = header.file_name.time_stamp
                if timestamp:
                    # Format as YYYY-MM-DD
                    try:
                        if isinstance(timestamp, str):
                            if 'T' in timestamp:
                                metadata['issueDate'] = timestamp.split('T')[0]
                            else:
                                metadata['issueDate'] = timestamp
                        else:
                            metadata['issueDate'] = timestamp.strftime('%Y-%m-%d')
                    except:
                        pass
        
        # Try to get from file_description
        if hasattr(header, 'file_description') and header.file_description:
            descriptions = header.file_description.description if hasattr(header.file_description, 'description') else []
            for desc in descriptions:
                if desc and 'Project' in desc:
                    # Try to extract project info
                    pass
    
    # Fallback to current date
    if not metadata['issueDate']:
        metadata['issueDate'] = datetime.now().strftime('%Y-%m-%d')
    
    return metadata


def get_element_global_id(element) -> str:
    """
    Get GlobalID from IFC element.
    """
    if hasattr(element, 'GlobalId'):
        return element.GlobalId
    return str(element.id())


def get_element_name(element) -> str:
    """
    Get Name attribute from IFC element.
    """
    if hasattr(element, 'Name') and element.Name:
        return element.Name
    return ''


def get_element_object_type(element) -> str:
    """
    Get ObjectType attribute from IFC element.
    """
    if hasattr(element, 'ObjectType') and element.ObjectType:
        return element.ObjectType
    return ''


def create_catalogue_root(metadata: Dict[str, str]) -> etree.Element:
    """
    Create the root Catalogue element with proper structure.
    """
    # Create root element with namespaces
    nsmap = {
        None: NS_CATALOGUE,
        'cac': NS_CAC,
        'cbc': NS_CBC,
    }
    
    catalogue = etree.Element('{'+NS_CATALOGUE+'}Catalogue', nsmap=nsmap)
    
    # Add processing instructions (will be added separately)
    
    # CustomizationID
    cust_id = etree.SubElement(catalogue, '{'+NS_CBC+'}CustomizationID')
    cust_id.text = 'urn:fdc:peppol.eu:poacc:trns:catalogue:3'
    
    # ProfileID
    profile_id = etree.SubElement(catalogue, '{'+NS_CBC+'}ProfileID')
    profile_id.text = 'urn:fdc:peppol.eu:poacc:bis:catalogue_only:3'
    
    # ID
    cat_id = etree.SubElement(catalogue, '{'+NS_CBC+'}ID')
    cat_id.text = metadata.get('projectNumber') or 'CATALOGUE-001'
    
    # ActionCode
    action_code = etree.SubElement(catalogue, '{'+NS_CBC+'}ActionCode')
    action_code.text = 'Add'
    
    # Name
    name = etree.SubElement(catalogue, '{'+NS_CBC+'}Name')
    name.text = metadata.get('projectName') or 'BIM2BOM Catalogue'
    
    # IssueDate (Ref §2.6)
    issue_date_val = metadata.get('issueDate') or datetime.now().strftime('%Y-%m-%d')
    issue_date = etree.SubElement(catalogue, '{'+NS_CBC+'}IssueDate')
    issue_date.text = issue_date_val
    
    # ValidityPeriod (Ref §2.7) -- StartDate + EndDate (default 90 days)
    validity_period = etree.SubElement(catalogue, '{'+NS_CAC+'}ValidityPeriod')
    start_date = etree.SubElement(validity_period, '{'+NS_CBC+'}StartDate')
    start_date.text = issue_date_val
    try:
        end_dt = datetime.strptime(issue_date_val, '%Y-%m-%d') + timedelta(days=90)
        end_date_str = end_dt.strftime('%Y-%m-%d')
    except (ValueError, TypeError):
        end_date_str = issue_date_val
    end_date = etree.SubElement(validity_period, '{'+NS_CBC+'}EndDate')
    end_date.text = end_date_str
    
    # ReferencedContract
    ref_contract = etree.SubElement(catalogue, '{'+NS_CAC+'}ReferencedContract')
    contract_id = etree.SubElement(ref_contract, '{'+NS_CBC+'}ID')
    contract_id.text = f"CONTRACT-{metadata.get('projectNumber') or '001'}"
    
    # ProviderParty
    provider = etree.SubElement(catalogue, '{'+NS_CAC+'}ProviderParty')
    endpoint_id = etree.SubElement(provider, '{'+NS_CBC+'}EndpointID')
    endpoint_id.set('schemeID', '0007')
    endpoint_id.text = '0000000000'
    party_id = etree.SubElement(provider, '{'+NS_CAC+'}PartyIdentification')
    party_id_elem = etree.SubElement(party_id, '{'+NS_CBC+'}ID')
    party_id_elem.set('schemeID', '0007')
    party_id_elem.text = '0000000000'
    legal_entity = etree.SubElement(provider, '{'+NS_CAC+'}PartyLegalEntity')
    reg_name = etree.SubElement(legal_entity, '{'+NS_CBC+'}RegistrationName')
    reg_name.text = metadata.get('organizationName') or 'Provider Organization'
    
    # ReceiverParty
    receiver = etree.SubElement(catalogue, '{'+NS_CAC+'}ReceiverParty')
    endpoint_id_r = etree.SubElement(receiver, '{'+NS_CBC+'}EndpointID')
    endpoint_id_r.set('schemeID', '0007')
    endpoint_id_r.text = '0000000000'
    party_id_r = etree.SubElement(receiver, '{'+NS_CAC+'}PartyIdentification')
    party_id_elem_r = etree.SubElement(party_id_r, '{'+NS_CBC+'}ID')
    party_id_elem_r.set('schemeID', '0007')
    party_id_elem_r.text = '0000000000'
    legal_entity_r = etree.SubElement(receiver, '{'+NS_CAC+'}PartyLegalEntity')
    reg_name_r = etree.SubElement(legal_entity_r, '{'+NS_CBC+'}RegistrationName')
    reg_name_r.text = 'TBD'
    
    return catalogue


def create_catalogue_line(element, bip_properties: Dict[str, str], ifc_filename: str = '') -> etree.Element:
    """
    Create a CatalogueLine element for an IFC element.
    Follows UBL 2.1 element ordering per XML_MESSAGE_REFERENCE.md.
    """
    catalogue_line = etree.Element('{'+NS_CAC+'}CatalogueLine')

    global_id = get_element_global_id(element)
    element_id = str(element.id()) if hasattr(element, 'id') else ''

    # cbc:ID (Ref §4.1)
    line_id = etree.SubElement(catalogue_line, '{'+NS_CBC+'}ID')
    line_id.text = global_id

    # cbc:ActionCode (Ref §4.2)
    action_code = etree.SubElement(catalogue_line, '{'+NS_CBC+'}ActionCode')
    action_code.text = 'Add'

    # cbc:OrderableIndicator (Ref §4.3)
    orderable = etree.SubElement(catalogue_line, '{'+NS_CBC+'}OrderableIndicator')
    orderable.text = 'true'

    # cbc:OrderableUnit (Ref §4.4) -- MTR for wall-type elements
    orderable_unit = etree.SubElement(catalogue_line, '{'+NS_CBC+'}OrderableUnit')
    orderable_unit.text = 'MTR'

    # cbc:ContentUnitQuantity (Ref §4.5) -- from BIP length when available
    length_val = bip_properties.get('length')
    if length_val:
        try:
            length_m = float(length_val) / 1000.0
            content_qty = etree.SubElement(catalogue_line, '{'+NS_CBC+'}ContentUnitQuantity')
            content_qty.set('unitCode', 'MTR')
            content_qty.text = f'{length_m:.2f}'
        except (ValueError, TypeError):
            pass

    # --- cac:Item (UBL 2.1 child ordering) ---
    item = etree.SubElement(catalogue_line, '{'+NS_CAC+'}Item')

    # cbc:Description (Ref §8.1) -- before Name per UBL sequence
    type_desc = bip_properties.get('TypeDescription')
    materials = bip_properties.get('materials/components')
    if type_desc:
        desc_text = type_desc
        if materials:
            desc_text += f'. Materials: {materials}'
        description = etree.SubElement(item, '{'+NS_CBC+'}Description')
        description.text = desc_text

    # cbc:Name (Ref §8.2) -- REQUIRED
    name = etree.SubElement(item, '{'+NS_CBC+'}Name')
    name.text = get_element_name(element)

    # cbc:BrandName
    manufacturer = bip_properties.get('Manufacturer')
    if manufacturer:
        brand_name = etree.SubElement(item, '{'+NS_CBC+'}BrandName')
        brand_name.text = manufacturer

    # cbc:Keyword(s)
    bsab_code = bip_properties.get('BSAB 96')
    if bsab_code:
        keyword = etree.SubElement(item, '{'+NS_CBC+'}Keyword')
        keyword.text = bsab_code

    object_type = get_element_object_type(element)
    if object_type:
        keyword = etree.SubElement(item, '{'+NS_CBC+'}Keyword')
        keyword.text = object_type

    is_external = bip_properties.get('is external')
    if is_external:
        keyword = etree.SubElement(item, '{'+NS_CBC+'}Keyword')
        keyword.text = 'external' if is_external.lower() == 'true' else 'internal'

    # cac:BuyersItemIdentification (Ref §7.1) -- from BIP TypeID
    type_id_val = bip_properties.get('TypeID')
    if type_id_val:
        buyers_id = etree.SubElement(item, '{'+NS_CAC+'}BuyersItemIdentification')
        buyers_id_elem = etree.SubElement(buyers_id, '{'+NS_CBC+'}ID')
        buyers_id_elem.text = type_id_val

    # cac:ManufacturersItemIdentification (Ref §7.3)
    type_id = bip_properties.get('type name id')
    if type_id:
        mfr_id = etree.SubElement(item, '{'+NS_CAC+'}ManufacturersItemIdentification')
        mfr_id_elem = etree.SubElement(mfr_id, '{'+NS_CBC+'}ID')
        mfr_id_elem.text = type_id

    # cac:ItemSpecificationDocumentReference (Ref §9.1)
    if ifc_filename:
        doc_ref = etree.SubElement(item, '{'+NS_CAC+'}ItemSpecificationDocumentReference')
        doc_ref_id = etree.SubElement(doc_ref, '{'+NS_CBC+'}ID')
        doc_ref_id.text = 'IFC-MODEL-REF'
        doc_desc = etree.SubElement(doc_ref, '{'+NS_CBC+'}DocumentDescription')
        doc_desc.text = 'IFC model file - Originating BIM model'
        attachment = etree.SubElement(doc_ref, '{'+NS_CAC+'}Attachment')
        ext_ref = etree.SubElement(attachment, '{'+NS_CAC+'}ExternalReference')
        uri_elem = etree.SubElement(ext_ref, '{'+NS_CBC+'}URI')
        uri_elem.text = f'https://cde.example.com/models/{ifc_filename}'

    # cac:ManufacturerParty
    if manufacturer:
        mfr_party = etree.SubElement(item, '{'+NS_CAC+'}ManufacturerParty')
        party_name = etree.SubElement(mfr_party, '{'+NS_CAC+'}PartyName')
        name_elem = etree.SubElement(party_name, '{'+NS_CBC+'}Name')
        name_elem.text = manufacturer

    # cac:ItemInstance (LotNumberID)
    lot_number = bip_properties.get('LotNumberID')
    if lot_number:
        item_instance = etree.SubElement(item, '{'+NS_CAC+'}ItemInstance')
        lot_ident = etree.SubElement(item_instance, '{'+NS_CAC+'}LotIdentification')
        lot_id = etree.SubElement(lot_ident, '{'+NS_CBC+'}LotNumberID')
        lot_id.text = lot_number

    # cac:AdditionalItemProperty -- BEAst properties (Ref §10.1)
    beast_cde = etree.SubElement(item, '{'+NS_CAC+'}AdditionalItemProperty')
    etree.SubElement(beast_cde, '{'+NS_CBC+'}Name').text = 'CDEGuid'
    cde_nc = etree.SubElement(beast_cde, '{'+NS_CBC+'}NameCode')
    cde_nc.set('listID', 'ORG:BEAst')
    cde_nc.text = 'CDEGuid'
    etree.SubElement(beast_cde, '{'+NS_CBC+'}Value').text = global_id

    beast_auth = etree.SubElement(item, '{'+NS_CAC+'}AdditionalItemProperty')
    etree.SubElement(beast_auth, '{'+NS_CBC+'}Name').text = 'AuthoringToolId'
    auth_nc = etree.SubElement(beast_auth, '{'+NS_CBC+'}NameCode')
    auth_nc.set('listID', 'ORG:BEAst')
    auth_nc.text = 'AuthoringToolId'
    etree.SubElement(beast_auth, '{'+NS_CBC+'}Value').text = element_id

    # cac:AdditionalItemProperty -- BIP properties (Ref §10.2)
    for prop_name, prop_value in sorted(bip_properties.items()):
        if prop_value and prop_value != '':
            add_prop = etree.SubElement(item, '{'+NS_CAC+'}AdditionalItemProperty')

            prop_name_elem = etree.SubElement(add_prop, '{'+NS_CBC+'}Name')
            prop_name_elem.text = prop_name

            name_code = etree.SubElement(add_prop, '{'+NS_CBC+'}NameCode')
            name_code.set('listID', 'SE:BIP-koder')
            name_code.text = prop_name

            value_elem = etree.SubElement(add_prop, '{'+NS_CBC+'}Value')
            value_elem.text = format_value(prop_name, prop_value)

            unit_code = get_unit_code(prop_name)
            if unit_code:
                value_qty = etree.SubElement(add_prop, '{'+NS_CBC+'}ValueQuantity')
                value_qty.set('unitCode', unit_code)
                value_qty.text = prop_value

    return catalogue_line


def transform_ifc_to_peppol(ifc_path: str, output_path: str) -> bool:
    """
    Transform IFC file to Peppol Catalogue XML using ifcopenshell.
    
    Args:
        ifc_path: Path to input IFC file
        output_path: Path for output Peppol catalogue XML
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        print(f"Loading IFC file: {ifc_path}")
        model = ifcopenshell.open(ifc_path)
        ifc_filename = os.path.basename(ifc_path)
        
        # Extract project metadata
        metadata = extract_project_metadata(model)
        print(f"  Project metadata extracted")
        
        # Create root catalogue element
        catalogue = create_catalogue_root(metadata)
        
        # Process all IFC elements (matching stylesheet: //*[starts-with(name(), 'Ifc')])
        processed_count = 0
        filtered_count = 0
        
        # Get all elements from the model - filter by hardcoded IFC_ELEMENT_TYPES
        for element_type in IFC_ELEMENT_TYPES:
            elements = model.by_type(element_type)
            for element in elements:
                processed_count += 1
                
                # Extract BIP properties
                result = extract_bip_properties(element)
                if result is None:
                    continue
                
                bip_properties, mmi_value = result
                
                # Filter by MMI >= 375
                if mmi_value is None or mmi_value < 375:
                    continue
                
                filtered_count += 1
                
                # Create catalogue line
                catalogue_line = create_catalogue_line(element, bip_properties, ifc_filename)
                catalogue.append(catalogue_line)
        
        print(f"  Processed {processed_count} elements, {filtered_count} passed MMI filter (>= 375)")
        
        # Create XML tree
        tree = etree.ElementTree(catalogue)
        
        # Write output with processing instructions
        print(f"Writing output to: {output_path}")
        
        # Create output directory if needed
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
        
        # Write XML with processing instructions
        with open(output_path, 'wb') as f:
            # Write XML declaration
            f.write(b'<?xml version=\'1.0\' encoding=\'UTF-8\'?>\n')
            # Write processing instructions
            f.write(b'<?DocumentTerm Catalogue?>\n')
            f.write(b'<?Property key="sch:prefix" PEPPOL-T19?>\n')
            f.write(b'<?Property key="sch:identifier" T19-basic?>\n')
            # Write the element tree
            tree.write(f, encoding='utf-8', xml_declaration=False, pretty_print=True)
        
        print(f"\n[SUCCESS] Transformation successful!")
        print(f"  Output file: {output_path}")
        print(f"  Catalogue lines created: {filtered_count}")
        
        return True
        
    except Exception as e:
        print(f"\nERROR: Failed to transform IFC to Peppol")
        print(f"  {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main entry point for the script."""
    
    parser = argparse.ArgumentParser(
        description='Transform IFC file to Peppol Catalogue format using ifcopenshell',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python transform_ifc_to_peppol.py ../../models/A-40-V-000_BIM2BOM.ifc
  python transform_ifc_to_peppol.py ../../models/A-40-V-000_BIM2BOM.ifc output_catalogue.xml
        """
    )
    
    parser.add_argument('input_file', help='Input IFC file')
    parser.add_argument('output_file', nargs='?', help='Output Peppol catalogue XML file (optional)')
    
    args = parser.parse_args()
    
    # Get input file path
    ifc_path = args.input_file
    if not os.path.exists(ifc_path):
        print(f"ERROR: Input file not found: {ifc_path}")
        sys.exit(1)
    
    # Get output file path (or generate default)
    if args.output_file:
        output_path = args.output_file
    else:
        input_name = Path(ifc_path).stem
        script_dir = Path(__file__).parent
        output_dir = script_dir.parent / 'output'
        output_path = str(output_dir / f"{input_name}_ifcopenshell_catalogue.xml")
    
    # Print header
    print("=" * 60)
    print("IFC to Peppol Catalogue Transformation (ifcopenshell)")
    print("=" * 60)
    print()
    
    # Perform transformation
    success = transform_ifc_to_peppol(ifc_path, output_path)
    
    if success:
        print("\nNext steps:")
        print("  1. Review the output catalogue XML")
        print("  2. Validate against Peppol BIS schema")
        print("  3. Compare with ifcconvert output for verification")
        sys.exit(0)
    else:
        print("\nTransformation failed. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()

