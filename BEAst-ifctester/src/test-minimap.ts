import * as OBC from "@thatopen/components";
import { Viewer } from "./components/Viewer";

// Initialize components
const components = new OBC.Components();
components.init();

// Create viewer
const container = document.getElementById('container') as HTMLElement;
const viewer = new Viewer(components, container);

// Setup IFC loader
viewer.setupIfcLoader().then(() => {
    console.log('✅ Viewer setup complete');
    updateStatus('✅ Viewer ready - load an IFC file to see the minimap');
}).catch(error => {
    console.error('❌ Viewer setup failed:', error);
    updateStatus('❌ Viewer setup failed: ' + error.message);
});

// Global functions for the buttons
window.loadFile = async () => {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    const file = fileInput.files?.[0];
    
    if (!file) {
        updateStatus('⚠️ Please select a file first');
        return;
    }
    
    try {
        updateStatus('🔄 Loading IFC file...');
        await viewer.loadIfcFile(file);
        updateStatus('✅ IFC file loaded successfully! Minimap should appear in bottom-right corner.');
    } catch (error) {
        console.error('Failed to load file:', error);
        updateStatus('❌ Failed to load file: ' + (error as Error).message);
    }
};

window.clearScene = () => {
    viewer.clearScene();
    updateStatus('🧹 Scene cleared');
};

function updateStatus(message: string) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

// Listen for model ready event
viewer.onModelReady.add((model) => {
    console.log('🎉 Model ready for validation:', model);
    updateStatus('🎉 Model ready! Minimap should show the 3D model from above.');
});

// Expose viewer for debugging
(window as any).viewer = viewer;

// Log that functions are available globally
console.log('✅ Global functions loaded: loadFile, clearScene');

// TypeScript declarations for global functions
declare global {
    interface Window {
        loadFile: () => Promise<void>;
        clearScene: () => void;
        viewer: Viewer;
    }
}
