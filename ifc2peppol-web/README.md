# IFC2Peppol Web Application

A browser-based drag-and-drop IFC to Peppol Catalogue XML transformer using Pyodide and IfcOpenShell WASM wheels.

## Features

- **Fully Client-Side**: Runs entirely in the browser - no backend required
- **Drag & Drop**: Easy file upload with drag-and-drop interface
- **Real-Time Progress**: Visual progress indicators for Pyodide loading and transformation
- **Enhanced UI**: Modern, responsive design with detailed statistics
- **Error Handling**: Clear error messages with technical details

## Quick Start

### Local Development

1. **Start a simple HTTP server:**

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js (if you have http-server installed)
npx http-server -p 8080
```

2. **Open in browser:**
   Navigate to `http://localhost:8080`

### Docker Deployment

1. **Build and run:**
```bash
docker compose up --build
```

2. **Access application:**
   Navigate to `http://localhost:8080`

## Architecture

- **Frontend**: HTML5 + JavaScript (vanilla, no framework dependencies)
- **Python Runtime**: Pyodide (Python in WebAssembly)
- **IFC Processing**: IfcOpenShell WASM wheels
- **XML Generation**: lxml (via Pyodide micropip)
- **Server**: Nginx (for production) or simple HTTP server (for development)

## File Structure

```
/apps/ifc2peppol-web/
├── index.html              # Main HTML page
├── src/
│   ├── main.js             # Main application logic
│   ├── pyodide-loader.js   # Pyodide initialization
│   ├── transformer.py      # Python transformer code
│   ├── ui.js              # UI state management
│   └── utils.js           # Utility functions
├── styles/
│   └── styles.css         # CSS styles
├── tests/                  # Test suite
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose config
└── nginx.conf             # Nginx configuration
```

## Usage

1. **Load the application** in your browser
2. **Wait for Pyodide** to load (first time only, ~30-60 seconds)
3. **Drag and drop** an IFC file or click "Choose File"
4. **Wait for transformation** to complete
5. **Download** the generated Peppol Catalogue XML

## Testing

### Running Tests

```bash
# Install test dependencies
cd tests
npm install

# Run all tests
npm test

# Run HTTP tests only
npm run test:http

# Run E2E tests only
npm run test:e2e

# Run in headed mode (see browser)
npm run test:headed

# Run with debug output
npm run test:debug
```

### Test Structure

- `tests/http/` - HTTP static file serving tests
- `tests/e2e/` - End-to-end browser tests
- `tests/fixtures/` - Test IFC files and expected outputs
- `tests/helpers/` - Test utilities

## Development

### Local Development Server

For local development, you can use any static file server:

```bash
# Python
python3 -m http.server 8080

# Node.js
npx http-server -p 8080

# PHP
php -S localhost:8080
```

### Building for Production

The application is already static files - no build step required. Simply:

1. Copy all files to your web server
2. Configure nginx (or your preferred web server)
3. Ensure `src/transformer.py` is accessible

## Deployment

### Docker

```bash
docker compose up --build -d
```

### Static Hosting

The application can be deployed to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any web server (nginx, Apache, etc.)

## Configuration

### Pyodide Version

The Pyodide version is configured in `src/pyodide-loader.js`:
```javascript
script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
```

### IfcOpenShell Wheel

The IfcOpenShell WASM wheel URL is configured in `src/pyodide-loader.js`:
```javascript
await micropip.install("https://ifcopenshell.github.io/wasm-wheels/ifcopenshell-0.8.3+34a1bc6-cp313-cp313-emscripten_4_0_9_wasm32.whl")
```

### MMI Threshold

The MMI (Model Maturity Index) threshold defaults to 375.0 and can be modified in `src/main.js`:
```javascript
const result = transformer(pythonBytes, 375.0);
```

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Initial Load**: ~30-60 seconds (Pyodide + packages, cached after first load)
- **Transformation**: Depends on IFC file size
  - Small files (< 1MB): ~5-10 seconds
  - Medium files (1-10MB): ~30-60 seconds
  - Large files (> 10MB): ~2-5 minutes

## Limitations

- Large files (> 100MB) may cause browser memory issues
- Pyodide initialization is required on first load
- Requires modern browser with WebAssembly support

## Troubleshooting

### Pyodide fails to load
- Check internet connection (CDN access required)
- Check browser console for errors
- Try clearing browser cache

### Transformation fails
- Verify IFC file is valid
- Check browser console for detailed error messages
- Ensure file has BIP property sets with MMI values

### Download doesn't work
- Check browser download settings
- Verify file was generated successfully
- Check browser console for errors

## License

[Add your license here]

## Acknowledgments

- [Pyodide](https://pyodide.org/) - Python runtime for WebAssembly
- [IfcOpenShell](https://ifcopenshell.org/) - IFC library
- [Peppol](https://peppol.eu/) - Peppol BIS Catalogue specification

