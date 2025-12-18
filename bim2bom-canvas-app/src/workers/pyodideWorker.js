/**
 * Pyodide Web Worker for IFC Processing
 * Handles all IFC-related operations in a separate thread
 */

let pyodideInstance = null;
let isInitializing = false;
let initPromise = null;

/**
 * Initialize Pyodide runtime
 */
async function initializePyodide(progressCallback) {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  progressCallback?.(0, 'Loading Pyodide runtime...');

  initPromise = (async () => {
    // Load Pyodide script if not already loaded
    // Note: Pyodide needs to be loaded via import() in worker context
    if (!self.loadPyodide) {
      // Use dynamic import for ES modules in worker
      // Pyodide CDN provides a module version
      try {
        // Import Pyodide as an ES module
        const pyodideModule = await import('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs');
        self.loadPyodide = pyodideModule.loadPyodide;
      } catch (e) {
        // Fallback: try loading the script version
        // This won't work in strict worker context, so we'll need to handle this differently
        throw new Error('Pyodide cannot be loaded in worker context. Consider loading it in main thread.');
      }
    }

    progressCallback?.(30, 'Initializing Pyodide...');

    // Initialize Pyodide
    pyodideInstance = await self.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
      stdout: (text) => {
        self.postMessage({ type: 'log', data: `[Pyodide] ${text}` });
      },
      stderr: (text) => {
        self.postMessage({ type: 'error', data: `[Pyodide Error] ${text}` });
      },
    });

    progressCallback?.(50, 'Installing micropip...');
    await pyodideInstance.loadPackage(['micropip']);

    progressCallback?.(60, 'Installing IfcOpenShell...');
    
    // Install IfcOpenShell
    const wheels = [
      'https://ifcopenshell.github.io/wasm-wheels/ifcopenshell-0.8.2+d50e806-cp312-cp312-emscripten_3_1_58_wasm32.whl',
      'https://ifcopenshell.github.io/wasm-wheels/ifcopenshell-0.8.1+latest-cp312-cp312-emscripten_3_1_58_wasm32.whl',
    ];

    let installSuccess = false;
    for (const wheelUrl of wheels) {
      try {
        await pyodideInstance.runPythonAsync(`
          import micropip
          await micropip.install("${wheelUrl}")
        `);
        installSuccess = true;
        break;
      } catch (error) {
        console.warn(`Failed to install ${wheelUrl}:`, error.message);
        if (!error.message.includes('Emscripten')) {
          throw error;
        }
      }
    }

    if (!installSuccess) {
      throw new Error('Failed to install IfcOpenShell. No compatible wheel found.');
    }

    progressCallback?.(80, 'Installing lxml...');
    await pyodideInstance.runPythonAsync(`
      import micropip
      await micropip.install("lxml")
    `);

    progressCallback?.(90, 'Loading transformer modules...');
    
    // Load transformer module
    const transformerResponse = await fetch('/scripts/transformer.py');
    const transformerCode = await transformerResponse.text();
    pyodideInstance.runPython(transformerCode);

    // Load BIP type tester module
    const bipTesterResponse = await fetch('/scripts/bip-type-tester.py');
    const bipTesterCode = await bipTesterResponse.text();
    pyodideInstance.runPython(bipTesterCode);

    progressCallback?.(100, 'Ready');
    isInitializing = false;

    return pyodideInstance;
  })();

  return initPromise;
}

/**
 * Handle messages from main thread
 */
self.addEventListener('message', async (event) => {
  const { type, id, data } = event.data;

  try {
    switch (type) {
      case 'INIT':
        await initializePyodide((percent, message) => {
          self.postMessage({ type: 'PROGRESS', id, percent, message });
        });
        self.postMessage({ type: 'INIT_COMPLETE', id });
        break;

      case 'UPLOAD_FILE':
        if (!pyodideInstance) {
          await initializePyodide();
        }
        
        const { fileData, filename } = data;
        const tempPath = `/tmp/${filename}`;
        
        // Write file to Pyodide filesystem
        pyodideInstance.FS.writeFile(tempPath, fileData);
        
        self.postMessage({ 
          type: 'UPLOAD_COMPLETE', 
          id, 
          data: { path: tempPath, filename } 
        });
        break;

      case 'RUN_VALIDATION':
        if (!pyodideInstance) {
          await initializePyodide();
        }
        
        const { ifcPath, csvPath, csvContent } = data;
        
        // If CSV content is provided, write it to filesystem
        if (csvContent && csvPath) {
          pyodideInstance.FS.writeFile(csvPath, csvContent);
        }
        
        const validateFunc = pyodideInstance.globals.get('validate_bip_type_name_id');
        
        if (!validateFunc) {
          throw new Error('Validation function not found');
        }
        
        const validationResult = validateFunc(ifcPath, csvPath);
        
        // Convert Python dict to JavaScript object
        const jsResult = validationResult.toJs 
          ? validationResult.toJs({ dict_converter: Object.fromEntries })
          : validationResult;
        
        self.postMessage({ 
          type: 'VALIDATION_COMPLETE', 
          id, 
          data: jsResult 
        });
        break;

      case 'CONVERT_TO_XML':
        if (!pyodideInstance) {
          await initializePyodide();
        }
        
        const { ifcPath: convertPath, mmiThreshold = 375.0 } = data;
        const transformFunc = pyodideInstance.globals.get('transform_ifc_to_peppol_bytes');
        
        if (!transformFunc) {
          throw new Error('Transform function not found');
        }
        
        const transformResult = transformFunc(convertPath, mmiThreshold);
        
        // Convert Python tuple to JavaScript array
        let xmlString;
        let stats;
        
        if (transformResult && transformResult.toJs) {
          const jsResult = transformResult.toJs();
          xmlString = jsResult[0];
          stats = jsResult[1]?.toJs ? jsResult[1].toJs({ dict_converter: Object.fromEntries }) : jsResult[1];
        } else if (Array.isArray(transformResult)) {
          xmlString = transformResult[0];
          stats = transformResult[1];
        } else {
          xmlString = transformResult[0];
          stats = transformResult[1];
        }
        
        // Ensure string conversion
        if (xmlString && typeof xmlString.toString === 'function' && typeof xmlString !== 'string') {
          xmlString = xmlString.toString();
        }
        if (stats && stats.toJs) {
          stats = stats.toJs({ dict_converter: Object.fromEntries });
        }
        
        self.postMessage({ 
          type: 'CONVERSION_COMPLETE', 
          id, 
          data: { xml: xmlString, stats } 
        });
        break;

      default:
        self.postMessage({ 
          type: 'ERROR', 
          id, 
          error: `Unknown message type: ${type}` 
        });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      id, 
      error: error.message || String(error),
      stack: error.stack 
    });
  }
});

