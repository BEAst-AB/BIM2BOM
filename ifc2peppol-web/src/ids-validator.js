/**
 * IDS Validation Module
 * Uses ifctester to validate IFC files against IDS specifications
 */

/**
 * Load ifctester and initialize validation environment
 */
export async function initializeIfcTester(pyodide) {
    try {
        // Install ifctester dependencies
        await pyodide.runPythonAsync(`
            import micropip
            # Install odfpy dependency (required by ifctester)
            await micropip.install('odfpy')
            # Install shapely (required for some ifctester features)
            await micropip.install('shapely')
        `);
        
        // Install ifctester
        await pyodide.runPythonAsync(`
            import micropip
            await micropip.install('ifctester')
        `);
        
        // Load ifctester modules
        await pyodide.runPythonAsync(`
            from ifctester.ids import Ids
            from ifctester.reporter import Json, Html
            import ifcopenshell
        `);
        
        console.log('IfcTester initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize IfcTester:', error);
        throw error;
    }
}

/**
 * Validate IFC file against IDS specification
 * @param {Uint8Array} ifcBytes - IFC file bytes
 * @param {string} idsXml - IDS XML string
 * @returns {Promise<Object>} Validation results with JSON and HTML reports
 */
export async function validateIfcAgainstIds(pyodide, ifcBytes, idsXml) {
    try {
        // Write IFC file to Pyodide filesystem
        const ifcPath = '/tmp/validation_input.ifc';
        pyodide.FS.writeFile(ifcPath, ifcBytes);
        
        // Write IDS XML to Pyodide filesystem (avoids escaping issues)
        const idsPath = '/tmp/validation_ids.ids';
        pyodide.FS.writeFile(idsPath, idsXml);
        
        // Parse IDS and validate - read from file to avoid escaping issues
        const result = await pyodide.runPythonAsync(`
from ifctester.ids import Ids
from ifctester.reporter import Json, Html
import ifcopenshell
import json

# Load IFC file
ifc = ifcopenshell.open("${ifcPath}")

# Load IDS XML from file
with open("${idsPath}", "r", encoding="utf-8") as f:
    ids_xml = f.read()

# Create IDS instance from XML
from xmlschema.validators.exceptions import XMLSchemaValidationError
from ifctester.ids import get_schema

try:
    decode = get_schema().decode(
        ids_xml, 
        strip_namespaces=True, 
        namespaces={"": "http://standards.buildingsmart.org/IDS"}
    )
    ids = Ids().parse(decode)
except Exception as e:
    raise Exception(f"Failed to parse IDS: {str(e)}")

# Validate IFC against IDS
ids.validate(ifc)

# Generate reports
json_reporter = Json(ids)
json_reporter.report()
json_report = json_reporter.to_string()
json_data = json.loads(json_report)

html_reporter = Html(ids)
html_reporter.report()
html_report = html_reporter.to_string()

# Determine if validation passed (check if all requirements passed)
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

# Return results as dict
{
    "json": json_data,
    "html": html_report,
    "valid": valid
}
        `);
        
        // Convert Python dict to JavaScript object
        const results = result.toJs({ dict_converter: Object.fromEntries });
        
        // Clean up files
        pyodide.FS.unlink(ifcPath);
        pyodide.FS.unlink(idsPath);
        
        return results;
    } catch (error) {
        console.error('IDS validation error:', error);
        throw error;
    }
}

/**
 * Load predefined IDS file
 */
export async function loadPredefinedIds(idsPath) {
    try {
        // Try multiple possible paths
        const paths = [
            idsPath,
            `/${idsPath}`,
            `public/${idsPath}`,
            `./${idsPath}`
        ];
        
        let lastError = null;
        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    const idsXml = await response.text();
                    return idsXml;
                }
            } catch (error) {
                lastError = error;
                continue;
            }
        }
        
        throw new Error(`Failed to load IDS file from any path: ${paths.join(', ')}`);
    } catch (error) {
        console.error('Failed to load predefined IDS:', error);
        throw error;
    }
}

