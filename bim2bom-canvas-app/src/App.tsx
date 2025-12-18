/**
 * Main App Component
 */

import { useState, useCallback, useEffect } from 'react';
import { ProcessCanvas } from './components/canvas/ProcessCanvas';
import { DataViewer } from './components/DataViewer';
import { pyodideService } from './services/pyodideService';
import { useProcurementStore, ProcurementStep } from './store/procurementStore';
import './App.css';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentCase = useProcurementStore((state) => state.currentCase);
  const selectedNodeId = useProcurementStore((state) => state.selectedNodeId);
  const setIFCFile = useProcurementStore((state) => state.setIFCFile);
  const setIFCCsvData = useProcurementStore((state) => state.setIFCCsvData);
  const setValidationResults = useProcurementStore((state) => state.setValidationResults);
  const setCatalogueXML = useProcurementStore((state) => state.setCatalogueXML);
  const updateStep = useProcurementStore((state) => state.updateStep);

  // Initialize Pyodide on mount
  useEffect(() => {
    pyodideService.initialize((progress) => {
      console.log(`Pyodide: ${progress.percent}% - ${progress.message}`);
    }).then(() => {
      setIsReady(true);
    }).catch((error) => {
      console.error('Failed to initialize Pyodide:', error);
    });
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!isReady) {
      alert('Pyodide not ready yet. Please wait...');
      return;
    }

    setIsProcessing(true);

    try {
      // Read file as Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload file to Pyodide filesystem
      const { path } = await pyodideService.uploadFile(uint8Array, file.name);
      setIFCFile(file, path);

      // Extract IFC CSV data
      try {
        const csvData = await pyodideService.extractIFCCsv(path);
        setIFCCsvData(csvData);
      } catch (csvError) {
        console.warn('Failed to extract IFC CSV:', csvError);
        // Continue even if CSV extraction fails
      }

      // Run validation
      try {
        // Load CSV file and pass content
        const csvResponse = await fetch('/config/bip_type_name_id_properties.csv');
        const csvText = await csvResponse.text();
        const csvPath = '/tmp/bip_type_name_id_properties.csv';
        
        const validationResults = await pyodideService.runValidation(path, csvPath, csvText);
        setValidationResults(validationResults);
      } catch (validationError) {
        console.warn('Validation failed:', validationError);
        // Continue even if validation fails
      }

      // Convert to XML
      try {
        const { xml, stats } = await pyodideService.convertToXML(path);
        console.log('Conversion stats:', stats);
        console.log('Setting catalogue XML, step should become CONVERTED');
        setCatalogueXML(xml);
        console.log('Catalogue XML set, checking step:', currentCase?.step);
      } catch (conversionError) {
        console.error('Conversion failed:', conversionError);
        alert('Failed to convert IFC to Peppol XML');
      }
    } catch (error: any) {
      console.error('File processing error:', error);
      alert(`Error processing file: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [isReady, setIFCFile, setValidationResults, setCatalogueXML]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.ifc')) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.ifc')) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const setEnrichedData = useProcurementStore((state) => state.setEnrichedData);

  const simulateNextStep = useCallback(() => {
    if (!currentCase) return;

    const stepOrder: ProcurementStep[] = [
      ProcurementStep.UPLOADED,
      ProcurementStep.VALIDATED,
      ProcurementStep.CONVERTED,
      ProcurementStep.SENT_TO_BUYER,
      ProcurementStep.ENRICHED,
      ProcurementStep.RFQ_SENT,
      ProcurementStep.QUOTE_RECEIVED,
      ProcurementStep.ACCEPTED,
      ProcurementStep.WRITTEN_BACK,
    ];

    const currentIndex = stepOrder.indexOf(currentCase.step);
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      
      // Initialize enrichedData when entering enrichment step
      if (nextStep === ProcurementStep.ENRICHED && currentCase.catalogueXML && !currentCase.enrichedData) {
        setEnrichedData({
          xml: currentCase.catalogueXML,
          tableData: null, // Will be parsed when needed
        });
      }
      
      updateStep(nextStep);
    }
  }, [currentCase, updateStep, setEnrichedData]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>BIM2BOM Canvas App</h1>
        <div className="controls">
          <input
            type="file"
            accept=".ifc"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input" className="button">
            Upload IFC File
          </label>
          {currentCase && (
            <button onClick={simulateNextStep} className="button">
              Next Step
            </button>
          )}
          {!isReady && <span style={{ color: '#6b7280' }}>Initializing Pyodide...</span>}
          {isProcessing && <span style={{ color: '#6b7280' }}>Processing...</span>}
        </div>
      </header>

      <div
        className="main-content"
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="canvas-panel">
          <h2>Process Flow</h2>
          <div style={{ width: '100%', height: '600px', minWidth: 0, maxWidth: '100%' }}>
            <ProcessCanvas />
          </div>
        </div>
      </div>

      {(currentCase?.catalogueXML || currentCase) && (
        <div className="xml-panel">
          <DataViewer selectedNodeId={selectedNodeId} />
        </div>
      )}
    </div>
  );
}

export default App;

