import * as OBC from "@thatopen/components";

export class FileLoader extends OBC.Component implements OBC.Disposable {
  private _fileInput: HTMLInputElement;
  private _fullPageDrop: HTMLElement;
  private _appElement: HTMLElement;
  private _onFileSelected: (file: File) => void;
  private _selectedFile: File | null = null;
  readonly onDisposed = new OBC.Event();
  
  // Required by Component class
  enabled = true;

  constructor(
    components: OBC.Components,
    fileInputId: string,
    onFileSelected: (file: File) => void,
    fullPageDropId: string = 'fullpage-drop',
    appId: string = 'app'
  ) {
    super(components);
    this._fileInput = document.getElementById(fileInputId) as HTMLInputElement;
    this._fullPageDrop = document.getElementById(fullPageDropId) as HTMLElement;
    this._appElement = document.getElementById(appId) as HTMLElement;
    this._onFileSelected = onFileSelected;

    // Initialize with full-page drop zone visible
    this.setupEvents(true);
    
    // Add animation after a short delay
    setTimeout(() => this.startAnimation(), 500);
  }

  private startAnimation() {
    // Add the loaded class to trigger the animation
    this._appElement.classList.add('app-loaded');
    
    // Hide the full page drop zone after animation completes
    setTimeout(() => {
      if (this._fullPageDrop) {
        this._fullPageDrop.style.display = 'none';
      }
    }, 3000); // Match animation duration
  }

  private setupEvents(active: boolean) {
    if (active) {
      // File input change event
      this._fileInput.addEventListener('change', this.handleFileChange);
      
      // Setup the full page drop zone
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        this._fullPageDrop.addEventListener(eventName, this.preventDefaults, false);
      });
      
      // Add highlight effects
      ['dragenter', 'dragover'].forEach(eventName => {
        this._fullPageDrop.addEventListener(eventName, () => this.highlight(this._fullPageDrop), false);
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        this._fullPageDrop.addEventListener(eventName, () => this.unhighlight(this._fullPageDrop), false);
      });
      
      // Handle file drop
      this._fullPageDrop.addEventListener('drop', this.handleDrop, false);
      
      // Hide full page drop when leaving the page or after a drop
      this._fullPageDrop.addEventListener('dragleave', this.handleDragLeave, false);
      
      this._fullPageDrop.addEventListener('drop', () => {
        this.hideFullPageDrop();
      });
      
      // Setup the entire document for drag and drop
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, this.preventDefaults, false);
      });
      
      // Document-wide drag events to show the full page drop zone
      document.addEventListener('dragenter', this.showFullPageDrop, false);
    } else {
      // Remove all event listeners
      this._fileInput.removeEventListener('change', this.handleFileChange);
      
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        this._fullPageDrop.removeEventListener(eventName, this.preventDefaults, false);
      });
      
      ['dragenter', 'dragover'].forEach(eventName => {
        this._fullPageDrop.removeEventListener(
          eventName, 
          () => this.highlight(this._fullPageDrop), 
          false
        );
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        this._fullPageDrop.removeEventListener(
          eventName, 
          () => this.unhighlight(this._fullPageDrop), 
          false
        );
      });
      
      this._fullPageDrop.removeEventListener('drop', this.handleDrop, false);
      this._fullPageDrop.removeEventListener('dragleave', this.handleDragLeave, false);
      this._fullPageDrop.removeEventListener('drop', () => {
        this.hideFullPageDrop();
      });
      
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.removeEventListener(eventName, this.preventDefaults, false);
      });
      
      document.removeEventListener('dragenter', this.showFullPageDrop, false);
    }
  }
  
  private showFullPageDrop = () => {
    if (this._fullPageDrop) {
      this._fullPageDrop.style.display = 'flex';
    }
  }
  
  private hideFullPageDrop = () => {
    if (this._fullPageDrop) {
      this._fullPageDrop.style.display = 'none';
    }
  }
  
  private preventDefaults = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  }
  
  private highlight = (element: HTMLElement) => {
    element.classList.add('dragover');
  }
  
  private unhighlight = (element: HTMLElement) => {
    element.classList.remove('dragover');
  }
  
  private handleDragLeave = (e: DragEvent) => {
    // Only hide if dragleave is from the full page drop element and not its children
    if (e.currentTarget === e.target) {
      this.hideFullPageDrop();
    }
  }
  
  private handleDrop = (event: DragEvent) => {
    if (!event.dataTransfer) return;
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      // Check if the file is an IFC file
      const file = files[0];
      
      if (this.isValidIfcFile(file)) {
        this.processFile(file);
      } else {
        alert('Endast IFC-filer kan laddas upp (.ifc)');
      }
    }
  }

  private handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      const file = files[0];
      
      if (this.isValidIfcFile(file)) {
        this.processFile(file);
      } else {
        alert('Endast IFC-filer kan laddas upp (.ifc)');
        // Reset the file input
        this._fileInput.value = '';
      }
    }
  }
  
  private isValidIfcFile(file: File): boolean {
    // Check file extension
    return file.name.toLowerCase().endsWith('.ifc');
  }
  
  private processFile(file: File) {
    this._selectedFile = file;
    
    // Hide the full page drop zone if it's visible
    this.hideFullPageDrop();
    
    // Call the file selected callback
    this._onFileSelected(file);
    
    console.log(`Selected file: ${file.name}`);
  }

  public getSelectedFile(): File | null {
    return this._selectedFile;
  }

  dispose() {
    // Remove all event listeners
    this.setupEvents(false);

    // Clean up references
    this._selectedFile = null;
    this._onFileSelected = () => {}; // Empty function
    
    // Trigger and reset the disposed event
    this.onDisposed.trigger();
    this.onDisposed.reset();
  }
} 