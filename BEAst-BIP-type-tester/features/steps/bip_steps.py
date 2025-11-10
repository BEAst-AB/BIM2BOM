"""
BIP-specific validation step definitions
"""

import csv
from collections import defaultdict
from typing import Optional, Dict, List
from pathlib import Path
from behave import then


def load_bip_property_definitions(csv_file: str) -> List[str]:
    """
    Load BIP property names from CSV file
    
    Args:
        csv_file: Name of CSV file (without .csv extension)
        
    Returns:
        List of property names to validate
    """
    script_dir = Path(__file__).parent.parent
    filename = script_dir / "resources" / f"{csv_file}.csv"
    
    property_names = []
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('required', 'true').lower() == 'true':
                property_names.append(row['property_name'])
    
    print(f"  Loaded {len(property_names)} validation properties from CSV")
    return property_names


def extract_bip_properties_step(inst, property_names: List[str], model_type: str) -> Optional[tuple]:
    """
    Extract BIP properties from an IFC instance
    
    Args:
        inst: An IfcPropertySingleValue instance with Name='type name id'
        property_names: List of property names to extract
        model_type: 'step' or 'xml'
        
    Returns:
        Tuple of (type_name_id_value, property_dict, property_tuple, property_set) or None
    """
    try:
        if model_type == 'step':
            # IfcOpenShell instance
            type_name_id = inst.NominalValue.wrappedValue if inst.NominalValue else None
            
            if not type_name_id:
                return None
            
            # Get the property set that contains this property
            prop_set = None
            for inverse in inst.wrapped_data.file.get_inverse(inst):
                if inverse.is_a('IfcPropertySet'):
                    prop_set = inverse
                    break
            
            if not prop_set:
                return None
            
            # Extract all properties from the property set
            all_properties = {}
            for prop in prop_set.HasProperties:
                if prop.is_a('IfcPropertySingleValue'):
                    prop_name = prop.Name
                    prop_value = prop.NominalValue.wrappedValue if prop.NominalValue else None
                    all_properties[prop_name] = prop_value
        
        else:
            # XML element
            type_name_id = inst.get('NominalValue')
            
            if not type_name_id:
                return None
            
            # Find parent IfcPropertySet
            # In XML, we need to traverse up to find the parent
            # For simplicity in this implementation, we'll store the property set reference
            # This would need context about the XML structure
            prop_set = None  # Would need to implement XML traversal
            all_properties = {}
            
            # Note: XML parsing would require different approach
            # For now, focus on STEP format with ifcopenshell
            return None
        
        # Build property dictionary for validation
        properties_for_validation = {}
        for prop_name in property_names:
            properties_for_validation[prop_name] = all_properties.get(prop_name)
        
        # Convert to tuple for comparison (order matters)
        property_tuple = tuple(properties_for_validation.get(name) for name in property_names)
        
        return (type_name_id, properties_for_validation, property_tuple, prop_set)
        
    except Exception as e:
        # If we can't extract properties, return None
        return None


def format_property_dict(properties: Dict) -> str:
    """Format property dictionary for error messages"""
    items = [f"{k}: {v}" for k, v in properties.items()]
    return ", ".join(items)


@then("All elements with the same value of 'type name id' must have identical values [according to the table] '{csv_file}'")
def step_then_consistency(context, csv_file):
    """
    Validate consistency: all property sets with the same type name id 
    must have identical BIP property values
    """
    # Load property definitions from CSV
    property_names = load_bip_property_definitions(csv_file)
    
    # Collect all instances and their properties
    instances_data = []
    
    if hasattr(context, 'instance_stack') and context.instance_stack:
        # Get instances from the last layer of the stack
        for layer in context.instance_stack:
            instances = layer.get('instances', [])
            for instance in instances:
                result = extract_bip_properties_step(instance, property_names, context.model_type)
                if result:
                    type_name_id, props_dict, props_tuple, prop_set = result
                    instances_data.append({
                        'instance': instance,
                        'type_name_id': type_name_id,
                        'properties_dict': props_dict,
                        'properties_tuple': props_tuple,
                        'property_set': prop_set
                    })
    
    print(f"  Checking consistency for {len(instances_data)} property sets...")
    
    # Group by type name id
    grouped = defaultdict(list)
    for data in instances_data:
        grouped[data['type_name_id']].append(data)
    
    # Check consistency within each group
    violations = 0
    for type_name_id, group in grouped.items():
        if len(group) < 2:
            continue
        
        # Get reference properties from first element
        reference_tuple = group[0]['properties_tuple']
        reference_dict = group[0]['properties_dict']
        
        # Check all others match
        for data in group[1:]:
            if data['properties_tuple'] != reference_tuple:
                violations += 1
                # Find which properties differ
                differing = []
                for prop_name in property_names:
                    ref_val = reference_dict.get(prop_name)
                    curr_val = data['properties_dict'].get(prop_name)
                    if ref_val != curr_val:
                        differing.append(f"{prop_name}: {curr_val} (expected: {ref_val})")
                
                print(f"  FAIL: Type name id '{type_name_id}' - inconsistent properties: {', '.join(differing)}")
                
                # Fail the scenario
                assert False, f"Consistency violation for type name id '{type_name_id}': {', '.join(differing)}"
    
    if violations == 0:
        print(f"  PASS: All {len(grouped)} type name ids are consistent")


