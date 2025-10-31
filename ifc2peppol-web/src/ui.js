/**
 * UI state management and updates
 */

export class UIState {
    constructor() {
        this.state = 'idle'; // idle, loading, processing, completed, error
        this.currentFile = null;
        this.stats = {
            processed: 0,
            filtered: 0,
            lines: 0,
            time: 0
        };
    }

    /**
     * Update status indicator
     */
    updateStatus(status, text) {
        const indicator = document.getElementById('status-indicator');
        const statusText = indicator.querySelector('.status-text');
        const statusIcon = indicator.querySelector('.status-icon');
        
        indicator.setAttribute('data-status', status);
        statusText.textContent = text || status;
        
        // Update icon based on status
        statusIcon.className = `status-icon status-${status}`;
    }

    /**
     * Update drop zone state
     */
    updateDropZone(state) {
        const dropZone = document.getElementById('drop-zone');
        dropZone.setAttribute('data-state', state);
    }

    /**
     * Show file information
     */
    showFileInfo(file, schema = null) {
        const fileInfo = document.getElementById('file-info');
        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        const ifcSchema = document.getElementById('ifc-schema');
        
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        ifcSchema.textContent = schema || '-';
        
        fileInfo.hidden = false;
        this.currentFile = file;
    }


    /**
     * Show statistics
     */
    showStatistics(stats) {
        this.stats = stats;
        const statsPanel = document.getElementById('statistics-panel');
        
        document.getElementById('stat-processed').textContent = stats.processed || 0;
        document.getElementById('stat-filtered').textContent = stats.filtered || 0;
        document.getElementById('stat-lines').textContent = stats.lines || 0;
        document.getElementById('stat-time').textContent = this.formatDuration(stats.time || 0);
        
        statsPanel.hidden = false;
    }

    /**
     * Show download section
     */
    showDownload(filename, fileSize) {
        const downloadSection = document.getElementById('download-section');
        const downloadSize = document.getElementById('download-size');
        
        downloadSize.textContent = `File size: ${this.formatFileSize(fileSize)}`;
        downloadSection.hidden = false;
        
        // Set up download button
        const downloadBtn = document.getElementById('download-btn');
        downloadBtn.onclick = () => {
            if (this.downloadCallback) {
                this.downloadCallback();
            }
        };
    }

    /**
     * Set download callback
     */
    setDownloadCallback(callback) {
        this.downloadCallback = callback;
    }

    /**
     * Show error
     */
    showError(message, details = '') {
        const errorDisplay = document.getElementById('error-display');
        const errorMessage = document.getElementById('error-message');
        const errorStack = document.getElementById('error-stack');
        
        errorMessage.textContent = message;
        if (details) {
            errorStack.textContent = details;
            document.getElementById('error-details').hidden = false;
        } else {
            document.getElementById('error-details').hidden = true;
        }
        
        errorDisplay.hidden = false;
        this.updateStatus('error', 'Error');
    }

    /**
     * Hide error
     */
    hideError() {
        document.getElementById('error-display').hidden = true;
    }

