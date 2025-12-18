/**
 * Pyodide Service - Main thread Pyodide initialization and processing
 * Note: Pyodide works better in main thread, processing is async to keep UI responsive
 */

declare global {
  interface Window {
    loadPyodide: any;
  }
}

let pyodideInstance: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

export interface PyodideProgress {
  percent: number;
  message: string;
}

export class PyodideService {
  private progressCallback?: (progress: PyodideProgress) => void;

  async initialize(progressCallback?: (progress: PyodideProgress) => void): Promise<void> {
    this.progressCallback = progressCallback;

    if (pyodideInstance) {
      return;
    }

    if (isInitializing && initPromise) {
      return initPromise;
    }

    isInitializing = true;
    this.reportProgress(0, 'Loading Pyodide runtime...');

    initPromise = (async () => {
      // Load Pyodide script if not already loaded
      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Pyodide script'));
          document.head.appendChild(script);
        });
      }

      this.reportProgress(30, 'Initializing Pyodide...');

      // Initialize Pyodide
      pyodideInstance = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
        stdout: (text: string) => {
          console.log('[Pyodide]', text);
        },
        stderr: (text: string) => {
          console.error('[Pyodide Error]', text);
        },
      });

      this.reportProgress(50, 'Installing micropip...');
      await pyodideInstance.loadPackage(['micropip']);

      this.reportProgress(60, 'Installing IfcOpenShell...');

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
        } catch (error: any) {
          console.warn(`Failed to install ${wheelUrl}:`, error.message);
          if (!error.message.includes('Emscripten')) {
            throw error;
          }
        }
      }

      if (!installSuccess) {
        throw new Error('Failed to install IfcOpenShell. No compatible wheel found.');
      }

      this.reportProgress(80, 'Installing lxml...');
      await pyodideInstance.runPythonAsync(`
        import micropip
        await micropip.install("lxml")
      `);

      this.reportProgress(85, 'Installing ifctester...');
      try {
        await pyodideInstance.runPythonAsync(`
          import micropip
          await micropip.install("odfpy")
        `);
        await pyodideInstance.runPythonAsync(`
          import micropip
          await micropip.install("ifctester")
        `);
      } catch (error: any) {
        console.warn('Failed to install ifctester:', error.message);
        // Continue without ifctester - will use custom HTML generation
      }

      this.reportProgress(90, 'Loading transformer modules...');

      // Load transformer module
      const transformerResponse = await fetch('/scripts/transformer.py');
      const transformerCode = await transformerResponse.text();
      pyodideInstance.runPython(transformerCode);

      // Load IDS validator module
      const idsValidatorResponse = await fetch('/scripts/ids-validator.py');
      const idsValidatorCode = await idsValidatorResponse.text();
      pyodideInstance.runPython(idsValidatorCode);

      this.reportProgress(100, 'Ready');
      isInitializing = false;

      return pyodideInstance;
    })();

    return initPromise;
  }

  async uploadFile(fileData: Uint8Array, filename: string): Promise<{ path: string; filename: string }> {
    if (!pyodideInstance) {
      await this.initialize();
    }

    const tempPath = `/tmp/${filename}`;
    pyodideInstance.FS.writeFile(tempPath, fileData);

    return { path: tempPath, filename };
  }

  async runValidation(ifcPath: string, csvPath: string, csvContent: string): Promise<any> {
    if (!pyodideInstance) {
      await this.initialize();
    }

    // Load BIM2BOM.ids file from public folder
    const idsResponse = await fetch('/BIM2BOM.ids');
    const idsContent = await idsResponse.text();
    const idsPath = '/tmp/BIM2BOM.ids';
    
    // Write IDS file to Pyodide filesystem
    pyodideInstance.FS.writeFile(idsPath, idsContent);

    const validateFunc = pyodideInstance.globals.get('validate_ifc_with_ids');

    if (!validateFunc) {
      throw new Error('IDS validation function not found');
    }

    // Run IDS validation with BIM2BOM.ids file
    const validationResult = validateFunc(ifcPath, idsPath);

    // Convert Python dict to JavaScript object
    const jsResult = validationResult.toJs
      ? validationResult.toJs({ dict_converter: Object.fromEntries })
      : validationResult;

    return jsResult;
  }

  async extractIFCCsv(ifcPath: string): Promise<any[]> {
    if (!pyodideInstance) {
      await this.initialize();
    }

    // Extract IFC data as CSV-like structure
    const csvCode = `
import ifcopenshell
import json

def extract_ifc_csv(ifc_path):
    model = ifcopenshell.open(ifc_path)
    rows = []
    
    # Get all IFC elements
    for element_type in ['IfcWall', 'IfcSlab', 'IfcRoof', 'IfcDoor', 'IfcWindow', 'IfcBeam', 'IfcColumn']:
        try:
            elements = model.by_type(element_type)
            for element in elements:
                row = {
                    'GlobalId': str(element.GlobalId) if hasattr(element, 'GlobalId') else '',
                    'Type': element_type,
                    'Name': str(element.Name) if hasattr(element, 'Name') and element.Name else '',
                    'Tag': str(element.Tag) if hasattr(element, 'Tag') and element.Tag else '',
                }
                
                # Get properties
                if hasattr(element, 'IsDefinedBy'):
                    for rel in element.IsDefinedBy:
                        if hasattr(rel, 'RelatingPropertyDefinition'):
                            if hasattr(rel.RelatingPropertyDefinition, 'HasProperties'):
                                for prop in rel.RelatingPropertyDefinition.HasProperties:
                                    if hasattr(prop, 'Name') and hasattr(prop, 'NominalValue'):
                                        row[prop.Name] = str(prop.NominalValue)
                
                rows.append(row)
        except:
            pass
    
    return rows
`;

    try {
      pyodideInstance.runPython(csvCode);
      const extractFunc = pyodideInstance.globals.get('extract_ifc_csv');
      const result = extractFunc(ifcPath);
      
      // Convert to JS array
      if (result && result.toJs) {
        return result.toJs({ dict_converter: Object.fromEntries });
      }
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Failed to extract IFC CSV:', error);
      return [];
    }
  }

  async convertToXML(ifcPath: string, mmiThreshold = 375.0): Promise<{ xml: string; stats: any }> {
    if (!pyodideInstance) {
      await this.initialize();
    }

    const transformFunc = pyodideInstance.globals.get('transform_ifc_to_peppol_bytes');

    if (!transformFunc) {
      throw new Error('Transform function not found');
    }

    const transformResult = transformFunc(ifcPath, mmiThreshold);

    // Convert Python tuple to JavaScript array
    let xmlString: string;
    let stats: any;

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
    if (xmlString && typeof xmlString !== 'string') {
      xmlString = String(xmlString);
    }
    if (stats && stats.toJs) {
      stats = stats.toJs({ dict_converter: Object.fromEntries });
    }

    return { xml: xmlString, stats };
  }

  private reportProgress(percent: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ percent, message });
    }
  }
}

export const pyodideService = new PyodideService();

