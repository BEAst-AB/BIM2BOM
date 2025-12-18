"""
IFC to Peppol Catalogue Transformer for Pyodide
Ported from transform_ifc_to_peppol.py for browser execution
"""

from datetime import datetime
from typing import Dict, Optional, Tuple

# Namespaces for Peppol XML
NS_CATALOGUE = "urn:oasis:names:specification:ubl:schema:xsd:Catalogue-2"
NS_CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
NS_CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"

# IFC building element types to process
IFC_ELEMENT_TYPES = [
    'IfcWall',
    'IfcWallStandardCase',
    'IfcDoor',
    'IfcWindow',
    'IfcSlab',
    'IfcBeam',
    'IfcColumn',
    'IfcRoof',
    'IfcStair',
    'IfcStairFlight',
    'IfcRailing',
    'IfcPlate',
    'IfcMember',
    'IfcChimney',
    'IfcCovering',
    'IfcCurtainWall',
    'IfcFurniture',
    'IfcFlowTerminal',
    'IfcOpeningElement',
    'IfcBuildingElementProxy',
]

def get_unit_code(property_name: str) -> str:
    """Get unit code based on property name pattern."""
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
    """Format property value with unit suffix."""
    if not value:
        return ''
    
    lower_name = property_name.lower()
    lower_value = value.lower()
    
    # Boolean values
    if lower_value == 'true' or value == '1':
        return 'Yes'
    elif lower_value == 'false' or value == '0':
        return 'No'
    
    # Dimension values
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
    """Extract BIP property set from an IFC element."""
    if not hasattr(element, 'IsDefinedBy'):
        return None
    
    properties = {}
    mmi_value = None
    
    for definition in element.IsDefinedBy:
        if definition.is_a('IfcRelDefinesByProperties'):
            prop_def = definition.RelatingPropertyDefinition
            
            if prop_def.is_a('IfcPropertySet') and prop_def.Name == 'BIP':
                for prop in prop_def.HasProperties:
                    if prop.is_a('IfcPropertySingleValue'):
                        prop_name = prop.Name
                        if prop.NominalValue:
                            prop_value = prop.NominalValue.wrappedValue
                            
                            # Special handling for MMI
                            if prop_name == 'MMI':
                                try:
                                    if isinstance(prop_value, (int, float)):
                                        mmi_value = float(prop_value)
                                    elif isinstance(prop_value, str):
                                        mmi_value = float(prop_value) if prop_value.strip() else None
                                    else:
                                        mmi_value = None
                                except (ValueError, TypeError):
                                    mmi_value = None
                                properties[prop_name] = str(prop_value)
                            else:
                                if isinstance(prop_value, (int, float)):
                                    properties[prop_name] = str(prop_value)
                                elif prop_value is None:
                                    properties[prop_name] = ''
                                else:
                                    properties[prop_name] = str(prop_value)
                
                return (properties, mmi_value)
    
    return None

def extract_project_metadata(model) -> Dict[str, str]:
    """Extract project metadata from IFC file header."""
    metadata = {
        'projectNumber': None,
        'projectName': None,
        'organizationName': None,
        'issueDate': None,
    }
    
    if hasattr(model, 'file') and model.file:
        header = model.file.header
        
        if hasattr(header, 'file_name') and header.file_name:
            if hasattr(header.file_name, 'time_stamp'):
                timestamp = header.file_name.time_stamp
                if timestamp:
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
    
    if not metadata['issueDate']:
        metadata['issueDate'] = datetime.now().strftime('%Y-%m-%d')
    
    return metadata

def get_element_global_id(element) -> str:
    """Get GlobalID from IFC element."""
    if hasattr(element, 'GlobalId'):
        return element.GlobalId
    return str(element.id())

def get_element_name(element) -> str:
    """Get Name attribute from IFC element."""
    if hasattr(element, 'Name') and element.Name:
        return element.Name
    return ''

def get_element_object_type(element) -> str:
    """Get ObjectType attribute from IFC element."""
    if hasattr(element, 'ObjectType') and element.ObjectType:
        return element.ObjectType
    return ''