    /**
     * Show validation results with tabbed interface
     */
    showValidationResults(results, onProceed) {
        const container = document.getElementById('validation-results-container');
        if (!container) return;
        
        const validationHtml = container.querySelector('#validation-html');
        const proceedBtn = container.querySelector('#validation-proceed-btn');
        const cancelBtn = container.querySelector('#validation-cancel-btn');
        const idsTab = container.querySelector('#tab-ids');
        
        // Display HTML report directly
        if (validationHtml && results.html) {
            validationHtml.innerHTML = results.html;
        }
        
        // Update tab status indicator
        if (idsTab) {
            // Check if validation passed 100% (all requirements must be PASSED)
            const passed = this.checkIdsValidationPassed(results.json);
            this.updateTabStatus('ids', passed);
        }
        
        // Set up proceed button
        if (proceedBtn) {
            proceedBtn.onclick = () => {
                // Switch to BIP tab instead of hiding
                this.switchValidationTab('bip');
                onProceed();
            };
        }
        
        // Set up cancel button
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                container.hidden = true;
                this.reset();
            };
        }
        
        // Show container and activate IDS tab
        container.hidden = false;
        this.switchValidationTab('ids');
        
        // Scroll to validation results
        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    /**
     * Show validation error with option to proceed anyway
     */
    showValidationError(error, onProceedAnyway) {
        const container = document.getElementById('validation-results-container');
        if (!container) return;
        
        const validationHtml = container.querySelector('#validation-html');
        const proceedBtn = container.querySelector('#validation-proceed-btn');
        const cancelBtn = container.querySelector('#validation-cancel-btn');
        const idsTab = container.querySelector('#tab-ids');
        
        // Display error message in HTML panel
        if (validationHtml) {
            validationHtml.innerHTML = `
                <div class="validation-error">
                    <h4>Validation Error</h4>
                    <p>${this.escapeHtml(error.message)}</p>
                    <p>You can choose to proceed with transformation anyway, but results may not meet all requirements.</p>
                </div>
            `;
        }
        
        // Update tab status indicator (error = failed)
        if (idsTab) {
            this.updateTabStatus('ids', false);
        }
        
        // Set up proceed anyway button
        if (proceedBtn) {
            proceedBtn.textContent = 'Proceed Anyway';
            proceedBtn.onclick = () => {
                container.hidden = true;
                onProceedAnyway();
            };
        }
        
        // Set up cancel button
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                container.hidden = true;
                this.reset();
            };
        }
        
        container.hidden = false;
        this.switchValidationTab('ids');
        
        // Scroll to validation results
        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    /**
     * Check if IDS validation passed 100% by examining JSON results
     */
    checkIdsValidationPassed(jsonResults) {
        if (!jsonResults || !jsonResults.specifications) {
            return false; // No data means validation didn't complete
        }
        
        // Check all specifications
        for (const spec of jsonResults.specifications) {
            if (spec.requirements) {
                for (const req of spec.requirements) {
                    // Only PASSED status counts as passed
                    if (req.status !== 'PASSED') {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    /**
     * Update tab status indicator
     */
    updateTabStatus(tabName, passed) {
        const container = document.getElementById('validation-results-container');
        if (!container) return;
        
        const tab = container.querySelector(`#tab-${tabName}`);
        if (!tab) return;
        
        // Remove existing status indicator
        const existingStatus = tab.querySelector('.tab-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Add status indicator
        const statusIcon = document.createElement('span');
        statusIcon.className = `tab-status ${passed ? 'status-passed' : 'status-failed'}`;
        statusIcon.innerHTML = passed ? '✓' : '✗';
        statusIcon.setAttribute('title', passed ? 'Validation passed' : 'Validation failed');
        
        tab.appendChild(statusIcon);
    }

    /**
     * Switch validation tab
     */
    switchValidationTab(tabName) {
        const container = document.getElementById('validation-results-container');
        if (!container) return;
        
        // Update tabs
        const tabs = container.querySelectorAll('.validation-tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update panels
        const panels = container.querySelectorAll('.validation-panel');
        panels.forEach(panel => {
            if (panel.id === `validation-panel-${tabName}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    }

    /**
     * Show BIP validation results
     */
    showBipValidationResults(results, onProceed) {
        const container = document.getElementById('validation-results-container');
        if (!container) return;
        
        const validationHtml = container.querySelector('#bip-validation-html');
        const proceedBtn = container.querySelector('#bip-validation-proceed-btn');
        const cancelBtn = container.querySelector('#bip-validation-cancel-btn');
        const bipTab = container.querySelector('#tab-bip');
        
        // Display HTML report directly
        if (validationHtml && results.html) {
            validationHtml.innerHTML = results.html;
        }
        
        // Update tab status indicator
        if (bipTab) {
            // Check if validation passed 100% (0 violations)
            const passed = results.json && 
                          results.json.summary &&
                          results.json.summary.consistency_violations === 0 &&
                          results.json.summary.uniqueness_violations === 0;
            this.updateTabStatus('bip', passed);
        }
        
        // Set up proceed button
        if (proceedBtn) {
            proceedBtn.onclick = () => {
                // Don't hide container - keep validation results visible
                onProceed();
            };
        }
        
        // Set up cancel button
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                container.hidden = true;
                this.reset();
            };
        }
        
        // Show container and switch to BIP tab
        container.hidden = false;
        this.switchValidationTab('bip');
        
        // Scroll to validation results
        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    /**
     * Show BIP validation error with option to proceed anyway
     */
    showBipValidationError(error, onProceedAnyway) {
        const container = document.getElementById('validation-results-container');
        if (!container) return;
        
        const validationHtml = container.querySelector('#bip-validation-html');
        const proceedBtn = container.querySelector('#bip-validation-proceed-btn');
        const cancelBtn = container.querySelector('#bip-validation-cancel-btn');
        const bipTab = container.querySelector('#tab-bip');
        
        // Display error message in HTML panel
        if (validationHtml) {
            validationHtml.innerHTML = `
                <div class="validation-error">
                    <h4>BIP Validation Error</h4>
                    <p>${this.escapeHtml(error.message)}</p>
                    <p>You can choose to proceed with transformation anyway, but results may not meet all requirements.</p>
                </div>
            `;
        }
        
        // Update tab status indicator (error = failed)
        if (bipTab) {
            this.updateTabStatus('bip', false);
        }
        
        // Set up proceed anyway button
        if (proceedBtn) {
            proceedBtn.textContent = 'Proceed Anyway';
            proceedBtn.onclick = () => {
                // Don't hide container - keep validation results visible
                onProceedAnyway();
            };
        }
        
        // Set up cancel button
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                container.hidden = true;
                this.reset();
            };
        }
        
        container.hidden = false;
        this.switchValidationTab('bip');
        
        // Scroll to validation results
        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Reset UI to initial state
     */
    reset() {
        const container = document.getElementById('validation-results-container');
        if (container) container.hidden = true;
        this.state = 'idle';
        this.currentFile = null;
        this.stats = { processed: 0, filtered: 0, lines: 0, time: 0 };
        
        const fileInfo = document.getElementById('file-info');
        const statisticsPanel = document.getElementById('statistics-panel');
        const downloadSection = document.getElementById('download-section');
        const xmlExplorer = document.getElementById('xml-explorer');
        
        if (fileInfo) fileInfo.hidden = true;
        if (statisticsPanel) statisticsPanel.hidden = true;
        if (downloadSection) downloadSection.hidden = true;
        if (xmlExplorer) xmlExplorer.hidden = true;
        this.hideError();
        
        this.updateStatus('idle', 'Ready');
        this.updateDropZone('idle');
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Format duration
     */
    formatDuration(ms) {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
}

