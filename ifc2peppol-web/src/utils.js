/**
 * Utility functions for file handling, formatting, and download
 */

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Read file as ArrayBuffer
 */
export function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Convert ArrayBuffer to Uint8Array
 */
export function arrayBufferToUint8Array(arrayBuffer) {
    return new Uint8Array(arrayBuffer);
}

/**
 * Generate output filename from input filename
 */
export function generateOutputFilename(inputFilename) {
    const baseName = inputFilename.replace(/\.ifc$/i, '');
    return `${baseName}_catalogue.xml`;
}

/**
 * Download blob as file
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Read file as text (for header parsing)
 */
export function readFileAsText(file, maxBytes = 8192) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        
        // Read only first part of file (first 8KB should be enough for header)
        const blob = file.slice(0, maxBytes);
        reader.readAsText(blob);
    });
}

/**
 * Extract IFC schema from file header
 */
export async function detectIFCSchema(file) {
    try {
        const headerText = await readFileAsText(file, 8192);
        const lines = headerText.split('\n');
        
        // Find FILE_SCHEMA line (usually within first 50 lines)
        for (let i = 0; i < Math.min(50, lines.length); i++) {
            const line = lines[i].trim();
            if (line.startsWith('FILE_SCHEMA')) {
                // Extract schema name from line like: FILE_SCHEMA(('IFC4'));
                const match = line.match(/FILE_SCHEMA\s*\(\s*\(?\s*['"]([^'"]+)['"]\s*\)?\s*\)/);
                if (match && match[1]) {
                    return match[1];
                }
                // Try alternative format: FILE_SCHEMA('IFC4');
                const match2 = line.match(/['"]([^'"]+)['"]/);
                if (match2 && match2[1]) {
                    return match2[1];
                }
            }
        }
        
        return null;
    } catch (error) {
        console.warn('Failed to detect IFC schema:', error);
        return null;
    }
}

/**
 * Validate IFC file
 */
export function validateIFCFile(file) {
    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.ifc')) {
        return { valid: false, error: 'File must have .ifc extension' };
    }

    // Check file size (warn if > 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
        return { 
            valid: true, 
            warning: `File is large (${formatFileSize(file.size)}). Processing may take longer.` 
        };
    }

    return { valid: true };
}

/**
 * Format duration in milliseconds to human-readable format
 */
export function formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