def create_catalogue_root(metadata: Dict[str, str]):
    """Create the root Catalogue element with proper structure."""
    from lxml import etree
    
    nsmap = {
        None: NS_CATALOGUE,
        'cac': NS_CAC,
        'cbc': NS_CBC,
    }
    
    catalogue = etree.Element('{'+NS_CATALOGUE+'}Catalogue', nsmap=nsmap)
    
    cust_id = etree.SubElement(catalogue, '{'+NS_CBC+'}CustomizationID')
    cust_id.text = 'urn:fdc:peppol.eu:poacc:trns:catalogue:3'
    
    profile_id = etree.SubElement(catalogue, '{'+NS_CBC+'}ProfileID')
    profile_id.text = 'urn:fdc:peppol.eu:poacc:bis:catalogue_only:3'
    
    cat_id = etree.SubElement(catalogue, '{'+NS_CBC+'}ID')
    cat_id.text = metadata.get('projectNumber') or 'CATALOGUE-001'
    
    action_code = etree.SubElement(catalogue, '{'+NS_CBC+'}ActionCode')
    action_code.text = 'Add'
    
    name = etree.SubElement(catalogue, '{'+NS_CBC+'}Name')
    name.text = metadata.get('projectName') or 'BIM2BOM Catalogue'
    
    issue_date = etree.SubElement(catalogue, '{'+NS_CBC+'}IssueDate')
    issue_date.text = metadata.get('issueDate') or datetime.now().strftime('%Y-%m-%d')
    
    validity_period = etree.SubElement(catalogue, '{'+NS_CAC+'}ValidityPeriod')
    start_date = etree.SubElement(validity_period, '{'+NS_CBC+'}StartDate')
    start_date.text = metadata.get('issueDate') or datetime.now().strftime('%Y-%m-%d')
    
    ref_contract = etree.SubElement(catalogue, '{'+NS_CAC+'}ReferencedContract')
    contract_id = etree.SubElement(ref_contract, '{'+NS_CBC+'}ID')
    contract_id.text = f"CONTRACT-{metadata.get('projectNumber') or '001'}"
    
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

def create_catalogue_line(element, bip_properties: Dict[str, str]):
    """Create a CatalogueLine element for an IFC element."""
    from lxml import etree
    
    catalogue_line = etree.Element('{'+NS_CAC+'}CatalogueLine')
    
    line_id = etree.SubElement(catalogue_line, '{'+NS_CBC+'}ID')
    line_id.text = get_element_global_id(element)
    
    action_code = etree.SubElement(catalogue_line, '{'+NS_CBC+'}ActionCode')
    action_code.text = 'Add'
    
    orderable = etree.SubElement(catalogue_line, '{'+NS_CBC+'}OrderableIndicator')
    orderable.text = 'true'
    
    item = etree.SubElement(catalogue_line, '{'+NS_CAC+'}Item')
    
    name = etree.SubElement(item, '{'+NS_CBC+'}Name')
    name.text = get_element_name(element)
    
    type_desc = bip_properties.get('TypeDescription')
    materials = bip_properties.get('materials/components')
    if type_desc:
        desc_text = type_desc
        if materials:
            desc_text += f'. Materials: {materials}'
        description = etree.SubElement(item, '{'+NS_CBC+'}Description')
        description.text = desc_text
    
    manufacturer = bip_properties.get('Manufacturer')
    if manufacturer:
        brand_name = etree.SubElement(item, '{'+NS_CBC+'}BrandName')
        brand_name.text = manufacturer
    
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
    
    type_id = bip_properties.get('type name id')
    if type_id:
        mfr_id = etree.SubElement(item, '{'+NS_CAC+'}ManufacturersItemIdentification')
        mfr_id_elem = etree.SubElement(mfr_id, '{'+NS_CBC+'}ID')
        mfr_id_elem.text = type_id
    
    if manufacturer:
        mfr_party = etree.SubElement(item, '{'+NS_CAC+'}ManufacturerParty')
        party_name = etree.SubElement(mfr_party, '{'+NS_CAC+'}PartyName')
        name_elem = etree.SubElement(party_name, '{'+NS_CBC+'}Name')
        name_elem.text = manufacturer
    
    lot_number = bip_properties.get('LotNumberID')
    if lot_number:
        item_instance = etree.SubElement(item, '{'+NS_CAC+'}ItemInstance')
        lot_ident = etree.SubElement(item_instance, '{'+NS_CAC+'}LotIdentification')
        lot_id = etree.SubElement(lot_ident, '{'+NS_CBC+'}LotNumberID')
        lot_id.text = lot_number
    
    for prop_name, prop_value in sorted(bip_properties.items()):
        if prop_value and prop_value != '':
            add_prop = etree.SubElement(item, '{'+NS_CAC+'}AdditionalItemProperty')
            
            prop_name_elem = etree.SubElement(add_prop, '{'+NS_CBC+'}Name')
            prop_name_elem.text = prop_name
            
            name_code = etree.SubElement(add_prop, '{'+NS_CBC+'}NameCode')
            name_code.set('listID', 'SE:BIP')
            name_code.text = prop_name
            
            value_elem = etree.SubElement(add_prop, '{'+NS_CBC+'}Value')
            value_elem.text = format_value(prop_name, prop_value)
            
            unit_code = get_unit_code(prop_name)
            if unit_code:
                value_qty = etree.SubElement(add_prop, '{'+NS_CBC+'}ValueQuantity')
                value_qty.set('unitCode', unit_code)
                value_qty.text = prop_value
    
    return catalogue_line

