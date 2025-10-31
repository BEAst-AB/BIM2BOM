/**
 * Main application logic
 */

import { loadPyodideRuntime, getPyodide, getTransformer, setTransformer } from './pyodide-loader.js';
import { UIState } from './ui.js';
import { displayXMLExplorer } from './xml-explorer.js';
import { validateIfcAgainstIds, loadPredefinedIds } from './ids-validator.js';
import { validateBipTypeNameId, loadPredefinedCsv } from './bip-type-tester.js';
import { 
    readFileAsArrayBuffer, 
    arrayBufferToUint8Array, 
    generateOutputFilename, 
    downloadBlob,
    validateIFCFile,
    detectIFCSchema
} from './utils.js';

// Initialize UI state
const ui = new UIState();

// Application state
let pyodideReady = false;
let currentXMLBlob = null;
let currentFilename = null;

/**
 * Initialize application
 */
async function init() {
    console.log('Initializing IFC2Peppol application...');
    
    // Set up file input handler
    const fileInput = document.getElementById('file-input');
    const filePickerBtn = document.getElementById('file-picker-btn');
    const dropZone = document.getElementById('drop-zone');
    
    filePickerBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    // Set up drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        ui.updateDropZone('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        ui.updateDropZone('idle');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        ui.updateDropZone('idle');
        
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    // Set up validation tab switching
    const validationTabs = document.querySelectorAll('.validation-tab');
    validationTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            ui.switchValidationTab(tabName);
        });
    });
    
    // Lazy load Pyodide when user first interacts
    // For now, we'll load it on initialization
    // In production, you might want to load it only when file is dropped
    await loadPyodideWithProgress();
}

/**
 * Show loading spinner overlay
 */
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    const dropZone = document.getElementById('drop-zone');
    overlay.hidden = false;
    dropZone.style.pointerEvents = 'none';
    dropZone.style.opacity = '0.6';
}

/**
 * Hide loading spinner overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    const dropZone = document.getElementById('drop-zone');
    overlay.hidden = true;
    dropZone.style.pointerEvents = '';
    dropZone.style.opacity = '1';
}

/**
 * Load Pyodide with progress updates
 */
async function loadPyodideWithProgress() {
    try {
        ui.updateStatus('loading', 'Loading Pyodide...');
        
        await loadPyodideRuntime((percent, message) => {
            // Update loading text
            const loadingText = document.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message || 'Loading...';
            }
        });
        
        pyodideReady = true;
        ui.updateStatus('ready', 'Ready');
        
        console.log('Pyodide loaded successfully');
    } catch (error) {
        console.error('Failed to load Pyodide:', error);
        hideLoading();
        ui.showError(
            'Failed to load Pyodide runtime',
            error.message
        );
    }
}

/**
 * Handle file upload
 */
async function handleFile(file) {
    // Reset UI
    ui.reset();
    
    // Validate file
    const validation = validateIFCFile(file);
    if (!validation.valid) {
        ui.showError(validation.error);
        return;
    }
    
    if (validation.warning) {
        console.warn(validation.warning);
    }
    
    // Detect IFC schema from file header
    const schema = await detectIFCSchema(file);
    
    // Show file info with schema
    ui.showFileInfo(file, schema);
    ui.updateStatus('processing', 'Processing...');
    
    // Ensure Pyodide is loaded
    if (!pyodideReady) {
        await loadPyodideWithProgress();
    }
    
    try {
        // Read file as ArrayBuffer
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const uint8Array = arrayBufferToUint8Array(arrayBuffer);
        
        // Validate IFC against IDS before transformation
        await validateAndPrompt(file, uint8Array);
        
    } catch (error) {
        console.error('File handling error:', error);
        hideLoading();
        ui.showError('Failed to process file', error.message);
    }
}

/**
 * Validate IFC file and prompt user to proceed
 */
