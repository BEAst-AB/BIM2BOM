/**
 * Pyodide loader and initialization
 */

let pyodideInstance = null;
let transformerModule = null;

/**
 * Load Pyodide runtime
 */
export async function loadPyodideRuntime(progressCallback) {
    if (pyodideInstance) {
        return pyodideInstance;
    }

    progressCallback?.(0, 'Loading Pyodide runtime...');
    
    // Load Pyodide from CDN
    // Check if already loaded
    if (window.loadPyodide) {
        return await initializePyodide(progressCallback);
    }
    
    const script = document.createElement('script');
    // Use latest Pyodide version - trying latest development version
    // Note: May need to check which version supports Emscripten 4.0.9
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    
    return new Promise((resolve, reject) => {
        script.onload = async () => {
            try {
                await initializePyodide(progressCallback);
                resolve(pyodideInstance);
            } catch (error) {
                reject(error);
            }
        };
        
        script.onerror = () => {
            reject(new Error('Failed to load Pyodide script'));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Initialize Pyodide after script loads
 */
async function initializePyodide(progressCallback) {
    progressCallback?.(30, 'Initializing Pyodide...');
    
    // Load Pyodide using global loadPyodide function
    pyodideInstance = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
        stdout: (text) => {
            console.log('[Pyodide]', text);
        },
        stderr: (text) => {
            console.error('[Pyodide]', text);
        }
    });

    progressCallback?.(50, 'Installing micropip...');
    
    // Install micropip
    await pyodideInstance.loadPackage(['micropip']);

    progressCallback?.(60, 'Installing IfcOpenShell...');
    
    // Check Pyodide's Emscripten version and install compatible wheel
    // First, let's check what version we're actually running
    const emscriptenVersion = await pyodideInstance.runPythonAsync(`
        import sys
        # Try to get emscripten version from pyodide
        try:
            import pyodide_js
            # Check if we can determine emscripten version
            version = "unknown"
        except:
            version = "unknown"
        version
    `).catch(() => "unknown");
    
    console.log('Pyodide Emscripten version check:', emscriptenVersion);
    
    // Try different wheels based on compatibility
    // Micropip has strict version checking, so we need exact match
    // Try Emscripten 3.1.58 wheel first (most compatible)
    let installSuccess = false;
    const wheels = [
        "https://ifcopenshell.github.io/wasm-wheels/ifcopenshell-0.8.2+d50e806-cp312-cp312-emscripten_3_1_58_wasm32.whl",
        "https://ifcopenshell.github.io/wasm-wheels/ifcopenshell-0.8.1+latest-cp312-cp312-emscripten_3_1_58_wasm32.whl",
    ];
    
    for (const wheelUrl of wheels) {
        try {
            await pyodideInstance.runPythonAsync(`
                import micropip
                await micropip.install("${wheelUrl}")
            `);
            installSuccess = true;
            console.log('Successfully installed IfcOpenShell from:', wheelUrl);
            break;
        } catch (error) {
            console.warn(`Failed to install ${wheelUrl}:`, error.message);
            if (error.message.includes('Emscripten')) {
                continue; // Try next wheel
            } else {
                throw error; // Re-throw if it's not an emscripten version error
            }
        }
    }
    
    if (!installSuccess) {
        throw new Error('Failed to install IfcOpenShell. No compatible wheel found for this Pyodide/Emscripten version.');
    }

    progressCallback?.(80, 'Installing lxml...');
    
    // Install lxml
    await pyodideInstance.runPythonAsync(`
        await micropip.install("lxml")
    `);

    progressCallback?.(85, 'Installing IfcTester...');
    
    // Install ifctester dependencies
    try {
        // Try to install shapely first (usually available)
        await pyodideInstance.runPythonAsync(`
            import micropip
            await micropip.install("shapely")
        `);
        
        // Install odfpy from wheel URL (required by ifctester)
        // Using the wheel file from ifctester-next project
        try {
            await pyodideInstance.runPythonAsync(`
                import micropip
                await micropip.install("public/wheels/odfpy-1.4.2-py2.py3-none-any.whl")
            `);
            console.log('odfpy installed successfully from wheel');
        } catch (odfError) {
            console.warn('odfpy wheel installation failed:', odfError.message);
            // Try alternative paths
            try {
                await pyodideInstance.runPythonAsync(`
                    import micropip
                    await micropip.install("/public/wheels/odfpy-1.4.2-py2.py3-none-any.whl")
                `);
            } catch (e) {
                console.warn('Alternative odfpy installation also failed:', e.message);
                // Continue without odfpy - ifctester might work without it for basic validation
            }
        }
        
        // Install ifctester
        await pyodideInstance.runPythonAsync(`
            import micropip
            await micropip.install("ifctester")
        `);
        console.log('IfcTester installed successfully');
    } catch (error) {
        console.warn('Failed to install IfcTester:', error);
        // Continue without ifctester - validation will be skipped
    }

    progressCallback?.(95, 'Loading transformer module...');
    
    // Load transformer module
    transformerModule = await loadTransformerModule(pyodideInstance);
    
    progressCallback?.(98, 'Loading BIP type tester module...');
    
    // Load BIP type tester module
    await loadBipTypeTesterModule(pyodideInstance);

    progressCallback?.(100, 'Ready');
    
    return pyodideInstance;
}

/**
 * Load transformer Python module
 */
async function loadTransformerModule(pyodide) {
    // The transformer code will be embedded here
    // For now, we'll fetch it from a separate file or embed it
    const transformerCode = await fetchTransformerCode();
    
    // Run the transformer code in Pyodide
    pyodide.runPython(transformerCode);
    
    return {
        transform: pyodide.globals.get('transform_ifc_to_peppol_bytes')
    };
}

/**
 * Fetch transformer Python code
 */
async function fetchTransformerCode() {
    // Try to fetch from file first
    try {
        const response = await fetch('src/transformer.py');
        if (response.ok) {
            return await response.text();
        }
    } catch (e) {
        console.warn('Could not fetch transformer.py, using embedded code');
    }
    
    // Return embedded transformer code (fallback)
    throw new Error('Transformer code must be loaded from src/transformer.py');
}

/**
 * Load BIP type tester Python module
 */
async function loadBipTypeTesterModule(pyodide) {
    try {
        const response = await fetch('src/bip-type-tester.py');
        if (response.ok) {
            const code = await response.text();
            pyodide.runPython(code);
            console.log('BIP type tester module loaded successfully');
        } else {
            console.warn('Could not fetch bip-type-tester.py');
        }
    } catch (e) {
        console.warn('Failed to load BIP type tester module:', e);
        // Continue without BIP validation - it will fail gracefully
    }
}

/**
 * Get Pyodide instance
 */
export function getPyodide() {
    return pyodideInstance;
}

/**
 * Get transformer module
 */
export function getTransformer() {
    return transformerModule;
}

/**
 * Set transformer module (for updating cache)
 */
export function setTransformer(transformFunc) {
    transformerModule = {
        transform: transformFunc
    };
}

