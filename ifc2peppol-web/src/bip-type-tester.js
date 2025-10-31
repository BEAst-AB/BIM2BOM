/**
 * BIP Type Tester Validation Module
 * Uses ifcopenshell to validate BIP type name ID consistency and uniqueness
 */

/**
 * Load predefined CSV configuration file
 */
export async function loadPredefinedCsv(csvPath) {
    try {
        // Try multiple possible paths
        const paths = [
            csvPath,
            `/${csvPath}`,
            `public/${csvPath}`,
            `./${csvPath}`
        ];
        
        let lastError = null;
        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    const csvContent = await response.text();
                    return csvContent;
                }
            } catch (error) {
                lastError = error;
                continue;
            }
        }
        
        throw new Error(`Failed to load CSV file from any path: ${paths.join(', ')}`);
    } catch (error) {
        console.error('Failed to load predefined CSV:', error);
        throw error;
    }
}

/**
 * Validate IFC file against BIP type name ID requirements
 * @param {Pyodide} pyodide - Pyodide instance
 * @param {Uint8Array} ifcBytes - IFC file bytes
 * @param {string} csvContent - CSV configuration content
 * @returns {Promise<Object>} Validation results with JSON and HTML reports
 */
export async function validateBipTypeNameId(pyodide, ifcBytes, csvContent) {
    try {
        // Write IFC file to Pyodide filesystem
        const ifcPath = '/tmp/bip_validation_input.ifc';
        pyodide.FS.writeFile(ifcPath, ifcBytes);
        
        // Write CSV to Pyodide filesystem
        const csvPath = '/tmp/bip_validation_config.csv';
        pyodide.FS.writeFile(csvPath, csvContent);
        
        // Run validation
        const result = await pyodide.runPythonAsync(`
import json

# Run validation (function is already loaded from bip-type-tester.py)
results = validate_bip_type_name_id("${ifcPath}", "${csvPath}")

# Return results as dict
{
    "html": results["html"],
    "json": results["json"],
    "valid": results["valid"]
}
        `);
        
        // Convert Python dict to JavaScript object
        const results = result.toJs({ dict_converter: Object.fromEntries });
        
        // Clean up files
        try {
            pyodide.FS.unlink(ifcPath);
            pyodide.FS.unlink(csvPath);
        } catch (e) {
            // Ignore cleanup errors
        }
        
        return results;
    } catch (error) {
        console.error('BIP validation error:', error);
        throw error;
    }
}

