import * as OBC from "@thatopen/components";
// import * as OBCF from "@thatopen/components-front"; // Currently unused
import * as THREE from "three";
import { IDSLoader } from "./IDSLoader";
import { Viewer } from "./Viewer";

// Workaround for THREE typing issues
// @ts-ignore - THREE module typing issues are handled by ignoring them

export interface ValidationSummary {
  total: number;
  passed: number;
  failed: number;
  details: ValidationDetail[];
  specificationResults: SpecificationResult[];
}

export interface ValidationDetail {
  id: string;
  description: string;
  status: 'pass' | 'fail';
  elements?: number;
  elementGuids?: string[];
  specificationId?: string;
  specificationName?: string;
  requirementType?: string;
  rawResult?: any;
}

export interface SpecificationResult {
  id: string;
  name: string;
  total: number;
  passed: number;
  failed: number;
  details: ValidationDetail[];
  elementResults: Map<string, ElementResult>;
}

export interface ElementResult {
  guid: string;
  requirements: ValidationDetail[];
}

export class Validator extends OBC.Component implements OBC.Disposable {
  private _idsLoader: IDSLoader;
  private _viewer: Viewer; // May be used later for highlighting
  private _resultsContainer: HTMLElement;
  private _summaryContainer: HTMLElement;
  private _loadingOverlay: HTMLElement | null = null;
  private _passMaterial: THREE.MeshBasicMaterial;
  private _failMaterial: THREE.MeshBasicMaterial;
  readonly onDisposed = new OBC.Event();
  readonly enabled = true; // Implement required abstract member from Component

