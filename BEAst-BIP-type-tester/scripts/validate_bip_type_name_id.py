"""
BIP Type Name ID Validation Script (STEP Format)

This script validates that "type name id" values in BIP property sets maintain:
1. Consistency: Elements with the same "type name id" have identical BIP property values
2. Uniqueness: Each unique combination of BIP properties maps to exactly one "type name id"

Validated BIP Properties:
Properties are loaded from CSV configuration file (bip_type_name_id_properties.csv).
Default properties include:
- TypeDescription (IFCTEXT)
- BSAB 96 (IFCLABEL)
- materials/components (IFCTEXT)
- thickness (IFCPOSITIVELENGTHMEASURE)
- is load bearing (IFCBOOLEAN)
- is external (IFCBOOLEAN)

Configuration:
The script automatically loads property definitions from:
1. ../features/resources/bip_type_name_id_properties.csv (centralized CSV - default)
2. Hardcoded fallback if CSV not found

Usage:
    python validate_bip_type_name_id.py <path_to_ifc_file>
"""

import sys
import ifcopenshell
from collections import defaultdict
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple
import json
import csv
from pathlib import Path


def load_validation_properties_from_csv(csv_path: str = None) -> List[str]:
    """
    Load validation properties from CSV file
    
    Args:
        csv_path: Path to CSV file. If None, uses default location.
        
    Returns:
        List of property names to validate
    """
    if csv_path is None:
        # Default to centralized CSV in features/resources
        script_dir = Path(__file__).parent
        csv_path = script_dir.parent / "features" / "resources" / "bip_type_name_id_properties.csv"
    
    properties = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('required', 'true').lower() == 'true':
                    properties.append(row['property_name'])
        print(f"Loaded {len(properties)} properties from: {csv_path}")
    except FileNotFoundError:
        print(f"Warning: CSV file not found at {csv_path}")
        print("Using default property list")
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


# Load properties from CSV (can be overridden by providing custom CSV path)
VALIDATION_PROPERTIES = load_validation_properties_from_csv()