def transform_ifc_to_peppol_bytes(ifc_path: str, mmi_threshold: float = 375.0) -> Tuple[str, Dict]:
    """
    Transform IFC file to Peppol Catalogue XML.
    
    Args:
        ifc_path: Path to IFC file in Pyodide's virtual filesystem
        mmi_threshold: MMI threshold for filtering (default: 375.0)
    
    Returns:
        tuple: (xml_string, stats_dict)
        - xml_string: Complete Peppol XML as string
        - stats_dict: Processing statistics
    """
    import ifcopenshell
    from lxml import etree
    import time
    
    start_time = time.time()
    
    try:
        # Load IFC model from file path (file already written to Pyodide FS by JavaScript)
        model = ifcopenshell.open(ifc_path)
        
        # Extract project metadata
        metadata = extract_project_metadata(model)
        
        # Create root catalogue element
        catalogue = create_catalogue_root(metadata)
        
        # Process all IFC elements
        processed_count = 0
        filtered_count = 0
        
        for element_type in IFC_ELEMENT_TYPES:
            try:
                elements = model.by_type(element_type)
            except RuntimeError as e:
                if "not found in schema" in str(e):
                    continue
                else:
                    raise
            
            for element in elements:
                processed_count += 1
                
                # Extract BIP properties
                result = extract_bip_properties(element)
                if result is None:
                    continue
                
                bip_properties, mmi_value = result
                
                # Filter by MMI threshold
                if mmi_value is None or mmi_value < mmi_threshold:
                    continue
                
                filtered_count += 1
                
                # Create catalogue line
                catalogue_line = create_catalogue_line(element, bip_properties)
                catalogue.append(catalogue_line)
        
        # Create XML tree
        tree = etree.ElementTree(catalogue)
        
        # Convert to string with processing instructions
        xml_bytes = etree.tostring(
            catalogue,
            encoding='utf-8',
            xml_declaration=False,
            pretty_print=True
        )
        
        # Add XML declaration and processing instructions
        xml_parts = [
            "<?xml version='1.0' encoding='UTF-8'?>\n",
            "<?DocumentTerm Catalogue?>\n",
            "<?Property key=\"sch:prefix\" PEPPOL-T19?>\n",
            "<?Property key=\"sch:identifier\" T19-basic?>\n",
            xml_bytes.decode('utf-8')
        ]
        
        xml_string = ''.join(xml_parts)
        
        processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        stats = {
            'processed': processed_count,
            'filtered': filtered_count,
            'lines': filtered_count,
            'time': processing_time
        }
        
        return (xml_string, stats)
        
    except Exception as e:
        error_msg = f"Transformation failed: {str(e)}"
        import traceback
        traceback_str = traceback.format_exc()
        raise RuntimeError(f"{error_msg}\n{traceback_str}")





