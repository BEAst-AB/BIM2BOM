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
    
    def generate_html_report(self) -> str:
        """Generate HTML validation report"""
        html_parts = []
        html_parts.append('<div class="bip-validation-report">')
        # Removed duplicate h3 header - panel header already has title
        
        # Summary
        html_parts.append('<div class="validation-summary">')
        html_parts.append('<h4>Summary</h4>')
        html_parts.append('<table class="summary-table">')
        html_parts.append(f'<tr><td>Total elements analyzed:</td><td>{len(self.elements)}</td></tr>')
        html_parts.append(f'<tr><td>Unique type name IDs:</td><td>{len(set(e.type_name_id for e in self.elements))}</td></tr>')
        html_parts.append(f'<tr><td>Consistency violations:</td><td><strong>{len(self.consistency_violations)}</strong></td></tr>')
        html_parts.append(f'<tr><td>Uniqueness violations:</td><td><strong>{len(self.uniqueness_violations)}</strong></td></tr>')
        html_parts.append('</table>')
        html_parts.append('</div>')
        
        # Consistency Violations
        if self.consistency_violations:
            html_parts.append('<div class="violations-section">')
            html_parts.append('<h4>Consistency Violations</h4>')
            html_parts.append('<p>Elements with the same "type name id" have different property values:</p>')
            
            for i, violation in enumerate(self.consistency_violations, 1):
                html_parts.append('<div class="violation-item">')
                html_parts.append(f'<h5>Violation {i}: Type Name ID "{violation["type_name_id"]}"</h5>')
                html_parts.append(f'<p>Total elements: {violation["total_elements"]}, Inconsistent: {len(violation["inconsistent_elements"])}</p>')
                
                html_parts.append('<div class="reference-element">')
                html_parts.append('<strong>Reference Element:</strong>')
                html_parts.append('<table class="properties-table">')
                html_parts.append(f'<tr><td>ID</td><td>#{violation["reference_element"]["id"]}</td></tr>')
                html_parts.append(f'<tr><td>Type</td><td>{violation["reference_element"]["type"]}</td></tr>')
                html_parts.append(f'<tr><td>GlobalId</td><td>{violation["reference_element"]["global_id"]}</td></tr>')
                for prop, value in violation["reference_element"]["properties"].items():
                    html_parts.append(f'<tr><td>{prop}</td><td>{value}</td></tr>')
                html_parts.append('</table>')
                html_parts.append('</div>')
                
                html_parts.append('<div class="inconsistent-elements">')
                html_parts.append('<strong>Inconsistent Elements:</strong>')
                for elem in violation["inconsistent_elements"]:
                    html_parts.append('<div class="element-item">')
                    html_parts.append(f'<p><strong>Element #{elem["id"]}</strong> ({elem["type"]}) - GlobalId: {elem["global_id"]}</p>')
                    html_parts.append('<table class="properties-table">')
                    ref_props = violation["reference_element"]["properties"]
                    for prop, value in elem["properties"].items():
                        expected = ref_props.get(prop)
                        if value != expected:
                            html_parts.append(f'<tr><td>{prop}</td><td class="diff-value">{value} <span class="expected">(expected: {expected})</span></td></tr>')
                        else:
                            html_parts.append(f'<tr><td>{prop}</td><td>{value}</td></tr>')
                    html_parts.append('</table>')
                    html_parts.append('</div>')
                html_parts.append('</div>')
                
                html_parts.append('</div>')
            
            html_parts.append('</div>')
        else:
            html_parts.append('<div class="no-violations">')
            html_parts.append('<p class="success">✓ No consistency violations found</p>')
            html_parts.append('</div>')
        
        # Uniqueness Violations
        if self.uniqueness_violations:
            html_parts.append('<div class="violations-section">')
            html_parts.append('<h4>Uniqueness Violations</h4>')
            html_parts.append('<p>Property combinations mapped to multiple "type name id" values:</p>')
            
            for i, violation in enumerate(self.uniqueness_violations, 1):
                html_parts.append('<div class="violation-item">')
                html_parts.append(f'<h5>Violation {i}</h5>')
                
                html_parts.append('<div class="property-combination">')
                html_parts.append('<strong>Property Combination:</strong>')
                html_parts.append('<table class="properties-table">')
                for prop, value in violation["property_combination"].items():
                    html_parts.append(f'<tr><td>{prop}</td><td>{value}</td></tr>')
                html_parts.append('</table>')
                html_parts.append('</div>')
                
                html_parts.append(f'<p><strong>Mapped to {len(violation["type_name_ids"])} different type name IDs:</strong> {", ".join(violation["type_name_ids"])}</p>')
                
                for type_id, elements in violation["elements_by_type_name_id"].items():
                    html_parts.append(f'<div class="type-name-id-group">')
                    html_parts.append(f'<strong>Type Name ID "{type_id}" - {len(elements)} element(s):</strong>')
                    html_parts.append('<ul>')
                    for elem in elements[:10]:  # Show first 10
                        html_parts.append(f'<li>Element #{elem["id"]} ({elem["type"]}) - {elem["global_id"]} {elem.get("name", "")}</li>')
                    if len(elements) > 10:
                        html_parts.append(f'<li>... and {len(elements) - 10} more</li>')
                    html_parts.append('</ul>')
                    html_parts.append('</div>')
                
                html_parts.append('</div>')
            
            html_parts.append('</div>')
        else:
            html_parts.append('<div class="no-violations">')
            html_parts.append('<p class="success">✓ No uniqueness violations found</p>')
            html_parts.append('</div>')
        
        # Conclusion
        if not self.consistency_violations and not self.uniqueness_violations:
            html_parts.append('<div class="validation-passed">')
            html_parts.append('<p class="success-message">✓ Validation Passed: All type name IDs are consistent and unique</p>')
            html_parts.append('</div>')
        else:
            html_parts.append('<div class="validation-failed">')
            html_parts.append('<p class="error-message">✗ Validation Failed: Violations found</p>')
            html_parts.append('</div>')
        
        html_parts.append('</div>')
        return '\n'.join(html_parts)
    
    def to_dict(self) -> dict:
        """Convert validation results to dictionary"""
        return {
            'summary': {
                'total_elements': len(self.elements),
                'unique_type_name_ids': len(set(e.type_name_id for e in self.elements)),
                'consistency_violations': len(self.consistency_violations),
                'uniqueness_violations': len(self.uniqueness_violations)
            },
            'consistency_violations': self.consistency_violations,
            'uniqueness_violations': self.uniqueness_violations
        }


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
    
    # Generate reports
    html_report = validator.generate_html_report()
    json_data = validator.to_dict()
    
    return {
        'html': html_report,
        'json': json_data,
        'valid': len(validator.consistency_violations) == 0 and len(validator.uniqueness_violations) == 0
    }

