import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import * as THREE from "three";
import { Viewer } from "./components/Viewer";
import { FileLoader } from "./components/FileLoader";
import { IDSLoader } from "./components/IDSLoader";
import { Validator } from "./components/Validator";
import { showError } from "./utils/fileUtils";

// Initialize UI components
BUI.Manager.init();

// IDS file path
const IDS_FILE_PATH = "BIM2BOM.ids";

// Initialize application
async function initApp() {
  try {
    // Initialize components
    const components = new OBC.Components();
    components.init();
    
    // Initialize viewer with components
    const viewerContainer = document.getElementById("viewer-container") as HTMLElement;
    
    // Ensure the container has proper dimensions before initializing viewer
    await new Promise(resolve => {
      // Force a layout reflow to ensure container has proper size
      const rect = viewerContainer.getBoundingClientRect();
      console.log(`📐 Container initial size: ${rect.width}x${rect.height}`);
      
      // If container has zero dimensions, wait for layout
      if (rect.width === 0 || rect.height === 0) {
        console.log("⏳ Waiting for container to get proper dimensions...");
        const observer = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            console.log(`✅ Container sized: ${entry.contentRect.width}x${entry.contentRect.height}`);
            observer.disconnect();
            resolve(undefined);
          }
        });
        observer.observe(viewerContainer);
        
        // Fallback timeout in case ResizeObserver doesn't work
        setTimeout(() => {
          observer.disconnect();
          console.log("⏰ Fallback timeout - proceeding with viewer initialization");
          resolve(undefined);
        }, 500);
      } else {
        console.log("✅ Container already has proper dimensions");
        resolve(undefined);
      }
    });
    
    const viewer = new Viewer(components, viewerContainer);
    
    // Setup IFC loader in viewer
    await viewer.setupIfcLoader();
    
    // Force multiple resize attempts to ensure proper canvas sizing
    const ensureProperSizing = () => {
      try {
        const rect = viewerContainer.getBoundingClientRect();
        console.log(`🔧 Resizing canvas to container: ${rect.width}x${rect.height}`);
        
        // Force the renderer to resize to match container
        if (viewer.world.renderer) {
          viewer.world.renderer.resize(new THREE.Vector2(rect.width, rect.height));
          
          // Also update the camera aspect ratio if needed
          const camera = viewer.world.camera.three;
          if (camera.type === 'PerspectiveCamera') {
            const perspCamera = camera as any;
            perspCamera.aspect = rect.width / rect.height;
            perspCamera.updateProjectionMatrix();
          }
          
          console.log("✅ Canvas resize completed");
        }
      } catch (error) {
        console.warn("Could not resize renderer:", error);
      }
    };
    
    // Immediate resize
    ensureProperSizing();
    
    // Additional delayed resizes to catch any late layout changes
    setTimeout(ensureProperSizing, 100);
    setTimeout(ensureProperSizing, 300);
    setTimeout(ensureProperSizing, 1000);
    
    // Initialize IDS loader with shared components instance
    const idsLoader = new IDSLoader(components);
    
    // Load predefined IDS file
    try {
      await idsLoader.loadFromFile(IDS_FILE_PATH);
      console.log(`Specifications: ${idsLoader.specifications.length}`);
    } catch (error) {
      console.error("Failed to load IDS file:", error);
      showError("Failed to load IDS file. Please check the console for details.");
    }
    
    // Initialize validator
    const validator = new Validator(
      components,
      idsLoader,
      viewer,
      'validation-results',
      'results-summary'
    );
    
    // Initialize file loader with callbacks
    let loadedModel: any = null;
    
    // Setup event listener for when model is ready for validation
    viewer.onModelReady.add(async (model) => {
      console.log("🎉 Model ready for validation:", model.name || "Unknown");
      try {
        const results = await validator.validate(model);
        console.log("Validation completed:", results);
      } catch (error) {
        console.error("Validation failed:", error);
        showError("Validation failed. Please check the console for details.");
      }
    });
    
    const fileLoader = new FileLoader(
      components,
      'file-input',
      async (file: File) => {
        // When file is selected, load it
        try {
          // Clear previous model if any
          viewer.clearScene();
          
          // Load the new IFC file
          loadedModel = await viewer.loadIfcFile(file);
          
          console.log(`Loaded model: ${loadedModel.name || loadedModel.uuid || 'Unknown'}`);
          
          // The validation will be triggered automatically by the onModelReady event
          // when the fragments are fully loaded and processed
          
        } catch (error) {
          console.error("Failed to load IFC file:", error);
          showError("Failed to load IFC file. Please check the console for details.");
        }
      },
      'fullpage-drop',
      'app'
    );
    
    // Setup smooth resize handler to prevent flickering
    let resizeTimeout: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        ensureProperSizing();
      }, 100) as unknown as number; // Debounce resize events to prevent excessive calls
    };
    
    window.addEventListener('resize', debouncedResize);
    
    // Also listen for orientation changes on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(debouncedResize, 200); // Small delay for orientation change
    });
    
    // Setup cleanup when window unloads
    window.addEventListener('beforeunload', () => {
      // Dispose components in reverse order of creation
      fileLoader.dispose();
      validator.dispose();
      idsLoader.dispose();
      viewer.dispose();
      
      // Finally dispose the components instance
      components.dispose();
    });
    
  } catch (error) {
    console.error("Failed to initialize application:", error);
    showError("Failed to initialize application. Please check the console for details.");
  }
}

// Start the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 