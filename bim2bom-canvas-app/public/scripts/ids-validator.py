"""
IDS Validation Module for Pyodide
Uses ifctester to validate IFC files against IDS specifications
"""

import ifcopenshell
from typing import Dict, Optional


def create_default_ids() -> str:
    """
    Create a default IDS specification for BIP validation
    This is a simple IDS that checks for BIP property set
    """
    ids_xml = """<?xml version="1.0" encoding="UTF-8"?>
<ids xmlns="http://standards.buildingsmart.org/IDS"
     xmlns:xs="http://www.w3.org/2001/XMLSchema"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://standards.buildingsmart.org/IDS http://standards.buildingsmart.org/IDS/ids.xsd">
    <info>
        <title>BIP Property Validation</title>
        <copyright>Copyright</copyright>
        <version>1.0</version>
        <author>BIM2BOM</author>
        <date>2024</date>
        <description>Validates that elements have BIP property set with type name id</description>
    </info>
    <specifications>
        <specification name="BIP Property Set Required">
            <applicability>
                <entity name="IFCWALL"/>
                <entity name="IFCSLAB"/>
                <entity name="IFCROOF"/>
                <entity name="IFCDOOR"/>
                <entity name="IFCWINDOW"/>
                <entity name="IFCBEAM"/>
                <entity name="IFCCOLUMN"/>
            </applicability>
            <requirements>
                <property baseName="type name id" propertySet="BIP" dataType="IfcLabel" minOccurs="1" maxOccurs="1">
                    <description>Type name id is required in BIP property set</description>
                </property>
            </requirements>
        </specification>
    </specifications>
</ids>"""
    return ids_xml


def validate_ifc_with_ids(ifc_path: str, ids_file_path: Optional[str] = None) -> Dict:
    """
    Validate IFC file against IDS specification using ifctester
    
    Args:
        ifc_path: Path to IFC file in Pyodide filesystem
        ids_file_path: Optional path to IDS file in Pyodide filesystem. If None, uses /BIM2BOM.ids
        
    Returns:
        Dictionary with validation results including HTML report
    """
    try:
        # Import ifctester
        from ifctester import ids
        from ifctester import reporter
    except ImportError:
        # Fallback: return error message
        return {
            'html': '<html><body><h1>Error</h1><p>ifctester not installed. Please install it first.</p></body></html>',
            'json': {'error': 'ifctester not installed'},
            'valid': False
        }
    
    try:
        # Use default IDS file path if none provided
        if ids_file_path is None:
            ids_file_path = '/BIM2BOM.ids'
        
        # Load IFC file
        ifc_model = ifcopenshell.open(ifc_path)
        
        # Load IDS file
        with open(ids_file_path, 'r', encoding='utf-8') as f:
            ids_xml = f.read()
        
        # Parse IDS XML
        ids_spec = ids.Ids()
        ids_spec.parse(ids_xml)
        
        # Validate IFC against IDS
        ids_spec.validate(ifc_model)
        
        # Generate HTML report
        html_reporter = reporter.Html(ids_spec)
        html_reporter.report()
        html_report = html_reporter.to_string()
        
        # Generate JSON report
        json_reporter = reporter.Json(ids_spec)
        json_reporter.report()
        json_report = json_reporter.to_string()
        
        # Parse JSON
        import json
        json_data = json.loads(json_report)
        
        # Determine if validation passed
        valid = True
        if json_data.get("specifications"):
            for spec in json_data["specifications"]:
                if spec.get("requirements"):
                    for req in spec["requirements"]:
                        if req.get("status") != "PASSED":
                            valid = False
                            break
                if not valid:
                    break
        
        return {
            'html': html_report,
            'json': json_data,
            'valid': valid
        }
        
    except Exception as e:
        # Return error report
        import traceback
        error_trace = traceback.format_exc()
        error_html = f"""
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Validation Error</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .error {{ background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }}
                pre {{ background: #f9fafb; padding: 10px; overflow-x: auto; }}
            </style>
        </head>
        <body>
            <h1>Validation Error</h1>
            <div class="error">
                <p><strong>Error:</strong> {str(e)}</p>
                <pre>{error_trace}</pre>
            </div>
        </body>
        </html>
        """
        return {
            'html': error_html,
            'json': {'error': str(e), 'traceback': error_trace},
            'valid': False
        }

