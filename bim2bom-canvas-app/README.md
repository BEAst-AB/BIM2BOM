# BIM2BOM Canvas App

A client-side Single Page Application (SPA) for visualizing and processing BIM models through the procurement workflow. The application runs entirely in the browser using Pyodide for IFC processing and React for the UI.

## Features

- **Client-Side Processing**: All IFC processing happens in the browser using Pyodide (Python in WebAssembly)
- **Interactive Canvas**: Visual process flow using React Flow showing the procurement pipeline
- **3D IFC Viewer**: View and interact with IFC models using That Open Components
- **Validation**: BIP type name ID validation and IDS validation
- **Conversion**: Transform IFC files to Peppol Catalogue XML
- **State Management**: Track procurement cases through the entire workflow

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Processing**: Pyodide Web Worker (runs Python code in browser)
- **3D Viewer**: That Open Components (web-ifc)
- **State**: Zustand for state management
- **Canvas**: React Flow for process visualization

## Project Structure

```
bim2bom-canvas-app/
├── public/
│   ├── scripts/          # Python scripts (transformer.py, bip-type-tester.py)
│   └── config/           # Configuration files (CSV)
├── src/
│   ├── components/
│   │   ├── canvas/       # React Flow components
│   │   └── viewer/       # IFC Viewer component
│   ├── store/            # Zustand state management
│   ├── workers/           # Pyodide Web Worker
│   └── App.tsx           # Main application component
└── vite.config.ts        # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern browser with WebAssembly support

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Upload IFC File**: Click "Upload IFC File" or drag and drop an IFC file
2. **View Process**: Watch the process flow canvas update as the file is processed
3. **View Model**: See the 3D model in the IFC Viewer panel
4. **Download XML**: Once conversion is complete, download the generated Peppol Catalogue XML

## Workflow Steps

1. **Upload**: IFC file is uploaded and loaded into Pyodide filesystem
2. **Validation**: BIP type name ID validation runs
3. **Conversion**: IFC is converted to Peppol Catalogue XML
4. **Procurement Flow**: (Simulated) Data flows through Buying/Selling systems
5. **Write-back**: Final data is written back to CDE

## Technologies

- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Pyodide**: Python runtime in WebAssembly
- **React Flow**: Process visualization
- **Zustand**: State management
- **That Open Components**: IFC viewer
- **web-ifc**: IFC file parsing

## Notes

- Initial Pyodide load can take 30-60 seconds (cached after first load)
- Large IFC files (>100MB) may cause browser memory issues
- Processing happens in a Web Worker to keep UI responsive

## License

[Add your license here]