class BIPProperties:
    """Container for BIP property values - dynamic based on CSV configuration"""
    
    def __init__(self, property_dict: Dict[str, any] = None):
        """
        Initialize with a dictionary of property name -> value
        
        Args:
            property_dict: Dictionary mapping property names to their values
        """
        self.properties = property_dict or {}
    
    def to_tuple(self) -> tuple:
        """Convert to tuple for use as dictionary key - ordered by VALIDATION_PROPERTIES"""
        return tuple(self.properties.get(prop) for prop in VALIDATION_PROPERTIES)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for reporting"""
        return self.properties.copy()
    
    def __eq__(self, other):
        """Compare based on property tuple"""
        if not isinstance(other, BIPProperties):
            return False
        return self.to_tuple() == other.to_tuple()


@dataclass
class ElementInfo:
    """Information about an IFC element"""
    element_id: int
    element_type: str
    global_id: Optional[str]
    name: Optional[str]
    type_name_id: str
    bip_properties: BIPProperties


class BIPValidator:
    """Validates BIP type name id consistency and uniqueness"""
    
    def __init__(self, ifc_file_path: str):
        """Initialize validator with IFC file"""
        print(f"Loading IFC file: {ifc_file_path}")
        self.model = ifcopenshell.open(ifc_file_path)
        self.elements: List[ElementInfo] = []
        self.consistency_violations: List[Dict] = []
        self.uniqueness_violations: List[Dict] = []
        
    def extract_bip_properties(self, element) -> Optional[Tuple[str, BIPProperties]]:
        """
        Extract BIP property set and type name id from an IFC element
        
        Returns:
            Tuple of (type_name_id, BIPProperties) if found, None otherwise
        """
        try:
            # Check if element has property definitions
            if not hasattr(element, 'IsDefinedBy'):
                return None
                
            for definition in element.IsDefinedBy:
                if definition.is_a('IfcRelDefinesByProperties'):
                    prop_def = definition.RelatingPropertyDefinition
                    
                    # Check if this is a BIP property set
                    if prop_def.is_a('IfcPropertySet') and prop_def.Name == 'BIP':
                        properties = {}
                        type_name_id = None
                        
                        # Extract all properties
                        for prop in prop_def.HasProperties:
                            if prop.is_a('IfcPropertySingleValue'):
                                prop_name = prop.Name
                                prop_value = prop.NominalValue.wrappedValue if prop.NominalValue else None
                                properties[prop_name] = prop_value
                                
                                if prop_name == 'type name id':
                                    type_name_id = prop_value
                        
                        # If we found a type name id, extract validation properties
                        if type_name_id:
                            # Build property dictionary based on VALIDATION_PROPERTIES
                            property_dict = {}
                            for prop_name in VALIDATION_PROPERTIES:
                                property_dict[prop_name] = properties.get(prop_name)
                            
                            bip_props = BIPProperties(property_dict)
                            return (type_name_id, bip_props)
        except Exception as e:
            print(f"Warning: Error extracting properties from element {element.id()}: {e}")
            
        return None
    
    def collect_elements(self):
        """Collect all elements with BIP property sets containing type name id"""
        print("Collecting elements with BIP property sets...")
        
        # Get all elements (IfcElement is base class for building elements)
        all_elements = self.model.by_type('IfcElement')
        
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
        
        print(f"Found {len(self.elements)} elements with BIP property sets containing 'type name id'")
    
    def validate_consistency(self):
        """
        Validate consistency: all elements with the same type name id 
        must have identical BIP property values
        """
        print("\nValidating consistency (same type name id -> same properties)...")
        
        # Group elements by type name id
        grouped = defaultdict(list)
        for element in self.elements:
            grouped[element.type_name_id].append(element)
        
        # Check each group for consistency
        violations_count = 0
        for type_name_id, elements in grouped.items():
            if len(elements) < 2:
                continue  # Nothing to compare
            
            # Get the reference properties from the first element
            reference_props = elements[0].bip_properties
            
            # Check if all other elements have identical properties
            inconsistent_elements = []
            for element in elements[1:]:
                if element.bip_properties.to_tuple() != reference_props.to_tuple():
                    inconsistent_elements.append(element)
            
            if inconsistent_elements:
                violations_count += 1
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
        
        if violations_count == 0:
            print("PASS: All type name ids are consistent")
        else:
            print(f"FAIL: Found {violations_count} consistency violations")
    
    def validate_uniqueness(self):
        """
        Validate uniqueness: each unique combination of BIP properties 
        must map to exactly one type name id
        """
        print("\nValidating uniqueness (same properties -> same type name id)...")
        
        # Group elements by property combination
        property_map = defaultdict(set)
        property_elements = defaultdict(list)
        
        for element in self.elements:
            prop_tuple = element.bip_properties.to_tuple()
            property_map[prop_tuple].add(element.type_name_id)
            property_elements[prop_tuple].append(element)
        
        # Check for property combinations mapped to multiple type name ids
        violations_count = 0
        for prop_tuple, type_name_ids in property_map.items():
            if len(type_name_ids) > 1:
                violations_count += 1
                elements_list = property_elements[prop_tuple]
                
                violation = {
                    'property_combination': elements_list[0].bip_properties.to_dict(),
                    'type_name_ids': sorted(list(type_name_ids)),
                    'total_elements': len(elements_list),
                    'elements_by_type_name_id': {}
                }
                
                # Group elements by their type name id
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
        
        if violations_count == 0:
            print("PASS: All property combinations map to unique type name ids")
        else:
            print(f"FAIL: Found {violations_count} uniqueness violations")
    
    def generate_report(self) -> str:
        """Generate a detailed validation report"""
        report_lines = []
        report_lines.append("=" * 80)
        report_lines.append("BIP TYPE NAME ID VALIDATION REPORT")
        report_lines.append("=" * 80)
        report_lines.append("")
        
        # Summary
        report_lines.append("SUMMARY")
        report_lines.append("-" * 80)
        report_lines.append(f"Total elements analyzed: {len(self.elements)}")
        report_lines.append(f"Unique type name ids: {len(set(e.type_name_id for e in self.elements))}")
        report_lines.append(f"Consistency violations: {len(self.consistency_violations)}")
        report_lines.append(f"Uniqueness violations: {len(self.uniqueness_violations)}")
        report_lines.append("")
        
        # Consistency Violations
        if self.consistency_violations:
            report_lines.append("CONSISTENCY VIOLATIONS")
            report_lines.append("-" * 80)
            report_lines.append("Elements with the same 'type name id' have different property values:")
            report_lines.append("")
            
            for i, violation in enumerate(self.consistency_violations, 1):
                report_lines.append(f"{i}. Type Name ID: {violation['type_name_id']}")
                report_lines.append(f"   Total elements: {violation['total_elements']}")
                report_lines.append(f"   Inconsistent elements: {len(violation['inconsistent_elements'])}")
                report_lines.append("")
                report_lines.append(f"   Reference Element (#{violation['reference_element']['id']}):")
                for prop, value in violation['reference_element']['properties'].items():
                    report_lines.append(f"     - {prop}: {value}")
                report_lines.append("")
                
                for elem in violation['inconsistent_elements']:
                    report_lines.append(f"   Inconsistent Element (#{elem['id']} - {elem['type']}):")
                    report_lines.append(f"     GlobalId: {elem['global_id']}")
                    report_lines.append(f"     Differing properties:")
                    ref_props = violation['reference_element']['properties']
                    for prop, value in elem['properties'].items():
                        if value != ref_props.get(prop):
                            report_lines.append(f"       - {prop}: {value} (expected: {ref_props.get(prop)})")
                    report_lines.append("")
                report_lines.append("")
        else:
            report_lines.append("CONSISTENCY VIOLATIONS: None")
            report_lines.append("")
        
        # Uniqueness Violations
        if self.uniqueness_violations:
            report_lines.append("UNIQUENESS VIOLATIONS")
            report_lines.append("-" * 80)
            report_lines.append("Property combinations mapped to multiple 'type name id' values:")
            report_lines.append("")
            
            for i, violation in enumerate(self.uniqueness_violations, 1):
                report_lines.append(f"{i}. Property Combination:")
                for prop, value in violation['property_combination'].items():
                    report_lines.append(f"     - {prop}: {value}")
                report_lines.append("")
                report_lines.append(f"   Mapped to {len(violation['type_name_ids'])} different type name ids:")
                report_lines.append(f"   {', '.join(violation['type_name_ids'])}")
                report_lines.append("")
                
                for type_id, elements in violation['elements_by_type_name_id'].items():
                    report_lines.append(f"   Type Name ID '{type_id}' - {len(elements)} element(s):")
                    for elem in elements[:5]:  # Show first 5 elements
                        report_lines.append(f"     - Element #{elem['id']} ({elem['type']}) - {elem['global_id']}")
                    if len(elements) > 5:
                        report_lines.append(f"     ... and {len(elements) - 5} more")
                    report_lines.append("")
                report_lines.append("")
        else:
            report_lines.append("UNIQUENESS VIOLATIONS: None")
            report_lines.append("")
        
        # Conclusion
        report_lines.append("=" * 80)
        if not self.consistency_violations and not self.uniqueness_violations:
            report_lines.append("VALIDATION PASSED: All type name ids are consistent and unique")
        else:
            report_lines.append("VALIDATION FAILED: Violations found")
        report_lines.append("=" * 80)
        
        return "\n".join(report_lines)
    
    def save_json_report(self, output_path: str):
        """Save detailed violation data as JSON"""
        data = {
            'summary': {
                'total_elements': len(self.elements),
                'unique_type_name_ids': len(set(e.type_name_id for e in self.elements)),
                'consistency_violations': len(self.consistency_violations),
                'uniqueness_violations': len(self.uniqueness_violations)
            },
            'consistency_violations': self.consistency_violations,
            'uniqueness_violations': self.uniqueness_violations
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"\nJSON report saved to: {output_path}")
    
    def run_validation(self):
        """Run complete validation process"""
        self.collect_elements()
        self.validate_consistency()
        self.validate_uniqueness()
        return self.generate_report()


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_bip_type_name_id.py <path_to_ifc_file>")
        print("\nExample:")
        print('  python validate_bip_type_name_id.py "A-40-V-000_BIM2BOM.ifc"')
        sys.exit(1)
    
    ifc_file_path = sys.argv[1]
    
    try:
        # Create validator and run
        validator = BIPValidator(ifc_file_path)
        report = validator.run_validation()
        
        # Print report
        print("\n")
        print(report)
        
        # Save reports to output folder
        script_dir = Path(__file__).parent
        output_dir = script_dir.parent / "output"
        output_dir.mkdir(exist_ok=True)
        
        # Extract filename without path and extension
        input_filename = Path(ifc_file_path).stem
        txt_report_path = output_dir / f"{input_filename}_BIP_validation_report.txt"
        json_report_path = output_dir / f"{input_filename}_BIP_validation_report.json"
        
        with open(txt_report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"\nText report saved to: {txt_report_path}")
        
        validator.save_json_report(json_report_path)
        
        # Exit with appropriate code
        if validator.consistency_violations or validator.uniqueness_violations:
            sys.exit(1)
        else:
            sys.exit(0)
            
    except FileNotFoundError:
        print(f"Error: File not found: {ifc_file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