async function validateAndPrompt(file, ifcBytes) {
    try {
        const loadingText = document.querySelector('.loading-text');
        const pyodide = getPyodide();
        if (!pyodide) {
            throw new Error('Pyodide not loaded');
        }
        
        // Step 1: IDS Validation
        if (loadingText) {
            loadingText.textContent = 'Validating IFC file against IDS...';
        }
        
        const idsXml = await loadPredefinedIds('public/ids/BIM2BOM.ids');
        const idsValidationResults = await validateIfcAgainstIds(pyodide, ifcBytes, idsXml);
        
        // Hide loading overlay after IDS validation
        hideLoading();
        
        // Display IDS validation results and prompt user
        ui.showValidationResults(idsValidationResults, async () => {
            // User clicked "Continue to BIP Validation" - switch tab and run BIP validation
            showLoading();
            
            try {
                // Step 2: BIP Type Tester Validation
                if (loadingText) {
                    loadingText.textContent = 'Validating BIP type consistency...';
                }
                
                const csvContent = await loadPredefinedCsv('public/config/bip_type_name_id_properties.csv');
                const bipValidationResults = await validateBipTypeNameId(pyodide, ifcBytes, csvContent);
                
                // Hide loading overlay after BIP validation
                hideLoading();
                
                // Display BIP validation results in the BIP tab
                ui.showBipValidationResults(bipValidationResults, () => {
                    // User confirmed BIP validation - proceed with transformation
                    showLoading();
                    transformIFC(ifcBytes, file.name);
                });
                
            } catch (bipError) {
                console.error('BIP validation error:', bipError);
                hideLoading();
                
                // If BIP validation fails, ask user if they want to proceed anyway
                ui.showBipValidationError(bipError, () => {
                    // User chose to proceed anyway
                    showLoading();
                    transformIFC(ifcBytes, file.name);
                });
            }
        });
        
    } catch (error) {
        console.error('IDS validation error:', error);
        hideLoading();
        
        // If IDS validation fails, ask user if they want to proceed anyway
        ui.showValidationError(error, () => {
            // User chose to proceed anyway - skip BIP validation and go straight to transformation
            showLoading();
            transformIFC(ifcBytes, file.name);
        });
    }
}

/**
 * Transform IFC file to Peppol XML
 */
async function transformIFC(ifcBytes, filename) {
    const startTime = Date.now();
    
    try {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = 'Transforming IFC file...';
        }
        
        const pyodide = getPyodide();
        if (!pyodide) {
            throw new Error('Pyodide not loaded');
        }
        
        // Load transformer code if not already loaded
        let transformer = getTransformer();
        let transformFunc = null;
        
        console.log('Transformer module:', transformer);
        
        if (transformer && transformer.transform) {
            console.log('Using cached transformer');
            transformFunc = transformer.transform;
        } else {
            console.log('Loading transformer code from file...');
            // Load transformer code
            const transformerCode = await fetch('src/transformer.py').then(r => r.text());
            pyodide.runPython(transformerCode);
            transformFunc = pyodide.globals.get('transform_ifc_to_peppol_bytes');
            
            console.log('Transformer function loaded:', transformFunc, typeof transformFunc);
            
            // Update transformer module cache
            if (transformFunc) {
                setTransformer(transformFunc);
            }
        }
        
        if (!transformFunc || typeof transformFunc !== 'function') {
            console.error('TransformFunc is:', transformFunc, typeof transformFunc);
            throw new Error(`Transformer function not found or invalid. Type: ${typeof transformFunc}`);
        }
        
        // Write IFC bytes to Pyodide's virtual filesystem
        const tempPath = '/tmp/ifc_input.ifc';
        pyodide.FS.writeFile(tempPath, ifcBytes);
        
        // Update loading text
        if (loadingText) {
            loadingText.textContent = 'Transforming IFC file...';
        }
        
        // Call transformer function with the file path
        // The transformer will load the file from Pyodide FS
        const result = transformFunc(tempPath, 375.0);
        
        // Result is a tuple: (xml_string, stats_dict)
        // Access tuple elements using toJs() if needed
        let xmlString, stats;
        if (result && result.toJs) {
            const jsResult = result.toJs();
            xmlString = jsResult[0];
            stats = jsResult[1];
        } else if (Array.isArray(result)) {
            xmlString = result[0];
            stats = result[1];
        } else {
            // Try direct access (Pyodide tuple)
            xmlString = result[0];
            stats = result[1];
        }
        
        // Convert to JavaScript strings/objects if needed
        if (xmlString && typeof xmlString.toString === 'function' && typeof xmlString !== 'string') {
            xmlString = xmlString.toString();
        }
        if (stats && stats.toJs) {
            stats = stats.toJs();
        } else if (stats && typeof stats.toJSON === 'function') {
            stats = stats.toJSON();
        }
        
        console.log('Transformation result:', { xmlLength: xmlString?.length, stats });
        
        // Create blob from XML string
        const blob = new Blob([xmlString], { type: 'application/xml' });
        currentXMLBlob = blob;
        currentFilename = generateOutputFilename(filename);
        
        // Update statistics
        const processingTime = Date.now() - startTime;
        ui.showStatistics({
            processed: stats.processed || 0,
            filtered: stats.filtered || 0,
            lines: stats.lines || 0,
            time: processingTime
        });
        
        // Display XML explorer first (will scroll to it)
        displayXMLExplorer(xmlString, ui);
        
        // Show download section at bottom
        ui.showDownload(currentFilename, blob.size);
        ui.setDownloadCallback(() => {
            downloadBlob(blob, currentFilename);
        });
        
        ui.updateStatus('completed', 'Complete');
        
        // Hide loading overlay after successful transformation
        hideLoading();
        
        console.log('Transformation completed successfully');
        
    } catch (error) {
        console.error('Transformation error:', error);
        hideLoading();
        ui.showError('Transformation failed', error.message);
        throw error;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