  constructor(
    components: OBC.Components,
    idsLoader: IDSLoader, 
    viewer: Viewer,
    resultsContainerId: string,
    summaryContainerId: string
  ) {
    super(components);
    this._idsLoader = idsLoader;
    this._viewer = viewer;
    this._resultsContainer = document.getElementById(resultsContainerId) as HTMLElement;
    this._summaryContainer = document.getElementById(summaryContainerId) as HTMLElement;
    
    // Create materials for highlighting
    this._passMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.2,
      depthTest: false,
      side: THREE.DoubleSide
    });
    
    this._failMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
      side: THREE.DoubleSide
    });
  }

  public async validate(fragmentGroup: any): Promise<ValidationSummary> {
    this.showLoading();
    
    try {
      // Default summary in case of errors
      const defaultSummary: ValidationSummary = {
        total: 0,
        passed: 0,
        failed: 0,
        details: [],
        specificationResults: []
      };
      
      // Run validation with error handling
      let testResults;
      try {
        testResults = await this._idsLoader.testModel(fragmentGroup);

      } catch (error) {
        console.error("Validation test failed:", error);
        this.showError("Failed to run validation tests. See console for details.");
        this.hideLoading();
        return defaultSummary;
      }

      // Process and display results with error handling
      let summary = defaultSummary;
      try {
        summary = this.processResults(testResults);
        console.log("Summary:", summary);
      } catch (error) {
        console.error("Processing results failed:", error);
        this.showError("Failed to process validation results. See console for details.");
        this.hideLoading();
        return defaultSummary;
      }
      
      try {
        await this.displayResults(summary, fragmentGroup);
      } catch (error) {
        console.error("Displaying results failed:", error);
        this.showError("Failed to display validation results. See console for details.");
      }
      
      this.hideLoading();
      return summary;
    } catch (error) {
      console.error("Validation failed:", error);
      this.hideLoading();
      // Return a valid summary even if validation fails
      return {
        total: 0,
        passed: 0,
        failed: 0,
        details: [],
        specificationResults: []
      };
    }
  }

  // Helper method for potential future use
  // private _extractFragmentIdMapFromResults(fragmentGroup: any, results: any): { pass: Map<string, number[]>, fail: Map<string, number[]> } {
  //   const pass = new Map<string, number[]>();
  //   const fail = new Map<string, number[]>();
  //   
  //   try {
  //     // Process each specification
  //     for (const spec of results.specifications || []) {
  //       const specId = spec.name;
  //       
  //       // Process each requirement
  //       for (const req of spec.requirements || []) {
  //         // Process passed entities
  //         if (req.passed_entities && req.passed_entities.length > 0) {
  //           const ids = req.passed_entities
  //             .map((entity: any) => entity.expressID)
  //             .filter((id: any) => id !== undefined);
  //           
  //           if (ids.length > 0) {
  //             pass.set(specId, [...(pass.get(specId) || []), ...ids]);
  //           }
  //         }
  //         
  //         // Process failed entities
  //         if (req.failed_entities && req.failed_entities.length > 0) {
  //           const ids = req.failed_entities
  //             .map((entity: any) => entity.expressID)
  //             .filter((id: any) => id !== undefined);
  //           
  //           if (ids.length > 0) {
  //             fail.set(specId, [...(fail.get(specId) || []), ...ids]);
  //           }
  //         }
  //       }
  //     }
  //   } catch (e) {
  //     console.error("Error extracting fragment ID map from results:", e);
  //   }
  //   
  //   return { pass, fail };
  // }

  private processResults(results: any): ValidationSummary {
    const summary: ValidationSummary = {
      total: 0,
      passed: 0,
      failed: 0,
      details: [],
      specificationResults: []
    };
    
    try {
      console.log("🔄 Processing validation results:", results);
      
      // Convert specifications to our internal format
       // Keep the original order from the IDS file by iterating in the same order
      for (const spec of results.specifications || []) {
        console.log(`📊 Processing spec: ${spec.name}`, spec);
        
        // Calculate totals based on testResult structure from the new engine
        let specPassed = 0;
        let specFailed = 0;
        let specTotal = 0;
        
        if (spec.testResult && typeof spec.testResult === 'object') {
          // Count elements from pass/fail sets
          if (spec.testResult.pass && typeof spec.testResult.pass === 'object') {
            Object.values(spec.testResult.pass).forEach((elementSet: any) => {
              if (elementSet && elementSet.size !== undefined) {
                specPassed += elementSet.size;
              }
            });
          }
          
          if (spec.testResult.fail && typeof spec.testResult.fail === 'object') {
            Object.values(spec.testResult.fail).forEach((elementSet: any) => {
              if (elementSet && elementSet.size !== undefined) {
                specFailed += elementSet.size;
              }
            });
          }
        }
        
        specTotal = specPassed + specFailed;
        
        // Create specification result
        const specResult: SpecificationResult = {
          id: spec.name || 'Unnamed',
          name: spec.name || 'Unnamed',
          total: specTotal,
          passed: specPassed,
          failed: specFailed,
          details: [],
          elementResults: new Map()
        };
        
        // Create a single detail entry for this specification based on its overall results
        if (specTotal > 0) {
          const detail: ValidationDetail = {
            id: `${spec.name || 'Unknown'}-overall`,
            description: `${spec.name || 'Unnamed Specification'} validation`,
            status: specFailed === 0 ? 'pass' : 'fail',
            elements: specTotal,
            elementGuids: [],
            specificationId: spec.name,
            specificationName: spec.name,
            requirementType: 'Specification',
            rawResult: spec.testResult
          };
          
          // Add to details list
          summary.details.push(detail);
          specResult.details.push(detail);
          
          // Process pass/fail data to create element results
          if (spec.testResult) {
            // Process failed elements
            if (spec.testResult.fail) {
              Object.entries(spec.testResult.fail).forEach(([modelId, elementSet]: [string, any]) => {
                if (elementSet && elementSet.size > 0) {
                  // Create mock element results for failed items
                  let elementIndex = 0;
                  elementSet.forEach((elementId: any) => {
                    const guid = `failed-${modelId}-${elementId}-${elementIndex++}`;
                detail.elementGuids?.push(guid);
              
                specResult.elementResults.set(guid, {
                  guid,
                      requirements: [{
                        ...detail,
                        status: 'fail' as const,
                        rawResult: {
                          ...spec.testResult,
                          failed_entities: [{
                            expressID: elementId,
                            global_id: guid,
                            model_id: modelId
                          }]
                        }
                      }]
                    });
                  });
                }
              });
            }
            
            // Process passed elements  
            if (spec.testResult.pass) {
              Object.entries(spec.testResult.pass).forEach(([modelId, elementSet]: [string, any]) => {
                if (elementSet && elementSet.size > 0) {
                  // Create mock element results for passed items
                  let elementIndex = 0;
                  elementSet.forEach((elementId: any) => {
                    const guid = `passed-${modelId}-${elementId}-${elementIndex++}`;
                    detail.elementGuids?.push(guid);
                    
                    specResult.elementResults.set(guid, {
                      guid,
                      requirements: [{
                        ...detail,
                        status: 'pass' as const,
                        rawResult: {
                          ...spec.testResult,
                          passed_entities: [{
                            expressID: elementId,
                            global_id: guid,
                            model_id: modelId
                          }]
                        }
                      }]
                    });
                  });
                }
              });
            }
          }
        }
        
        // Add to specification results
        summary.specificationResults.push(specResult);
        
        // Update overall summary
        summary.total += specTotal;
        summary.passed += specPassed;
        summary.failed += specFailed;
      }
      
      console.log("✅ Processed summary:", {
        total: summary.total,
        passed: summary.passed,
        failed: summary.failed,
        specifications: summary.specificationResults.length
      });
      
    } catch (e) {
      console.error("Error processing validation results:", e);
    }
    
    return summary;
  }

  private async displayResults(summary: ValidationSummary, fragmentGroup: any) {
    try {
      // Show the results container
      this._resultsContainer.classList.remove('hidden');
      
      // Display overall summary
      this._summaryContainer.innerHTML = `
        <div class="summary-header">
          <div class="summary-status ${summary.failed > 0 ? 'failed' : 'passed'}">
            ${summary.failed > 0 ? 'FAILED' : 'PASSED'}
          </div>
                     <button id="clear-highlighting-btn" class="clear-highlighting-button">🧹 Show All Elements</button>
        </div>
        <div class="summary-counts">
          <div class="summary-row">
            <strong>📋 Specifications:</strong> 
            <span class="count-total">${summary.specificationResults.length} total</span>, 
            <span class="count-passed">${summary.specificationResults.filter(s => s.failed === 0).length} passed</span>, 
            <span class="count-failed">${summary.specificationResults.filter(s => s.failed > 0).length} failed</span>
          </div>
          <div class="summary-row">
            <strong>🏗️ Elements:</strong> 
            <span class="count-total">${summary.total} total</span>, 
            <span class="count-passed">${summary.passed} passed</span>, 
            <span class="count-failed">${summary.failed} failed</span>
          </div>
          <div class="summary-row">
            <strong>✅ Overall Pass Rate:</strong> 
            <span class="pass-rate ${summary.total > 0 && Math.round((summary.passed / summary.total) * 100) >= 80 ? 'good' : 'needs-improvement'}">${summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0}%</span>
          </div>
        </div>
      `;
      
      // Add click handler for clear highlighting button
      const clearBtn = document.getElementById('clear-highlighting-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearHighlighting();
          console.log('🧹 Cleared all highlighting');
        });
      }
      
      // Clear previous results
      const detailsContainer = document.getElementById('results-details') as HTMLElement;
      if (!detailsContainer) {
        console.error("Results details container not found");
        return;
      }
      detailsContainer.innerHTML = '';
      
      // Safety check
      if (!Array.isArray(summary.specificationResults)) {
        console.warn("Specification results is not an array:", summary.specificationResults);
        detailsContainer.innerHTML = '<p>No valid results found.</p>';
        return;
      }
      
      // Skip specifications with no results if there are many specifications
       // Keep the original order from the IDS file (don't sort alphabetically)
      const filteredSpecs = summary.specificationResults
         .filter(spec => spec && (spec.total > 0 || summary.specificationResults.length <= 5));
      
      // If there are no specifications with results, show a message
      if (filteredSpecs.length === 0) {
        detailsContainer.innerHTML = '<p>No results found for any specification.</p>';
        return;
      }
      
      // Process each specification
      for (const specResult of filteredSpecs) {
        if (!specResult) continue;
        
        const specElement = document.createElement('div');
        specElement.className = 'specification-result';
        
        // Create collapsible section
        const safeId = String(specResult.id || 'unknown').replace(/[^a-zA-Z0-9]/g, '-');
        const headerId = `spec-header-${safeId}`;
        const contentId = `spec-content-${safeId}`;
        
        // Create spec status indicator
        const statusClass = specResult.failed > 0 ? 'spec-status-fail' : 'spec-status-pass';
        const hasFailures = specResult.failed > 0;
        
        const resultsSummary = `
          <div class="spec-summary ${statusClass}">
            <p>
              <strong>Requirements:</strong> ${specResult.total} total, 
              ${specResult.passed} passed, 
              ${specResult.failed} failed
            </p>
            <p>
              <strong>Elements:</strong> 
              ${specResult.elementResults ? specResult.elementResults.size : 0} total
            </p>
          </div>
        `;
        
        // Create header first with only the title
        const header = document.createElement('div');
        header.className = `spec-header ${hasFailures ? 'has-failures' : 'no-failures'}`;
        header.id = headerId;
        header.innerHTML = `<h3>${specResult.name || 'Unnamed'}</h3>`; // Only add title initially

        // Add toggle button if there are results
        if (specResult.total > 0) {
          const toggleBtn = document.createElement('button');
          toggleBtn.className = 'spec-toggle';
          toggleBtn.textContent = 'View Details';
          toggleBtn.setAttribute('data-content-id', contentId);

          // Append toggle button to header (before summary)
          header.appendChild(toggleBtn);

           // Add bulk isolation button if there are failed elements
           if (specResult.failed > 0) {
             const bulkIsolateBtn = document.createElement('button');
             bulkIsolateBtn.className = 'bulk-isolate-button';
             bulkIsolateBtn.textContent = `🎯 Isolate All Failed (${specResult.failed})`;
             bulkIsolateBtn.title = `Isolate all ${specResult.failed} failed elements in this specification`;
             header.appendChild(bulkIsolateBtn);

             // Add click handler for bulk isolation
             bulkIsolateBtn.addEventListener('click', async (event) => {
               event.stopPropagation(); // Prevent triggering header click
               
               try {
                 // Isolate immediately - no loading states or animations
                 await this.isolateAllFailedElements(specResult);
                 console.log(`✨ Isolated all failed elements in specification: ${specResult.name}`);
               } catch (error) {
                 console.error('Failed to isolate all failed elements:', error);
               }
             });
           }

           // Now append the results summary after the buttons
          header.insertAdjacentHTML('beforeend', resultsSummary);

          // Add click handler for the entire header
          header.addEventListener('click', (event) => {
            // Don't process if the click was directly on the toggle button (it has its own handler)
            if (!(event.target as HTMLElement).classList.contains('spec-toggle')) {
              const content = document.getElementById(contentId);
              if (content) {
                content.classList.toggle('hidden');
                const btn = header.querySelector('.spec-toggle') as HTMLButtonElement;
                if (btn) {
                  btn.textContent = content.classList.contains('hidden') ? 'View Details' : 'Hide Details';
                }
              }
            }
          });
          
          // Add separate click handler for the toggle button to prevent event bubbling
          toggleBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering the header click event
            const content = document.getElementById(contentId);
            if (content) {
              content.classList.toggle('hidden');
              toggleBtn.textContent = content.classList.contains('hidden') ? 'View Details' : 'Hide Details';
            }
          });
        } else {
          // If no results, just append the summary after the title
          header.insertAdjacentHTML('beforeend', resultsSummary);
        }
        
        specElement.appendChild(header);
        
        // Add details for this specification only if there are results
        if (specResult.total > 0 && specResult.elementResults) {
          const specDetailsElement = document.createElement('div');
          specDetailsElement.id = contentId;
          specDetailsElement.className = 'specification-details';
          specDetailsElement.classList.add('hidden');
          
          // New approach: Group by requirements instead of elements
          if (specResult.elementResults && typeof specResult.elementResults.size === 'number' && specResult.elementResults.size > 0) {
            try {
              // Get all requirements from all elements
              const allRequirements = new Map();
              
              // First, collect all requirements across all elements
              specResult.elementResults.forEach((elemResult) => {
                if (!elemResult || !Array.isArray(elemResult.requirements)) return;
                
                elemResult.requirements.forEach((req) => {
                  if (!req || !req.description) return;
                  
                  // Use description as a key to group by requirement
                  const key = req.description;
                  if (!allRequirements.has(key)) {
                    allRequirements.set(key, {
                      description: req.description,
                      requirementType: req.requirementType,
                      passedElements: [],
                      failedElements: [],
                      checks: req.rawResult?.checks || []
                    });
                  }
                  
                  // Add this element to either passed or failed
                  const reqGroup = allRequirements.get(key);
                  if (req.status === 'pass') {
                    if (!reqGroup.passedElements.some((e: {guid: string}) => e.guid === elemResult.guid)) {
                      // Find the relevant entity to get expressID
                      let expressID = undefined;
                      if (req.rawResult && Array.isArray(req.rawResult.passed_entities)) {
                        const entity = req.rawResult.passed_entities.find((e: any) => e.global_id === elemResult.guid);
                        if (entity) {
                          expressID = entity.expressID;
                        }
                      }
                      
                      reqGroup.passedElements.push({
                        guid: elemResult.guid,
                        expressID: expressID, // Add expressID
                        status: 'pass',
                        entities: req.rawResult?.passed_entities || []
                      });
                    }
                  } else {
                    if (!reqGroup.failedElements.some((e: {guid: string}) => e.guid === elemResult.guid)) {
                      // Find the relevant entity to get expressID
                      let expressID = undefined;
                      if (req.rawResult && Array.isArray(req.rawResult.failed_entities)) {
                        const entity = req.rawResult.failed_entities.find((e: any) => e.global_id === elemResult.guid);
                        if (entity) {
                          expressID = entity.expressID;
                        }
                      }
                      
                      reqGroup.failedElements.push({
                        guid: elemResult.guid,
                        expressID: expressID, // Add expressID
                        status: 'fail',
                        reason: req.rawResult?.reason || 'Unknown reason',
                        entities: req.rawResult?.failed_entities || []
                      });
                    }
                  }
                });
              });
              
              // Now display each requirement
              const reqGroups = Array.from(allRequirements.values());
              
              // Sort requirements by those with failures first
              reqGroups.sort((a, b) => b.failedElements.length - a.failedElements.length);
              
              for (const reqGroup of reqGroups) {
                const reqDiv = document.createElement('div');
                reqDiv.className = 'requirement-group';
                
                // Create requirement header
                const reqHeader = document.createElement('div');
                reqHeader.className = 'requirement-header';
                reqHeader.innerHTML = `
                  <h4>${reqGroup.description || 'Unnamed Requirement'}</h4>
                  <div class="requirement-summary">
                    <span class="passed-count">${reqGroup.passedElements.length} elements passed</span>
                    <span class="failed-count">${reqGroup.failedElements.length} elements failed</span>
                  </div>
                `;
                
                reqDiv.appendChild(reqHeader);
                
                // Add checks information if available
                if (reqGroup.checks && reqGroup.checks.length > 0) {
                  const checksDiv = document.createElement('div');
                  checksDiv.className = 'checks-info';
                  
                  checksDiv.innerHTML = '<h5>Checks</h5>';
                  
                  reqGroup.checks.forEach((check: any, index: number) => {
                    if (!check) return;
                    
                    const checkItem = document.createElement('div');
                    checkItem.className = 'check-item';
                    
                    const paramName = check.parameter || 'Unknown';
                    const reqValue = check.requiredValue || 'Not specified';
                    const actualValue = check.currentValue !== undefined ? 
                                       (check.currentValue !== null ? check.currentValue : 'null') : 
                                       'Not available';
                    const passed = check.pass ? 'Yes' : 'No';
                    
                    checkItem.innerHTML = `
                      <p><strong>Check ${index + 1}:</strong> ${paramName}</p>
                      <ul>
                        <li><strong>Required:</strong> ${reqValue}</li>
                        <li><strong>Actual:</strong> ${actualValue}</li>
                        <li><strong>Passed:</strong> ${passed}</li>
                      </ul>
                    `;
                    
                    checksDiv.appendChild(checkItem);
                  });
                  
                  reqDiv.appendChild(checksDiv);
                }
                
                // Show failed elements first if there are any
                if (reqGroup.failedElements.length > 0) {
                  const failedDiv = document.createElement('div');
                  failedDiv.className = 'failed-elements';
                  
                  failedDiv.innerHTML = '<h5>Failed Elements</h5>';
                  
                  // Create table
                  const table = document.createElement('table');
                  table.className = 'elements-table';
                  
                  // Create table header
                  table.innerHTML = `
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>GlobalId</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                    </tbody>
                  `;
                  
                  const tbody = table.querySelector('tbody');
                  
                  // Add rows for failed elements
                  for (const failedElem of reqGroup.failedElements) {
                    try {
                      // Get detailed information using getEntityInfo
                      console.log(`🔍 Getting element info for failed element:`, {
                        expressID: failedElem.expressID,
                        guid: failedElem.guid,
                        global_id: failedElem.global_id
                      });
                      
                      let elemInfo = await this._idsLoader.getEntityInfo(fragmentGroup, {
                        expressID: failedElem.expressID,
                        guid: failedElem.guid
                      });
                      
                      console.log(`📋 Retrieved element info:`, elemInfo);
                      
                      const row = document.createElement('tr');
                      row.innerHTML = `
                        <td>${elemInfo.class || 'Unknown'}</td>
                        <td>${elemInfo.guid || failedElem.global_id || failedElem.guid || ''}</td>
                        <td>
                          <button class="highlight-button" data-express-id="${failedElem.expressID}" data-status="fail">🎯 Isolate</button>
                          ${elemInfo.tag ? 
                            `<button class="switchback-button" data-tag="${elemInfo.tag}">View in Revit</button>` 
                            : ''}
                        </td>
                      `;
                      
                      // Add click handler for the highlight button
                      const highlightBtn = row.querySelector('.highlight-button');
                      if (highlightBtn) {
                        highlightBtn.addEventListener('click', async (event) => {
                          event.stopPropagation();
                          const expressIdStr = (event.target as HTMLElement).getAttribute('data-express-id');
                          const status = (event.target as HTMLElement).getAttribute('data-status') as 'pass' | 'fail';
                          
                          if (expressIdStr) {
                            const expressId = parseInt(expressIdStr, 10);
                            if (!isNaN(expressId)) {
                              console.log(`🎯 Isolateing element ${expressId} with status ${status}`);
                              
                              // Update button state
                              const btn = event.target as HTMLButtonElement;
                              btn.disabled = true;
                              btn.textContent = '🎯 Isolating';
                              
                              try {
                                await this.highlightElement(expressId, status);
                                btn.textContent = '✨ Isolated';
                                btn.classList.add('highlight-success');
                                setTimeout(() => {
                                  btn.textContent = '🎯 Isolate';
                                  btn.classList.remove('highlight-success');
                                  btn.disabled = false;
                                }, 3000);
                              } catch (error) {
                                console.error('Failed to isolate element:', error);
                                btn.textContent = '❌ Failed';
                                btn.classList.add('highlight-error');
                                setTimeout(() => {
                                  btn.textContent = '🎯 Isolate';
                                  btn.classList.remove('highlight-error');
                                  btn.disabled = false;
                                }, 3000);
                              }
                            }
                          }
                        });
                      }
                      
                      // Add click handler for the switchback button
                      const switchbackBtn = row.querySelector('.switchback-button');
                      if (switchbackBtn) {
                        switchbackBtn.addEventListener('click', async (event) => {
                          event.stopPropagation();
                          const tagId = (event.target as HTMLElement).getAttribute('data-tag');
                          if (!tagId) {
                            console.error('Missing tag ID for switchback');
                            return;
                          }
                          
                          // Update button state
                          const btn = event.target as HTMLButtonElement;
                          btn.disabled = true;
                          btn.textContent = 'Sending...';

                          try {
                            // Use Image() to make the API request - this bypasses CORS
                            // for simple GET requests while still triggering the server action
                            // Note: We won't get the JSON response, but the action will work in Revit
                            const img = new Image();
                            
                            // Set up success handling (rarely triggers due to CORS, but included for completeness)
                            img.onload = () => {
                              console.log('Switchback successful for tag:', tagId);
                              btn.textContent = 'Viewed ✓';
                              btn.classList.add('switchback-success');
                              setTimeout(() => {
                                btn.textContent = 'View in Revit';
                                btn.classList.remove('switchback-success');
                                btn.disabled = false;
                              }, 3000);
                            };
                            
                            // Set up error handling - this will usually trigger due to CORS,
                            // even though the request successfully reaches Revit
                            img.onerror = () => {
                              console.log('Switchback request sent for tag:', tagId, 
                                '(CORS error expected, but action likely worked in Revit)');
                              
                              // Assume success because the request typically reaches Revit
                              // despite the browser showing a CORS error
                              btn.textContent = 'Sent ✓';
                              btn.classList.add('switchback-success');
                              setTimeout(() => {
                                btn.textContent = 'View in Revit';
                                btn.classList.remove('switchback-success');
                                btn.disabled = false;
                              }, 3000);
                            };
                            
                            // Send the request - this triggers the pyRevit API endpoint
                            img.src = `http://localhost:48884/switchback/id/${tagId}`;
                          } catch (error) {
                            console.error('Error setting up switchback request:', error);
                            btn.textContent = 'Failed ✗';
                            btn.classList.add('switchback-error');
                            setTimeout(() => {
                              btn.textContent = 'View in Revit';
                              btn.classList.remove('switchback-error');
                              btn.disabled = false;
                            }, 3000);
                          }
                        });
                      }
                      
                      tbody?.appendChild(row);
                    } catch (e) {
                      console.warn("Could not get element info:", e);
                      
                      // Fallback row with just basic info
                      const row = document.createElement('tr');
                      row.innerHTML = `
                        <td>IFC Element</td>
                        <td>Element ${failedElem.expressID}</td>
                        <td title="${failedElem.reason || 'No specific reason provided'}">${this.getDescriptiveWarning(failedElem, { class: 'IFC Element', name: `Element ${failedElem.expressID}` })}</td>
                        <td>${failedElem.global_id || failedElem.guid || ''}</td>
                        <td>${failedElem.tag || ''}</td>
                        <td>
                          <button class="highlight-button" data-express-id="${failedElem.expressID}" data-status="fail">🎯 Isolate</button>
                          ${failedElem.tag ? 
                            `<button class="switchback-button" data-tag="${failedElem.tag}">View in Revit</button>` 
                            : ''}
                        </td>
                      `;
                      
                      // Add click handler for the highlight button (same as above)
                      const highlightBtn = row.querySelector('.highlight-button');
                      if (highlightBtn) {
                        highlightBtn.addEventListener('click', async (event) => {
                          event.stopPropagation();
                          const expressIdStr = (event.target as HTMLElement).getAttribute('data-express-id');
                          const status = (event.target as HTMLElement).getAttribute('data-status') as 'pass' | 'fail';
                          
                          if (expressIdStr) {
                            const expressId = parseInt(expressIdStr, 10);
                            if (!isNaN(expressId)) {
                              console.log(`🎯 Isolateing element ${expressId} with status ${status}`);
                              
                              // Update button state
                              const btn = event.target as HTMLButtonElement;
                              btn.disabled = true;
                              btn.textContent = '🎯 Isolating';
                              
                              try {
                                await this.highlightElement(expressId, status);
                                btn.textContent = '✨ Isolated';
                                btn.classList.add('highlight-success');
                                setTimeout(() => {
                                  btn.textContent = '🎯 Isolate';
                                  btn.classList.remove('highlight-success');
                                  btn.disabled = false;
                                }, 3000);
                              } catch (error) {
                                console.error('Failed to isolate element:', error);
                                btn.textContent = '❌ Failed';
                                btn.classList.add('highlight-error');
                                setTimeout(() => {
                                  btn.textContent = '🎯 Isolate';
                                  btn.classList.remove('highlight-error');
                                  btn.disabled = false;
                                }, 3000);
                              }
                            }
                          }
                        });
                      }
                      
                      // Add click handler for the switchback button (same as above)
                      const switchbackBtn = row.querySelector('.switchback-button');
                      if (switchbackBtn) {
                        switchbackBtn.addEventListener('click', async (event) => {
                          event.stopPropagation();
                          const tagId = (event.target as HTMLElement).getAttribute('data-tag');
                          if (!tagId) {
                            console.error('Missing tag ID for switchback');
                            return;
                          }
                          
                          // Update button state
                          const btn = event.target as HTMLButtonElement;
                          btn.disabled = true;
                          btn.textContent = 'Sending...';

                          try {
                            // Use Image() to make the API request - this bypasses CORS
                            // for simple GET requests while still triggering the server action
                            // Note: We won't get the JSON response, but the action will work in Revit
                            const img = new Image();
                            
                            // Set up success handling (rarely triggers due to CORS, but included for completeness)
                            img.onload = () => {
                              console.log('Switchback successful for tag:', tagId);
                              btn.textContent = 'Viewed ✓';
                              btn.classList.add('switchback-success');
                              setTimeout(() => {
                                btn.textContent = 'View in Revit';
                                btn.classList.remove('switchback-success');
                                btn.disabled = false;
                              }, 3000);
                            };
                            
                            // Set up error handling - this will usually trigger due to CORS,
                            // even though the request successfully reaches Revit
                            img.onerror = () => {
                              console.log('Switchback request sent for tag:', tagId, 
                                '(CORS error expected, but action likely worked in Revit)');
                              
                              // Assume success because the request typically reaches Revit
                              // despite the browser showing a CORS error
                              btn.textContent = 'Sent ✓';
                              btn.classList.add('switchback-success');
                              setTimeout(() => {
                                btn.textContent = 'View in Revit';
                                btn.classList.remove('switchback-success');
                                btn.disabled = false;
                              }, 3000);
                            };
                            
                            // Send the request - this triggers the pyRevit API endpoint
                            img.src = `http://localhost:48884/switchback/id/${tagId}`;
                          } catch (error) {
                            console.error('Error setting up switchback request:', error);
                            btn.textContent = 'Failed ✗';
                            btn.classList.add('switchback-error');
                            setTimeout(() => {
                              btn.textContent = 'View in Revit';
                              btn.classList.remove('switchback-error');
                              btn.disabled = false;
                            }, 3000);
                          }
                        });
                      }
                      
                      tbody?.appendChild(row);
                    }
                  }
                  
                  failedDiv.appendChild(table);
                  reqDiv.appendChild(failedDiv);
                }
                
                // Show passed elements (collapsed by default) only if there are any
                if (reqGroup.passedElements.length > 0) {
                  const passedDiv = document.createElement('div');
                  passedDiv.className = 'passed-elements';
                  
                  const passedToggleId = `toggle-passed-${safeId}-${reqGroup.description.replace(/[^a-zA-Z0-9]/g, '-')}`;
                  
                  // Create a more compact header with toggle
                  const passedHeader = document.createElement('div');
                  passedHeader.className = 'passed-header';
                  passedHeader.innerHTML = `
                    <h5>Passed Elements (${reqGroup.passedElements.length})</h5>
                    <button id="${passedToggleId}" class="toggle-passed">View</button>
                  `;
                  
                  passedDiv.appendChild(passedHeader);
                  
                  // Create content div (hidden by default)
                  const passedContent = document.createElement('div');
                  passedContent.className = 'passed-content hidden';
                  
                  // Create table
                  const passedTable = document.createElement('table');
                  passedTable.className = 'elements-table';
                  
                  // Create table header with fewer columns for compactness
                  passedTable.innerHTML = `
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Name</th>
                        <th>GlobalId</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                    </tbody>
                  `;
                  
                  const passedTbody = passedTable.querySelector('tbody');
                  
                  // Limit to first 10 elements to prevent performance issues
                  const limitedPassedElements = reqGroup.passedElements.slice(0, 10);
                  const hasMorePassed = reqGroup.passedElements.length > 10;
                  
                  // Add rows for passed elements with fewer columns
                  for (const passedElem of limitedPassedElements) {
                    try {
                      // Get detailed information using getEntityInfo
                      let elemInfo = await this._idsLoader.getEntityInfo(fragmentGroup, {
                        expressID: passedElem.expressID,
                        guid: passedElem.guid
                      });
                      
                      const row = document.createElement('tr');
                      row.innerHTML = `
                        <td>${elemInfo.class || 'Unknown'}</td>
                        <td>${elemInfo.name || ''}</td>
                        <td>${elemInfo.guid || passedElem.global_id || passedElem.guid || ''}</td>
                        <td>
                          <button class="highlight-button" data-express-id="${passedElem.expressID}" data-status="pass">🎯 Isolate</button>
                        </td>
                      `;
                      
                      // Add click handler for the highlight button for passed elements
                      const highlightBtn = row.querySelector('.highlight-button');
                      if (highlightBtn) {
                        highlightBtn.addEventListener('click', async (event) => {
                          event.stopPropagation();
                          const expressIdStr = (event.target as HTMLElement).getAttribute('data-express-id');
                          const status = (event.target as HTMLElement).getAttribute('data-status') as 'pass' | 'fail';
                          
                          if (expressIdStr) {
                            const expressId = parseInt(expressIdStr, 10);
                            if (!isNaN(expressId)) {
                              console.log(`🎯 Isolateing element ${expressId} with status ${status}`);
                              
                              // Update button state
                              const btn = event.target as HTMLButtonElement;
                              btn.disabled = true;
                              btn.textContent = '🎯 Isolating';
                              
                              try {
                                await this.highlightElement(expressId, status);
                                btn.textContent = '✨ Isolated';
                                btn.classList.add('highlight-success');
                                setTimeout(() => {
                                  btn.textContent = '🎯 Isolate';
                                  btn.classList.remove('highlight-success');
                                  btn.disabled = false;
                                }, 3000);
                              } catch (error) {
                                console.error('Failed to isolate element:', error);
                                btn.textContent = '❌ Failed';
                                btn.classList.add('highlight-error');
                                setTimeout(() => {
                                  btn.textContent = '🎯 Isolate';
                                  btn.classList.remove('highlight-error');
                                  btn.disabled = false;
                                }, 3000);
                              }
                            }
                          }
                        });
                      }
                      
                      passedTbody?.appendChild(row);
                    } catch (e) {
                      console.warn("Could not get element info:", e);
                      
                      // Fallback row with basic info
                      const row = document.createElement('tr');
                      row.innerHTML = `
                        <td>IFC Element</td>
                        <td>Element ${passedElem.expressID}</td>
                        <td>${passedElem.guid || ''}</td>
                        <td>
                          <button class="highlight-button" data-express-id="${passedElem.expressID}" data-status="pass">🎯 Isolate</button>
                        </td>
                      `;
                      
                      // Add click handler for the highlight button for fallback passed elements
                      const highlightBtn = row.querySelector('.highlight-button');
                      if (highlightBtn) {
                        highlightBtn.addEventListener('click', async (event) => {
                          event.stopPropagation();
                          const expressIdStr = (event.target as HTMLElement).getAttribute('data-express-id');
                          const status = (event.target as HTMLElement).getAttribute('data-status') as 'pass' | 'fail';
                          
                          if (expressIdStr) {
                            const expressId = parseInt(expressIdStr, 10);
                            if (!isNaN(expressId)) {
                              console.log(`🎯 Isolateing element ${expressId} with status ${status}`);
                              
                              // Update button state
                              const btn = event.target as HTMLButtonElement;
                              btn.disabled = true;
                              btn.textContent = '🎯 Isolating';
                              
                              try {
                                await this.highlightElement(expressId, status);
                                btn.textContent = '✨ Isolated';
                                btn.classList.add('highlight-success');
                                setTimeout(() => {
                                  btn.textContent = '🎯 Isolate';
                                  btn.classList.remove('highlight-success');
                                  btn.disabled = false;
                                }, 3000);
                              } catch (error) {
                                console.error('Failed to isolate element:', error);
                                btn.textContent = '❌ Failed';
                                btn.classList.add('highlight-error');
                                setTimeout(() => {
                                  btn.textContent = '🎯 Isolate';
                                  btn.classList.remove('highlight-error');
                                  btn.disabled = false;
                                }, 3000);
                              }
                            }
                          }
                        });
                      }
                      
                      passedTbody?.appendChild(row);
                    }
                  }
                  
                  // Add a message if there are more elements not shown
                  if (hasMorePassed) {
                    const row = document.createElement('tr');
                    row.className = 'more-elements-row';
                    row.innerHTML = `
                      <td colspan="3">... ${reqGroup.passedElements.length - 10} more passing elements not shown ...</td>
                    `;
                    passedTbody?.appendChild(row);
                  }
                  
                  passedContent.appendChild(passedTable);
                  passedDiv.appendChild(passedContent);
                  
                  // Add click handler for toggle
                  passedHeader.querySelector('button')?.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent event bubbling
                    passedContent.classList.toggle('hidden');
                    const btn = document.getElementById(passedToggleId);
                    if (btn) {
                      btn.textContent = passedContent.classList.contains('hidden') ? 'View' : 'Hide';
                    }
                  });
                  
                  // Add click handler for the requirement header to toggle passed elements
                  reqHeader.addEventListener('click', () => {
                    if (reqGroup.passedElements.length > 0) {
                      passedContent.classList.toggle('hidden');
                      const btn = document.getElementById(passedToggleId);
                      if (btn) {
                        btn.textContent = passedContent.classList.contains('hidden') ? 'View' : 'Hide';
                      }
                    }
                  });
                  
                  reqDiv.appendChild(passedDiv);
                }
                
                specDetailsElement.appendChild(reqDiv);
              }
            } catch (e: unknown) {
              console.error("Error processing requirements:", e);
              specDetailsElement.innerHTML = `<p>Error processing requirements: ${e instanceof Error ? e.message : String(e)}</p>`;
            }
          } else {
            specDetailsElement.innerHTML = '<p>No element data available for this specification.</p>';
          }
          
          specElement.appendChild(specDetailsElement);
        }
        
        detailsContainer.appendChild(specElement);
      }
    } catch (e) {
      console.error("Error displaying results:", e);
      this.showError("Failed to display validation results. See console for details.");
    }
  }
  
  private showLoading() {
    // Create loading overlay if it doesn't exist
    if (!this._loadingOverlay) {
      this._loadingOverlay = document.createElement('div');
      this._loadingOverlay.className = 'loading';
      
      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      
      const text = document.createElement('span');
      text.textContent = 'Validating model...';
      
      this._loadingOverlay.appendChild(spinner);
      this._loadingOverlay.appendChild(text);
      
      document.getElementById('viewer-container')?.appendChild(this._loadingOverlay);
    }
    
    this._loadingOverlay.style.display = 'flex';
  }

  private hideLoading() {
    if (this._loadingOverlay) {
      this._loadingOverlay.style.display = 'none';
    }
  }

  /**
   * Format spatial path information into a readable string
   * Currently unused but may be used in future UI improvements
   */
  // private _formatSpatialPath(spatialStructure: any): string {
  //   if (!spatialStructure) return '';
  //   
  //   try {
  //     // Handle different formats of spatial structure data
  //     if (Array.isArray(spatialStructure)) {
  //       // It's already an array of spatial elements
  //       return spatialStructure
  //         .filter(item => item && item.expressID)
  //         .map(item => {
  //           const type = item.type || 'Unknown';
  //           const name = item.userData?.Name || '';
  //           return name ? `${type}: ${name}` : type;
  //         })
  //         .join(' → ');
  //     } else if (typeof spatialStructure === 'object') {
  //       // It might be a hierarchical object structure
  //       const parts = [];
  //       let current = spatialStructure;
  //       
  //       while (current) {
  //         const type = current.type || 'Unknown';
  //         const name = current.userData?.Name || '';
  //         
  //         if (type) {
  //           parts.unshift(name ? `${type}: ${name}` : type);
  //         }
  //         
  //         current = current.parent || null;
  //       }
  //       
  //       return parts.join(' → ');
  //     }
  //   } catch (e) {
  //     console.warn('Error formatting spatial path:', e);
  //   }
  //   
  //   return '';
  // }

  /**
   * Highlight and isolate an element in the 3D viewer using the Hider component
   */
  public async highlightElement(expressID: number, status: 'pass' | 'fail'): Promise<void> {
    try {
      const fragments = this.components.get(OBC.FragmentsManager);
      const hider = this.components.get(OBC.Hider);
      
      console.log(`🎯 Isolating element ${expressID} with status ${status}`);
      console.log(`🔍 Available models:`, Array.from(fragments.list.keys()));
      
      // Find the element in the loaded models
      let elementFound = false;
      for (const [modelId, model] of fragments.list) {
        try {
          // First check if this element exists in this model
          const item = await model.getItem(expressID);
          if (!item) {
            console.log(`⏭️ Element ${expressID} not found in model ${modelId}, trying next model...`);
            continue;
          }
          
          console.log(`✅ Found element ${expressID} in model ${modelId}`);
          
          // Create a ModelIdMap for the isolate method
          const modelIdMap: Record<string, Set<number>> = {
            [modelId]: new Set([expressID])
          };
          
          // Use the Hider component to isolate the element immediately (no animations)
          hider.isolate(modelIdMap);
          console.log(`🎯 Successfully isolated element ${expressID} in model ${modelId}`);
          elementFound = true;
          
          // Focus camera on the isolated element with a simple approach
          try {
            // Use a simple camera repositioning - move camera to a good viewing angle
            this._viewer.world.camera.controls?.setLookAt(
              50, 30, 50,  // Camera position
              0, 0, 0,     // Look at origin (center of model)
              true         // Animate
            );
            console.log(`📹 Focused camera on isolated element ${expressID}`);
          } catch (error) {
            console.warn("Could not focus camera on element:", error);
          }
          
          break; // Found and isolated, stop searching
        } catch (error) {
          console.warn(`Could not process element ${expressID} in model ${modelId}:`, error);
        }
      }
      
      if (!elementFound) {
        console.warn(`⚠️ Element ${expressID} not found in any loaded model`);
        alert(`Element ${expressID} could not be found in the loaded model. It may not exist or be properly loaded.`);
      }
    } catch (error) {
      console.error("Failed to isolate element:", error);
      alert(`Failed to isolate element: ${error}`);
    }
  }



  /**
   * Isolate all failed elements in a specification
   */
  public async isolateAllFailedElements(specResult: SpecificationResult): Promise<void> {
    try {
      const hider = this.components.get(OBC.Hider);
      
      console.log(`🎯 Isolating all failed elements in specification: ${specResult.name}`);
      
      // Collect all failed element IDs grouped by model
      const modelIdMap: Record<string, Set<number>> = {};
      let totalFailedElements = 0;
      
      if (specResult.elementResults) {
        specResult.elementResults.forEach((elemResult) => {
          if (!elemResult || !Array.isArray(elemResult.requirements)) return;
          
          elemResult.requirements.forEach((req) => {
            if (!req || req.status !== 'fail') return;
            
            // Extract failed entities from the raw result
            if (req.rawResult && req.rawResult.failed_entities) {
              req.rawResult.failed_entities.forEach((entity: any) => {
                if (entity.expressID && entity.model_id) {
                  const modelId = entity.model_id;
                  const expressID = entity.expressID;
                  
                  if (!modelIdMap[modelId]) {
                    modelIdMap[modelId] = new Set();
                  }
                  modelIdMap[modelId].add(expressID);
                  totalFailedElements++;
                }
              });
            }
          });
        });
      }
      
      if (Object.keys(modelIdMap).length === 0) {
        console.warn(`⚠️ No failed elements found in specification: ${specResult.name}`);
        alert(`No failed elements found in specification "${specResult.name}"`);
        return;
      }
      
      console.log(`🎯 Found ${totalFailedElements} failed elements across ${Object.keys(modelIdMap).length} models`);
      console.log('ModelIdMap:', modelIdMap);
      
      // Use the Hider component to isolate all failed elements
      // Isolate immediately without animations
      hider.isolate(modelIdMap);
      console.log(`🎯 Successfully isolated ${totalFailedElements} failed elements in specification: ${specResult.name}`);
      
      // Focus camera on the isolated elements with a simple approach
      try {
        // Use a simple camera repositioning - move camera to a good viewing angle
        this._viewer.world.camera.controls?.setLookAt(
          50, 30, 50,  // Camera position
          0, 0, 0,     // Look at origin (center of model)
          true         // Animate
        );
        console.log(`📹 Focused camera on ${totalFailedElements} isolated elements`);
      } catch (error) {
        console.warn("Could not fit camera to elements:", error);
      }
      
    } catch (error) {
      console.error("Failed to isolate failed elements:", error);
      alert(`Failed to isolate failed elements: ${error}`);
    }
  }



  /**
   * Generate a more descriptive warning message based on the element and reason
   */
  private getDescriptiveWarning(failedElem: any, elemInfo: any): string {
    const reason = failedElem.reason || '';
    const elementType = elemInfo.class || 'Element';
    const elementName = elemInfo.name || `${elementType} ${failedElem.expressID}`;
    
    // Try to provide more context based on common validation failure patterns
    if (reason.toLowerCase().includes('missing')) {
      return `${elementName}: Missing required property or value`;
    } else if (reason.toLowerCase().includes('incorrect') || reason.toLowerCase().includes('invalid')) {
      return `${elementName}: Property value does not meet requirements`;
    } else if (reason.toLowerCase().includes('not found')) {
      return `${elementName}: Required element or reference not found`;
    } else if (reason.toLowerCase().includes('type')) {
      return `${elementName}: Element type does not match specification`;
    } else if (reason.toLowerCase().includes('value')) {
      return `${elementName}: Property value validation failed`;
    } else if (reason.trim() === '') {
      return `${elementName}: Failed validation (no specific reason provided)`;
    } else {
      return `${elementName}: ${reason}`;
    }
  }

  /**
   * Clear all isolation/highlighting and show all elements
   */
  public clearHighlighting(): void {
    try {
      const hider = this.components.get(OBC.Hider);
      // Show all elements by setting visibility to true without specifying a ModelIdMap
      hider.set(true);
      console.log("🧹 Cleared all isolation - showing all elements");
    } catch (error) {
      console.warn("Could not clear isolation using Hider:", error);
      // Fallback to highlighter clearing
      try {
        this._viewer.highlighter.clear();
        console.log("🧹 Cleared highlighting using fallback method");
      } catch (altError) {
        console.warn("Fallback clearing method also failed:", altError);
      }
    }
  }

  private showError(message: string): void {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'validation-error';
    errorContainer.textContent = message;
    errorContainer.style.color = 'red';
    errorContainer.style.padding = '10px';
    errorContainer.style.margin = '10px 0';
    errorContainer.style.backgroundColor = '#ffeeee';
    errorContainer.style.border = '1px solid #ffcccc';
    errorContainer.style.borderRadius = '3px';
    
    // Add to results container
    if (this._resultsContainer) {
      this._resultsContainer.classList.remove('hidden');
      this._resultsContainer.prepend(errorContainer);
    } else {
      // Fallback to body if results container isn't available
      document.body.prepend(errorContainer);
    }
  }

  dispose() {
    // Dispose THREE.js materials
    if (this._passMaterial) {
      this._passMaterial.dispose();
    }
    
    if (this._failMaterial) {
      this._failMaterial.dispose();
    }
    
    // Remove loading overlay if it exists
    if (this._loadingOverlay && this._loadingOverlay.parentNode) {
      this._loadingOverlay.parentNode.removeChild(this._loadingOverlay);
    }
    
    // Clear references
    this._loadingOverlay = null;
    
    // Trigger and reset the disposed event
    this.onDisposed.trigger();
    this.onDisposed.reset();
  }
}