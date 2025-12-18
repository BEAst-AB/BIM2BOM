"""
BIP Type Name ID Validation Module for Pyodide
Validates BIP type name ID consistency and uniqueness in IFC files.
"""

import ifcopenshell
from collections import defaultdict
from typing import Dict, List, Optional, Tuple
import json
import csv


def load_validation_properties_from_csv(csv_path: str) -> List[str]:
    """
    Load validation properties from CSV file in Pyodide filesystem
    
    Args:
        csv_path: Path to CSV file in Pyodide filesystem
        
    Returns:
        List of property names to validate
    """
    properties = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('required', 'true').lower() == 'true':
                    properties.append(row['property_name'])
    except Exception as e:
        # Fallback to hardcoded list
        properties = [
            'TypeDescription',
            'BSAB 96',
            'materials/components',
            'thickness',
            'is load bearing',
            'is external'
        ]
    
    return properties


class BIPProperties:
    """Container for BIP property values"""
    
    def __init__(self, property_dict: Dict[str, any] = None, validation_properties: List[str] = None):
        self.properties = property_dict or {}
        self.validation_properties = validation_properties or []
    
    def to_tuple(self) -> tuple:
        """Convert to tuple for use as dictionary key - ordered by VALIDATION_PROPERTIES"""
        return tuple(self.properties.get(prop) for prop in self.validation_properties)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for reporting"""
        return self.properties.copy()


class ElementInfo:
    """Information about an IFC element"""
    
    def __init__(self, element_id: int, element_type: str, global_id: Optional[str], 
                 name: Optional[str], type_name_id: str, bip_properties: BIPProperties):
        self.element_id = element_id
        self.element_type = element_type
        self.global_id = global_id
        self.name = name
        self.type_name_id = type_name_id
        self.bip_properties = bip_properties
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.element_id,
            'type': self.element_type,
            'global_id': self.global_id,
            'name': self.name,
            'type_name_id': self.type_name_id,
            'properties': self.bip_properties.to_dict()
        }


class BIPValidator:
    """Validates BIP type name id consistency and uniqueness"""
    
    def __init__(self, ifc_file_path: str, validation_properties: List[str]):
        """Initialize validator with IFC file"""
        self.model = ifcopenshell.open(ifc_file_path)
        self.validation_properties = validation_properties
        self.elements: List[ElementInfo] = []
        self.consistency_violations: List[Dict] = []
        self.uniqueness_violations: List[Dict] = []
        self.completeness_violations: List[Dict] = []
        
    def extract_bip_properties(self, element) -> Optional[Tuple[str, BIPProperties]]:
        """Extract BIP property set and type name id from an IFC element"""
        try:
            if not hasattr(element, 'IsDefinedBy'):
                return None
                
            for definition in element.IsDefinedBy:
                if definition.is_a('IfcRelDefinesByProperties'):
                    prop_def = definition.RelatingPropertyDefinition
                    
                    if prop_def.is_a('IfcPropertySet') and prop_def.Name == 'BIP':
                        properties = {}
                        type_name_id = None
                        
                        for prop in prop_def.HasProperties:
                            if prop.is_a('IfcPropertySingleValue'):
                                prop_name = prop.Name
                                prop_value = prop.NominalValue.wrappedValue if prop.NominalValue else None
                                properties[prop_name] = prop_value
                                
                                if prop_name == 'type name id':
                                    type_name_id = prop_value
                        
                        if type_name_id:
                            property_dict = {}
                            for prop_name in self.validation_properties:
                                property_dict[prop_name] = properties.get(prop_name)
                            
                            bip_props = BIPProperties(property_dict, self.validation_properties)
                            return (type_name_id, bip_props)
        except Exception as e:
            pass
            
        return None
    
    def collect_elements(self):
        """Collect all elements with BIP property sets containing type name id"""
        try:
            all_elements = self.model.by_type('IfcElement')
        except Exception:
            # Fallback: try common element types
            all_elements = []
            for elem_type in ['IfcWall', 'IfcSlab', 'IfcRoof', 'IfcDoor', 'IfcWindow', 'IfcColumn', 'IfcBeam']:
                try:
                    all_elements.extend(self.model.by_type(elem_type))
                except:
                    continue
        
        for element in all_elements:
            result = self.extract_bip_properties(element)
            if result:
                type_name_id, bip_props = result
                
                element_info = ElementInfo(
                    element_id=element.id(),
                    element_type=element.is_a(),
                    global_id=getattr(element, 'GlobalId', None),
                    name=getattr(element, 'Name', None),
                    type_name_id=type_name_id,
                    bip_properties=bip_props
                )
                self.elements.append(element_info)
    
    def validate_consistency(self):
        """Validate consistency: all elements with the same type name id must have identical BIP property values"""
        grouped = defaultdict(list)
        for element in self.elements:
            grouped[element.type_name_id].append(element)
        
        for type_name_id, elements in grouped.items():
            if len(elements) < 2:
                continue
            
            reference_props = elements[0].bip_properties
            
            inconsistent_elements = []
            for element in elements[1:]:
                if element.bip_properties.to_tuple() != reference_props.to_tuple():
                    inconsistent_elements.append(element)
            
            if inconsistent_elements:
                violation = {
                    'type_name_id': type_name_id,
                    'total_elements': len(elements),
                    'reference_element': {
                        'id': elements[0].element_id,
                        'type': elements[0].element_type,
                        'global_id': elements[0].global_id,
                        'properties': reference_props.to_dict()
                    },
                    'inconsistent_elements': [
                        {
                            'id': elem.element_id,
                            'type': elem.element_type,
                            'global_id': elem.global_id,
                            'properties': elem.bip_properties.to_dict()
                        }
                        for elem in inconsistent_elements
                    ]
                }
                self.consistency_violations.append(violation)
    
    def validate_uniqueness(self):
        """Validate uniqueness: each unique combination of BIP properties must map to exactly one type name id"""
        property_map = defaultdict(set)
        property_elements = defaultdict(list)
        
        for element in self.elements:
            prop_tuple = element.bip_properties.to_tuple()
            property_map[prop_tuple].add(element.type_name_id)
            property_elements[prop_tuple].append(element)
        
        for prop_tuple, type_name_ids in property_map.items():
            if len(type_name_ids) > 1:
                elements_list = property_elements[prop_tuple]
                
                violation = {
                    'property_combination': elements_list[0].bip_properties.to_dict(),
                    'type_name_ids': sorted(list(type_name_ids)),
                    'total_elements': len(elements_list),
                    'elements_by_type_name_id': {}
                }
                
                for type_id in sorted(type_name_ids):
                    matching_elements = [e for e in elements_list if e.type_name_id == type_id]
                    violation['elements_by_type_name_id'][type_id] = [
                        {
                            'id': elem.element_id,
                            'type': elem.element_type,
                            'global_id': elem.global_id,
                            'name': elem.name
                        }
                        for elem in matching_elements
                    ]
                
                self.uniqueness_violations.append(violation)
    
    def validate_completeness(self):
        """Validate completeness: type name id must not contain 'xx' placeholder"""
        for element in self.elements:
            type_name_id_str = str(element.type_name_id) if element.type_name_id else ""
            if 'xx' in type_name_id_str.lower():
                violation = {
                    'type_name_id': element.type_name_id,
                    'element': {
                        'id': element.element_id,
                        'type': element.element_type,
                        'global_id': element.global_id,
                        'name': element.name
                    }
                }
                self.completeness_violations.append(violation)
    
    def to_dict(self) -> dict:
        """Convert validation results to dictionary"""
        return {
            'summary': {
                'total_elements': len(self.elements),
                'unique_type_name_ids': len(set(e.type_name_id for e in self.elements)),
                'consistency_violations': len(self.consistency_violations),
                'uniqueness_violations': len(self.uniqueness_violations),
                'completeness_violations': len(self.completeness_violations)
            },
            'consistency_violations': self.consistency_violations,
            'uniqueness_violations': self.uniqueness_violations,
            'completeness_violations': self.completeness_violations
        }


def generate_html_report(validator: BIPValidator) -> str:
    """Generate HTML report from validation results"""
    html_parts = []
    html_parts.append("""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>BIP Validation Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h1 { color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            .summary { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .summary-item { display: inline-block; margin: 10px 20px 10px 0; }
            .summary-label { font-weight: 600; color: #6b7280; }
            .summary-value { font-size: 24px; font-weight: bold; color: #1f2937; }
            .violation { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .violation-title { font-weight: 600; color: #991b1b; margin-bottom: 10px; }
            .element-list { margin-left: 20px; }
            .element { background: white; padding: 8px; margin: 5px 0; border-radius: 4px; }
            .property-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .property-table th { background: #f3f4f6; padding: 8px; text-align: left; border: 1px solid #e5e7eb; }
            .property-table td { padding: 8px; border: 1px solid #e5e7eb; }
            .success { color: #10b981; }
            .error { color: #ef4444; }
            .warning { color: #f59e0b; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>BIP Type Name ID Validation Report</h1>
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-label">Total Elements</div>
                    <div class="summary-value">{total_elements}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Unique Type Name IDs</div>
                    <div class="summary-value">{unique_type_name_ids}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Consistency Violations</div>
                    <div class="summary-value {consistency_class}">{consistency_violations}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Uniqueness Violations</div>
                    <div class="summary-value {uniqueness_class}">{uniqueness_violations}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Completeness Violations</div>
                    <div class="summary-value {completeness_class}">{completeness_violations}</div>
                </div>
            </div>
    """.format(
        total_elements=len(validator.elements),
        unique_type_name_ids=len(set(e.type_name_id for e in validator.elements)),
        consistency_violations=len(validator.consistency_violations),
        uniqueness_violations=len(validator.uniqueness_violations),
        completeness_violations=len(validator.completeness_violations),
        consistency_class='error' if validator.consistency_violations else 'success',
        uniqueness_class='error' if validator.uniqueness_violations else 'success',
        completeness_class='error' if validator.completeness_violations else 'success',
    ))
    
    # Consistency violations
    if validator.consistency_violations:
        html_parts.append("<h2>Consistency Violations</h2>")
        for violation in validator.consistency_violations:
            html_parts.append(f"""
            <div class="violation">
                <div class="violation-title">Type Name ID: {violation['type_name_id']} ({violation['total_elements']} elements)</div>
                <p>Elements with the same type name ID have inconsistent BIP property values.</p>
                <div class="element-list">
                    <div class="element">
                        <strong>Reference Element:</strong> {violation['reference_element']['type']} 
                        (ID: {violation['reference_element']['id']}, GlobalId: {violation['reference_element']['global_id']})
                        <table class="property-table">
                            <tr><th>Property</th><th>Value</th></tr>
            """)
            for prop, value in violation['reference_element']['properties'].items():
                html_parts.append(f"<tr><td>{prop}</td><td>{value or '(empty)'}</td></tr>")
            html_parts.append("</table></div>")
            
            for elem in violation['inconsistent_elements']:
                html_parts.append(f"""
                    <div class="element">
                        <strong>Inconsistent Element:</strong> {elem['type']} 
                        (ID: {elem['id']}, GlobalId: {elem['global_id']})
                        <table class="property-table">
                            <tr><th>Property</th><th>Value</th></tr>
                """)
                for prop, value in elem['properties'].items():
                    html_parts.append(f"<tr><td>{prop}</td><td>{value or '(empty)'}</td></tr>")
                html_parts.append("</table></div>")
            html_parts.append("</div></div>")
    
    # Uniqueness violations
    if validator.uniqueness_violations:
        html_parts.append("<h2>Uniqueness Violations</h2>")
        for violation in validator.uniqueness_violations:
            html_parts.append(f"""
            <div class="violation">
                <div class="violation-title">Property Combination Maps to Multiple Type Name IDs</div>
                <p>Same property combination maps to type name IDs: {', '.join(violation['type_name_ids'])}</p>
                <table class="property-table">
                    <tr><th>Property</th><th>Value</th></tr>
            """)
            for prop, value in violation['property_combination'].items():
                html_parts.append(f"<tr><td>{prop}</td><td>{value or '(empty)'}</td></tr>")
            html_parts.append("</table>")
            
            for type_id, elements in violation['elements_by_type_name_id'].items():
                html_parts.append(f"<h3>Type Name ID: {type_id}</h3><div class="element-list">")
                for elem in elements:
                    html_parts.append(f"<div class="element">{elem['type']} (ID: {elem['id']}, GlobalId: {elem['global_id']}, Name: {elem['name'] or 'N/A'})</div>")
                html_parts.append("</div>")
            html_parts.append("</div>")
    
    # Completeness violations
    if validator.completeness_violations:
        html_parts.append("<h2>Completeness Violations</h2>")
        for violation in validator.completeness_violations:
            html_parts.append(f"""
            <div class="violation">
                <div class="violation-title">Type Name ID Contains Placeholder: {violation['type_name_id']}</div>
                <div class="element-list">
                    <div class="element">
                        {violation['element']['type']} (ID: {violation['element']['id']}, 
                        GlobalId: {violation['element']['global_id']}, 
                        Name: {violation['element']['name'] or 'N/A'})
                    </div>
                </div>
            </div>
            """)
    
    if not validator.consistency_violations and not validator.uniqueness_violations and not validator.completeness_violations:
        html_parts.append("""
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h2 style="color: #10b981; margin: 0;">✓ All Validations Passed</h2>
                <p>No violations found. The IFC model meets all BIP type name ID requirements.</p>
            </div>
        """)
    
    html_parts.append("</div></body></html>")
    return ''.join(html_parts)


def validate_bip_type_name_id(ifc_path: str, csv_path: str) -> dict:
    """
    Main validation function for Pyodide
    
    Args:
        ifc_path: Path to IFC file in Pyodide filesystem
        csv_path: Path to CSV configuration file in Pyodide filesystem
        
    Returns:
        Dictionary with validation results including HTML report
    """
    # Load validation properties from CSV
    validation_properties = load_validation_properties_from_csv(csv_path)
    
    # Create validator
    validator = BIPValidator(ifc_path, validation_properties)
    
    # Run validation
    validator.collect_elements()
    validator.validate_consistency()
    validator.validate_uniqueness()
    validator.validate_completeness()
    
    # Generate reports
    json_data = validator.to_dict()
    html_report = generate_html_report(validator)
    
    return {
        'json': json_data,
        'html': html_report,
        'valid': len(validator.consistency_violations) == 0 and len(validator.uniqueness_violations) == 0 and len(validator.completeness_violations) == 0
    }

