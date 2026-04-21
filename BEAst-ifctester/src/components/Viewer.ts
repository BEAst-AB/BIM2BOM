import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as THREE from "three";

// Simple custom minimap implementation
class SimpleMiniMap {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.OrthographicCamera;
  private scene: THREE.Scene;
  private container: HTMLElement;
  private _enabled = true;
  private size = new THREE.Vector2(320, 160);

  constructor(world: OBC.SimpleWorld, container: HTMLElement) {
    this.container = container;
    
    // Create a separate scene for the minimap
    this.scene = new THREE.Scene();
    
    // Create orthographic camera for top-down view
    const aspect = this.size.x / this.size.y;
    const frustumSize = 50;
    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    
    // Create renderer for minimap
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(this.size.x, this.size.y);
    this.renderer.setClearColor(0x06080a, 0.8);
    
    // Style the canvas
    const canvas = this.renderer.domElement;
    canvas.style.borderRadius = "12px";
    canvas.style.border = "2px solid #333";
    
    // Add to container
    this.container.appendChild(canvas);
    
    // Position camera for top-down view
    this.updateCamera(world);
  }

  private updateCamera(world: OBC.SimpleWorld) {
    // Get the world's camera position and look at the scene center
    const worldScene = world.scene.three;
    
    // Calculate scene bounds
    const box = new THREE.Box3().setFromObject(worldScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Position camera above the scene
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;
    
    this.camera.position.set(center.x, center.y + distance, center.z);
    this.camera.lookAt(center);
    this.camera.updateMatrixWorld();
  }

  public update(world: OBC.SimpleWorld) {
    if (!this._enabled) return;
    
    // Update camera position
    this.updateCamera(world);
    
    // Copy world scene objects to minimap scene
    this.scene.clear();
    
    // Clone the world scene objects for the minimap
    world.scene.three.children.forEach(child => {
      if (child.type === 'Group' || child.type === 'Mesh') {
        const clone = child.clone();
        this.scene.add(clone);
      }
    });
    
    // Render the minimap
    this.renderer.render(this.scene, this.camera);
  }

  public resize(size?: THREE.Vector2) {
    if (size) {
      this.size.copy(size);
    }
    this.renderer.setSize(this.size.x, this.size.y);
    
    // Update camera aspect
    const aspect = this.size.x / this.size.y;
    const frustumSize = 50;
    this.camera.left = frustumSize * aspect / -2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.updateProjectionMatrix();
  }

  public dispose() {
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  get enabled() { return this._enabled; }
  set enabled(value: boolean) { this._enabled = value; }
}

export class Viewer extends OBC.Component implements OBC.Disposable {
  static readonly uuid = "viewer-component-uuid" as const;
  enabled = true;
  
  private _container: HTMLElement;
  public world!: OBC.SimpleWorld;
  public fragments!: OBC.FragmentsManager;
  public ifcLoader!: OBC.IfcLoader;
  public highlighter: OBCF.Highlighter;
  private _miniMap: SimpleMiniMap | null = null;
  readonly onDisposed = new OBC.Event();

  constructor(components: OBC.Components, container: HTMLElement) {
    super(components);
    this._container = container;
    
    // Initialize the highlighter early to avoid TypeScript errors
    this.highlighter = new OBCF.Highlighter(this.components);
    
    this.setupWorld();
    this.setupComponents();
  }

  private setupWorld() {
    const worlds = this.components.get(OBC.Worlds);
    
    // Create world exactly like the official tutorial
    this.world = worlds.create() as OBC.SimpleWorld;
    
    this.world.scene = new OBC.SimpleScene(this.components);
    this.world.renderer = new OBC.SimpleRenderer(this.components, this._container);
    this.world.camera = new OBC.SimpleCamera(this.components);
    
    // Setup scene exactly like the tutorial
    (this.world.scene as any).setup();
    
    this.components.init();
    
    // Fix: Use proper typing for scene background
    if (this.world.scene.three instanceof THREE.Scene) {
      this.world.scene.three.background = null;
    }
    
    // Add grid for better orientation (like in the Grids tutorial)
    const grids = this.components.get(OBC.Grids);
    grids.create(this.world);
  }

  private setupComponents() {
    // Initialize fragments manager and IFC loader
    this.fragments = this.components.get(OBC.FragmentsManager);
    this.ifcLoader = this.components.get(OBC.IfcLoader);
  }

  public async setupIfcLoader() {
    console.log("🚀 Viewer: Starting IFC Loader setup...");
    
    try {
      // Apply the working configuration discovered through systematic debugging
      // Key insight: Prevent double WASM initialization by disabling auto-detection
      
      // STEP 1: Setup IfcLoader with explicit WASM configuration (prevents double initialization)
      console.log("📦 Step 1: Setting up IfcLoader with manual WASM configuration...");
      await this.setupIfcLoaderWithFallbacks();
      console.log("✅ Step 1: IfcLoader setup complete");
      
      // STEP 1.5: Configure IFC Loader for proper entity data processing
      console.log("📦 Step 1.5: Configuring IFC Loader settings for entity data...");
      this.configureIfcLoaderForEntityData();
      console.log("✅ Step 1.5: IFC Loader configuration complete");
      
      // STEP 2: Setup FragmentsManager with fallback options
      console.log("📦 Step 2: Setting up FragmentsManager...");
      await this.setupFragmentsManagerWithFallbacks();
      console.log("✅ Step 2: FragmentsManager setup complete");
      
      // STEP 3: Setup event handlers after both are initialized
      console.log("📦 Step 3: Setting up event handlers...");
      this.setupEventHandlers();
      console.log("✅ Step 3: Event handlers setup complete");
      
      // Setup the highlighter
      console.log("📦 Step 4: Setting up highlighter...");
      this.highlighter.setup({ world: this.world });
      console.log("✅ Step 4: Highlighter setup complete");
      
      console.log("🎉 Viewer: IFC Loader setup completed successfully!");
      
    } catch (error) {
      console.error("❌ Viewer: IFC Loader setup failed:", error);
      throw error;
    }
  }

  private async setupIfcLoaderWithFallbacks() {
    // Primary: Manual WASM configuration (proven working)
    console.log("🔧 Using manual WASM configuration to prevent double initialization...");
    try {
      await this.ifcLoader.setup({
        autoSetWasm: false,
        wasm: {
          path: "https://unpkg.com/web-ifc@0.0.71/",
          absolute: true,
        },
      });
      console.log("✅ IfcLoader setup with manual CDN configuration successful");
      console.log("🔍 WASM settings:", this.ifcLoader.settings.wasm);
      console.log("🔍 AutoSetWasm disabled:", this.ifcLoader.settings.autoSetWasm === false);
      return;
    } catch (error) {
      console.warn("⚠️ Manual CDN configuration failed, trying local WASM files:", error);
    }

    // Fallback: Local WASM files
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
      console.error("❌ All IfcLoader configurations failed:", error);
      throw new Error(`Failed to setup IfcLoader: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async setupFragmentsManagerWithFallbacks() {
    // Primary: Local worker
    console.log("🔧 Trying local worker.mjs...");
    try {
      const workerUrl = `${window.location.origin}/worker.mjs`;
      await this.fragments.init(workerUrl);
      console.log("✅ FragmentsManager initialized with local worker");
      return;
    } catch (error) {
      console.warn("⚠️ Local worker failed, trying CDN worker:", error);
    }

    // Fallback: CDN worker (like the official tutorial)
    console.log("🔧 Trying CDN worker...");
    try {
      const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
      const fetchedUrl = await fetch(githubUrl);
      const workerBlob = await fetchedUrl.blob();
      const workerFile = new File([workerBlob], "worker.mjs", {
        type: "text/javascript",
      });
      const workerUrl = URL.createObjectURL(workerFile);
      await this.fragments.init(workerUrl);
      console.log("✅ FragmentsManager initialized with CDN worker");
    } catch (error) {
      console.error("❌ All FragmentsManager configurations failed:", error);
      throw new Error(`Failed to setup FragmentsManager: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private configureIfcLoaderForEntityData() {
    // Configure IFC loader to ensure entity data is processed properly
    // Based on the official example and IDS requirements
    
    console.log("🔧 Configuring web-ifc settings for entity data processing...");
    
    // Ensure coordinates are processed (from official example)
    this.ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;
    
    // Enable optimized processing (commented out as property may not exist in all versions)
    // this.ifcLoader.settings.webIfc.OPTIMIZE_PROFILES = true;
    
    // Add test option to download and test with known working IFC
    (window as any).testWithSmallIfc = async () => {
      console.log("🧪 Loading small.ifc for testing...");
      try {
        const response = await fetch("https://thatopen.github.io/engine_components/resources/small.ifc");
        const arrayBuffer = await response.arrayBuffer();
        const file = new File([arrayBuffer], "small.ifc", { type: "application/octet-stream" });
        
        // Simulate file selection
        console.log("📁 Testing with small.ifc file...");
        
        // Trigger file loading (you'll need to call this manually from console)
        console.log("Call loadSmallIfc() to test with the known working file");
        (window as any).loadSmallIfc = () => {
          this.clearScene();
          this.loadIfcFile(file);
        };
      } catch (error) {
        console.error("Failed to load test file:", error);
      }
    };
    
    console.log("🔍 Current IFC Loader settings:", {
      coordinateToOrigin: this.ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN,
      // optimizeProfiles: this.ifcLoader.settings.webIfc.OPTIMIZE_PROFILES, // Property may not exist
      // excludedCategories: this.ifcLoader.settings.excludedCategories ? this.ifcLoader.settings.excludedCategories.size : 'not available' // Property may not exist
    });
    
    console.log("💡 Test with known working file: Run testWithSmallIfc() in console, then loadSmallIfc()");
  }

  private setupEventHandlers() {
    console.log("📡 Setting up event handlers...");
    
    // Camera update on rest
    this.world.camera.controls?.addEventListener("rest", () => {
      this.fragments.core.update(true);
      // Update minimap when camera moves
      if (this._miniMap) {
        this._miniMap.update(this.world);
      }
    });
    
    // Model handling when added to fragments
    this.fragments.list.onItemSet.add(({ value: model }) => {
      // Try to extract model name from various sources
      let modelName = "Unknown";
      try {
        // Check different possible name properties
        if ((model as any).name) {
          modelName = (model as any).name;
        } else if ((model as any).title) {
          modelName = (model as any).title;
        } else if ((model as any).modelId) {
          modelName = (model as any).modelId;
        } else if ((model as any).id) {
          modelName = (model as any).id;
        }
        
        console.log("📦 Model added to fragments list:", modelName);
      } catch (error) {
        console.warn("⚠️ Error accessing model properties:", error);
        console.log("📦 Model added to fragments list: Unknown");
      }
      
      model.useCamera(this.world.camera.three as any);
      this.world.scene.three.add(model.object);
      this.fragments.core.update(true);
      
      // Create minimap when first model is loaded
      if (!this._miniMap) {
        //this.createMiniMap();
      }
      
      // Update minimap with new model
      if (this._miniMap) {
        this._miniMap.update(this.world);
      }
    });
    
    // Listen for fragments loaded event to know when IFC processing is complete
    this.fragments.onFragmentsLoaded.add((model) => {
      console.log("🎉 Fragments loaded and ready for validation:", model.name || "Unknown");
      // Trigger custom event that app.ts can listen to
      this.onModelReady.trigger(model);
      
      // Update minimap after fragments are fully loaded
      if (this._miniMap) {
        this._miniMap.update(this.world);
      }
    });
    
    // Debug: Log when the onFragmentsLoaded event is set up
    console.log("📡 onFragmentsLoaded event handler registered");
  }

  // Event for when model is ready for validation
  readonly onModelReady = new OBC.Event<any>();

  public async loadIfcFile(file: File): Promise<any> {
    console.log("🚀 Loading IFC file:", file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      // Clear any existing models first - we only want one model at a time
      if (this.fragments.list.size > 0) {
        console.log("🧹 Clearing existing models before loading new one...");
        this.clearScene();
      }
      
      // Prepare file buffer
      const buffer = await file.arrayBuffer();
      console.log("📦 File buffer created, size:", buffer.byteLength);
      
      // Get initial model count for comparison
      const initialModelCount = this.fragments.list.size;
      console.log("📊 Initial model count:", initialModelCount);
      
      // Use the standard OBC approach like in the official example
      console.log("🔄 Starting IFC loading process...");
      const loadedModel = await this.ifcLoader.load(new Uint8Array(buffer), true, file.name);
      console.log("📦 IfcLoader.load() completed, returned:", !!loadedModel);
      
      // Set model name for identification
      if (loadedModel && file.name) {
        (loadedModel as any).name = file.name;
        console.log(`📦 Set model name to: ${file.name}`);
      }
      
      // Verify that a model was loaded
      const finalModelCount = this.fragments.list.size;
      console.log("📊 Final model count:", finalModelCount);
      
      if (finalModelCount <= initialModelCount) {
        throw new Error("No new model was loaded - check IFC file format and size");
      }
      
      // Center camera on the loaded model
      console.log("📹 Centering camera on model...");
      this.centerCameraOnModel();
      
      // 🚀 Trigger immediate IDS validation (no waiting)
      console.log("🚀 Triggering immediate IDS validation...");
      this.onModelReady.trigger(loadedModel);
      
      console.log("✅ IFC loading completed successfully");
      return loadedModel;
      
    } catch (error) {
      console.error("❌ IFC loading failed:", error);
      
      // Provide helpful error context
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage?.includes("callbacks.shift")) {
        console.error("💡 This looks like a WASM double initialization error. The setupIfcLoader configuration should prevent this.");
      } else if (errorMessage?.includes("tolerancePlaneIntersection")) {
        console.error("💡 This looks like a missing web-ifc configuration error. Check WASM setup completion.");
      } else if (errorMessage?.includes("Unsupported input type")) {
        console.error("💡 This looks like a FragmentsManager initialization error. Check fragments.init() status.");
      }
      
      throw error;
    }
  }

  private centerCameraOnModel() {
    // Simple camera positioning like in the tutorial
    this.world.camera.controls?.setLookAt(68, 23, -8.5, 21.5, -5.5, 23);
    this.fragments.core.update(true);
  }

  public clearScene() {
    console.log("🧹 Clearing scene...");
    // Simple scene clearing
    this.highlighter.clear();
    // Clear fragments
    const fragmentCount = this.fragments.list.size;
    for (const [id] of this.fragments.list) {
      this.fragments.list.delete(id);
    }
    console.log(`✅ Cleared ${fragmentCount} fragments from scene`);
  }

  // Diagnostic method from MinimalViewer for troubleshooting
  public diagnose(): any {
    const diagnosis = {
      components: {
        world: !!this.world,
        fragments: !!this.fragments,
        ifcLoader: !!this.ifcLoader,
        highlighter: !!this.highlighter,
      },
      initialization: {
        fragmentsInitialized: this.fragments?.list !== undefined,
        ifcLoaderConfigured: !!this.ifcLoader?.settings,
        wasmSettings: this.ifcLoader?.settings?.wasm || null,
        autoSetWasm: this.ifcLoader?.settings?.autoSetWasm,
      },
      scene: {
        retrievedModelsLoaded: this.fragments?.list?.size || 0,
        sceneObjects: this.world?.scene?.three?.children?.length || 0,
        cameraPosition: this.world?.camera?.three?.position || null,
      },
      system: {
        userAgent: navigator.userAgent,
        webglSupport: !!window.WebGLRenderingContext,
        wasmSupport: typeof WebAssembly === 'object',
      }
    };
    
    console.log("🔍 System Diagnosis:", diagnosis);
    return diagnosis;
  }
  
  // Expose fragments manager for debugging/validation purposes
  getFragmentsManager(): OBC.FragmentsManager {
    return this.fragments;
  }

  dispose() {
    this.clearScene();
    // Dispose minimap if it exists
    if (this._miniMap) {
      this._miniMap.dispose();
      this._miniMap = null;
    }
    const worlds = this.components.get(OBC.Worlds);
    worlds.delete(this.world);
    this.onDisposed.trigger();
    this.onDisposed.reset();
  }
} 