@then("Each unique combination [according to the table] '{csv_file}' must correspond to exactly one value of 'type name id'")
def step_then_uniqueness(context, csv_file):
    """
    Validate uniqueness: each unique combination of BIP properties 
    must map to exactly one type name id
    """
    # Load property definitions from CSV
    property_names = load_bip_property_definitions(csv_file)
    
    # Collect all instances and their properties
    instances_data = []
    
    if hasattr(context, '_stack') and context._stack:
        for layer in context._stack:
            instances = layer.get('instances', [])
            for instance in instances:
                result = extract_bip_properties_step(instance, property_names, context.model_type)
                if result:
                    type_name_id, props_dict, props_tuple, prop_set = result
                    instances_data.append({
                        'instance': instance,
                        'type_name_id': type_name_id,
                        'properties_dict': props_dict,
                        'properties_tuple': props_tuple,
                        'property_set': prop_set
                    })
    
    print(f"  Checking uniqueness for {len(instances_data)} property sets...")
    
    # Group by property combination
    property_map = defaultdict(set)
    property_instances = defaultdict(list)
    
    for data in instances_data:
        prop_tuple = data['properties_tuple']
        property_map[prop_tuple].add(data['type_name_id'])
        property_instances[prop_tuple].append(data)
    
    # Check for property combinations mapped to multiple type name ids
    violations = 0
    for prop_tuple, type_name_ids in property_map.items():
        if len(type_name_ids) > 1:
            violations += 1
            # Get property dict for display
            props_dict = property_instances[prop_tuple][0]['properties_dict']
            
            print(f"  FAIL: Property combination maps to multiple type name ids: {', '.join(sorted(type_name_ids))}")
            print(f"       Properties: {format_property_dict(props_dict)}")
            
            # Fail the scenario
            assert False, f"Uniqueness violation: Properties map to multiple type name ids: {', '.join(sorted(type_name_ids))}"
    
    if violations == 0:
        print(f"  PASS: All {len(property_map)} property combinations are unique")


@then("The value of 'type name id' must not contain 'xx'")
def step_then_no_xx_placeholder(context):
    """
    Validate completeness: type name id must not contain 'xx' placeholder.
    Consultants must replace 'xx' with project-specific numbering sequences.
    """
    # Collect all type name id values from filtered instances
    type_name_ids_with_xx = []
    total_checked = 0
    
    if hasattr(context, 'instance_stack') and context.instance_stack:
        # Get instances from the last layer of the stack
        for layer in context.instance_stack:
            instances = layer.get('instances', [])
            for instance in instances:
                try:
                    if context.model_type == 'step':
                        # IfcOpenShell instance
                        type_name_id = instance.NominalValue.wrappedValue if instance.NominalValue else None
                    else:
                        # XML element
                        type_name_id = instance.get('NominalValue')
                    
                    if type_name_id:
                        total_checked += 1
                        type_name_id_str = str(type_name_id).lower()
                        if 'xx' in type_name_id_str:
                            type_name_ids_with_xx.append(type_name_id)
                except Exception:
                    # Skip instances we can't process
                    continue
    
    print(f"  Checking for 'xx' placeholder in {total_checked} type name id(s)...")
    
    if type_name_ids_with_xx:
        # Get unique violations for reporting
        unique_violations = sorted(set(type_name_ids_with_xx))
        violations_count = len(type_name_ids_with_xx)
        
        print(f"  FAIL: Found {violations_count} type name id(s) containing 'xx' placeholder:")
        for violation in unique_violations:
            print(f"       - '{violation}'")
        
        # Fail the scenario
        assert False, f"Completeness violation: {violations_count} type name id(s) contain 'xx' placeholder: {', '.join(unique_violations)}"
    
    print(f"  PASS: No type name ids contain 'xx' placeholder")