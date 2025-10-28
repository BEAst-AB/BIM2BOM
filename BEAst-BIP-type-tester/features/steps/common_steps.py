"""
Common step definitions for filtering IFC elements
"""

from behave import given


@given("An {entity}")
@given("An .{entity}.")
def step_given_entity(context, entity):
    """
    Filter instances by entity type
    """
    # Remove dots from entity name
    entity = entity.strip('.')
    
    if context.model_type == 'step':
        # Use ifcopenshell
        instances = context.model.by_type(entity, include_subtypes=True)
    else:
        # For XML, find all elements with this tag
        instances = context.root.findall(f'.//{entity}')
    
    if instances:
        context.applicable = True
        # Store instances in stack for next steps
        context.instance_stack.append({'instances': list(instances)})
    else:
        context.applicable = False
        context.instance_stack.append({'instances': []})


@given("its attribute .{attribute}.")
@given("its .{attribute}. attribute")
def step_given_attribute(context, attribute):
    """
    Filter instances that have a specific attribute and navigate to attribute values
    """
    attribute = attribute.strip('.')
    
    if not hasattr(context, 'instance_stack') or not context.instance_stack:
        return
    
    current_layer = context.instance_stack[-1].get('instances', [])
    new_instances = []
    
    for inst in current_layer:
        if context.model_type == 'step':
            # IfcOpenShell instance
            attr_value = getattr(inst, attribute, None)
        else:
            # XML element
            attr_value = inst.get(attribute)
        
        if attr_value:
            # Navigate to the attribute value(s)
            if isinstance(attr_value, (list, tuple)):
                new_instances.extend(attr_value)
            else:
                new_instances.append(attr_value)
    
    context.instance_stack.append({'instances': new_instances})


@given("[its entity type] ^is^ '{expected_type}'")
def step_given_entity_type_is(context, expected_type):
    """
    Filter instances by entity type
    """
    if not hasattr(context, 'instance_stack') or not context.instance_stack:
        return
    
    current_layer = context.instance_stack[-1].get('instances', [])
    filtered = []
    
    for inst in current_layer:
        if context.model_type == 'step':
            # IfcOpenShell instance
            if inst.is_a(expected_type):
                filtered.append(inst)
        else:
            # XML element
            if inst.tag == expected_type:
                filtered.append(inst)
    
    context.instance_stack.append({'instances': filtered})


@given("its .{attribute}. attribute ^is^ '{expected_value}'")
def step_given_attribute_value_is(context, attribute, expected_value):
    """
    Filter instances where attribute equals a specific value
    """
    attribute = attribute.strip('.')
    
    if not hasattr(context, 'instance_stack') or not context.instance_stack:
        return
    
    current_layer = context.instance_stack[-1].get('instances', [])
    filtered = []
    
    for inst in current_layer:
        if context.model_type == 'step':
            # IfcOpenShell instance
            attr_value = getattr(inst, attribute, None)
        else:
            # XML element
            attr_value = inst.get(attribute)
        
        if attr_value == expected_value:
            filtered.append(inst)
    
    context.instance_stack.append({'instances': filtered})

