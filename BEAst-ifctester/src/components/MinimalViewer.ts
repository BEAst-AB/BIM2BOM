import * as OBC from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";

/**
 * Minimal IFC Viewer based EXACTLY on the official tutorial
 * https://docs.thatopen.com/Tutorials/Components/Core/IfcLoader
 * 
 * This is a learning/debugging tool to isolate issues
 */
export class MinimalViewer {
  private _components: OBC.Components;
  private world: any;
  private _fragments!: OBC.FragmentsManager;
  private ifcLoader!: OBC.IfcLoader;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this._components = new OBC.Components();
    
    // Initialize components exactly like the tutorial
    this.init();
  }

  // Expose components for IDS testing
  get components() {
    return this._components;
  }

  get fragments() {
    return this._fragments;
  }

  get OBC() {
    return OBC;
  }

  get FRAGS() {
    return FRAGS;
  }

  private async init() {
    console.log("🚀 MinimalViewer: Starting initialization...");
    
    try {
      // STEP 1: Create world exactly like tutorial
      console.log("📦 Step 1: Creating world...");
      const worlds = this._components.get(OBC.Worlds);
      this.world = worlds.create();
      
      this.world.scene = new OBC.SimpleScene(this._components);
      this.world.renderer = new OBC.SimpleRenderer(this._components, this.container);
      this.world.camera = new OBC.SimpleCamera(this._components);
      
      this.world.scene.setup();
      this.world.scene.three.background = null;
      
      await this.world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);
      
      this._components.init();
      
      this._components.get(OBC.Grids).create(this.world);
      console.log("✅ Step 1: World created successfully");
      
      // STEP 2: Get components
      console.log("📦 Step 2: Getting IfcLoader and FragmentsManager...");
      this.ifcLoader = this._components.get(OBC.IfcLoader);
      this._fragments = this._components.get(OBC.FragmentsManager);
      console.log("✅ Step 2: Components retrieved");
      
      // STEP 3: Setup IfcLoader exactly like tutorial
      console.log("📦 Step 3: Setting up IfcLoader...");
      await this.setupIfcLoader();
      console.log("✅ Step 3: IfcLoader setup complete");
      
      // STEP 4: Setup FragmentsManager exactly like tutorial  
      console.log("📦 Step 4: Setting up FragmentsManager...");
      await this.setupFragmentsManager();
      console.log("✅ Step 4: FragmentsManager setup complete");
      
      console.log("🎉 MinimalViewer: Initialization complete!");
      
    } catch (error) {
      console.error("❌ MinimalViewer: Initialization failed:", error);
      throw error;
    }
  }

  private async setupIfcLoader() {
    // The key insight: auto-detection during setup() works, but it re-runs during load()
    // We need to disable auto-detection to prevent the double initialization
    
    console.log("🔧 Using manual WASM configuration to prevent double initialization...");
    try {
      await this.ifcLoader.setup({
        autoSetWasm: false,
        wasm: {
          path: "https://unpkg.com/web-ifc@0.0.71/",
          absolute: true,
        },
      });
      console.log("✅ IfcLoader setup with manual configuration successful");
      console.log("🔍 WASM settings:", this.ifcLoader.settings.wasm);
      console.log("🔍 AutoSetWasm disabled:", this.ifcLoader.settings.autoSetWasm === false);
      return;
    } catch (error) {
      console.warn("⚠️ Manual configuration failed, trying local WASM files:", error);
    }

    // Fallback to local WASM files
    console.log("🔧 Trying local WASM files...");
    try {
      await this.ifcLoader.setup({
        autoSetWasm: false,
        wasm: {
          path: `${window.location.origin}/`,
          absolute: true,
        },
      });
      console.log("✅ IfcLoader setup with local WASM successful");
    } catch (error) {
      console.error("❌ All WASM configurations failed:", error);
      throw error;
    }
  }

  private async setupFragmentsManager() {
    // Try local worker first
    console.log("🔧 Trying local worker.mjs...");
    try {
      const workerUrl = `${window.location.origin}/worker.mjs`;
      await this._fragments.init(workerUrl);
      console.log("✅ FragmentsManager initialized with local worker");
    } catch (error) {
      console.warn("⚠️ Local worker failed, trying CDN worker:", error);
      
      // Fallback to CDN worker like the tutorial
      try {
        const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
        const fetchedUrl = await fetch(githubUrl);
        const workerBlob = await fetchedUrl.blob();
        const workerFile = new File([workerBlob], "worker.mjs", {
          type: "text/javascript",
        });
        const workerUrl = URL.createObjectURL(workerFile);
        await this._fragments.init(workerUrl);
        console.log("✅ FragmentsManager initialized with CDN worker");
      } catch (cdnError) {
        console.error("❌ Both local and CDN worker failed:", cdnError);
        throw cdnError;
      }
    }

    // Setup event handlers exactly like tutorial
    this.world.camera.controls.addEventListener("rest", () =>
      this._fragments.core.update(true),
    );

    this._fragments.list.onItemSet.add(({ value: model }) => {
      model.useCamera(this.world.camera.three);
      this.world.scene.three.add(model.object);
      this._fragments.core.update(true);
      // Enhanced model property logging
      console.log("📊 Model properties available:", Object.keys(model));
      let modelName = "Unknown";
      if ((model as any).name) modelName = (model as any).name;
      else if ((model as any).title) modelName = (model as any).title;
      else if ((model as any).modelId) modelName = (model as any).modelId;
      else if ((model as any).id) modelName = (model as any).id;
      else if ((model as any).uuid) modelName = (model as any).uuid;
      console.log("📦 Model added to scene:", modelName);
    });
  }

  async loadIfc(file: File): Promise<any> {
    console.log(`🚀 Loading IFC file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      const buffer = await file.arrayBuffer();
      console.log("📦 File buffer created, size:", buffer.byteLength);
      
      // Use the EXACT method from the tutorial
      await this.ifcLoader.load(new Uint8Array(buffer), false, file.name, {
        processData: {
          progressCallback: (progress: number) => {
            console.log(`📊 Loading progress: ${progress}%`);
          },
        },
      });
      
      console.log("✅ IFC loading completed successfully");
      
      // Get the loaded model
      const models = Array.from(this._fragments.list.values());
      const model = models[models.length - 1];
      console.log("📦 Retrieved model:", (model as any)?.name || (model as any)?.uuid || "Unknown");
      
      return model;
      
    } catch (error) {
      console.error("❌ IFC loading failed:", error);
      console.error("Error details:", {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      throw error;
    }
  }

  // Test method to load the small.ifc file
  async testWithSmallIfc(): Promise<any> {
    console.log("🧪 Testing with small.ifc file...");
    try {
      const response = await fetch(`${window.location.origin}/small.ifc`);
      if (!response.ok) {
        throw new Error(`Failed to fetch small.ifc: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      const file = new File([buffer], "small.ifc", { type: "application/octet-stream" });
      return await this.loadIfc(file);
    } catch (error) {
      console.error("❌ Small IFC test failed:", error);
      throw error;
    }
  }

  // Diagnostic method to check system state
  diagnose(): any {
    const diagnosis = {
      timestamp: new Date().toISOString(),
      components: !!this._components,
      world: !!this.world,
      fragments: {
        initialized: !!this._fragments,
        hasCore: !!this._fragments?.core,
        listSize: this._fragments?.list?.size || 0,
        groups: (this._fragments as any)?.groups?.size || 0
      },
      ifcLoader: {
        initialized: !!this.ifcLoader,
        settings: this.ifcLoader?.settings ? {
          autoSetWasm: this.ifcLoader.settings.autoSetWasm,
          wasmPath: this.ifcLoader.settings.wasm?.path
        } : null
      },
      browser: {
        userAgent: navigator.userAgent,
        webgl: !!document.createElement('canvas').getContext('webgl'),
        webgl2: !!document.createElement('canvas').getContext('webgl2')
      }
    };
    
    console.log("🔍 System Diagnosis:", diagnosis);
    return diagnosis;
  }

  dispose() {
    console.log("🧹 Disposing MinimalViewer...");
    try {
      if (this.world) {
        const worlds = this._components.get(OBC.Worlds);
        worlds.delete(this.world);
      }
      this._components.dispose();
      console.log("✅ MinimalViewer disposed successfully");
    } catch (error) {
      console.error("❌ Error during disposal:", error);
    }
  }
}
