"""
Behave environment setup for BIM2BOM validation framework
"""

import ifcopenshell


def before_all(context):
    """Initialize context before all tests"""
    context.config.setup_logging()


def before_feature(context, feature):
    """Load IFC file before each feature"""
    # Get input file from command line
    input_file = context.config.userdata.get('input')
    
    if not input_file:
        raise ValueError("No input file specified. Use: behave --define input=path/to/file.ifc")
    
    # Load the IFC model
    print(f"\nLoading IFC file: {input_file}")
    
    try:
        # Try to load as XML first
        if input_file.endswith('.xml'):
            # For XML files, we'll need to handle differently
            import xml.etree.ElementTree as ET
            context.model_type = 'xml'
            context.tree = ET.parse(input_file)
            context.root = context.tree.getroot()
            context.model = None  # No ifcopenshell model for XML
            context.xml_file = input_file
            print("Loaded as IFC-XML format")
        else:
            # Load as STEP format
            context.model = ifcopenshell.open(input_file)
            context.model_type = 'step'
            context.xml_file = None
            print(f"Loaded IFC model: {context.model.schema}")
    except Exception as e:
        print(f"Error loading file: {e}")
        raise
    
    # Initialize results storage
    context.validation_results = []


def before_scenario(context, scenario):
    """Initialize before each scenario"""
    # Create a stack for instances (used in step chaining)
    # Use custom name to avoid conflict with Behave's internal _stack
    context.instance_stack = []
    context.applicable = True
    context.within_model = True


def after_scenario(context, scenario):
    """Clean up after each scenario"""
    # Clear the stack
    context.instance_stack = []


def after_feature(context, feature):
    """Clean up after feature"""
    # Could generate summary reports here if needed
    pass

