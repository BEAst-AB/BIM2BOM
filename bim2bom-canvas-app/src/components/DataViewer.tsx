/**
 * Data Viewer Component - Shows XML or Data Table with Edit Capability
 */

import { useState, useMemo, useCallback } from 'react';
import { useProcurementStore, ProcurementStep } from '../store/procurementStore';
import { parseXMLToTable, convertTableToXML, type CatalogueLineRow } from '../utils/xmlConverter';

interface DataViewerProps {
  selectedNodeId?: string | null;
}

export function DataViewer({ selectedNodeId }: DataViewerProps) {
  const [viewMode, setViewMode] = useState<'xml' | 'table'>('xml');
  const [isEditing, setIsEditing] = useState(false);
  const [editedXML, setEditedXML] = useState<string>('');
  const [editedTableData, setEditedTableData] = useState<CatalogueLineRow[]>([]);
  
  const currentCase = useProcurementStore((state) => state.currentCase);
  const setEnrichedData = useProcurementStore((state) => state.setEnrichedData);
  const currentStep = currentCase?.step;

  // Check if we're in enrichment step or viewing enrich node
  const isEnrichmentStep = (currentStep === ProcurementStep.ENRICHED || 
                            currentStep === ProcurementStep.SENT_TO_BUYER ||
                            selectedNodeId === 'enrich') && 
                            (currentCase?.catalogueXML || currentCase?.enrichedData);

  // Determine which data to show based on SELECTED node (not most recent)
  const { xml, tableData, nodeName, sourceNodeId, displayType } = useMemo(() => {
    if (!currentCase) {
      return { xml: null, tableData: null, nodeName: null, sourceNodeId: null, displayType: null };
    }

    // Always use selectedNodeId if provided, don't fallback to most recent
    const targetNodeId = selectedNodeId;

    if (!targetNodeId) {
      return { xml: null, tableData: null, nodeName: null, sourceNodeId: null, displayType: null };
    }

    // Map node IDs to their specific data
    switch (targetNodeId) {
      case 'upload':
      case 'upload-validate':
        // Show validation results if available, otherwise IFC CSV data
        if (currentCase.validationResults?.html) {
          return {
            xml: currentCase.validationResults.html || null,
            tableData: null,
            nodeName: 'Upload & Validate - IDS Validation Report',
            sourceNodeId: 'upload-validate',
            displayType: 'ids-html',
          };
        }
        return {
          xml: null,
          tableData: currentCase.ifcCsvData || null,
          nodeName: 'Upload & Validate - IFC Model Data',
          sourceNodeId: 'upload-validate',
          displayType: 'ifc-csv',
        };

      case 'validate':
        // Show IDS HTML (kept for backward compatibility)
        return {
          xml: currentCase.validationResults?.html || null,
          tableData: null,
          nodeName: 'IDS Validation Report',
          sourceNodeId: 'validate',
          displayType: 'ids-html',
        };

      case 'convert':
        // Show Peppol Catalogue XML
        return {
          xml: currentCase.catalogueXML || null,
          tableData: currentCase.catalogueXML ? parseXMLToTable(currentCase.catalogueXML) : null,
          nodeName: 'Peppol Catalogue XML',
          sourceNodeId: 'convert',
          displayType: 'xml',
        };

      case 'enrich':
        // Show enriched data
        return {
          xml: currentCase.enrichedData?.xml || currentCase.catalogueXML || null,
          tableData: currentCase.enrichedData?.tableData || 
                    (currentCase.enrichedData?.xml ? parseXMLToTable(currentCase.enrichedData.xml) : null) ||
                    (currentCase.catalogueXML ? parseXMLToTable(currentCase.catalogueXML) : null),
          nodeName: 'Enriched Catalogue',
          sourceNodeId: 'enrich',
          displayType: 'xml',
        };

      case 'send-rfq':
        return {
          xml: currentCase.rfqData?.xml || null,
          tableData: currentCase.rfqData?.xml ? parseXMLToTable(currentCase.rfqData.xml) : null,
          nodeName: 'RFQ XML',
          sourceNodeId: 'send-rfq',
          displayType: 'xml',
        };

      case 'respond':
        return {
          xml: currentCase.quoteData?.xml || null,
          tableData: currentCase.quoteData?.xml ? parseXMLToTable(currentCase.quoteData.xml) : null,
          nodeName: 'Quote XML',
          sourceNodeId: 'respond',
          displayType: 'xml',
        };

      case 'accept':
        return {
          xml: currentCase.acceptanceData?.xml || null,
          tableData: currentCase.acceptanceData?.xml ? parseXMLToTable(currentCase.acceptanceData.xml) : null,
          nodeName: 'Accepted Catalogue',
          sourceNodeId: 'accept',
          displayType: 'xml',
        };

      case 'writeback':
        return {
          xml: currentCase.enrichedData?.xml || currentCase.catalogueXML || null,
          tableData: currentCase.enrichedData?.tableData || 
                    (currentCase.enrichedData?.xml ? parseXMLToTable(currentCase.enrichedData.xml) : null) ||
                    (currentCase.catalogueXML ? parseXMLToTable(currentCase.catalogueXML) : null),
          nodeName: 'Write-back Catalogue',
          sourceNodeId: 'writeback',
          displayType: 'xml',
        };

      default:
        return { xml: null, tableData: null, nodeName: null, sourceNodeId: null, displayType: null };
    }
  }, [currentCase, selectedNodeId]);

  // Initialize edited data when entering edit mode
  const handleStartEdit = useCallback(() => {
    if (viewMode === 'xml' && xml) {
      setEditedXML(xml);
    } else if (viewMode === 'table' && tableData) {
      setEditedTableData([...tableData]);
    }
    setIsEditing(true);
  }, [viewMode, xml, tableData]);

  // Save edited data
  const handleSave = useCallback(() => {
    if (!currentCase || !isEnrichmentStep) return;

    try {
      let finalXML: string;
      
      if (viewMode === 'xml') {
        // Validate XML
        const parser = new DOMParser();
        const doc = parser.parseFromString(editedXML, 'application/xml');
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
          alert('Invalid XML: ' + parserError.textContent);
          return;
        }
        finalXML = editedXML;
      } else {
        // Convert table to XML
        if (!xml) {
          alert('No original XML to convert from');
          return;
        }
        finalXML = convertTableToXML(editedTableData, xml);
      }

      // Save to enrichedData
      setEnrichedData({
        xml: finalXML,
        tableData: viewMode === 'table' ? editedTableData : parseXMLToTable(finalXML),
      });

      setIsEditing(false);
      alert('Data saved successfully!');
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert('Failed to save: ' + error.message);
    }
  }, [viewMode, editedXML, editedTableData, xml, currentCase, isEnrichmentStep, setEnrichedData]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedXML('');
    setEditedTableData([]);
  }, []);

  // Add new row to table
  const handleAddRow = useCallback(() => {
    if (!tableData || tableData.length === 0) return;
    
    const newRow: CatalogueLineRow = { id: '', name: '', description: '' };
    // Copy property keys from first row
    Object.keys(tableData[0]).forEach(key => {
      if (key !== 'id' && key !== 'name' && key !== 'description') {
        newRow[key] = '';
      }
    });
    setEditedTableData([...editedTableData, newRow]);
  }, [tableData, editedTableData]);

  // Delete row from table
  const handleDeleteRow = useCallback((index: number) => {
    setEditedTableData(editedTableData.filter((_, i) => i !== index));
  }, [editedTableData]);

  // Update cell value
  const handleCellChange = useCallback((rowIndex: number, field: string, value: string) => {
    const updated = [...editedTableData];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value };
    setEditedTableData(updated);
  }, [editedTableData]);

  // Show empty state if no node selected or no data
  if (!selectedNodeId) {
    return (
      <div className="data-viewer">
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          Click a node to view its data.
        </div>
      </div>
    );
  }

  if (!xml && !tableData && displayType !== 'ids-html') {
    return (
      <div className="data-viewer">
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          No data available for this node yet.
        </div>
      </div>
    );
  }

  const displayXML = isEditing && viewMode === 'xml' ? editedXML : xml || '';
  const displayTableData = isEditing && viewMode === 'table' ? editedTableData : tableData || [];

  // Special handling for IDS HTML
  if (displayType === 'ids-html' && xml) {
    return (
      <div className="data-viewer">
        <div className="data-viewer-header">
          <h2>{nodeName}</h2>
        </div>
        <div 
          className="ids-html-view"
          style={{
            maxHeight: '500px',
            overflow: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            background: 'white',
          }}
          dangerouslySetInnerHTML={{ __html: xml }}
        />
      </div>
    );
  }

  return (
    <div className="data-viewer">
      <div className="data-viewer-header">
        <h2>{nodeName}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isEnrichmentStep && (
            <>
              {!isEditing ? (
                <button
                  className="button"
                  onClick={handleStartEdit}
                  style={{ fontSize: '13px', padding: '6px 12px' }}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    className="button"
                    onClick={handleSave}
                    style={{ fontSize: '13px', padding: '6px 12px', background: '#10b981' }}
                  >
                    Save
                  </button>
                  <button
                    className="button"
                    onClick={handleCancel}
                    style={{ fontSize: '13px', padding: '6px 12px', background: '#6b7280' }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </>
          )}
          {displayType !== 'ifc-csv' && displayType !== 'ids-html' && (
            <div className="view-mode-toggle">
              <button
                className={`toggle-btn ${viewMode === 'xml' ? 'active' : ''}`}
                onClick={() => {
                  if (!isEditing) setViewMode('xml');
                }}
                disabled={isEditing}
              >
                XML
              </button>
              <button
                className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => {
                  if (!isEditing) setViewMode('table');
                }}
                disabled={isEditing}
              >
                Data Table
              </button>
            </div>
          )}
        </div>
      </div>

      {displayType === 'ifc-csv' && displayTableData && Array.isArray(displayTableData) && (
        <div className="table-view">
          <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10 }}>
                <tr>
                  {Object.keys(displayTableData[0] || {}).map((key) => (
                    <th
                      key={key}
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '2px solid #e5e7eb',
                        fontWeight: 600,
                        color: '#1f2937',
                        fontSize: '14px',
                      }}
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayTableData.map((row: Record<string, any>, index: number) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                    }}
                  >
                    {Object.values(row).map((value: any, cellIndex: number) => (
                      <td
                        key={cellIndex}
                        style={{
                          padding: '12px',
                          color: '#1f2937',
                          fontSize: '13px',
                        }}
                      >
                        {value || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {displayType === 'xml' && viewMode === 'xml' && displayXML && (
        <div className="xml-view">
          {isEditing ? (
            <textarea
              value={displayXML}
              onChange={(e) => setEditedXML(e.target.value)}
              style={{
                width: '100%',
                height: '400px',
                background: '#1f2937',
                color: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                border: '2px solid #3b82f6',
                resize: 'vertical',
              }}
            />
          ) : (
            <pre style={{ 
              maxHeight: '400px', 
              overflow: 'auto', 
              background: '#1f2937', 
              color: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}>
              {displayXML}
            </pre>
          )}
          {!isEditing && (
            <button
              onClick={() => {
                const blob = new Blob([displayXML], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${nodeName?.toLowerCase().replace(/\s+/g, '-') || 'catalogue'}.xml`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="button"
              style={{ marginTop: '12px' }}
            >
              Download XML
            </button>
          )}
        </div>
      )}

      {displayType === 'xml' && viewMode === 'table' && displayTableData && displayTableData.length > 0 && (
        <div className="table-view">
          {isEnrichmentStep && isEditing && (
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <button
                className="button"
                onClick={handleAddRow}
                style={{ fontSize: '13px', padding: '6px 12px', background: '#3b82f6' }}
              >
                + Add Row
              </button>
            </div>
          )}
          <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 10 }}>
                <tr>
                  {Object.keys(displayTableData[0]).map((key) => (
                    <th
                      key={key}
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        borderBottom: '2px solid #e5e7eb',
                        fontWeight: 600,
                        color: '#1f2937',
                        fontSize: '14px',
                      }}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </th>
                  ))}
                  {isEditing && <th style={{ padding: '12px', width: '80px' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {displayTableData.map((row: Record<string, any>, index: number) => (
                  <tr
                    key={(row as any).id || index}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                    }}
                  >
                    {Object.keys(displayTableData[0]).map((key) => (
                      <td
                        key={key}
                        style={{
                          padding: '12px',
                          color: '#1f2937',
                          fontSize: '13px',
                        }}
                      >
                        {isEditing && isEnrichmentStep ? (
                          <input
                            type="text"
                            value={row[key] || ''}
                            onChange={(e) => handleCellChange(index, key, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '13px',
                            }}
                          />
                        ) : (
                          row[key] || '-'
                        )}
                      </td>
                    ))}
                    {isEditing && (
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleDeleteRow(index)}
                          style={{
                            padding: '4px 8px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {displayType === 'xml' && viewMode === 'table' && (!displayTableData || displayTableData.length === 0) && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          No table data available. XML may not contain CatalogueLines.
        </div>
      )}
    </div>
  );
}
